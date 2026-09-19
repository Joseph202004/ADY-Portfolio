# Cursor plate montage. The screens follow cursor.com's own product shots:
# the three-column desktop (task list / agent thread / live preview + CLI) and
# the tabbed plan view. Everything is drawn through a camera, so a punch-in is
# rendered at its final size rather than upscaled.
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 896, 672
CW, CH = 1400, 1050
BASE = W / CW
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE + "/frames"
os.makedirs(OUT, exist_ok=True)
LOGO = Image.open(HERE + "/cursor_logo.png").convert("RGBA")

MONO = "/System/Library/Fonts/Menlo.ttc"
UI   = "/System/Library/Fonts/HelveticaNeue.ttc"
_fc = {}
def font(path, size, idx=0):
    size = max(6, int(round(size)))
    k = (path, size, idx)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size, index=idx)
    return _fc[k]

# sampled from cursor.com
BG     = (10, 10, 10)
CHROME = (26, 26, 26)
PANEL  = (18, 18, 18)
PANEL2 = (22, 22, 22)
BORDER = (42, 42, 42)
TXT    = (232, 232, 232)
DIM    = (138, 138, 138)
FAINT  = (92, 92, 92)
GREEN  = (74, 222, 128)
RED    = (248, 113, 113)
BLUE   = (59, 130, 246)
LIGHT  = (247, 245, 242)

def ease(t): return t * t * (3 - 2 * t)
def eout(t): return 1 - (1 - t) ** 3

class Cam:
    def __init__(s, cx, cy, z): s.cx, s.cy, s.z = cx, cy, z
    def k(s): return s.z * BASE
    def pt(s, x, y):
        k = s.k(); return ((x - s.cx) * k + W / 2, (y - s.cy) * k + H / 2)
    def box(s, x, y, w, h):
        a = s.pt(x, y); k = s.k(); return [a[0], a[1], a[0] + w * k, a[1] + h * k]

class P:
    def __init__(s, cam):
        s.img = Image.new("RGB", (W, H), BG); s.d = ImageDraw.Draw(s.img); s.c = cam
    def rect(s, x, y, w, h, fill=None, r=0, outline=None, width=1):
        b = s.c.box(x, y, w, h); k = s.c.k()
        if b[2] < -60 or b[0] > W + 60 or b[3] < -60 or b[1] > H + 60: return
        rr = max(0, r * k)
        if rr > 1: s.d.rounded_rectangle(b, radius=rr, fill=fill, outline=outline, width=max(1, int(width * k)))
        else: s.d.rectangle(b, fill=fill, outline=outline, width=max(1, int(width * k)))
    def circ(s, cx, cy, rad, fill=None, outline=None, width=1):
        p = s.c.pt(cx, cy); k = s.c.k(); rr = rad * k
        s.d.ellipse([p[0]-rr, p[1]-rr, p[0]+rr, p[1]+rr], fill=fill, outline=outline, width=max(1, int(width*k)))
    def text(s, x, y, msg, size, fill, bold=False, mono=True):
        if not msg: return
        p = s.c.pt(x, y); k = s.c.k()
        if p[1] < -70 or p[1] > H + 70: return
        s.d.text(p, msg, font=font(MONO if mono else UI, size * k, 1 if bold else 0), fill=fill)
    def img_cam(s, x, y, size, im, alpha=1.0):
        k = s.c.k(); px = max(2, int(size * k)); a = s.c.pt(x, y)
        r = im.resize((px, px), Image.LANCZOS)
        if alpha < 1: r.putalpha(r.split()[3].point(lambda v: int(v * alpha)))
        s.img.paste(r, (int(a[0]), int(a[1])), r)
    def img_screen(s, sx, sy, px, im, alpha=1.0):
        r = im.resize((int(px), int(px)), Image.LANCZOS)
        if alpha < 1: r.putalpha(r.split()[3].point(lambda v: int(v * alpha)))
        s.img.paste(r, (int(sx), int(sy)), r)
    def text_screen(s, sx, sy, msg, size, fill, bold=False, mono=False):
        s.d.text((sx, sy), msg, font=font(MONO if mono else UI, size, 1 if bold else 0), fill=fill)
    def arc(s, cx, cy, rad, a0, a1, col, width=3):
        b = s.c.box(cx - rad, cy - rad, rad * 2, rad * 2); k = s.c.k()
        s.d.arc(b, a0, a1, fill=col, width=max(1, int(width * k)))
    def grad(s, x, y, w, h, top, bot, r=0):
        b = s.c.box(x, y, w, h); k = s.c.k()
        x0, y0, x1, y1 = [int(v) for v in b]
        if x1 <= x0 or y1 <= y0: return
        g = Image.new("RGB", (1, max(1, y1-y0))); gd = ImageDraw.Draw(g)
        n = max(1, y1-y0)
        for i in range(n):
            f = i / max(1, n-1)
            gd.point((0, i), fill=tuple(int(top[j] + (bot[j]-top[j])*f) for j in range(3)))
        g = g.resize((max(1, x1-x0), n))
        if r * k > 1:
            m = Image.new("L", g.size, 0)
            ImageDraw.Draw(m).rounded_rectangle([0, 0, g.size[0]-1, g.size[1]-1], radius=r*k, fill=255)
            s.img.paste(g, (x0, y0), m)
        else: s.img.paste(g, (x0, y0))

