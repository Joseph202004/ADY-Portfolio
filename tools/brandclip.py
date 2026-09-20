# Builds a plate clip for one product, following the same six beats as the
# Cursor clip: click the mark -> the profile -> toggle the nav -> the ask,
# close up -> it works -> the result, centred.
# Headers and nav follow each product's own site; the app screens follow their
# real interfaces. Drawn, not recorded, so every punch-in stays sharp.
import os, sys, math
from PIL import Image, ImageDraw, ImageFont

W, H = 896, 672
CW, CH = 1400, 1050
BASE = W / CW
HERE = os.path.dirname(os.path.abspath(__file__))

MONO  = "/System/Library/Fonts/Menlo.ttc"
UI    = "/System/Library/Fonts/HelveticaNeue.ttc"
SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
_fc = {}
def font(path, size, idx=0):
    # .ttc files carry weights as indices; a plain .ttf does not, so a bold
    # request has to resolve to the bold file instead.
    if path.endswith(".ttf") and idx:
        alt = path.replace(".ttf", " Bold.ttf")
        if os.path.exists(alt): path = alt
        idx = 0
    size = max(6, int(round(size))); k = (path, size, idx)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size, index=idx)
    return _fc[k]

def ease(t): return t*t*(3-2*t)
def eout(t): return 1-(1-t)**3

class Cam:
    def __init__(s, cx, cy, z): s.cx, s.cy, s.z = cx, cy, z
    def k(s): return s.z * BASE
    def pt(s, x, y): k = s.k(); return ((x-s.cx)*k + W/2, (y-s.cy)*k + H/2)
    def box(s, x, y, w, h):
        a = s.pt(x, y); k = s.k(); return [a[0], a[1], a[0]+w*k, a[1]+h*k]

class P:
    def __init__(s, cam, bg):
        s.img = Image.new("RGB", (W, H), bg); s.d = ImageDraw.Draw(s.img); s.c = cam
    def rect(s, x, y, w, h, fill=None, r=0, outline=None, width=1):
        b = s.c.box(x, y, w, h); k = s.c.k()
        if b[2] < -80 or b[0] > W+80 or b[3] < -80 or b[1] > H+80: return
        rr = max(0, r*k)
        if rr > 1: s.d.rounded_rectangle(b, radius=rr, fill=fill, outline=outline, width=max(1, int(width*k)))
        else: s.d.rectangle(b, fill=fill, outline=outline, width=max(1, int(width*k)))
    def circ(s, cx, cy, rad, fill=None, outline=None, width=1):
        p = s.c.pt(cx, cy); k = s.c.k(); rr = rad*k
        s.d.ellipse([p[0]-rr, p[1]-rr, p[0]+rr, p[1]+rr], fill=fill, outline=outline, width=max(1, int(width*k)))
    def arc(s, cx, cy, rad, a0, a1, col, width=3):
        b = s.c.box(cx-rad, cy-rad, rad*2, rad*2); k = s.c.k()
        s.d.arc(b, a0, a1, fill=col, width=max(1, int(width*k)))
    def line(s, pts, col, width=2):
        k = s.c.k(); s.d.line([s.c.pt(*p) for p in pts], fill=col, width=max(1, int(width*k)))
    def text(s, x, y, msg, size, fill, bold=False, face=UI):
        if not msg: return
        p = s.c.pt(x, y); k = s.c.k()
        if p[1] < -80 or p[1] > H+80: return
        s.d.text(p, msg, font=font(face, size*k, 1 if bold else 0), fill=fill)
    def img_cam(s, x, y, size, im, alpha=1.0):
        k = s.c.k(); px = max(2, int(size*k)); a = s.c.pt(x, y)
        r = im.resize((px, px), Image.LANCZOS)
        if alpha < 1: r.putalpha(r.split()[3].point(lambda v: int(v*alpha)))
        s.img.paste(r, (int(a[0]), int(a[1])), r)
    def img_screen(s, sx, sy, px, im, alpha=1.0):
        r = im.resize((int(px), int(px)), Image.LANCZOS)
        if alpha < 1: r.putalpha(r.split()[3].point(lambda v: int(v*alpha)))
        s.img.paste(r, (int(sx), int(sy)), r)
    def text_screen(s, sx, sy, msg, size, fill, bold=False, face=UI):
        s.d.text((sx, sy), msg, font=font(face, size, 1 if bold else 0), fill=fill)
    def grad(s, x, y, w, h, top, bot, r=0):
        b = s.c.box(x, y, w, h); k = s.c.k()
        x0, y0, x1, y1 = [int(v) for v in b]
        if x1 <= x0 or y1 <= y0: return
        n = max(1, y1-y0); g = Image.new("RGB", (1, n)); gd = ImageDraw.Draw(g)
        for i in range(n):
            f = i/max(1, n-1)
            gd.point((0, i), fill=tuple(int(top[j]+(bot[j]-top[j])*f) for j in range(3)))
        g = g.resize((max(1, x1-x0), n))
        if r*k > 1:
            m = Image.new("L", g.size, 0)
            ImageDraw.Draw(m).rounded_rectangle([0, 0, g.size[0]-1, g.size[1]-1], radius=r*k, fill=255)
            s.img.paste(g, (x0, y0), m)
        else: s.img.paste(g, (x0, y0))

