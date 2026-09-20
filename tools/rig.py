"""A small rig for Adi's avatar.

The character is segmented once into parts with pivots, then frames are
composed from parameters — hand angle, blink, breath — so any number of
animations can be built from the same art without redrawing it. Nothing is
repainted or restyled: parts are lifted from the source pixels and moved or
occluded with colours sampled from the art itself, so the design is exactly
the original.

    rig = Rig("media/rig/base.png")
    frame = rig.render(hand_deg=-8, blink=0.5, bob=2)

Parts
  hand   the rightmost skin blob (the head is skin too, so it is split by x),
         dilated to carry its dark outline, rotated about the wrist
  eyes   the two bright blobs inside the glasses; a lid closes over each from
         the top, filled with skin sampled from the brow and edged with the
         art's own outline colour
  body   everything else, held still
"""
from PIL import Image, ImageDraw, ImageFilter
from collections import deque
import json, os


def _components(mask, w, h, minpx):
    seen = bytearray(w * h)
    out = []
    for s in range(w * h):
        if seen[s] or not mask[s]:
            continue
        q, cells = deque([s]), []
        seen[s] = 1
        while q:
            p = q.popleft(); cells.append(p)
            y, x = divmod(p, w)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w:
                    j = ny * w + nx
                    if not seen[j] and mask[j]:
                        seen[j] = 1
                        q.append(j)
        if len(cells) >= minpx:
            out.append(cells)
    return out


def _bbox(cells, w):
    xs = [p % w for p in cells]
    ys = [p // w for p in cells]
    return min(xs), min(ys), max(xs), max(ys)


class Rig:
    HAND_X_FRAC = 0.65          # the head never reaches this far right
    SKIN = lambda r, g, b, a: a > 120 and r > 175 and 90 < g < 200 and b < 175 and r - b > 40
    BRIGHT = lambda r, g, b, a: a > 120 and r > 210 and g > 210 and b > 205

    def __init__(self, path):
        self.path = path
        self.src = Image.open(path).convert("RGBA")
        self.W, self.H = self.src.size
        self._segment()

    # ---------------------------------------------------------------- parts
    def _segment(self):
        W, H, px = self.W, self.H, self.src.load()
        cfgp = os.path.splitext(self.path)[0] + ".rig.json"
        frac = (json.load(open(cfgp)).get("hand_x_frac", self.HAND_X_FRAC)
                if os.path.exists(cfgp) else self.HAND_X_FRAC)
        hand_x = int(W * frac)

        skin = bytearray(W * H)
        bright = bytearray(W * H)
        for y in range(H):
            for x in range(W):
                r, g, b, a = px[x, y]
                if a > 120 and r > 175 and 90 < g < 200 and b < 175 and r - b > 40:
                    skin[y * W + x] = 1
                if a > 120 and r > 210 and g > 210 and b > 205:
                    bright[y * W + x] = 1

        # ---- hand: the largest skin blob right of the split
        right = bytearray(W * H)
        for y in range(H):
            for x in range(hand_x, W):
                right[y * W + x] = skin[y * W + x]
        hand = max(_components(right, W, H, 2000), key=len)
        hx0, hy0, hx1, hy1 = _bbox(hand, W)
        low = [p for p in hand if p // W >= hy1 - 12]
        self.wrist = (sum(p % W for p in low) / len(low), float(hy1))
        self.hand_box = (hx0, hy0, hx1, hy1)

        m = Image.new("L", (W, H), 0)
        mp = m.load()
        for p in hand:
            y, x = divmod(p, W)
            mp[x, y] = 255
        m = m.filter(ImageFilter.MaxFilter(9))      # take the dark outline too
        mp = m.load()
        for y in range(H):
            for x in range(W):
                if y > self.wrist[1] + 2 or x < hand_x - 40:
                    mp[x, y] = 0
        self.hand_mask = m
        self.hand_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.hand_layer.paste(self.src, (0, 0), m)
        self.body = self.src.copy()
        self.body.paste((0, 0, 0, 0), (0, 0), m)

        # ---- eyes: the blink is real artwork. Three renders of the same
        # character — open, half, shut — are registered on the same canvas, so
        # a blink is the eye band swapped for the matching render rather than a
        # lid drawn over the top. The closed eyes are the artist's curves.
        cfg_path = os.path.splitext(self.path)[0] + ".rig.json"
        cfg = json.load(open(cfg_path)) if os.path.exists(cfg_path) else {}
        self.band = tuple(cfg.get("eye_band", [70, 284, 356, 380]))
        here = os.path.dirname(self.path)
        self.blink_art = []
        for level, name in cfg.get("blink_art", []):
            art = Image.open(os.path.join(here, name)).convert("RGBA")
            self.blink_art.append((float(level), art))
        self.blink_art.sort(key=lambda t: t[0])

        # a feathered mask, so a transplant never shows a hard edge
        bx0, by0, bx1, by1 = self.band
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).rounded_rectangle([bx0, by0, bx1, by1],
                                            radius=18, fill=255)
        self.band_mask = m.filter(ImageFilter.GaussianBlur(6))

        # colours sampled from the art, never invented
        bx = self.band


    # --------------------------------------------------------------- render
    def render(self, hand_deg=0.0, blink=0.0, bob=0.0):
        """Compose one frame. blink runs 0 (open) to 1 (shut)."""
        f = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
        f.alpha_composite(self.body)
        layer = self.hand_layer
        if hand_deg:
            layer = layer.rotate(hand_deg, resample=Image.BICUBIC, center=self.wrist)
        f.alpha_composite(layer)

        if blink > 0.02 and self.blink_art:
            art = self.blink_art[0][1]
            for level, candidate in self.blink_art:
                if blink >= level - 0.22:
                    art = candidate
            f.paste(art, (0, 0), self.band_mask)

        if abs(bob) >= 0.5:
            out = Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))
            out.alpha_composite(f, (0, int(round(bob))))
            f = out
        return f

    def describe(self):
        return {
            "canvas": [self.W, self.H],
            "wrist": [round(self.wrist[0]), round(self.wrist[1])],
            "hand_box": list(self.hand_box),
            "eye_band": list(self.band),
            "blink_levels": [l for l, _ in self.blink_art],
        }


if __name__ == "__main__":
    import sys
    rig = Rig(sys.argv[1] if len(sys.argv) > 1 else "media/rig/base.png")
    print(json.dumps(rig.describe(), indent=1))
