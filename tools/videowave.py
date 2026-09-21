"""Turns the rendered wave clip into the hero's transparent-on-white loop.

Source: media/src/excited-wave-animation.mp4 — 1024x1024, 30fps, the character
on pure black. Extract it first:

    ffmpeg -i media/src/excited-wave-animation.mp4 /tmp/ewfull/f%04d.png

Then `python3 tools/videowave.py`. What each step is for:

  PICK CRISP FRAMES. The render bakes motion blur into every fast stroke, and
  it is not a smooth smear — it is several half-transparent copies of the hand
  at once. Keyed onto white those became the fanned "extra fingers". Nothing
  in the key can remove them: measured, in the worst frames the hand has no
  opaque core at all, so cutting by alpha deletes the hand along with them.
  What the clip does have is crisp held poses either side of each stroke, so
  those are kept and the blurred frames between them dropped. The wave still
  reads — the hand tilts between holds, which is the motion — and the drops
  land exactly where the hand moves fastest, so the timing stays honest.

  Measured across the source: the blur metric floors at ~3,900 (the hand's own
  shading) and peaks at 47,836. Keeping frames within 1.15x of the median
  leaves 45 crisp frames and drops 26.

  KEY THE BLACK. Not a chroma key — the hair and sweater are black too.
  Measured, the sweater's darkest pixel is 15-18 and the hair's true blacks
  are interior, so "<= 12 in every channel and connected to the frame border"
  is exactly the background. Seeded from the top and sides only: the sweater's
  creases are true black and run off the bottom edge, and a fill seeded there
  walks up them and cuts a white crescent through the shoulder.

  Then close the crease between the torso and the raised arm, which the fill
  still ran down. Brightness cannot separate it — see the note in key() — but
  width can.

  UN-PREMULTIPLY THE SKIN EDGE. Every skin edge pixel is a blend toward black,
  which keys onto white as a dark rim. Alpha = brightness / skin-max and
  colour = C / alpha recover it. Restricted to within 2px of the background so
  lit shading on the ear and jaw is untouched.

  LOOP. No ping-pong and no crossfade: the wave starts and ends on the same
  pose, so it cycles on its own.

  WHAT THIS CANNOT DO. The wave is two hand poses toggling. They are not
  related by any rotation, scale or translation — the best similarity
  transform between them is the identity, at 0.695 IoU, because the fingers
  articulate. So in-betweens cannot be synthesised: warping cannot align them
  and blending doubles the hand, which is what ffmpeg's minterpolate produced.
  The source's own in-between frames are all heavily blurred (20,000+ against
  a crisp 4,000; even the mildest, 7,300, shows dark duplicate fingers).
  Smoother motion needs a re-render with more sampled poses and motion blur
  off, not more processing here.

  ENCODE as an animated WebP with alpha, not a <video>. The h264 version was
  a tenth the size and played correctly — the element reported readyState 4,
  no error, and drawing it into a canvas produced the character — but the
  video layer did not composite into the page: the hero simply read as empty
  white. An image has no such layer, loops on its own with no autoplay policy
  or JS, and keeps the transparency, so it sits on whatever background the
  hero has rather than a baked-in white rectangle.
"""
from PIL import Image, ImageChops, ImageFilter
import numpy as np
from scipy import ndimage
import glob, os, statistics, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(HERE, "..", "media")
SRC_FRAMES = sorted(glob.glob("/tmp/ewfull/f*.png"))
KEYED = "/tmp/wavekey"

T = 12               # <= this in every channel is candidate background
THIN = 11            # background channels narrower than this are fabric creases
SKIN_KEEP = 14       # ... unless they run beside skin, which is a finger gap
CREASE_MIN = 400     # ... and unless they are specks, or touch the frame edge,
ENCLOSE = 0.88       # or are not ringed by figure. See the note in key().
SKIN_MAX = 235.0     # brightest skin channel; the un-premultiply reference
CRISP = 1.15         # keep frames within this multiple of the median blur
START = 56           # the wave only. The raise before it (f42-49) is filmed on a
                     # wider camera, so cutting from it into the wave shifts the
                     # torso by 17,802 px — the shirt visibly jumps. Inside the
                     # wave the body moves ~900 px between poses, which is
                     # nothing. Starting here also means the loop needs no
                     # ping-pong: the wave opens and closes on the same pose.
TAIL = 8             # the clip ends on a long hold; keep a beat of it, not 17
OUT_W = 640          # working size for the keyed frames
WEBP_W = 560         # shipped size; the hero renders it at ~411 CSS px
FPS = 30             # the source's own rate. Interpolating to 60 was tried and
                     # rejected: block matching blends the fingers and puts a
                     # second translucent hand back in, which is the artefact
                     # this whole pipeline exists to remove.


