"""Assembles the pose library into one animated WebP.

Every uploaded strip is registered into media/rig/pose-NN.png by
tools/register.py — same canvas, same torso anchor — so the shoulders stay
planted and only the arm moves. This script orders those poses into a cycle,
adds in-between frames where a step is too big to read smoothly, and writes a
single image.

In-betweens are positional, never dissolves: the arm above the shoulder is
lifted from the earlier pose and rotated part-way toward the next one. A
cross-fade would show two translucent hands, which is not the design.

    python3 tools/assemble.py media/hero-wave.webp
"""
from PIL import Image, ImageChops, ImageFilter
import limbs
from collections import deque
import os, subprocess, sys, tempfile

RIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media", "rig")

# the cycle: wave, reach up, scratch, come back down, wave
# The order comes from the art, not from the order the strips arrived in.
# Each pose is measured by how high the raised hand reaches; that single number
# parameterises the whole arm motion, from buried in the hair to raised in a
# wave. The cycle then reads: scratch, lift, wave, and back down to loop.
#
#   pose  hand-top      pose  hand-top
#   16      238   deep    02      108
#   15      228           12      108
#   17      226           13       76
#   20      174           14       70
#   18      158           01       62
#   04/21   156           00       32   raised
#
# Ordered by how high the hand reaches, so poses from different strips fall
# into one continuous arc. More of the library is used than strictly needed
# for the pose changes — the extra frames are what make the arm travel read as
# motion rather than as steps.
def hand_positions():
    """Where the hand is in every pose, measured rather than assumed.

    The face is the largest skin blob and the hand the next largest, so the
    hand can be found without knowing which strip a pose came from. Its height
    orders the whole library into one continuous arc — deep in the hair at one
    end, raised in a wave at the other — and poses from different strips
    interleave correctly.
    """
    from collections import deque
    out = {}
    for i, im in enumerate(limbs.load_all()):
        W, H = im.size
        px = im.load()
        mask = bytearray(W * H)
        for y in range(H):
            for x in range(W):
                r, g, b, a = px[x, y]
                if a > 120 and r > 175 and 90 < g < 200 and b < 175 and r - b > 40:
                    mask[y * W + x] = 1
        seen = bytearray(W * H); blobs = []
        for st in range(W * H):
            if seen[st] or not mask[st]:
                continue
            q, cells = deque([st]), []
            seen[st] = 1
            while q:
                p = q.popleft(); cells.append(p)
                y, x = divmod(p, W)
                for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                    ny, nx = y+dy, x+dx
                    if 0 <= ny < H and 0 <= nx < W:
                        j = ny*W + nx
                        if not seen[j] and mask[j]:
                            seen[j] = 1; q.append(j)
            if len(cells) > 400:
                blobs.append(cells)
        blobs.sort(key=len, reverse=True)
        hand = blobs[1] if len(blobs) > 1 else blobs[0]
        out[i] = sum(p // W for p in hand) / len(hand)
    return out


_POS = hand_positions()
ORDER = sorted(_POS, key=lambda i: -_POS[i])      # hair -> wave

# The library is lopsided: 16 poses sit in the hair and only 6 near the wave,
# so playing it straight through dwells on the scratch and flashes past the
# wave. Two corrections. The scratch keeps a spread and drops near-duplicates
# — several poses put the hand within a couple of pixels of each other. And
# the wave, which has no in-between art, is made from an oscillation between
# its four poses, which is what a wave is anyway.
def spread(ids, keep):
    """Evenly spaced picks, so a dense cluster does not dominate."""
    if keep >= len(ids):
        return list(ids)
    step = (len(ids) - 1) / (keep - 1)
    return [ids[round(k * step)] for k in range(keep)]


HAIR  = ORDER[:16]
MID   = ORDER[16:18]
TOP   = ORDER[18:]                                # the four raised poses

SCRATCH = spread(HAIR, 10)
WAVE_BEAT = [TOP[0], TOP[2], TOP[3], TOP[2], TOP[1], TOP[2], TOP[3], TOP[2]]

SEQUENCE = (
    [(i, 130) for i in SCRATCH]                   # working through the hair
    + [(i, 95) for i in MID]                      # the arm comes clear
    + [(i, 95) for i in TOP[:2]]
    + [(i, 105) for i in WAVE_BEAT]               # waving, three times over
    + [(i, 105) for i in WAVE_BEAT]
    + [(i, 105) for i in WAVE_BEAT]
    + [(TOP[-1], 260)]                            # a beat at the top
    + [(i, 95) for i in TOP[1::-1] + MID[::-1]]   # and back down
    + [(i, 110) for i in SCRATCH[::-1][1:]]
)

# Set high enough to disable: a rotated in-between leaves a seam where the
# arm was lifted from the body, because the arm is separated by silhouette and
# the shoulder join is a hard edge rather than a deformable joint. More source
# frames at the jumpy moments beat a synthesised one — drop them in the library
# and they register automatically.
ARM_MIN = 10 ** 9        # px of arm silhouette needed before a tween is used
OUT_W = 320              # the page renders at 420; whole frames cost more than
                         # composited ones, so this pays for keeping 52 of them

BAND_Y = 348        # the hand never descends below y=333, so everything from
                    # here down — face, glasses, collar, torso — can be held
                    # from one render. Each pose draws the face slightly
                    # differently, and that was 10,219 px of jitter a frame.
FEATHER = 26        # rows over which the frozen body blends into the frame


FREEZE = False      # see the note in build()


def freeze_body(poses, ref=0):
    """Hold the torso still.

    Each pose is a separate render, so the sweater's lower edge lands at a
    slightly different height — measured, up to 1500 differing pixels around
    y=600. The body never moves in this animation, so below the collar every
    frame takes its pixels from one reference pose. The seam is feathered, and
    because those rows then match exactly they also drop out of the per-frame
    difference, which makes the file smaller as well as steadier.
    """
    W, H = poses[ref].size
    base = poses[ref]
    out = []
    for p in poses:
        f = p.copy()
        f.paste(base.crop((0, BAND_Y, W, H)), (0, BAND_Y))
        for k in range(FEATHER):                       # blend across the join
            y = BAND_Y - FEATHER + k
            if y < 0:
                continue
            a = k / FEATHER
            row = Image.blend(p.crop((0, y, W, y + 1)), base.crop((0, y, W, y + 1)), a)
            f.paste(row, (0, y))
        out.append(f)
    return out


def load(i):
    return Image.open(os.path.join(RIG, f"pose-{i:02d}.png")).convert("RGBA")


def arm_layer(im, split=0.55):
    """The arm above the shoulder line, by its own silhouette."""
    W, H = im.size
    a = im.split()[3]
    m = Image.new("L", (W, H), 0)
    mp, ap = m.load(), a.load()
    for y in range(int(H * split)):
        for x in range(W):
            if ap[x, y] > 40:
                mp[x, y] = 255
    return m


def tween(a, b, t=0.5):
    """A frame part-way from a to b: a's arm, rotated toward b's."""
    W, H = a.size
    m = arm_layer(a)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(a, (0, 0), m)
    rest = a.copy()
    rest.paste((0, 0, 0, 0), (0, 0), m)

    # how far the arm has to travel, from the two hands' centroids
    def hand(im):
        px = im.load()
        pts = [(x, y) for y in range(int(H * 0.45)) for x in range(0, W, 2)
               if (lambda r, g, bl, al: al > 120 and r > 175 and 90 < g < 200 and bl < 175 and r - bl > 40)(*px[x, y])]
        if not pts:
            return None
        return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)

    ha, hb = hand(a), hand(b)
    if not ha or not hb:
        return None
    pivot = (W * 0.62, H * 0.62)             # roughly the shoulder
    import math
    aa = math.atan2(ha[1] - pivot[1], ha[0] - pivot[0])
    ab = math.atan2(hb[1] - pivot[1], hb[0] - pivot[0])
    deg = math.degrees(ab - aa) * t
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.alpha_composite(rest)
    out.alpha_composite(layer.rotate(deg, resample=Image.BICUBIC, center=pivot))
    return out