def window(p, x, y, w, h, title, right=None):
    p.rect(x, y, w, h, PANEL, r=12)
    p.rect(x, y, w, 34, CHROME, r=12); p.rect(x, y+22, w, 12, CHROME)
    for i in range(3): p.circ(x+18+i*15, y+17, 4.5, (58, 58, 58))
    p.text(x + w/2 - len(title)*3.1, y+10, title, 14, DIM, mono=False)
    if right: p.text(x + w - len(right)*7.2 - 16, y+10, right, 14, DIM, mono=False)

def doc_icon(p, x, y, s_=13, col=DIM):
    p.rect(x, y, s_*0.78, s_, None, r=2, outline=col, width=1.4)

def check(p, x, y, r=8, col=DIM):
    p.circ(x, y, r, None, outline=col, width=1.4)
    a = p.c.pt(x-3.4, y+0.4); b = p.c.pt(x-1.1, y+2.8); c = p.c.pt(x+3.6, y-2.6)
    p.d.line([a, b, c], fill=col, width=max(1, int(1.6*p.c.k())))

TASKS = [("Build Landing Page", "now", "Done. Fonts preload in the he…", None),
         ("Plan Mission Control", "now", "Drafted implementation…", ("+20", "-3")),
         ("PyTorch MNIST Experi…", "10m", "PyTorch MNIST Experiments", None),
         ("Set up Cursor Rules fo…", "30m", "Set up Cursor Rules for Dashb…", None),
         ("Bioinformatics Tools", "45m", "Bioinformatics Tools", ("+135", "-21"))]