def pointer(p, x, y, press=0.0, dark_on_light=False):
    k = p.c.k(); a = p.c.pt(x, y); s_ = 30*(1-.12*press)*k
    pts = [(0,0),(0,.74),(.2,.57),(.33,.87),(.47,.8),(.34,.5),(.58,.5)]
    fill = (16,16,18) if dark_on_light else (255,255,255)
    edge = (255,255,255) if dark_on_light else (16,16,18)
    p.d.polygon([(a[0]+u*s_, a[1]+v*s_) for u, v in pts], fill=fill, outline=edge)

# ---------------------------------------------------------------- brands
def gpt_mark(p, x, y, size):
    p.circ(x+size/2, y+size/2, size/2, (16,163,127))
    p.text(x+size*0.13, y+size*0.28, "GPT", size*0.36, (255,255,255), bold=True)

B = {
 "photoshop": dict(
    logo="photoshop_logo.png", word="Photoshop", word_face=UI, serif=False,
    page=(255,255,255), bar=(255,255,255), rule=(226,226,230),
    txt=(35,35,38), dim=(110,110,118), light_ui=True,
    nav=["Creativity & Design", "Photoshop", "Features", "Mobile", "Compare plans"],
    cta="Free trial", cta2="Sign in", accent=(49,168,255),
    panel=(38,38,38), panel2=(48,48,48), canvas=(24,24,24),
    menu=(255,255,255), menu_txt=(35,35,38), menu_dim=(120,120,128), pill=(234,234,238),
    ask="a field of wildflowers at dusk", subtitle="Product designer, Delhi"),
 "claude": dict(
    logo="claude_logo.png", word="Claude", word_face=SERIF, serif=True,
    page=(20,20,19), bar=(20,20,19), rule=(48,46,44),
    txt=(240,238,234), dim=(150,146,140), light_ui=False,
    nav=["Product", "Developers", "Enterprise", "Resources", "Pricing"],
    cta="Try Claude", cta2="Login", accent=(217,119,87),
    panel=(30,29,28), panel2=(38,36,34), canvas=(24,23,22),
    menu=(30,29,28), menu_txt=(240,238,234), menu_dim=(150,146,140), pill=(38,36,34),
    ask="turn my toolkit notes into a scroll-driven list", subtitle="Product designer, Delhi"),
 "figma": dict(
    logo="figma_logo.png", word="Figma", word_face=UI, serif=False,
    page=(255,255,255), bar=(255,255,255), rule=(226,226,230),
    txt=(24,24,26), dim=(104,104,112), light_ui=True,
    nav=["Products", "Solutions", "Community", "Resources", "Pricing"],
    cta="Get started for free", cta2="Log in", accent=(13,153,255),
    panel=(44,44,44), panel2=(56,56,56), canvas=(30,30,30),
    menu=(255,255,255), menu_txt=(24,24,26), menu_dim=(110,110,118), pill=(234,234,238),
    ask="a toolkit list that reveals one row at a time", subtitle="Product designer, Delhi"),
 "chatgpt": dict(
    logo="chatgpt_logo.png", word="ChatGPT", word_face=UI, serif=False,
    page=(13,13,13), bar=(13,13,13), rule=(42,42,42),
    txt=(236,236,236), dim=(142,142,142), light_ui=False,
    nav=["About", "Features", "Learn", "Codex", "Business", "Pricing"],
    cta="Sign up for free", cta2="Log in", accent=(16,163,127),
    panel=(24,24,24), panel2=(32,32,32), canvas=(18,18,18),
    menu=(24,24,24), menu_txt=(236,236,236), menu_dim=(142,142,142), pill=(32,32,32),
    ask="summarise these research notes into three themes", subtitle="Product designer, Delhi"),
}

