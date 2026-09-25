# Mode.Inc email signature generator

Internal tool for generating on-brand Mode.Inc email signatures. Fill in your
details, pick a concept and theme, copy, and paste into Gmail.

Implemented from the Claude Design prototype
([Mode Email Signature Generator](https://claude.ai/design/p/ff240943-096b-4714-b815-27d56559bac7))
using the Mode.Inc design system (May 2026): black canvas, white text,
`#00FF9D` mint accent, Manrope + JetBrains Mono (self-hosted variable TTFs).

## Run

Any static server works; ES modules require HTTP:

```
python3 -m http.server 8907 --directory .
```

Then open http://localhost:8907.

## Concepts

| Concept | Contents |
|---|---|
| 01 · Minimal | Wordmark, name, title, email, mode.inc (no optional links) |
| 02 · Mission | One-line name · title, links row, mission line |
| 03 · Values | Name, title, links row, values row (mint accent rail on dark) |
| 04 · Values + Deloitte | One-line name · title, links, values row, accolade line |
| 05 · Mission + Deloitte | One-line name · title, links, mission line, accolade line |
| 06 · Mission + Deloitte NA | Same as 05, accolade reworded: "#1 Fastest-Growing Software Company in North America, 2023 Deloitte Technology Fast 500™" |

Every concept also has a **logo position** toggle: the wordmark either opens
the signature (top, default) or closes it (bottom).

Each concept ships in **Clear** (light, violet accent per brand rule: never
mint on white) and **Dark** (black card, mint accent) themes.

## Structure

- `signature.js` — pure generator: `(data, concept, theme, config) -> email-safe HTML`.
  Table-based layout, inline styles only, web-safe fonts, no scripts — the hard
  constraints for email clients. Also exports `validate()` (required fields,
  `@mode.inc` address, no company name in job titles, URL checks).
- `app.js` — UI wiring: state, validation display, segmented controls,
  clipboard (async Clipboard API with `execCommand` fallback), live preview.
- `index.html` / `styles.css` — the generator page on the Mode.Inc dark canvas.
- `assets/` — wordmark SVGs and the 500×122 PNG rasters embedded in signatures.
- `fonts/` — Manrope and JetBrains Mono variable TTFs (Google OFL).

## Before company-wide rollout

The signature `<img>` wordmark points at `assets/logo-clear.png` /
`assets/logo-dark.png` resolved against the page origin. Host those PNGs on a
public CDN and update `CONFIG.LOGO_URL_*` in `signature.js` (or pass
`?logoClear=…&logoDark=…` URL params; `none` forces the text-wordmark
fallback) so the image resolves in recipients' inboxes.