def desktop(p, prog):
    """The three-column desktop from cursor.com's hero."""
    window(p, 40, 40, 1320, 970, "Cursor Desktop", right="Get Cursor")
    # --- left: task list
    p.rect(40, 74, 330, 936, (14, 14, 14))
    p.text(64, 92, "READY FOR REVIEW 5", 13, FAINT, mono=False)
    for i, (t, when, sub, diff) in enumerate(TASKS):
        y = 126 + i * 74
        if i == 0: p.rect(40, y-10, 330, 66, (24, 24, 24))
        check(p, 76, y+10, 8, DIM if i else GREEN)
        p.text(98, y+2, t, 15, TXT if i == 0 else DIM, mono=False)
        p.text(330, y+2, when, 13, FAINT, mono=False)
        if diff:
            p.text(98, y+26, diff[0], 13, GREEN); p.text(98+len(diff[0])*8.4, y+26, diff[1], 13, RED)
            p.text(98+(len(diff[0])+len(diff[1]))*8.4+10, y+26, "· " + sub, 13, FAINT, mono=False)
        else:
            p.text(98, y+26, sub, 13, FAINT, mono=False)
    # --- middle: agent thread
    p.rect(370, 74, 400, 936, PANEL2)
    p.text(394, 96, "Build Landing Page", 16, TXT, bold=True, mono=False)
    p.rect(390, 126, 360, 72, (22, 22, 22), r=8, outline=BORDER)
    msg = "make a landing page based on attached docs explaining what we do"
    n = int(len(msg) * min(1, prog * 2.0))
    words, line, lines = msg[:n].split(" "), "", []
    for wd in words:
        if len(line) + len(wd) > 38: lines.append(line); line = wd
        else: line = (line + " " + wd).strip()
    lines.append(line)
    for i, L in enumerate(lines[:3]): p.text(404, 138 + i*20, L, 14, (214, 214, 214), mono=False)
    steps = [("Read", "about-acme.md"), ("Read", "brand-guidelines.pdf")]
    for i, (verb, f) in enumerate(steps):
        if prog < .3 + i*.1: continue
        doc_icon(p, 394, 212 + i*24, 13)
        p.text(414, 210 + i*24, verb, 14, DIM, mono=False)
        p.text(452, 210 + i*24, f, 14, FAINT, mono=False)
    if prog > .5:
        p.text(394, 260, "Thought", 14, DIM, mono=False); p.text(456, 260, "6s", 14, FAINT, mono=False)
    if prog > .55:
        for i, L in enumerate(["I'll create a minimal, serif-based landing page that",
                               "matches your brand voice."]):
            p.text(394, 292 + i*20, L, 14, (206, 206, 206), mono=False)
    chips = [("app/page.tsx", "+52", "-0"), ("app/globals.css", "+18", "-0")]
    for i, (f, a, b) in enumerate(chips):
        if prog < .62 + i*.1: continue
        y = 344 + i*40
        p.rect(390, y, 360, 32, (20, 20, 20), r=7, outline=BORDER)
        doc_icon(p, 402, y+9, 13)
        p.text(422, y+8, f, 14, (214, 214, 214), mono=False)
        p.text(422 + len(f)*7.6 + 14, y+8, a, 13, GREEN)
        p.text(422 + len(f)*7.6 + 14 + len(a)*8.2 + 6, y+8, b, 13, RED)
    if prog > .8:
        for i, L in enumerate(["Done. Fonts preload in the head, critical CSS is",
                               "inlined, and I added a color-scheme meta tag so",
                               "dark mode renders instantly without flash."]):
            p.text(394, 440 + i*20, L, 14, (206, 206, 206), mono=False)
    p.rect(390, 900, 360, 86, (20, 20, 20), r=9, outline=BORDER)
    p.text(404, 912, "Plan, search, build anything…", 14, FAINT, mono=False)
    p.rect(400, 946, 78, 26, (28, 28, 28), r=6); p.text(412, 952, "Agent", 13, DIM, mono=False)
    p.rect(486, 946, 84, 26, (28, 28, 28), r=6); p.text(498, 952, "Grok 4.6", 13, DIM, mono=False)
    p.circ(730, 959, 13, (58, 58, 58))
    # --- right: live preview
    p.rect(770, 74, 590, 460, (18, 18, 18))
    p.rect(770, 74, 590, 34, (20, 20, 20))
    for i, g in enumerate(["‹", "›", "⟳"]): p.text(786 + i*22, 82, g, 15, FAINT, mono=False)
    p.text(860, 82, "http://localhost:3000", 13, DIM, mono=False)
    p.rect(790, 126, 550, 390, LIGHT, r=4)
    p.text(818, 152, "Acme Labs", 22, (24, 24, 24), bold=True, mono=False)
    for i, L in enumerate(["Software creation is changing. We are a group of researchers,",
                           "engineers, and technologists inventing at the edge of what's",
                           "useful and possible."]):
        p.text(818, 196 + i*24, L, 15, (70, 70, 70), mono=False)
    if prog > .45:
        p.rect(816, 286, 372, 30, None, r=2, outline=BLUE, width=1.6)
        p.rect(816, 268, 128, 18, BLUE, r=3)
        p.text(824, 270, "CTAButton · button", 11, (255, 255, 255), mono=False)
    p.text(818, 292, "We have much to learn, try, and build.", 15, (40, 40, 40), mono=False)
    # --- right: CLI
    p.rect(800, 548, 560, 462, (12, 12, 12), r=10, outline=BORDER)
    p.rect(800, 548, 560, 32, (20, 20, 20), r=10); p.rect(800, 566, 560, 14, (20, 20, 20))
    for i in range(3): p.circ(818 + i*14, 564, 4, (58, 58, 58))
    p.text(1040, 556, "Cursor CLI", 13, DIM, mono=False)
    cli = ["cleans up whitespace/numbers", "3. ORF finder that searches all three frames",
           "4. Reverse complement for searching both strands", "",
           "The Gotoh implementation uses three matrices (M, X, Y)",
           "to track match/mismatch and gap states separately.", "",
           "Want me to create a quick test to verify everything?"]
    for i, L in enumerate(cli):
        if prog * 10 < i: break
        p.text(820, 596 + i*26, L, 13, (176, 176, 176))
    p.rect(816, 826, 528, 44, None, r=8, outline=BORDER)
    p.text(834, 838, "→  Add a follow-up", 14, FAINT, mono=False)
    p.text(820, 892, "Grok 4.6", 12, FAINT, mono=False)
    p.text(820, 916, "/ for commands  ·  @ for files", 12, (70, 70, 70), mono=False)