def mark(p, b, x, y, size, alpha=1.0):
    if b["logo"]: p.img_cam(x, y, size, b["_logo"], alpha=alpha)
    else: gpt_mark(p, x, y, size)

NAV_X0, NAV_GAP = 396, 14
def nav_layout(b):
    xs, x = [], NAV_X0
    for label in b["nav"]:
        wdt = len(label)*8.6 + 26
        xs.append((x, wdt)); x += wdt + NAV_GAP
    return xs

def header(p, b, press=0.0, active=None, pill=None):
    p.rect(0, 0, CW, CH, b["page"])
    p.rect(0, 0, CW, 78, b["bar"])
    p.rect(0, 78, CW, 1, b["rule"])
    sc = 1 - .10*press
    mark(p, b, 96, 24 - 2*press, 40*sc)
    p.text(148, 28, b["word"], 27, b["txt"], bold=True, face=b["word_face"])
    if pill is not None:
        px, pw = pill
        p.rect(px, 16, pw, 44, b["pill"], r=9)
    for i, (x, wdt) in enumerate(nav_layout(b)):
        p.text(x+13, 30, b["nav"][i], 16, b["txt"] if active == i else b["dim"])
    p.text(1092, 30, b["cta2"], 16, b["dim"])
    p.rect(1176, 16, len(b["cta"])*9.2+36, 44, b["txt"], r=22)
    p.text(1194, 30, b["cta"], 16, b["page"], bold=True)

def open_logo(p, b, prog):
    header(p, b, press=max(0, (prog-.62)/.38))
    t = ease(min(1, prog/.62))
    pointer(p, 400-(400-118)*t, 150-(150-52)*t, press=max(0, (prog-.62)/.38),
            dark_on_light=b["light_ui"])

def account(p, b, prog):
    header(p, b)
    f = eout(min(1, prog*1.8)); h = 300*f
    if h < 8: return
    p.rect(88, 94, 430, h, b["menu"], r=14, outline=b["rule"])
    if f > .35:
        p.circ(136, 146, 24, b["accent"])
        p.text(125, 130, "A", 25, (255,255,255), bold=True)
        p.text(178, 122, "Aditya Joseph", 24, b["menu_txt"], bold=True)
        p.text(178, 154, b["subtitle"], 17, b["menu_dim"])
    if f > .6:
        p.rect(104, 194, 398, 1, b["rule"])
        for i, row in enumerate(["Dashboard", "Settings", "Usage", "Sign out"]):
            if f > .62 + i*.08:
                p.text(126, 214 + i*42, row, 19, b["menu_txt"] if i == 0 else b["menu_dim"])
    pointer(p, 118, 52, dark_on_light=b["light_ui"])

def nav_toggle(p, b, prog):
    xs = nav_layout(b); n = len(xs)
    pos = min(n-1.001, prog*n); i = int(pos); f = ease(pos-i); j = min(n-1, i+1)
    px = xs[i][0] + (xs[j][0]-xs[i][0])*f
    pw = xs[i][1] + (xs[j][1]-xs[i][1])*f
    header(p, b, active=(j if f > .5 else i), pill=(px, pw))
    pointer(p, px + pw*.5, 68, dark_on_light=b["light_ui"])

def window(p, b, x, y, w, h, title, tint=None):
    p.rect(x, y, w, h, tint or b["panel"], r=12)
    p.rect(x, y, w, 36, b["panel2"], r=12); p.rect(x, y+24, w, 12, b["panel2"])
    for i in range(3): p.circ(x+18+i*15, y+18, 4.5, (86,86,86))
    p.text(x+w/2-len(title)*3.4, y+11, title, 14, b["dim"])

