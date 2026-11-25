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

## Put it online (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes the app on every push to `main` (or `master`). One-time setup in the GitHub repo: Settings, Pages, Source: GitHub Actions. The site then lives at `https://<user>.github.io/<repo>/`. Open that address on your phone, then add it to the home screen. Pages on a private repository needs a paid GitHub plan.

The workflow runs the tests first, so a broken change never goes live.

## How it fits together

- `src/db/` Dexie (IndexedDB) schema, batch import, settings, backup. Schema changes must be additive: add a new `version(n)` block, never edit an old one.
- `src/lib/` pure logic: today's plan, streak, dates.
- `src/screens/` one file per screen. `src/components/` shared pieces.
- Words move through `pool` (downloaded, waiting) then `new`, `learning`, `known`. Only `dailyNew` words (default 10) leave the pool per day, so a large download never lands on you at once.
- Duplicates (same part of speech and spelling, ignoring case) are skipped on import.
- Data lives in the browser only. Use Words, then Backup, to export a JSON copy.

## Content

- `src/data/myWords.ts` the 71 words from the user's PDF, `src/data/grammar.ts` the 14 grammar topics. Both list the corrections made to the PDF at the top of the file.
- `src/data/sample.ts` a small starter pack (Food & drink). `src/data/packs.ts` lists the packs shown on the Add words screen.
- A word already in the library (same part of speech and spelling) is never added twice, even from a different pack.

## How studying works

- Scheduling is FSRS through `ts-fsrs` (`src/lib/scheduler.ts`). "Know it" is a Good, "Still learning" is an Again. Short learning steps are off: this is a once-a-day app, so a miss comes back the next day.
- A missed card also returns a few cards later in the same session for practice. That retry is logged but does not change the schedule.
- A word counts as known once it is in review and its memory is predicted to last 21 days (`KNOWN_STABILITY_DAYS`). A miss sends it back to learning.
- A session is today's due reviews (oldest first, at most `maxReviews`, default 50) followed by new words. Reviews over the cap wait for the next session.
- New words are released about 10 a day (`dailyNew`), and never more than 10 wait unstudied, so skipping days builds no pile.
- The streak counts a day once 5 cards are done (`streakMinCards`). One missed day between two studied days is covered by a freeze, at most one freeze per 7 days. Two missed days in a row break it.
- Practice (Study tab) works any time, as often as you like: words still learning, all words, one pack, or new words beyond the daily ten. Practising a word you already started never changes its schedule. A word that is due anyway, or not started yet, is scheduled as usual. Practice counts toward the streak.
- Desktop keys in a session: left arrow = still learning, right arrow = know it, up or down = flip.
- The numbers above live in `Settings` (`src/db/schema.ts`). There is no settings screen yet.

## Build plan

1. App shell, data layer, backup (done)
2. Packs, batch size, sorted summary, grammar lessons (done). Still to do: paste and CSV import
3. Study cards with FSRS, daily session, streak with a weekly freeze (done)
4. Tests (multiple choice, type the word, pick the article), grammar exercises, a settings screen
