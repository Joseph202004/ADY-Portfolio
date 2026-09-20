"""Separates the moving arm from the static body, across the whole library.

Every pose shows the same head and torso; only the arm moves. So the body is
what all the silhouettes have in common, and the arm is whatever each pose has
on top of that. Deriving it this way needs no hand-drawn mask and no horizontal
cut — a cut takes the face with it, which is what put a seam across the glasses
in the first attempt.
"""
from PIL import Image, ImageChops, ImageFilter
import glob, math, os

RIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media", "rig")


def load_all():
    return [Image.open(f).convert("RGBA")
            for f in sorted(glob.glob(os.path.join(RIG, "pose-*.png")))]


def body_mask(poses):
    """What every pose has in common: head and torso."""
    m = poses[0].split()[3].point(lambda v: 255 if v > 40 else 0)
    for p in poses[1:]:
        m = ImageChops.darker(m, p.split()[3].point(lambda v: 255 if v > 40 else 0))
    return m


def arm_of(pose, body):
    """Silhouette minus a *dilated* body. Without the dilation the leftover is
    a thin rim all round the head — the poses differ by a pixel or two — and
    rotating that rim scatters debris across the face."""
    a = pose.split()[3].point(lambda v: 255 if v > 40 else 0)
    arm = ImageChops.subtract(a, body.filter(ImageFilter.MaxFilter(11)))
    return _largest_blob(arm)


def _largest_blob(mask):
    from collections import deque
    W, H = mask.size
    px = mask.load()
    seen = [[False] * W for _ in range(H)]
    best = []
    for sy in range(0, H, 2):
        for sx in range(0, W, 2):
            if seen[sy][sx] or not px[sx, sy]:
                continue
            q, cells = deque([(sx, sy)]), []
            seen[sy][sx] = True
            while q:
                x, y = q.popleft(); cells.append((x, y))
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(2,0),(-2,0),(0,2),(0,-2)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny][nx] and px[nx, ny]:
                        seen[ny][nx] = True; q.append((nx, ny))
            if len(cells) > len(best):
                best = cells
    out = Image.new("L", mask.size, 0)
    op = out.load()
    for x, y in best:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                if 0 <= x+dx < W and 0 <= y+dy < H and px[x+dx, y+dy]:
                    op[x+dx, y+dy] = 255
    return out


def hand_centre(pose):
    W, H = pose.size
    px = pose.load()
    pts = [(x, y) for y in range(0, int(H * 0.55), 2) for x in range(0, W, 2)
           if px[x, y][3] > 120 and px[x, y][0] > 175 and 90 < px[x, y][1] < 200
           and px[x, y][2] < 175 and px[x, y][0] - px[x, y][2] > 40]
    if not pts:
        return None
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def shoulder(arm, body):
    """Where the arm meets the body — the joint the arm swings about."""
    near = ImageChops.multiply(arm, body.filter(ImageFilter.MaxFilter(15)))
    bb = near.getbbox()
    if bb is None:
        return None
    px = near.load()
    pts = [(x, y) for y in range(bb[1], bb[3]) for x in range(bb[0], bb[2]) if px[x, y]]
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def plate(poses, body, clear_pose=0):
    """The body with nothing in front of it.

    Lifting the arm off a frame leaves a hole wherever it covered the head or
    torso, and that hole is what showed as a seam in the first attempt. Those
    pixels cannot be recovered from that frame — but a pose whose arm is raised
    clear of the body has them, so the body is taken from there once."""
    out = Image.new("RGBA", poses[clear_pose].size, (0, 0, 0, 0))
    out.paste(poses[clear_pose], (0, 0), body)
    return out


def arm_angle(pose, piv):
    h = hand_centre(pose)
    if h is None or piv is None:
        return None
    return math.degrees(math.atan2(piv[1] - h[1], h[0] - piv[0]))


def tween(a, b, body, t=0.5, plate_img=None):
    """Part-way from a to b: a's arm turned toward b's, over the clean body."""
    arm_a = arm_of(a, body)
    piv = shoulder(arm_a, body)
    aa, ab = arm_angle(a, piv), arm_angle(b, piv)
    if piv is None or aa is None or ab is None:
        return None
    deg = (ab - aa) * t
    if abs(deg) > 25:                      # too far to fake; keep the real frames
        return None
    layer = Image.new("RGBA", a.size, (0, 0, 0, 0))
    layer.paste(a, (0, 0), arm_a)
    out = Image.new("RGBA", a.size, (0, 0, 0, 0))
    out.alpha_composite(plate_img if plate_img is not None else a)
    out.alpha_composite(layer.rotate(-deg, resample=Image.BICUBIC, center=piv))
    return out


if __name__ == "__main__":
    poses = load_all()
    body = body_mask(poses)
    print("poses", len(poses), "body px", sum(1 for v in body.getdata() if v))
    for i in (0, 5, 16):
        arm = arm_of(poses[i], body)
        print(f"pose-{i:02d}: arm px {sum(1 for v in arm.getdata() if v):6d}  shoulder {shoulder(arm, body)}")
    pl = plate(poses, body, 0)
    mid = tween(poses[10], poses[3], body, 0.5, pl)
    if mid:
        bg = Image.new("RGB", mid.size, (233, 233, 233)); bg.paste(mid, (0, 0), mid)
        row = Image.new("RGB", (mid.width * 3, mid.height), (233, 233, 233))
        for k, im in enumerate([poses[10], mid, poses[3]]):
            t = Image.new("RGB", im.size, (233, 233, 233))
            t.paste(im.convert("RGBA"), (0, 0), im.convert("RGBA"))
            row.paste(t, (k * mid.width, 0))
        row.resize((row.width // 2, row.height // 2)).save("/tmp/tween.png")
        print("wrote /tmp/tween.png")