def caret(p, x, y, hgt, col, prog):
    if int(prog*32) % 2: p.rect(x, y, 3, hgt, col)

def typed(msg, prog, rate=1.9):
    return msg[:int(len(msg)*min(1, prog*rate))]

# ---------------------------------------------------------------- Photoshop
def ps_ask(p, b, prog):
    """Contextual taskbar: a selection, then a generative fill prompt."""
    p.rect(0, 0, CW, CH, b["canvas"])
    p.rect(250, 150, 900, 560, (52,52,56), r=4)
    p.grad(250, 150, 900, 560, (86,96,116), (42,46,58))
    # marching-ants selection
    sx, sy, sw, sh = 470, 300, 470, 260
    dash = int(prog*40)
    for i in range(0, int(sw), 22):
        p.rect(sx+i+(dash % 22), sy, 11, 2, (255,255,255))
        p.rect(sx+i+(dash % 22), sy+sh, 11, 2, (255,255,255))
    for i in range(0, int(sh), 22):
        p.rect(sx, sy+i+(dash % 22), 2, 11, (255,255,255))
        p.rect(sx+sw, sy+i+(dash % 22), 2, 11, (255,255,255))
    # contextual taskbar
    p.rect(330, 764, 740, 96, (34,34,36), r=18, outline=(64,64,68))
    p.circ(372, 812, 15, None, outline=b["dim"], width=2)
    p.text(366, 800, "✳", 18, b["dim"])
    p.text(404, 798, "Generative Fill", 21, (236,236,238), bold=True)
    p.rect(596, 786, 330, 52, (24,24,26), r=10, outline=(70,70,74))
    t = typed(b["ask"], prog)
    p.text(614, 800, t, 18, (226,226,228))
    caret(p, 614 + len(t)*9.3, 796, 26, (226,226,228), prog)
    on = prog > .82
    p.rect(944, 786, 104, 52, b["accent"] if on else (58,58,62), r=10)
    p.text(964, 800, "Generate", 17, (10,20,30) if on else (130,130,134), bold=True)

def ps_work(p, b, prog):
    """Generating, with the variations arriving."""
    p.rect(0, 0, CW, CH, b["canvas"])
    p.rect(300, 330, 800, 300, (34,34,36), r=16, outline=(62,62,66))
    sweep = (prog*860) % 360
    p.arc(352, 396, 15, sweep, sweep+250, b["accent"], 3)
    p.text(388, 380, "Generating", 25, (238,238,240), bold=True)
    p.text(548, 380, "·  Firefly Image 3", 20, b["dim"])
    p.rect(348, 440, 704, 8, (58,58,62), r=4)
    p.rect(348, 440, 704*min(1, prog*1.35), 8, b["accent"], r=4)
    cols = [((246,172,120),(214,96,132)), ((150,196,230),(92,120,198)), ((238,206,128),(196,128,88))]
    for i, (c0, c1) in enumerate(cols):
        f = min(1, max(0, prog*2.4 - .35 - i*.22))
        if f <= 0: continue
        x = 348 + i*240
        p.grad(x, 482, 216, 118, c0, c1, r=10)
        if i == 1 and prog > .85: p.rect(x-3, 479, 222, 124, None, r=12, outline=(255,255,255), width=2)

