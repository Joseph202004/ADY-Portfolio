"""Builds an animated WebP from the rig.

A timeline sets the rig's parameters over time; frames that come out identical
are merged into one longer frame, and every frame after the first is stored as
only the rectangle that changed since the frame before it. That keeps a long,
smooth loop small: the idle stretches cost nothing and a blink costs only the
eyes.

    python3 tools/animate.py media/rig/base.png media/hero-wave.webp
"""
from PIL import Image, ImageChops
import json, math, os, subprocess, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import Rig

FPS = 25


def timeline(t):
    """Parameters at time t seconds. Waves, then blinks, always in that order
    so the two never compete for attention."""
    # wave: two cycles, then the hand rests where it was drawn
    hand = 13.0 * math.sin(2 * math.pi * 1.5 * t) if t < 1.34 else 0.0

    # blink: open -> half -> shut -> half -> open, ~220ms, twice, off the
    # wave's beat so they do not look synchronised
    blink = 0.0
    for at in (2.15, 3.70):
        d = t - at
        if 0 <= d <= 0.22:
            blink = 1 - abs(d - 0.11) / 0.11
    return dict(hand_deg=hand, blink=max(0.0, min(1.0, blink)), bob=0.0)


def build(src, out, seconds=4.4):
    rig = Rig(src)
    n = int(seconds * FPS)
    frames, times = [], []
    for i in range(n):
        f = rig.render(**timeline(i / FPS))
        ms = int(round(1000 / FPS))
        if frames and ImageChops.difference(f, frames[-1]).getbbox() is None:
            times[-1] += ms                          # nothing moved: hold
        else:
            frames.append(f); times.append(ms)

    tmp = tempfile.mkdtemp()
    parts = [("full", frames[0], (0, 0))]
    for i in range(1, len(frames)):
        bb = ImageChops.difference(frames[i], frames[i - 1]).getbbox()
        x0 = max(0, bb[0] - 2) // 2 * 2
        y0 = max(0, bb[1] - 2) // 2 * 2
        x1 = min(rig.W, bb[2] + 2)
        y1 = min(rig.H, bb[3] + 2)
        parts.append(("sub", frames[i].crop((x0, y0, x1, y1)), (x0, y0)))

    args = []
    for i, (kind, img, (x, y)) in enumerate(parts):
        png = os.path.join(tmp, f"f{i:04d}.png")
        webp = os.path.join(tmp, f"f{i:04d}.webp")
        img.save(png)
        q = "78" if kind == "full" else "68"
        subprocess.run(["cwebp", "-quiet", "-q", q, "-alpha_q", "90", "-m", "6",
                        png, "-o", webp], check=True)
        args += ["-frame", webp, f"+{times[i]}+{x}+{y}+0-b"]
    subprocess.run(["webpmux", *args, "-loop", "0", "-bgcolor", "0,0,0,0",
                    "-o", out], check=True)

    total = sum(times)
    print(f"{out}: {len(frames)} frames, {total} ms, {os.path.getsize(out)//1024} KB")
    print("  merged", n - len(frames), "still frames")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
