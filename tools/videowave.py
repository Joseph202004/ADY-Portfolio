"""Turns the rendered wave video into the hero's transparent 60fps loop.

Source: media/src/excited-wave-animation.mp4 — 1024x1024, 30fps, h264, the
character on a pure black background. Pipeline:

  1. ffmpeg minterpolate doubles it to 60fps with motion-compensated
     in-betweens (real intermediate frames, not blends). Run separately:
       ffmpeg -i SRC -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:\\
              me_mode=bidir:vsbmc=1" /tmp/ew60/f%04d.png
  2. Key the black away. Not a chroma key — the hair and sweater are black
     too. Measured: the sweater's darkest pixel is 15-18 and the hair's true
     blacks are interior, so "<= 12 in every channel AND connected to the
     frame border" is exactly the background and nothing else.
  3. Ping-pong. The clip opens on a calm smile, hand down, and ends mid-wave;
     played straight it would cut. Forward then back closes the loop with no
     crossfade (a crossfade shows two half-hands).
  4. Encode as an h264 <video> composited on the page's white (#ffffff).
     Video compresses this motion ~10x better than animated WebP and decodes
     on the GPU, which is what 60fps actually needs. Not alpha video: the
     VP9 .webm + HEVC .mov pair was built and rejected — Chrome on macOS
     advertises HEVC and takes the .mov first, but drops its alpha layer and
     paints the figure on a black square. On a white page the composite is
     indistinguishable from transparency and plays everywhere.

    python3 tools/videowave.py
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
import glob, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.join(HERE, "..", "media")
SRC_FRAMES = sorted(glob.glob("/tmp/ew60/f*.png"))
KEYED = "/tmp/ewkey"

T = 12            # <= this in every channel counts as candidate background
OUT_W = 640       # rendered at ~405 CSS px; 640 keeps it crisp on 2x displays
FPS = 60


def key(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im)
    dark = a.max(axis=2) <= T
    lab, n = ndimage.label(dark)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border != 0]
    bg = np.isin(lab, border)
    m = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8), "L")
    # Erode a pixel and feather: edge pixels are blends toward black, and left
    # as-is they draw a dark rim once the ground is white.
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(m)
    return out


def main():
    os.makedirs(KEYED, exist_ok=True)
    for f in glob.glob(f"{KEYED}/*.png"):
        os.remove(f)

    fwd = [key(p) for p in SRC_FRAMES]
    print(f"keyed {len(fwd)} frames")

    # Crop to the union of the figure across the whole clip, then scale.
    bb = None
    for f in fwd:
        b = f.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    W, H = fwd[0].size
    bb = (max(0, bb[0] - 6) // 2 * 2, max(0, bb[1] - 6) // 2 * 2, min(W, bb[2] + 6), min(H, bb[3] + 6))
    h = int(round((bb[3] - bb[1]) * OUT_W / (bb[2] - bb[0]))) // 2 * 2
    fwd = [f.crop(bb).resize((OUT_W, h), Image.LANCZOS) for f in fwd]

    seq = fwd + fwd[-2:0:-1]                     # ping-pong; both ends once
    for i, f in enumerate(seq):
        f.save(f"{KEYED}/f{i:04d}.png")
    fwd[0].save(os.path.join(MEDIA, "hero-wave-poster.webp"), quality=88)
    print(f"sequence {len(seq)} frames at {FPS}fps = {len(seq)/FPS:.2f}s, canvas {seq[0].size}")

    inp = ["-framerate", str(FPS), "-i", f"{KEYED}/f%04d.png"]
    runs = {
        "hero-wave.mp4": inp + ["-filter_complex", f"color=white:s={OUT_W}x{h}:r={FPS}[bg];[bg][0:v]overlay=shortest=1,format=yuv420p",
                                "-c:v", "libx264", "-crf", "22", "-preset", "slow", "-movflags", "+faststart"],
    }
    for name, args in runs.items():
        out = os.path.join(MEDIA, name)
        subprocess.run(["ffmpeg", "-v", "error", "-y", *args, out], check=True)
        print(f"{name}: {os.path.getsize(out)//1024} KB")


if __name__ == "__main__":
    main()