def ps_result(p, b, prog):
    """The filled canvas and the layer it made."""
    window(p, b, 90, 110, 1220, 830, "wildflowers.psd  @ 100%  (Generative Layer 1, RGB/8)")
    p.rect(90, 146, 68, 794, (44,44,46))
    for i in range(9):
        p.rect(110, 172 + i*54, 28, 28, (86,86,90) if i != 2 else b["accent"], r=5)
    p.rect(158, 146, 892, 794, (26,26,28))
    p.grad(214, 200, 780, 640, (252,190,138), (96,116,186), r=6)
    for i in range(7):
        f = min(1, max(0, prog*2.0 - i*.1))
        if f <= 0: continue
        cx = 300 + i*112; cy = 640 - (i % 3)*70
        for k in range(6):
            a = k*math.pi/3
            p.circ(cx + math.cos(a)*26*f, cy + math.sin(a)*26*f, 17*f, (255,236,196))
        p.circ(cx, cy, 15*f, (248,176,86))
        p.rect(cx-3, cy, 6, 150*f, (108,156,110))
    p.rect(1050, 146, 260, 794, (38,38,40))
    p.text(1074, 168, "Layers", 17, (216,216,218), bold=True)
    rows = [("Generative Layer 1", True), ("Background copy", False), ("Background", False)]
    for i, (nm, on) in enumerate(rows):
        f = min(1, max(0, prog*2.4 - i*.2))
        if f <= 0: continue
        y = 206 + i*72
        if on: p.rect(1058, y-8, 244, 64, (58,58,62), r=6)
        p.rect(1074, y, 44, 44, (120,120,124), r=3)
        p.text(1130, y+12, nm, 15, (222,222,224) if on else b["dim"])

# ---------------------------------------------------------------- Claude / ChatGPT
def chat_ask(p, b, prog, placeholder, chip, plus=True):
    p.rect(0, 0, CW, CH, b["canvas"])
    p.rect(300, 392, 800, 268, b["panel"], r=18, outline=b["rule"])
    t = typed(b["ask"], prog)
    if t:
        lines, line = [], ""
        for wd in t.split(" "):
            if len(line) + len(wd) + 1 > 42: lines.append(line); line = wd
            else: line = (line + " " + wd).strip()
        lines.append(line)
        for i, L in enumerate(lines[:2]):
            p.text(340, 436 + i*42, L, 25, b["txt"])
        caret(p, 340 + len(lines[min(1, len(lines)-1)])*13.2,
              432 + (42 if len(lines) > 1 else 0), 32, b["txt"], prog)
    else:
        p.text(340, 436, placeholder, 25, b["dim"])
    if plus:
        p.circ(360, 606, 19, None, outline=b["dim"], width=2)
        p.line([(348, 606), (372, 606)], b["dim"], 2); p.line([(360, 594), (360, 618)], b["dim"], 2)
    p.rect(402, 586, len(chip)*10.4+40, 40, b["panel2"], r=10)
    p.text(422, 596, chip, 17, b["dim"])
    sent = prog > .82
    p.circ(1054, 606, 21, b["txt"] if sent else b["panel2"])
    a = p.c.pt(1054, 606); k = p.c.k()
    col = b["page"] if sent else b["dim"]
    p.d.line([(a[0], a[1]+9*k), (a[0], a[1]-9*k)], fill=col, width=max(1, int(2.6*k)))
    p.d.line([(a[0]-7*k, a[1]-2*k), (a[0], a[1]-10*k), (a[0]+7*k, a[1]-2*k)], fill=col, width=max(1, int(2.6*k)))

def think(p, b, prog, label, lines, done_label):
    p.rect(0, 0, CW, CH, b["canvas"])
    p.rect(300, 372, 800, 306, b["panel"], r=16, outline=b["rule"])
    if prog > .68:
        p.circ(346, 424, 11, b["accent"])
        p.text(376, 410, done_label, 25, b["txt"], bold=True)
    else:
        sweep = (prog*900) % 360
        p.arc(346, 424, 13, sweep, sweep+260, b["accent"], 3)
        p.text(376, 410, label, 25, b["txt"], bold=True)
        p.text(376 + len(label)*13.4, 410, "." * (1 + int(prog*12) % 3), 25, b["dim"])
    for i, L in enumerate(lines):
        f = min(1, max(0, prog*2.5 - .25 - i*.19))
        if f <= 0: continue
        g = int(70 + (150-70)*f)
        p.text(346, 476 + i*46, L, 20, (g, g, g))

