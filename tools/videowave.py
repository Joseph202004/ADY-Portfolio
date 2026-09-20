"""Turns the rendered wave video into the hero's 60fps loop.

Source: media/src/excited-wave-animation-smooth-v2.mp4 — 1024x1024, native
60fps, h264, the character on pure black. Extract it first:

    ffmpeg -i media/src/excited-wave-animation-smooth-v2.mp4 /tmp/v2full/f%04d.png

Then `python3 tools/videowave.py`. What it does, and why each step exists:

  KEY. Not a chroma key — the hair and sweater are black too. Measured, the
  sweater's darkest pixel is 15-18 and the hair's true blacks are interior, so
  "<= 12 in every channel and connected to the frame border" is the
  background. Seeded from the top and side borders only: the sweater's creases
  are true black and run off the bottom edge, and a fill seeded there walked up
  them and cut a white crescent through the shoulder.

  UN-PREMULTIPLY THE SKIN. The fast strokes carry multi-exposure ghosting —
  several half-transparent hands blended toward black. On black that read as
  motion blur; keyed onto white it was brown silhouettes. A ghost pixel is
  skin at partial alpha over black, so alpha = brightness / skin-max and
  colour = C / alpha recover a translucent, correctly coloured trail. Applied
  only to skin that is dark (< 140) or within 2px of the background, so lit
  shading on the ear and jaw is left alone; that 2px band is also what takes
  the dark rim off every skin edge.

  TRIM. The first ~62 frames are a literal still. Kept to a short hold so the
  loop's seam does not sit on two seconds of frozen face.

  PING-PONG. The clip opens hand-down and ends mid-wave; played straight it
  would cut. Forward then back closes the loop with no crossfade.

  ENCODE. An h264 <video> composited on the page's white (#ffffff): ~10x
  smaller than animated WebP for this many frames, and decoded on the GPU.
  Not alpha video — the VP9/HEVC alpha pair was built and rejected because
  Chrome on macOS advertises HEVC, takes the .mov, and drops its alpha layer
  onto a black square. On a white page the composite is indistinguishable.
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
import glob, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(HERE, "..", "media")
SRC_FRAMES = sorted(glob.glob("/tmp/v2full/f*.png"))
KEYED = "/tmp/v2key"

T = 12               # <= this in every channel is candidate background
SKIN_MAX = 235.0     # brightest skin channel; the reference for un-premultiply
LEAD_HOLD = 12       # frames of the opening still to keep
OUT_W = 640          # rendered at ~405 CSS px; 640 stays crisp on 2x displays
FPS = 60


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
    dist = ndimage.distance_transform_edt(~bg)
    fix = skin & (((mx < 140) & (dist <= 50)) | (dist <= 2))
    al = np.clip(mx / SKIN_MAX, 0.04, 1.0)
    rgb = a.copy()
    rgb[fix] = np.clip(rgb[fix] / al[fix][:, None], 0, 255)
    alpha = np.where(fix, np.minimum(alpha, al), alpha)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def first_motion(frames):
    """Index of the first frame that differs from the opening still."""
    ref = np.asarray(Image.open(frames[0]).convert("RGB")).astype(np.int16)
    for i, f in enumerate(frames[1:], 1):
        a = np.asarray(Image.open(f).convert("RGB")).astype(np.int16)
        if (np.abs(a - ref).max(axis=2) > 40).sum() > 50:
            return i
    return 0


def main():
    os.makedirs(KEYED, exist_ok=True)
    for f in glob.glob(f"{KEYED}/*.png"):
        os.remove(f)

    start = max(0, first_motion(SRC_FRAMES) - LEAD_HOLD)
    src = SRC_FRAMES[start:]
    print(f"motion starts at frame {start + LEAD_HOLD}; keeping {len(src)} of {len(SRC_FRAMES)}")

    fwd = [key(p) for p in src]

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
                    "-c:v", "libx264", "-crf", "22", "-preset", "slow", "-movflags", "+faststart", out], check=True)
    print(f"hero-wave.mp4: {os.path.getsize(out)//1024} KB")


if __name__ == "__main__":
    main()