def plans(p, prog):
    """The tabbed plan view from the second product shot."""
    window(p, 120, 120, 1160, 800, "Cursor")
    p.rect(120, 154, 430, 766, PANEL2)
    p.text(146, 176, "Plan Mission Control", 16, TXT, bold=True, mono=False)
    p.rect(142, 208, 386, 74, (22, 22, 22), r=8, outline=BORDER)
    msg = ["let's build a mission control interface, similar to", "the expose-style window manager on macOS"]
    for i, L in enumerate(msg):
        n = int(len(L) * min(1, max(0, prog * 2.4 - i * .4)))
        p.text(156, 220 + i*22, L[:n], 14, (214, 214, 214), mono=False)
    if prog > .5:
        p.text(146, 300, "Thought", 14, DIM, mono=False); p.text(208, 300, "4s", 14, FAINT, mono=False)
    tabs = [("feature-prd.md", True), ("presence.ts", False)]
    x = 550
    for name, on in tabs:
        wdt = len(name) * 8.2 + 44
        p.rect(x, 154, wdt, 38, (24, 24, 24) if on else PANEL, r=0)
        p.text(x + 16, 164, name, 14, TXT if on else FAINT, mono=False)
        if on: p.text(x + wdt - 22, 164, "×", 14, FAINT, mono=False)
        x += wdt
    p.rect(550, 192, 730, 728, (16, 16, 16))
    p.text(578, 210, "Plans  ›  feature-prd.md", 13, FAINT, mono=False)
    p.text(578, 254, "Mission Control Interface", 30, TXT, bold=True, mono=False)
    rows = [620, 700, 540, 660, 480, 600, 420]
    for i, wdt in enumerate(rows):
        f = min(1, max(0, prog * 2.4 - i * .16))
        if f <= 0: continue
        p.rect(578, 320 + i*42, wdt * f, 13, (38, 38, 38), r=6)


# ---- the site header, the click on the mark, and the nav toggle ----
NAV = ["Models", "Product", "Enterprise", "Pricing", "Resources"]
NAV_X0, NAV_GAP = 418, 16
def nav_layout():
    xs, x = [], NAV_X0
    for label in NAV:
        wdt = len(label) * 10.6 + 30
        xs.append((x, wdt))
        x += wdt + NAV_GAP
    return xs