def cl_result(p, b, prog):
    """The answer, with what it built beside it."""
    window(p, b, 90, 110, 1220, 830, "Claude")
    p.rect(90, 146, 620, 794, b["canvas"])
    p.rect(126, 186, 548, 64, b["panel2"], r=12)
    p.text(148, 204, "turn my toolkit notes into a", 19, b["txt"])
    lines = ["Here's the list, revealing one row at a time as", "you scroll. Each row fades up as it centres, and",
             "the column stops when the last one lands."]
    for i, L in enumerate(lines):
        f = min(1, max(0, prog*2.4 - .2 - i*.18))
        if f <= 0: continue
        p.text(126, 300 + i*38, L[:int(len(L)*f)], 19, b["txt"])
    p.rect(126, 452, 300, 56, b["panel2"], r=10, outline=b["rule"])
    if prog > .5:
        p.rect(146, 470, 20, 20, b["accent"], r=4)
        p.text(180, 468, "Toolkit.tsx", 18, b["txt"])
    p.rect(710, 146, 600, 794, (250,249,246))
    p.text(742, 176, "Artifact  ·  Toolkit list", 15, (150,146,140))
    names = ["Figma", "Cursor", "Photoshop", "Claude"]
    for i, nm in enumerate(names):
        f = min(1, max(0, prog*2.2 - .4 - i*.18))
        if f <= 0: continue
        p.text(742, 268 + i*104, f"0{i+1}", 15, (170,166,160))
        p.text(796, 250 + i*104, nm, 44, (20,20,19) if i == 3 else (198,194,188))

def gp_result(p, b, prog):
    """The answer streaming: three themes, then a snippet."""
    window(p, b, 150, 110, 1100, 830, "ChatGPT")
    p.rect(150, 146, 260, 794, (24,24,24))
    for i, s in enumerate(["New chat", "Library", "Projects", "Scheduled"]):
        p.text(180, 182 + i*46, s, 16, b["dim"])
    p.text(180, 392, "Recents", 14, (92,92,92))
    for i, s in enumerate(["Toolkit research notes", "Portfolio copy pass"]):
        p.rect(170, 424 + i*40, 220, 32, (34,34,34) if i == 0 else None, r=7)
        p.text(182, 430 + i*40, s, 15, b["txt"] if i == 0 else b["dim"])
    p.rect(410, 146, 840, 794, (18,18,18))
    p.rect(760, 186, 460, 62, (48,48,48), r=14)
    p.text(784, 204, "summarise these research notes", 18, b["txt"])
    themes = [("1. How people scan a list", "They read the current row, not the set."),
              ("2. Motion as a pointer", "Movement says where to look next."),
              ("3. Restraint reads as craft", "One thing moving beats five.")]
    for i, (head, sub) in enumerate(themes):
        f = min(1, max(0, prog*2.3 - .15 - i*.2))
        if f <= 0: continue
        p.text(444, 300 + i*104, head[:int(len(head)*f)], 21, b["txt"], bold=True)
        if f > .6: p.text(444, 334 + i*104, sub[:int(len(sub)*min(1,(f-.6)*3))], 18, b["dim"])
    if prog > .78:
        p.rect(444, 630, 760, 160, (10,10,10), r=10, outline=b["rule"])
        p.text(466, 650, "reveal: 'one-at-a-time'", 17, (110,200,160), face=MONO)
        p.text(466, 684, "window: 3", 17, (110,200,160), face=MONO)
        p.text(466, 718, "ease:   'expo'", 17, (110,200,160), face=MONO)

# ---------------------------------------------------------------- Figma
TABS = [("Design", (13,153,255)), ("FigJam", (161,102,255)), ("Slides", (255,114,38)), ("Make", (180,180,184))]

