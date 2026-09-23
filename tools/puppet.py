"""Builds the hero wave from ONE frame of the 3D render, by rigging its arm.

The clip in media/src is the character; nothing here redraws him. But as an
animation it could only ever be two crisp poses toggling: every frame between
them is motion-blurred into several half-transparent hands (see videowave.py),
so the shipped loop stepped between the holds and read as a flicker, not a
wave. No re-render was available, and a 3D model of him does not exist to
re-pose — the render is all there is of him.

So the crispest frame is keyed once and cut into three parts on the joints
the render itself shows:

    body      head and torso, held still
    forearm   the sleeve from the cuff to the elbow, which sits right on the
              bottom edge of the frame — the upper arm is behind the torso
    hand      the skin blob above the cuff, which the wrist narrows to 31px

and every frame is those parts turned about their pivots. The hand follows
the forearm a beat late, which is what a real wave does — the hand is loose
on the wrist, so it whips — and what makes an oscillation read as excited
rather than mechanical.

Two seams, two treatments. The wrist is narrow, so a 30px cap of the hand's
own pixels stays with the forearm and covers the sliver a turn opens there.
The forearm meets the torso only below y=840, black on black; the leftmost
70px of the sleeve stays with the body along that stretch, so when the arm
swings away the gap fills with sleeve rather than with the page. Nothing
is painted: every pixel in every frame is from the frame that was keyed.

    python3 tools/puppet.py                # writes media/hero-wave.webp
    python3 tools/puppet.py --sheet out.png  # extreme poses side by side
"""
from PIL import Image, ImageChops, ImageFilter
import numpy as np
from scipy import ndimage
import glob, math, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import videowave as vw

MEDIA = os.path.join(HERE, "..", "media")
SRC = os.path.join(MEDIA, "src", "excited-wave-animation.mp4")
FRAME = 98            # the closing hold: the crispest frame in the clip (blur
                      # floor 3872), hand up beside the head, fingers spread

# Joints, in source pixels (1024 canvas), measured on that frame
WRIST = (841, 770)    # the narrowest skin row above the cuff
ELBOW = (840, 1006)   # the sleeve's bend, on the bottom edge of the frame
CREASE_X = 748        # right of this, below the hand, is sleeve not torso
CUFF_TOP = 690        # above the cuff's rim; the hand sits on top of it
GAP_Y = 822           # up to here there is background between sleeve and torso
JOIN_Y = 840          # below this the two are one black shape
STRIP = 70            # sleeve kept with the body along that join

FPS = 25
WEBP_W = 560
SECONDS = 4.0


def keyed_frame(cache):
    if os.path.exists(cache):
        return Image.open(cache).convert("RGBA")
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC,
                    os.path.join(tmp, "f%04d.png")], check=True)
    frames = sorted(glob.glob(os.path.join(tmp, "f*.png")))
    im = vw.key(frames[FRAME])
    im.save(cache)
    return im


class Puppet:
    def __init__(self, src):
        self.src = src
        self.W, self.H = src.size
        a = np.asarray(src).astype(int)
        r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
        opaque = al > 0
        skin = (al > 120) & (r > 175) & (g > 90) & (g < 200) & (b < 175) & ((r - b) > 40)

        # the hand: the largest skin blob right of the face
        lab, n = ndimage.label(skin)
        sizes = ndimage.sum(skin, lab, range(1, n + 1))
        objs = ndimage.find_objects(lab)
        hand_k = max((k for k in range(n) if objs[k][1].start > 600),
                     key=lambda k: sizes[k]) + 1
        hand = ndimage.binary_dilation(lab == hand_k, vw._disk(7)) & opaque

        yy, xx = np.mgrid[0:self.H, 0:self.W]
        # The sleeve. Above the join it stands clear of the torso, so it is
        # simply the pieces on the far side of that gap — cutting on a fixed x
        # there took a straight slice out of the shoulder. Below the join the
        # two are one black shape and a fixed x is all there is.
        upper = opaque & ~hand & (yy >= CUFF_TOP) & (yy < GAP_Y)
        lab2, n2 = ndimage.label(upper)
        sleeve = np.zeros_like(opaque)
        for k, sl in enumerate(ndimage.find_objects(lab2), start=1):
            if sl is not None and sl[1].start > CREASE_X - 12:
                sleeve |= lab2 == k
        sleeve |= opaque & ~hand & (xx > CREASE_X) & (yy >= GAP_Y)
        d_wrist = np.hypot(xx - WRIST[0], yy - WRIST[1])
        cap = hand & (d_wrist <= 20)           # stays with the forearm too
        strip = sleeve & (yy >= GAP_Y) & (xx <= CREASE_X + STRIP)

        self.hand = self._layer(hand)
        self.forearm = self._layer(sleeve | cap)
        self.body = self._layer(opaque & ~hand & ~sleeve | strip)

    def _layer(self, mask):
        m = Image.fromarray((mask * 255).astype(np.uint8))
        out = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        out.paste(self.src, (0, 0), m)
        return out

    def render(self, arm_deg=0.0, hand_deg=0.0, bob=0.0):
        """Positive angles swing toward the viewer's right (the hand's side)."""
        hand = self.hand
        if abs(hand_deg) > 0.05:
            hand = hand.rotate(-hand_deg, resample=Image.BICUBIC, center=WRIST)
        arm = self.forearm.copy()
        arm.alpha_composite(hand)
        if abs(arm_deg) > 0.05:
            arm = arm.rotate(-arm_deg, resample=Image.BICUBIC, center=ELBOW)
        f = self.body.copy()
        f.alpha_composite(arm)
        if abs(bob) >= 0.5:
            out = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
            out.alpha_composite(f, (0, int(round(bob))))
            f = out
        return f