def pointer_at(p, x, y, press=0.0):
    k = p.c.k(); a = p.c.pt(x, y); s_ = 30 * (1 - .12 * press) * k
    pts = [(0,0),(0,.74),(.2,.57),(.33,.87),(.47,.8),(.34,.5),(.58,.5)]
    p.d.polygon([(a[0]+u*s_, a[1]+v*s_) for u, v in pts], fill=(255,255,255), outline=(16,16,18))

def header(p, press=0.0, active=None, pill=None):
    """cursor.com's own top bar."""
    p.rect(0, 0, CW, CH, (8, 8, 8))
    p.rect(0, 62, CW, 1, (30, 30, 30))
    scale = 1 - .10 * press
    p.img_cam(96, 26 - 2*press, 40 * scale, LOGO)
    p.text(148, 30, "CURSOR", 26, TXT, bold=True, mono=False)
    if pill is not None:
        px, pw = pill
        p.rect(px, 18, pw, 40, (26, 26, 26), r=9)
    for i, (x, wdt) in enumerate(nav_layout()):
        on = (active == i)
        p.text(x + 15, 28, NAV[i], 19, TXT if on else DIM, mono=False)
    p.text(1092, 28, "Sign in", 19, DIM, mono=False)
    p.rect(1170, 16, 92, 44, None, r=22, outline=(48, 48, 48))
    p.text(1190, 28, "Contact", 18, TXT, mono=False)
    p.rect(1274, 16, 110, 44, (245, 245, 245), r=22)
    p.text(1294, 28, "Download", 18, (12, 12, 12), bold=True, mono=False)

def open_logo(p, prog):
    """The pointer travels to the mark and presses it."""
    header(p, press=max(0, (prog - .62) / .38))
    t = ease(min(1, prog / .62))
    px = 400 - (400 - 118) * t
    py = 150 - (150 - 52) * t
    pointer_at(p, px, py, press=max(0, (prog - .62) / .38))

def account(p, prog):
    """...and Aditya Joseph's profile drops out of it."""
    header(p)
    f = eout(min(1, prog * 1.8))
    h = 300 * f
    if h < 8: return
    p.rect(88, 78, 430, h, (18, 18, 18), r=14, outline=(38, 38, 38))
    if f > .35:
        p.circ(136, 128, 24, (124, 150, 214))
        p.text(125, 112, "A", 25, (255, 255, 255), bold=True, mono=False)
        p.text(178, 104, "Aditya Joseph", 24, TXT, bold=True, mono=False)
        p.text(178, 136, "Product designer, Delhi", 17, FAINT, mono=False)
    if f > .6:
        p.rect(104, 176, 398, 1, (34, 34, 34))
        for i, row in enumerate(["Dashboard", "Settings", "Usage", "Sign out"]):
            if f > .62 + i * .08:
                p.text(126, 196 + i * 42, row, 19, TXT if i == 0 else DIM, mono=False)
    pointer_at(p, 118, 52)

def nav_toggle(p, prog):
    """Each nav item lights in turn, the pill sliding under the pointer."""
    xs = nav_layout()
    n = len(xs)
    pos = min(n - 1.001, prog * n)
    i = int(pos)
    f = ease(pos - i)
    j = min(n - 1, i + 1)
    px = xs[i][0] + (xs[j][0] - xs[i][0]) * f
    pw = xs[i][1] + (xs[j][1] - xs[i][1]) * f
    header(p, active=(j if f > .5 else i), pill=(px, pw))
    pointer_at(p, px + pw * .5, 66)