def fg_ask(p, b, prog):
    """The product tabs, then a prompt into Make."""
    p.rect(0, 0, CW, CH, b["canvas"])
    x = 300
    for i, (label, col) in enumerate(TABS):
        wdt = len(label)*13 + 80
        on = (i == 3 and prog > .3)
        p.rect(x, 250, wdt, 66, (58,58,58) if on else (42,42,42), r=33,
               outline=(96,96,96) if on else None, width=2)
        p.rect(x+22, 268, 30, 30, col, r=7)
        p.text(x+64, 266, label, 23, (240,240,242) if on else (170,170,174))
        x += wdt + 18
    if prog > .18:
        pointer(p, 880, 300)
    p.rect(300, 392, 800, 240, b["panel"], r=18, outline=(84,84,84))
    p.rect(330, 420, 132, 38, (72,72,72), r=8)
    p.rect(344, 429, 20, 20, (180,180,184), r=5)
    p.text(376, 428, "Make", 17, (226,226,228))
    t = typed(b["ask"], prog, 1.7)
    lines, line = [], ""
    for wd in t.split(" "):
        if len(line)+len(wd)+1 > 40: lines.append(line); line = wd
        else: line = (line+" "+wd).strip()
    lines.append(line)
    for i, L in enumerate(lines[:2]):
        p.text(330, 486 + i*40, L, 24, (238,238,240))
    caret(p, 330 + len(lines[min(1, len(lines)-1)])*12.8, 482 + (40 if len(lines) > 1 else 0), 30, (238,238,240), prog)
    sent = prog > .84
    p.circ(1046, 584, 20, b["accent"] if sent else (72,72,72))
    a = p.c.pt(1046, 584); k = p.c.k()
    col = (255,255,255) if sent else (150,150,154)
    p.d.line([(a[0], a[1]+8*k), (a[0], a[1]-8*k)], fill=col, width=max(1, int(2.5*k)))
    p.d.line([(a[0]-6*k, a[1]-2*k), (a[0], a[1]-9*k), (a[0]+6*k, a[1]-2*k)], fill=col, width=max(1, int(2.5*k)))

def fg_work(p, b, prog):
    """Frames being drawn on the canvas."""
    p.rect(0, 0, CW, CH, b["canvas"])
    p.rect(300, 300, 800, 300, b["panel"], r=16, outline=(84,84,84))
    sweep = (prog*880) % 360
    if prog > .7:
        p.circ(346, 352, 11, b["accent"]); p.text(376, 338, "Made 4 frames", 25, (240,240,242), bold=True)
    else:
        p.arc(346, 352, 13, sweep, sweep+250, b["accent"], 3)
        p.text(376, 338, "Making", 25, (240,240,242), bold=True)
        p.text(478, 338, "." * (1 + int(prog*12) % 3), 25, (160,160,164))
    for i in range(4):
        f = min(1, max(0, prog*2.4 - .2 - i*.2))
        if f <= 0: continue
        x = 348 + i*184
        p.rect(x, 404, 164*f, 150, (66,66,68), r=8)
        if f > .8:
            p.rect(x+16, 420, 100, 12, (150,150,154), r=6)
            p.rect(x+16, 444, 132, 10, (104,104,108), r=5)
            p.rect(x+16, 464, 84, 10, (104,104,108), r=5)
            p.rect(x-3, 401, 170, 156, None, r=10, outline=b["accent"], width=2)

def fg_result(p, b, prog):
    """The file: layers, canvas, properties."""
    window(p, b, 90, 110, 1220, 830, "Toolkit  —  Figma", tint=(44,44,44))
    p.rect(90, 146, 250, 794, (38,38,38))
    p.text(114, 170, "Layers", 15, (170,170,174))
    layers = ["Toolkit", "  Row / Figma", "  Row / Cursor", "  Row / Photoshop", "  Row / Claude"]
    for i, L in enumerate(layers):
        f = min(1, max(0, prog*2.4 - i*.16))
        if f <= 0: continue
        if i == 1: p.rect(98, 208 + i*44, 234, 38, (60,72,92), r=5)
        p.text(118, 216 + i*44, L, 15, (226,226,228) if i < 2 else (166,166,170))
    p.rect(340, 146, 720, 794, (30,30,30))
    p.rect(392, 200, 616, 690, (250,250,250), r=6)
    p.text(424, 232, "The tools I design,", 27, (24,24,26), bold=True)
    p.text(424, 268, "think and build with.", 27, (24,24,26), bold=True)
    names = ["Figma", "Cursor", "Photoshop", "Claude"]
    for i, nm in enumerate(names):
        f = min(1, max(0, prog*2.2 - .3 - i*.18))
        if f <= 0: continue
        y = 352 + i*104
        p.text(424, y + 14, f"0{i+1}", 14, (160,160,166))
        p.text(470, y, nm, 40, (24,24,26) if i == 0 else (196,196,200))
        if i == 0 and prog > .55:
            p.rect(462, y - 8, 320, 66, None, r=3, outline=b["accent"], width=2)
            for hx, hy in [(462, y-8), (782, y-8), (462, y+58), (782, y+58)]:
                p.rect(hx-4, hy-4, 8, 8, (255,255,255), outline=b["accent"], width=1)
    p.rect(1060, 146, 250, 794, (38,38,38))
    p.text(1084, 170, "Design", 15, (170,170,174))
    for i, (lab, val) in enumerate([("W", "320"), ("H", "66"), ("Fill", "#111111"), ("Opacity", "100%")]):
        f = min(1, max(0, prog*2.6 - .4 - i*.14))
        if f <= 0: continue
        p.text(1084, 214 + i*54, lab, 15, (150,150,154))
        p.rect(1160, 206 + i*54, 128, 36, (56,56,56), r=6)
        p.text(1176, 214 + i*54, val, 15, (226,226,228))

