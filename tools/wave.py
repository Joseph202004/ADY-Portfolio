"""Builds the hero animation from ONE drawing, by rigging its arm.

The earlier approach played the 22 uploaded poses as frames. Each of those is
a separate render, so the hair, the glasses and the mouth are redrawn every
time — measured at 7,000-40,000 differing pixels between neighbouring poses,
which reads as a shimmer across the head no matter how the frames are ordered.
No amount of reordering fixes that; the frames simply are not the same drawing.

So the character is drawn once, from pose-00, and the arm is a rotating part:

    base  = pose-00 with the forearm lifted off it
    arm   = that forearm, rotated about the elbow per frame
    cap   = a disc of the original sleeve pasted back over the joint, which
            hides the wedge the rotation opens at the cut

Everything above the elbow is one rigid piece, so the hand keeps its shape and
the head never changes at all. The angle alone tells the story: buried in the
hair at -40 deg, raised at 0, and the wave is an oscillation around it.

    python3 tools/wave.py media/hero-wave.webp
"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter
from collections import deque
import math, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "media", "rig", "pose-00.png")

CUT = 322                # above this row the arm is clear of the head
PIVOT = (418, 338)       # the elbow, a little below the cut so the joint
                         # itself stays inside the solid upper arm
CAP = (40, 42)           # radii of the sleeve disc that covers the joint

STEP_DEG = 2.6           # how far the arm may turn between frames
MIN_MS = 45              # ... and the shortest and longest a frame may hold
MAX_MS = 150
OUT_W = 460              # the page renders it at 420 CSS px; 460 keeps it
                         # sharp without paying for a full 2x plate


def _fill(ap, W, seed, limit):
    """Everything joined to seed above row `limit`."""
    m = Image.new("L", (W, limit + 400), 0)
    mp = m.load()
    q = deque([seed]); mp[seed] = 255
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < limit and not mp[nx, ny] and ap[nx, ny] > 20:
                mp[nx, ny] = 255
                q.append((nx, ny))
    return m


def parts(im):
    """base, arm, cap — the three layers every frame is built from."""
    W, H = im.size
    ap = im.split()[3].load()

    m = _fill(ap, W, (420, 310), CUT).crop((0, 0, W, H))        # the forearm
    head = _fill(ap, W, (300, 300), CUT).crop((0, 0, W, H))     # head and hair

    arm = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arm.paste(im, (0, 0), m)

    # Above the elbow the base keeps the head and nothing else. Erasing only
    # the arm's own blob leaves its drop shadow behind — a few hundred pixels
    # at alpha 10-20, too faint to join the flood fill and just dark enough to
    # read as a grey smudge once the arm has swung away from it.
    base = im.copy()
    clear = Image.new("L", (W, H), 0)
    clear.paste(255, (0, 0, W, CUT))
    clear = ImageChops.subtract(clear, head)
    base.paste((0, 0, 0, 0), (0, 0), clear)

    cm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(cm).ellipse([PIVOT[0] - CAP[0], PIVOT[1] - CAP[1],
                                PIVOT[0] + CAP[0], PIVOT[1] + CAP[1]], fill=255)
    cm = cm.filter(ImageFilter.GaussianBlur(3))
    cap = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cap.paste(im, (0, 0), cm)
    return base, arm, cap


# The performance, as angles over time. 0 deg is the arm as drawn — raised,
# palm open. Negative swings it inward, over the head.
#
# Scratching is a small, quick rub at the hairline; waving is a wider, slower
# swing with a held beat at each end, which is what stops it looking like a
# metronome. The two are the same joint, so the move between them is just the
# angle travelling — no cut, nothing to mismatch.
SCRATCH = 52.0              # hand on the crown
WAVE = 1.0                  # arm raised, palm out — the drawing as rendered
KEYS = [
    (0.00, SCRATCH),
    (0.20, SCRATCH - 4.5),      # rubbing: small, quick, uneven
    (0.38, SCRATCH + 1.0),
    (0.56, SCRATCH - 5.0),
    (0.74, SCRATCH + 0.5),
    (0.92, SCRATCH - 4.0),
    (1.20, SCRATCH - 1.0),
    (1.75, WAVE - 12.0),        # the arm swings down and out, past the target
    (2.00, WAVE + 13.0),
    (2.32, WAVE - 12.0),        # three strokes
    (2.64, WAVE + 13.0),
    (2.96, WAVE - 12.0),
    (3.28, WAVE + 13.0),
    (3.60, WAVE - 12.0),
    (3.95, WAVE),               # held, palm out
    (4.40, WAVE),
    (5.10, SCRATCH),            # and back up into the hair to loop
    (5.45, SCRATCH),
]


def ease(t):
    return t * t * (3 - 2 * t)


def angle_at(t):
    if t <= KEYS[0][0]:
        return KEYS[0][1]
    for (t0, a0), (t1, a1) in zip(KEYS, KEYS[1:]):
        if t <= t1:
            return a0 + (a1 - a0) * ease((t - t0) / (t1 - t0))
    return KEYS[-1][1]


def build(out_path):
    im = Image.open(SRC).convert("RGBA")
    base, arm, cap = parts(im)

    # Sampled by how far the arm has moved, not on a fixed clock. A frame
    # costs the same whether the arm shifted a degree or ten, and the swing is
    # an order of magnitude faster than the rub, so an even 20fps spends most
    # of the file on the parts that are barely moving. Stepping on angle keeps
    # the fast strokes smooth and lets the held beats run on a single frame.
    dur = KEYS[-1][0]
    times_s, t = [0.0], 0.0
    while t < dur:
        a = angle_at(t)
        dt = MIN_MS / 1000.0
        while dt < MAX_MS / 1000.0 and abs(angle_at(t + dt) - a) < STEP_DEG:
            dt += 0.01
        t += dt
        times_s.append(min(t, dur))

    frames, times = [], []
    for i, t0 in enumerate(times_s):
        t1 = times_s[i + 1] if i + 1 < len(times_s) else dur + MIN_MS / 1000.0
        f = base.copy()
        f.alpha_composite(arm.rotate(angle_at(t0), resample=Image.BICUBIC, center=PIVOT))
        f.alpha_composite(cap)
        frames.append(f)
        times.append(max(MIN_MS, int(round((t1 - t0) * 1000))))

    bb = None
    for f in frames:
        b = f.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]),
                                   max(bb[2], b[2]), max(bb[3], b[3]))
    bb = (max(0, bb[0] - 4) // 2 * 2, max(0, bb[1] - 4) // 2 * 2,
          min(im.width, bb[2] + 4), min(im.height, bb[3] + 4))
    frames = [f.crop(bb) for f in frames]
    if OUT_W and frames[0].width != OUT_W:
        h = int(round(frames[0].height * OUT_W / frames[0].width)) // 2 * 2
        frames = [f.resize((OUT_W // 2 * 2, h), Image.LANCZOS) for f in frames]

    # Only the arm moves, so each frame's difference from the last is a small
    # rectangle around it. Those sub-frames can carry a high quality setting
    # and still cost little, which is where the sharpness comes from.
    tmp = tempfile.mkdtemp()
    args = []
    for i, f in enumerate(frames):
        if i == 0:
            part, off, q = f, (0, 0), "90"
        else:
            d = ImageChops.difference(f, frames[i - 1]).getbbox()
            if d is None:
                times[i - 1] += times[i]
                continue
            x0 = max(0, d[0] - 2) // 2 * 2
            y0 = max(0, d[1] - 2) // 2 * 2
            part = f.crop((x0, y0, min(f.width, d[2] + 2), min(f.height, d[3] + 2)))
            off, q = (x0, y0), "72"
        png, webp = f"{tmp}/f{i}.png", f"{tmp}/f{i}.webp"
        part.save(png)
        subprocess.run(["cwebp", "-quiet", "-q", q, "-alpha_q", "92", "-m", "6",
                        png, "-o", webp], check=True)
        args += ["-frame", webp, f"+{times[i]}+{off[0]}+{off[1]}+0-b"]
    subprocess.run(["webpmux", *args, "-loop", "0", "-bgcolor", "0,0,0,0",
                    "-o", out_path], check=True)
    print(f"{out_path}: {len(frames)} frames, {sum(times)} ms, "
          f"{os.path.getsize(out_path)//1024} KB, canvas {frames[0].size}")


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "media/hero-wave.webp")