def prompt_closeup(p, prog):
    """Close on the composer: the prompt typed in, then sent."""
    p.rect(0, 0, CW, CH, (8, 8, 8))
    p.rect(300, 392, 800, 268, (18, 18, 18), r=16, outline=(44, 44, 44))
    # the file it is aimed at
    p.rect(330, 420, 196, 38, (26, 26, 26), r=8)
    doc_icon(p, 344, 430, 16, DIM)
    p.text(368, 428, "@ Toolkit.tsx", 17, (206, 206, 206), mono=False)

    msg = ["make the toolkit rows reveal", "one at a time as you scroll"]
    typed = int(sum(len(m) for m in msg) * min(1, prog * 1.9))
    used = 0
    for i, L in enumerate(msg):
        n = max(0, min(len(L), typed - used)); used += len(L)
        p.text(330, 484 + i * 40, L[:n], 26, TXT, mono=False)
        if 0 < n < len(L) and int(prog * 34) % 2:
            p.rect(330 + n * 14.1, 482 + i * 40, 3, 32, TXT)
    # composer controls
    p.rect(330, 596, 96, 36, (28, 28, 28), r=8)
    p.text(348, 604, "Agent", 17, DIM, mono=False)
    p.rect(438, 596, 112, 36, (28, 28, 28), r=8)
    p.text(456, 604, "Grok 4.6", 17, DIM, mono=False)
    sent = prog > .82
    p.circ(1054, 614, 20, (245, 245, 245) if sent else (40, 40, 40))
    a = p.c.pt(1054, 614); k = p.c.k()
    col = (16, 16, 16) if sent else (120, 120, 120)
    p.d.line([(a[0], a[1] + 8 * k), (a[0], a[1] - 8 * k)], fill=col, width=max(1, int(2.4 * k)))
    p.d.line([(a[0] - 6 * k, a[1] - 2 * k), (a[0], a[1] - 9 * k), (a[0] + 6 * k, a[1] - 2 * k)],
             fill=col, width=max(1, int(2.4 * k)))

def thinking(p, prog):
    """The pause after the prompt: reasoning, then Thought Ns."""
    p.rect(0, 0, CW, CH, (8, 8, 8))
    p.rect(300, 372, 800, 306, (18, 18, 18), r=16, outline=(44, 44, 44))
    done = prog > .68
    if done:
        check(p, 346, 424, 11, GREEN)
        p.text(376, 410, "Thought", 25, TXT, bold=True, mono=False)
        p.text(492, 410, "6s", 25, DIM, mono=False)
    else:
        sweep = (prog * 900) % 360
        p.arc(346, 424, 13, sweep, sweep + 260, (150, 150, 150), 3)
        p.text(376, 410, "Thinking", 25, TXT, bold=True, mono=False)
        dots = "." * (1 + int(prog * 12) % 3)
        p.text(492, 410, dots, 25, DIM, mono=False)
    steps = ["Reading Toolkit.tsx and the scroll container",
             "The rows are one list — the window shows three",
             "Stagger the reveal off scroll progress, not time",
             "Clamp the travel so the last row still centres"]
    for i, L in enumerate(steps):
        f = min(1, max(0, prog * 2.5 - .25 - i * .19))
        if f <= 0: continue
        col = tuple(int(70 + (150 - 70) * f) for _ in range(3))
        p.text(346, 476 + i * 46, L, 20, col, mono=False)