def burst(t, start, cycles, hz, amp):
    """One run of waving: eases in over the first half cycle, rings down over
    the last one, so it starts like a decision and ends like a hand coming to
    rest rather than stopping dead."""
    d = t - start
    if d < 0:
        return 0.0
    length = cycles / hz
    if d > length + 0.25:
        return 0.0
    env = min(1.0, d * hz * 2)                      # in
    env *= max(0.0, min(1.0, (length + 0.25 - d) / 0.55))   # out
    return amp * env * math.sin(2 * math.pi * hz * d)


def timeline(t):
    # A big hello, a breath, a smaller one — the second is what keeps it from
    # reading as a loop, because the two are not the same wave.
    # The swing is biased outward: the hand starts beside the cheek, and an
    # even oscillation would put it across the face on every other beat.
    def swing(tt):
        return burst(tt, 0.10, 3.0, 2.4, 9.0) + burst(tt, 2.30, 2.0, 2.2, 5.5)
    lean = lambda tt: 3.0 * min(1.0, max(0.0, (tt - 0.10) * 4)) if 0.10 <= tt <= 1.60 else 0.0
    arm = swing(t) + lean(t)
    # the hand trails the forearm by about a twelfth of a cycle and overshoots
    lag = 0.035
    hand = 1.35 * swing(t - lag) + 0.6 * lean(t)
    # No body bounce. It looked right, and it cost the file its size: a shift
    # of the whole figure makes every frame a full-canvas difference, where
    # the arm alone is a strip down one side. Tried at 2px: 1.3 MB against 500 KB.
    return dict(arm_deg=arm, hand_deg=hand)


def build(out, seconds=SECONDS):
    cache = os.path.join(tempfile.gettempdir(), f"puppet-key-{FRAME}.png")
    puppet = Puppet(keyed_frame(cache))

    n = int(seconds * FPS)
    ms = int(round(1000 / FPS))
    frames, times = [], []
    for i in range(n):
        f = puppet.render(**timeline(i / FPS))
        if frames and ImageChops.difference(f, frames[-1]).getbbox() is None:
            times[-1] += ms
        else:
            frames.append(f); times.append(ms)

    # one crop for all frames, with room for the swing
    bb = None
    for f in frames:
        b = f.getbbox()
        bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    W, H = frames[0].size
    bb = (max(0, bb[0] - 6) // 2 * 2, max(0, bb[1] - 6) // 2 * 2, min(W, bb[2] + 6), min(H, bb[3] + 6))
    h = int(round((bb[3] - bb[1]) * WEBP_W / (bb[2] - bb[0]))) // 2 * 2
    web = [vw.rgba_resize(f.crop(bb), (WEBP_W, h)) for f in frames]
    web[0].save(os.path.join(MEDIA, "hero-wave-poster.webp"), quality=88)

    tmp = tempfile.mkdtemp()
    args = []
    for i, f in enumerate(web):
        if i == 0:
            part, off, q = f, (0, 0), "84"
        else:
            d = ImageChops.difference(f, web[i - 1]).getbbox()
            x0, y0 = max(0, d[0] - 2) // 2 * 2, max(0, d[1] - 2) // 2 * 2
            part, off, q = f.crop((x0, y0, min(f.width, d[2] + 2), min(f.height, d[3] + 2))), (x0, y0), "76"
        png = os.path.join(tmp, f"f{i:04d}.png"); wp = os.path.join(tmp, f"f{i:04d}.webp")
        part.save(png)
        subprocess.run(["cwebp", "-quiet", "-q", q, "-alpha_q", "92", "-m", "6", png, "-o", wp], check=True)
        args += ["-frame", wp, f"+{times[i]}+{off[0]}+{off[1]}+0-b"]
    subprocess.run(["webpmux", *args, "-loop", "0", "-bgcolor", "0,0,0,0", "-o", out], check=True)
    print(f"{out}: {len(frames)} frames ({n - len(frames)} merged), {sum(times)} ms, "
          f"{web[0].size[0]}x{web[0].size[1]}, {os.path.getsize(out) // 1024} KB")


def sheet(out):
    cache = os.path.join(tempfile.gettempdir(), f"puppet-key-{FRAME}.png")
    p = Puppet(keyed_frame(cache))
    poses = [(-6, -8), (0, 0), (12, 16), (7, 9.5)]
    tiles = []
    for a, h in poses:
        f = p.render(arm_deg=a, hand_deg=h)
        bg = Image.new("RGBA", f.size, (255, 255, 255, 255)); bg.alpha_composite(f)
        tiles.append(bg.crop((500, 380, 1024, 1024)))
    W = sum(t.width for t in tiles)
    s = Image.new("RGB", (W, tiles[0].height), (200, 200, 200)); x = 0
    for t in tiles:
        s.paste(t, (x, 0)); x += t.width
    s.save(out)


if __name__ == "__main__":
    if "--sheet" in sys.argv:
        sheet(sys.argv[sys.argv.index("--sheet") + 1])
    else:
        build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(MEDIA, "hero-wave.webp"))
