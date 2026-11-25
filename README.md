# Deutsch

A small app for learning German words and grammar. Dark, offline, and meant to be used a few minutes every day. It installs to the phone home screen and keeps everything on the device.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # data layer tests
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build (needed to try offline mode)
```

Hosting under a sub-path (for example GitHub Pages): `BASE_PATH=/repo-name/ npm run build`.

## How it fits together

- `src/db/` Dexie (IndexedDB) schema, batch import, settings, backup. Schema changes must be additive: add a new `version(n)` block, never edit an old one.
- `src/lib/` pure logic: today's plan, streak, dates.
- `src/screens/` one file per screen. `src/components/` shared pieces.
- Words move through `pool` (downloaded, waiting) then `new`, `learning`, `known`. Only `dailyNew` words (default 10) leave the pool per day, so a large download never lands on you at once.
- Duplicates (same part of speech and spelling, ignoring case) are skipped on import.
- Data lives in the browser only. Use Words, then Backup, to export a JSON copy.

## Build plan

1. App shell, data layer, backup, minimal add-words (done)
2. Pack-building script, pack list, paste and CSV import, sorted summary screen
3. Study cards with FSRS (ts-fsrs), daily session, streak with one weekly freeze
4. Tests (multiple choice, type the word, pick the article) and grammar lessons