def making(p, prog):
    """It builds: code streams on the left, the page assembles on the right."""
    window(p, 90, 110, 1220, 830, "Toolkit.tsx  —  building")
    # left: code writing itself
    p.rect(90, 144, 520, 796, (14, 14, 14))
    rows = [[("const ", (167,139,250)), ("rows", (96,165,250)), (" = ", TXT), ("useReveal", (74,222,128)), ("()", TXT)],
            [("  step", TXT), (": ", DIM), ("clamp", (74,222,128)), ("(p * n)", TXT)],
            [("  window", TXT), (": ", DIM), ("3", (251,146,60))],
            [("  ease", TXT), (": ", DIM), ("'expo'", (251,146,60))],
            [("  stagger", TXT), (": ", DIM), ("55", (251,146,60))],
            [("})", TXT)],
            [("", TXT)],
            [("return ", (167,139,250)), ("rows", (96,165,250)), (".map(", TXT)],
            [("  r => ", TXT), ("<Row ", (74,222,128)), ("{...r}", (251,146,60)), (" />", (74,222,128))],
            [(")", TXT)]]
    shown = prog * len(rows) * 1.5
    for i, line in enumerate(rows):
        if i > shown: break
        p.text(122, 178 + i * 40, f"{i+1:>2}", 14, (64, 64, 64))
        x = 162
        for frag, col in line:
            n = len(frag)
            if i > shown - 1: n = int(len(frag) * max(0, min(1, (shown - i))))
            p.text(x, 176 + i * 40, frag[:n], 18, col)
            x += n * 11
        if int(shown) == i and int(prog * 30) % 2:
            p.rect(x + 2, 176 + i * 40, 3, 24, TXT)
    # right: the preview assembling, block by block
    p.rect(610, 144, 700, 796, (20, 20, 20))
    p.rect(640, 176, 640, 730, LIGHT, r=8)
    if prog > .08:
        p.rect(672, 208, 300, 18, (206, 206, 210), r=9)
    if prog > .16:
        p.text(672, 248, "The tools I design,", 30, (24, 24, 24), bold=True, mono=False)
        p.text(672, 288, "think and build with.", 30, (24, 24, 24), bold=True, mono=False)
    names = ["Figma", "Cursor", "Photoshop", "Claude"]
    for i, nm in enumerate(names):
        f = min(1, max(0, prog * 2.2 - .4 - i * .18))
        if f <= 0: continue
        y = 372 + i * 78
        p.text(672, y, f"0{i+1}", 15, (150, 150, 156), mono=False)
        p.text(716, y - 12, nm, 40 * (0.92 + .08 * f), (17, 17, 17) if i == 1 else (196, 196, 200),
               bold=False, mono=False)
    if prog > .82:
        p.rect(672, 700, 560, 12, (226, 226, 230), r=6)
        p.rect(672, 700, 300, 12, (17, 17, 17), r=6)

def profile(p, prog):
    """Whose machine this is."""
    window(p, 240, 200, 920, 650, "Figma")
    p.rect(276, 262, 430, 68, (30, 30, 30), r=12)
    p.circ(316, 296, 23, (124, 150, 214))
    p.text(305, 280, "A", 25, (255, 255, 255), bold=True, mono=False)
    p.text(356, 280, "Aditya Joseph", 25, TXT, bold=True, mono=False)
    ch = p.c.pt(632, 298); kk = p.c.k()
    p.d.line([(ch[0]-7*kk, ch[1]-3*kk), (ch[0], ch[1]+4*kk), (ch[0]+7*kk, ch[1]-3*kk)],
             fill=DIM, width=max(1, int(2.2*kk)))
    pts = [(0,0),(0,.74),(.2,.57),(.33,.87),(.47,.8),(.34,.5),(.58,.5)]
    a = p.c.pt(600, 302); s_ = 26 * kk
    p.d.polygon([(a[0]+u*s_, a[1]+v*s_) for u, v in pts], fill=(255,255,255), outline=(20,20,24))
    if prog > .2:
        p.rect(276, 352, 700, 70, (26, 26, 26), r=10)
        p.text(310, 372, "Search", 21, FAINT, mono=False)
        for i, s2 in enumerate(["Recents", "Community", "Drafts"]):
            if prog > .32 + i*.12: p.text(310, 458 + i*60, s2, 22, TXT if i == 0 else DIM, mono=False)

