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

  UN-PREMULTIPLY THE SKIN EDGE. Every skin edge pixel is a blend toward black,
  which keys onto white as a dark rim. Alpha = brightness / skin-max and
  colour = C / alpha recover it. Restricted to within 2px of the background so
  lit shading on the ear and jaw is untouched.

  PING-PONG. The clip opens hand-down and ends hand-up, so forward-then-back
  closes the loop without a crossfade (a crossfade shows two half-hands).

  ENCODE. An h264 <video> composited on the page's white (#ffffff): ~10x
  smaller than animated WebP and decoded on the GPU. Not alpha video — the
  VP9/HEVC pair was built and rejected because Chrome on macOS advertises
  HEVC, takes the .mov, and drops its alpha onto a black square.
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
import glob, os, statistics, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(HERE, "..", "media")
SRC_FRAMES = sorted(glob.glob("/tmp/ewfull/f*.png"))
KEYED = "/tmp/wavekey"

T = 12               # <= this in every channel is candidate background
SKIN_MAX = 235.0     # brightest skin channel; the un-premultiply reference
CRISP = 1.15         # keep frames within this multiple of the median blur
START = 36           # the clip opens on a still; the raise begins here
OUT_W = 640          # rendered at ~405 CSS px; 640 stays crisp on 2x displays
FPS = 30             # the source's own rate. Interpolating to 60 was tried and
                     # rejected: block matching blends the fingers and puts a
                     # second translucent hand back in, which is the artefact
                     # this whole pipeline exists to remove.


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

    m = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.asarray(m).astype(np.float32) / 255.0

    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    skin = (r > g) & (g > b) & ((r - b) > 25) & (mx >= 20) & ~bg
    edge = skin & (ndimage.distance_transform_edt(~bg) <= 2)
    al = np.clip(mx / SKIN_MAX, 0.04, 1.0)
    rgb = a.copy()
    rgb[edge] = np.clip(rgb[edge] / al[edge][:, None], 0, 255)
    alpha = np.where(edge, np.minimum(alpha, al), alpha)

    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def main():
    os.makedirs(KEYED, exist_ok=True)
    for f in glob.glob(f"{KEYED}/*.png"):
        os.remove(f)

    scores = {i: blur_score(SRC_FRAMES[i]) for i in range(START, len(SRC_FRAMES))}
    med = statistics.median(scores.values())
    crisp = [i for i in sorted(scores) if scores[i] <= med * CRISP]
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
    fwd = [f.crop(bb).resize((OUT_W, h), Image.LANCZOS) for f in fwd]

    seq = fwd + fwd[-2:0:-1]
    for i, f in enumerate(seq):
        f.save(f"{KEYED}/f{i:04d}.png")
    fwd[0].save(os.path.join(MEDIA, "hero-wave-poster.webp"), quality=88)
    print(f"sequence {len(seq)} frames at {FPS}fps = {len(seq)/FPS:.2f}s, canvas {seq[0].size}")

    out = os.path.join(MEDIA, "hero-wave.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{KEYED}/f%04d.png",
                    "-filter_complex", f"color=white:s={OUT_W}x{h}:r={FPS}[bg];[bg][0:v]overlay=shortest=1,format=yuv420p",
                    "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", out], check=True)
    print(f"hero-wave.mp4: {os.path.getsize(out)//1024} KB")


if __name__ == "__main__":
    main()
