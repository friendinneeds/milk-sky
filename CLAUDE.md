# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `milk-sky.html` directly in a browser, or serve with any static file server:

```
npx serve .
python3 -m http.server 8080
```

Admin mode (enables delete buttons, clear-all): append `#admin` to the URL.

## Architecture

**No framework, no bundler, no dependencies.** Three files make up the full app:

- `milk-sky.html` — production page; inlines the dock, desktop icons, Aqua confirm dialog, and loads `styles.css` + `app.js`
- `styles.css` — all styles for both HTML variants
- `app.js` — all logic, one `init()` function called on `DOMContentLoaded`; entire state lives in closure variables

`milk-sky-lite.html` is a lighter variant (no parallax sky background) sharing the same CSS and JS.

## State model (`app.js`)

All mutable state lives in the `init()` closure:

| Variable | Purpose |
|---|---|
| `FILES[]` | Array of file objects `{ name, sizeStr, sizeBytes, kind, dateStr, icon, isImage, url }` |
| `selectedIdx` | Index into `FILES` of the currently selected/previewed item |
| `visibleList` | Output of `render()` — filtered+sorted `{f, idx}` pairs used for arrow-key navigation |
| `viewMode` | `'grid'` or `'list'` |
| `sortKey` / `sortDir` | Active sort column and direction |
| `searchQuery` | Live filter string |

Files persist via `localStorage` key `milksky.files.v1` as base64 data URLs. Only images are accepted on drop; non-images trigger a CSS shake on the dropzone.

## Key behaviors

**Genie animation** — uses CSS custom properties `--gx`/`--gy` on `.win` to set the dock icon target. `.genie-out` triggers the collapse transition. `.genie-in` is added first with `transition: none` to snap the window to the collapsed position instantly, then removed inside a double-`rAF` to play the expand transition upward.

**Window drag** — the window starts flex-centered. On first `mousedown` on the titlebar, it switches to `position: fixed` with explicit `left`/`top`, so the flex parent stops fighting the drag position.

**Preview navigation** — `visibleList` (the current filtered+sorted render output) is the source of truth for arrow-key navigation. Navigation wraps endlessly via modulo on `visibleList.length`.

**Admin mode** — `window.location.hash === '#admin'` is checked once at init. It gates delete buttons in both list and grid views, the clear-all button, and keyboard Delete/Backspace deletion.

## Other files

- `assets/` — SVGs (`favicon.svg`, `contacts.svg`, `arena.png`), `sky-bg.png`, and icon placeholders
- `uploads/` — test images used during development (not served in production)
- `scraps/` — design screenshots and a Napkin sketch file; not part of the app
- `tweaks-panel.jsx` — standalone React/Babel design-tweaks panel for rapid prototyping; not used by the main app
