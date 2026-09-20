"""Puts every registered pose on one scale and one anchor, measured on the face.

An earlier version measured the chest width and anchored on the bottom rows.
Both are crossed by the arm in the scratch poses, so those frames came out
mis-scaled and shifted — the head sat larger and ran off the left edge. The
face is the one landmark the arm never covers: it is the largest skin blob in
every pose, and its width and chin fix both scale and position.
"""
from PIL import Image
from collections import deque
import glob, os, sys

TARGET_FACE = 196.0          # face width in px, after scaling
CW, CH = 700, 880   # room for every pose after scaling; assemble trims
ANCHOR = (CW * 0.42, CH * 0.56)     # where the chin sits on the canvas


def face(im):
    """The largest skin blob: the face. The hand is skin too but smaller, and
    in the scratch poses only a few fingers show."""
    W, H = im.size
    px = im.load()
    mask = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a > 120 and r > 175 and 90 < g < 200 and b < 175 and r - b > 40:
                mask[y * W + x] = 1
    seen = bytearray(W * H)
    best = []
    for s in range(W * H):
        if seen[s] or not mask[s]:
            continue
        q, cells = deque([s]), []
        seen[s] = 1
        while q:
            p = q.popleft(); cells.append(p)
            y, x = divmod(p, W)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W:
                    j = ny * W + nx
                    if not seen[j] and mask[j]:
                        seen[j] = 1
                        q.append(j)
        if len(cells) > len(best):
            best = cells
    xs = [p % W for p in best]
    ys = [p // W for p in best]
    return min(xs), min(ys), max(xs), max(ys)


def normalise(path, width_override=None):
    im = Image.open(path).convert("RGBA")
    x0, y0, x1, y1 = face(im)
    width = x1 - x0 + 1
    s = TARGET_FACE / (width_override or width)
    cx, chin = (x0 + x1) / 2, y1          # centre of the face, and the chin
    bb = im.getbbox()
    crop = im.crop(bb).resize((max(1, round((bb[2]-bb[0]) * s)),
                               max(1, round((bb[3]-bb[1]) * s))), Image.LANCZOS)
    out = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    out.alpha_composite(crop, (round(ANCHOR[0] - (cx - bb[0]) * s),
                               round(ANCHOR[1] - (chin - bb[1]) * s)))
    return out, width, s


# Poses that came from the same strip share a render scale, so they are
# normalised as a group on the group's median face width. One pose whose face
# is partly behind the arm then cannot pull itself out of scale — pose 13
# measured 250 against its neighbours' 290 and came out visibly too large.
GROUPS = [range(0, 5), range(5, 10), range(10, 15), range(15, 18), range(18, 22)]


def group_of(i):
    for g in GROUPS:
        if i in g:
            return g
    return [i]


if __name__ == "__main__":
    files = sorted(glob.glob(sys.argv[1] if len(sys.argv) > 1 else "media/rig/pose-*.png"))
    widths = {}
    for i, f in enumerate(files):
        x0, y0, x1, y1 = face(Image.open(f).convert("RGBA"))
        widths[i] = x1 - x0 + 1
    for i, f in enumerate(files):
        g = sorted(widths[j] for j in group_of(i) if j in widths)
        med = g[len(g) // 2]
        out, w, s = normalise(f, med)
        out.save(f)
        flag = "  (group median)" if abs(w - med) > 2 else ""
        print(f"{os.path.basename(f)}  face {w} -> scaled on {med}  (x{s:.3f}){flag}")