def _disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return (x * x + y * y) <= r * r


def blur_score(path):
    """Skin pixels that are dark — i.e. blended toward the black ground."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    H, W = a.shape[:2]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    m = (r > g) & (g > b) & ((r - b) > 30) & (mx >= 30) & (mx <= 150)
    m[:int(H * 0.38), :] = False        # hand zone only: the face never blurs
    m[:, :int(W * 0.55)] = False
    return int(m.sum())


def key(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    mx = a.max(axis=2)

    lab, _ = ndimage.label(mx <= T)
    seeds = np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, seeds[seeds != 0])

    # Close the crease between the torso and the raised arm. The sweater's
    # shadow there is as black as the background — measured, every pixel the
    # flood took is <= 12, while fabric kept right beside it goes down to 8 —
    # so no threshold separates them and the fill ran down the crease, opening
    # a white sliver 2-19px wide. Width does separate them: that sliver's half
    # width is 3px against 27px for the gaps between the fingers. So any
    # background channel too narrow for a disk of THIN is fabric, unless it
    # runs beside skin, which is what a finger gap does.
    rr, gg, bb2 = a[..., 0], a[..., 1], a[..., 2]
    skin_for_gaps = (rr > gg) & (gg > bb2) & ((rr - bb2) > 25) & (mx >= 60) & ~bg
    near_skin = ndimage.binary_dilation(skin_for_gaps, _disk(SKIN_KEEP))
    cand = bg & ~ndimage.binary_opening(bg, _disk(THIN)) & ~near_skin

    # Narrowness alone catches far more than the crease: measured on one frame,
    # 79 components, of which exactly one was the crease. The rest were the
    # gaps between hair curls and the thin band where the figure runs off the
    # top and bottom of the frame — all of which, reclaimed, paint a black
    # block onto the page. Three properties separate them, and every frame
    # agrees: the crease is 958-1024 px where the specks are ~300; it never
    # reaches the frame edge where the top and bottom bands do by definition;
    # and it is ringed by figure on 0.917-0.930 of its perimeter where the
    # bands manage 0.63 and 0.76.
    crease = np.zeros_like(cand)
    lab2, n = ndimage.label(cand)
    H, W = cand.shape
    for k, sl in enumerate(ndimage.find_objects(lab2), start=1):
        if sl is None:
            continue
        sub = lab2[sl] == k
        if sub.sum() < CREASE_MIN:
            continue
        if sl[0].start == 0 or sl[0].stop == H or sl[1].start == 0 or sl[1].stop == W:
            continue
        pad = 12
        y0, y1 = max(0, sl[0].start - pad), min(H, sl[0].stop + pad)
        x0, x1 = max(0, sl[1].start - pad), min(W, sl[1].stop + pad)
        big = np.zeros((y1 - y0, x1 - x0), bool)
        big[sl[0].start - y0:sl[0].stop - y0, sl[1].start - x0:sl[1].stop - x0] = sub
        ring = ndimage.binary_dilation(big, _disk(10)) & ~big
        if (~bg[y0:y1, x0:x1])[ring].mean() < ENCLOSE:
            continue
        crease[sl][sub] = True
    bg = bg & ~crease

    m = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.asarray(m).astype(np.float32) / 255.0

    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    skin = (r > g) & (g > b) & ((r - b) > 25) & (mx >= 20) & ~bg

    # The rim the skin test misses. A skin pixel blended toward black keeps
    # its hue as it darkens, but not its distance from it: at the very edge
    # of a finger the blend is so far along that r-b falls under 25 and the
    # test lets the pixel through at full alpha and full darkness. Measured,
    # that is 1,554 pixels a frame at a mean brightness of 27 — the dotted
    # black fringe along the fingers and the gaps between them.
    #
    # They can be told from hair, which is legitimately black at full alpha,
    # by hue: blended skin stays warm (r-b of 7 to 22 in the samples), where
    # black hair sits within 4 of neutral. So the band beside skin is taken
    # as skin too when it is warm at all.
    band = (ndimage.distance_transform_edt(~bg) <= 3) & ~bg
    warm = (r >= g) & (g >= b) & ((r - b) >= 5)
    beside_skin = ndimage.binary_dilation(skin, _disk(4))
    edge = band & (skin | (beside_skin & warm))
    al = np.clip(mx / SKIN_MAX, 0.04, 1.0)
    rgb = a.copy()
    rgb[edge] = np.clip(rgb[edge] / al[edge][:, None], 0, 255)
    alpha = np.where(edge, np.minimum(alpha, al), alpha)

    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def rgba_resize(img, size):
    """Resize without letting the background back in.

    A keyed frame still carries the original colour under every transparent
    pixel — black, because that is what the character was rendered on. PIL
    resamples the four channels independently, so a LANCZOS pass averages that
    black into every edge pixel it touches and lays a dotted dark rim along
    the fingers and the gaps between them. Multiplying colour by alpha first
    makes the transparent pixels contribute nothing, which is what "the
    background is not there" should mean; dividing it back out afterwards
    restores the colour of what survived.
    """
    a = np.asarray(img).astype(np.float32)
    al = a[..., 3:4] / 255.0
    pm = Image.fromarray(
        np.dstack([a[..., :3] * al, a[..., 3]]).astype(np.uint8), "RGBA"
    ).resize(size, Image.LANCZOS)
    o = np.asarray(pm).astype(np.float32)
    oa = o[..., 3:4] / 255.0
    rgb = np.where(oa > 0.002, o[..., :3] / np.maximum(oa, 0.002), 0.0)
    return Image.fromarray(
        np.dstack([np.clip(rgb, 0, 255), o[..., 3]]).astype(np.uint8), "RGBA"
    )


def main():
    os.makedirs(KEYED, exist_ok=True)
    for f in glob.glob(f"{KEYED}/*.png"):
        os.remove(f)

    scores = {i: blur_score(SRC_FRAMES[i]) for i in range(START, len(SRC_FRAMES))}
    med = statistics.median(scores.values())
    crisp = [i for i in sorted(scores) if scores[i] <= med * CRISP]
    # the closing hold runs 17 frames; trim it so the cycle does not sit still
    while len(crisp) > 2 and crisp[-1] - crisp[-TAIL] == TAIL - 1 and crisp[-TAIL] - crisp[-TAIL - 1] == 1:
        crisp.pop()
    print(f"blur floor {min(scores.values())}, median {int(med)}, peak {max(scores.values())}")
    print(f"keeping {len(crisp)} crisp frames, dropping {len(scores) - len(crisp)} blurred")

    fwd = [key(SRC_FRAMES[i]) for i in crisp]

    bb = None
    for f in fwd:
        b = f.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    W, H = fwd[0].size
    bb = (max(0, bb[0] - 6) // 2 * 2, max(0, bb[1] - 6) // 2 * 2, min(W, bb[2] + 6), min(H, bb[3] + 6))
    h = int(round((bb[3] - bb[1]) * OUT_W / (bb[2] - bb[0]))) // 2 * 2
    fwd = [rgba_resize(f.crop(bb), (OUT_W, h)) for f in fwd]

    seq = fwd
    for i, f in enumerate(seq):
        f.save(f"{KEYED}/f{i:04d}.png")
    fwd[0].save(os.path.join(MEDIA, "hero-wave-poster.webp"), quality=88)
    print(f"sequence {len(seq)} frames at {FPS}fps = {len(seq)/FPS:.2f}s, canvas {seq[0].size}")

    # Only the hand changes between frames, so each one encodes as a small
    # rectangle of difference over the last; that is what keeps 28 frames of a
    # 560px figure under half a megabyte.
    web = [rgba_resize(f, (WEBP_W, int(round(f.height * WEBP_W / f.width)) // 2 * 2)) for f in seq]
    times = [int(round(1000 / FPS))] * len(web)
    tmp = tempfile.mkdtemp()
    args = []
    for i, f in enumerate(web):
        if i == 0:
            part, off, q = f, (0, 0), "84"
        else:
            d = ImageChops.difference(f, web[i - 1]).getbbox()
            if d is None:
                times[i - 1] += times[i]
                continue
            x0 = max(0, d[0] - 2) // 2 * 2
            y0 = max(0, d[1] - 2) // 2 * 2
            part = f.crop((x0, y0, min(f.width, d[2] + 2), min(f.height, d[3] + 2)))
            off, q = (x0, y0), "68"
        png, webp = f"{tmp}/f{i}.png", f"{tmp}/f{i}.webp"
        part.save(png)
        subprocess.run(["cwebp", "-quiet", "-q", q, "-alpha_q", "88", "-m", "6", png, "-o", webp], check=True)
        args += ["-frame", webp, f"+{times[i]}+{off[0]}+{off[1]}+0-b"]
    out = os.path.join(MEDIA, "hero-wave.webp")
    subprocess.run(["webpmux", *args, "-loop", "0", "-bgcolor", "0,0,0,0", "-o", out], check=True)
    print(f"hero-wave.webp: {os.path.getsize(out)//1024} KB, canvas {web[0].size}")


if __name__ == "__main__":
    main()
