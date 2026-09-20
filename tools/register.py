# Generalised frame extraction: any strip, any count. Figures are found as
# blobs; where two merge because they overlap, the cell pitch splits them.
# Every frame is registered on the torso, so the shoulders stay planted and
# only the arm moves — the bounding box cannot be used, it moves with the arm.
from PIL import Image
from collections import deque
import sys, os

CW, CH = 780, 900   # generous: a source figure can be 500px wide and the
                    # arm must not meet the edge — a clipped arm leaves a cut
                    # edge in the frame and a leftover in the animation

def frames_of(path, count):
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    pitch = W / count
    a = list(im.split()[3].getdata())
    mask = bytearray(1 if v > 24 else 0 for v in a)
    seen = bytearray(W * H)
    blobs = []
    for s in range(W * H):
        if seen[s] or not mask[s]: continue
        q, cells = deque([s]), []
        seen[s] = 1
        while q:
            p = q.popleft(); cells.append(p)
            y, x = divmod(p, W)
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < H and 0 <= nx < W:
                    j = ny*W + nx
                    if not seen[j] and mask[j]: seen[j] = 1; q.append(j)
        if len(cells) > 5000: blobs.append(cells)

    # Where two figures overlap they can merge into one blob, and then a cell
    # taken on the nominal pitch keeps a slice of the neighbour attached. Cut
    # instead at the thinnest column near each boundary — the real gap.
    cover = [sum(1 for y in range(0, H, 3) if mask[y * W + x]) for x in range(W)]
    cuts = [0]
    for k in range(1, count):
        want = int(k * pitch)
        lo = max(1, want - int(pitch * 0.18))
        hi = min(W - 1, want + int(pitch * 0.18))
        cuts.append(min(range(lo, hi), key=lambda x: cover[x]))
    cuts.append(W)

    src = im.load(); out = []
    for k in range(count):
        lo, hi = cuts[k], cuts[k + 1]
        own = max(blobs, key=lambda c: sum(1 for p in c if lo <= p % W < hi))
        window = [p for p in own if lo <= p % W < hi]
        wset = set(window); seen2 = set(); pieces = []
        for st in window:
            if st in seen2: continue
            q2, piece = deque([st]), []
            seen2.add(st)
            while q2:
                p = q2.popleft(); piece.append(p)
                y, x = divmod(p, W)
                for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                    j = (y+dy)*W + (x+dx)
                    if 0 <= y+dy < H and 0 <= x+dx < W and j in wset and j not in seen2:
                        seen2.add(j); q2.append(j)
            pieces.append(piece)
        cells = max(pieces, key=lambda c: sum(1 for p in c if lo <= p % W < hi))

        ys = [p // W for p in cells]
        ybot = max(ys)
        base = [p % W for p in cells if p // W >= ybot - 90]
        ax = sum(base) / len(base)
        canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        dst = canvas.load()
        ox, oy = int(CW * 0.46 - ax), int(CH - 12 - ybot)
        for p in cells:
            y, x = divmod(p, W)
            nx, ny = x + ox, y + oy
            if 0 <= nx < CW and 0 <= ny < CH:
                dst[nx, ny] = src[x, y]
        out.append(canvas)
    return out

if __name__ == "__main__":
    path, count, prefix = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    for i, f in enumerate(frames_of(path, count)):
        f.save(f"{prefix}{i:02d}.png")
    print(prefix, count, "frames")