def project(p, prog):
    """The colourful one — a bright product screen."""
    p.grad(120, 120, 1160, 810, (255, 237, 213), (219, 234, 254), r=18)
    p.rect(160, 176, 1080, 110, (255, 255, 255), r=14)
    p.text(196, 208, "Onebuzz  ·  Plan Builder", 30, (17, 17, 17), bold=True, mono=False)
    p.circ(1180, 231, 22, (99, 102, 241))
    cards = [((244,114,182), "Coverage", "82%"), ((52,211,153), "Claims", "1.2k"),
             ((96,165,250), "Renewals", "94%"), ((251,191,36), "Rating", "4.8")]
    for i, (col, label, val) in enumerate(cards):
        f = min(1, max(0, prog*2.6 - i*.16))
        if f <= 0: continue
        x = 160 + i*274
        p.rect(x, 320, 250, 190, (255,255,255), r=16)
        p.rect(x+24, 348, 44*f, 44, col, r=12)
        p.text(x+24, 412, label, 20, (110,114,128), mono=False)
        p.text(x+24, 440, val, 34, (17,17,17), bold=True, mono=False)
    p.rect(160, 548, 700, 380, (255,255,255), r=16)
    p.text(192, 578, "Premium by segment", 22, (110,114,128), mono=False)
    bars = [(140,(244,114,182)), (210,(167,139,250)), (170,(96,165,250)),
            (250,(52,211,153)), (120,(251,146,60)), (196,(99,102,241))]
    for i, (hgt, col) in enumerate(bars):
        hh = hgt * eout(min(1, max(0, prog*2.2 - i*.12)))
        if hh < 2: continue
        p.rect(200 + i*106, 880-hh, 68, hh, col, r=10)
    p.rect(900, 548, 340, 380, (255,255,255), r=16)
    for i in range(4):
        f = min(1, max(0, prog*2.4 - i*.2))
        if f <= 0: continue
        p.circ(950, 600+i*84, 22, cards[i][0])
        p.rect(986, 588+i*84, 200*f, 14, (232,234,240), r=7)
        p.rect(986, 612+i*84, 140*f, 12, (240,242,246), r=6)

def brand(p, prog):
    """The lockup as cursor.com sets it: mark, then CURSOR in caps."""
    f = min(1, prog * 2.1)
    p.rect(0, 0, CW, CH, (8, 8, 8))
    p.img_cam(548, 428, 132, LOGO, alpha=eout(f))
    name = "CURSOR"
    p.text(712, 452, name[:max(1, int(len(name) * min(1, prog*2.4)))], 62, TXT, bold=True, mono=False)
    if prog > .5:
        p.text(714, 548, "writing code alongside the design", 24, DIM, mono=False)

def lockup(p):
    p.img_screen(30, H - 70, 34, LOGO, alpha=.95)
    p.text_screen(74, H - 65, "CURSOR", 23, (255, 255, 255), bold=True)

BEATS = [
    (open_logo,      0.55, (330, 108, 1.85), (178,  48, 2.85), ease),   # 1  click the mark
    (account,        0.55, (250, 140, 2.45), (300, 205, 1.90), eout),   # 2  the profile
    (nav_toggle,     0.55, (600,  52, 1.90), (900,  52, 1.62), lambda t: t),  # 3  toggle the nav
    (prompt_closeup, 0.60, (700, 530, 1.92), (690, 524, 1.70), eout),   # 4  give the prompt
    (thinking,       0.55, (700, 500, 1.85), (700, 512, 1.68), eout),   # 5  it thinks
    (making,         0.75, (640, 520, 1.30), (700, 525, 1.12), ease),   # 6  it builds, centred
]

FPS = 30
n = 0
for draw, secs, a, b, ez in BEATS:
    total = int(round(secs * FPS))
    for i in range(total):
        t = ez(i / max(1, total - 1))
        cam = Cam(a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t)
        p = P(cam)
        # the three desktop beats share one running progress so the thread
        # keeps filling across the cuts instead of restarting
        pr = i / max(1, total - 1)
        if draw is desktop: pr = min(1, 0.25 + 0.75 * (n / 150))
        draw(p, pr)
        if draw not in (brand, open_logo, account, nav_toggle, prompt_closeup, thinking): lockup(p)
        p.img.save(f"{OUT}/f{n:04d}.png")
        n += 1
print("frames", n)