def build(out_path):
    # Whole frames, not a composite. Holding the face and torso from one
    # render stops them wobbling, but it also reads as a cut-out: a still
    # figure with an arm moving on it. Every pose is its own complete drawing,
    # so playing them whole keeps the character coherent, and the small
    # variation between renders reads as hand-drawn rather than as error.
    poses = limbs.load_all()
    if FREEZE:
        poses = freeze_body(poses)
    body = limbs.body_mask(poses)
    arms = [limbs.arm_of(p, body) for p in poses]
    armpx = [sum(1 for v in a.getdata() if v) for a in arms]

    frames, times = [], []
    for n, (idx, ms) in enumerate(SEQUENCE):
        im = poses[idx]
        if n:
            prev = SEQUENCE[n - 1][0]
            step_ok = True
            if step_ok and armpx[prev] > ARM_MIN and armpx[idx] > ARM_MIN and prev != idx:
                mid = limbs.tween(poses[prev], im, body, 0.5)
                if mid is not None:
                    frames.append(mid); times.append(38)
        frames.append(im); times.append(ms)

    # Trim to the ink across the cycle, but cap the bottom above the shortest
    # body. The strips are cropped at different heights — one torso ends at
    # y=565, another runs to y=629 — so a frame tall enough for all of them
    # shows the sweater's hem jumping. Cutting above the shortest means every
    # frame fills the bottom edge and nothing moves there, without freezing
    # anything: each frame stays a complete drawing.
    floor = min(f.getbbox()[3] for f in frames) - 6
    bb = None
    for f in frames:
        b = f.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]),
                                   max(bb[2], b[2]), max(bb[3], b[3]))
    bb = (bb[0], bb[1], bb[2], min(bb[3], floor))
    bb = (max(0, bb[0] - 4) // 2 * 2, max(0, bb[1] - 4) // 2 * 2,
          min(frames[0].width, bb[2] + 4), min(frames[0].height, bb[3] + 4))
    frames = [f.crop(bb) for f in frames]
    if OUT_W and frames[0].width != OUT_W:
        h = int(round(frames[0].height * OUT_W / frames[0].width)) // 2 * 2
        frames = [f.resize((OUT_W // 2 * 2, h), Image.LANCZOS) for f in frames]

    tmp = tempfile.mkdtemp(); args = []
    for i, f in enumerate(frames):
        if i == 0:
            part, off, q = f, (0, 0), "80"
        else:
            d = ImageChops.difference(f, frames[i - 1]).getbbox()
            if d is None:                       # identical: hold the last frame
                times[i - 1] += times[i]
                continue
            x0 = max(0, d[0] - 2) // 2 * 2; y0 = max(0, d[1] - 2) // 2 * 2
            part, off, q = f.crop((x0, y0, min(f.width, d[2] + 2), min(f.height, d[3] + 2))), (x0, y0), "44"
        png, webp = f"{tmp}/f{i}.png", f"{tmp}/f{i}.webp"
        part.save(png)
        subprocess.run(["cwebp", "-quiet", "-q", q, "-alpha_q", "90", "-m", "6",
                        png, "-o", webp], check=True)
        args += ["-frame", webp, f"+{times[i]}+{off[0]}+{off[1]}+0-b"]
    subprocess.run(["webpmux", *args, "-loop", "0", "-bgcolor", "0,0,0,0",
                    "-o", out_path], check=True)
    print(f"{out_path}: {len(frames)} frames, {sum(times)} ms, "
          f"{os.path.getsize(out_path)//1024} KB, canvas {frames[0].size}")


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "media/hero-wave.webp")
