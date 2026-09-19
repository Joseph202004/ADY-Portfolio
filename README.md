# ADY Portfolio

A single-page portfolio with two modes, toggled by the button in the hero.

| Mode | What shows |
| --- | --- |
| **Drawing** (default) | A hand-drawn intro video and a handwritten nav — nothing else |
| **Headline** | The full site: typed headline, process section, work, contact |

## Built with

Plain HTML, CSS and JavaScript — no build step, no dependencies.

- **Type** — Geist (variable) with Instrument Serif italic accents; Caveat for the handwritten nav
- **Hero headline** types itself out character by character, and letters thicken
  toward the cursor using the variable font's weight axis
- **Process section** pins while scrolling, driving a step list and matching visual
- Preloader, custom cursor, marquee, scroll reveals and parallax
- Full `prefers-reduced-motion` support throughout

## Running locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing

- Replace `media/hero.mp4` with your own clip, then update the aspect ratio in
  `styles.css` (`.frame.ratio-hero`) to match it.
- Nudge the video horizontally with `--hero-shift` in `styles.css`.
- Client names, services and projects live in arrays at the top of `script.js`.