# ---------------------------------------------------------------- assembly
SPECS = {
 "figma":     [("ask", fg_ask), ("work", fg_work), ("result", fg_result)],
 "photoshop": [("ask", ps_ask), ("work", ps_work), ("result", ps_result)],
 "claude":    [("ask", lambda p, b, pr: chat_ask(p, b, pr, "How can I help you today?", "Claude Opus 4.5")),
               ("work", lambda p, b, pr: think(p, b, pr, "Thinking",
                  ["Reading the toolkit notes", "Grouping them by what they claim",
                   "Choosing a reveal that follows the scroll", "Writing it as one component"], "Thought 8s")),
               ("result", cl_result)],
 "chatgpt":   [("ask", lambda p, b, pr: chat_ask(p, b, pr, "Ask anything", "GPT-5")),
               ("work", lambda p, b, pr: think(p, b, pr, "Thinking",
                  ["Skimming the notes for repeated claims", "Three themes carry most of them",
                   "Checking each against the raw quotes", "Drafting the summary"], "Thought 5s")),
               ("result", gp_result)],
}

def build(key):
    b = dict(B[key])
    if b["logo"]: b["_logo"] = Image.open(HERE + "/" + b["logo"]).convert("RGBA")
    ask, work, result = [f for _, f in SPECS[key]]
    beats = [
        (lambda p, pr: open_logo(p, b, pr),  0.55, (330, 108, 1.85), (178,  48, 2.85), ease),
        (lambda p, pr: account(p, b, pr),    0.55, (250, 156, 2.45), (300, 220, 1.90), eout),
        (lambda p, pr: nav_toggle(p, b, pr), 0.55, (600,  60, 1.90), (900,  60, 1.62), lambda t: t),
        (lambda p, pr: ask(p, b, pr),        0.60, (700, 530, 1.92), (690, 524, 1.70), eout),
        (lambda p, pr: work(p, b, pr),       0.55, (700, 500, 1.85), (700, 512, 1.68), eout),
        (lambda p, pr: result(p, b, pr),     0.75, (640, 520, 1.30), (700, 525, 1.12), ease),
    ]
    out = HERE + "/frames_" + key
    os.system("rm -rf " + out); os.makedirs(out, exist_ok=True)
    n = 0
    for draw, secs, a, c, ez in beats:
        total = int(round(secs*30))
        for i in range(total):
            t = ez(i/max(1, total-1))
            cam = Cam(a[0]+(c[0]-a[0])*t, a[1]+(c[1]-a[1])*t, a[2]+(c[2]-a[2])*t)
            p = P(cam, b["page"])
            draw(p, i/max(1, total-1))
            # the lockup rides the app screens; the first three carry the header
            if n >= 99:
                if b["logo"]: p.img_screen(30, H-70, 34, b["_logo"], alpha=.95)
                else:
                    p.d.ellipse([30, H-70, 64, H-36], fill=(16,163,127))
                    p.text_screen(37, H-62, "GPT", 13, (255,255,255), bold=True)
                p.text_screen(74, H-65, b["word"], 23, (255,255,255), bold=True, face=b["word_face"])
            p.img.save(f"{out}/f{n:04d}.png")
            n += 1
    print(key, "frames", n)

for key in (sys.argv[1:] or list(B)):
    build(key)
