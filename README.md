# Kelimece

**English vocabulary for Turkish learners — your own words, asked the way memory needs them, a 60-unit course, and Tonton, a character who actually shows up.**

Kelimece is a progressive web app built for one learner first: a few words a day, remembered for good. You add the words you meet in the wild (a series, a street sign, a meeting); the app turns each one into a rich card — meanings, patterns, example sentences, the chunks it lives in, its family, one thing to watch — and brings it back on an SM-2 schedule. How it asks changes as the word settles: first you recognise it, then you produce it, in its sentences, its chunks and finally a sentence of your own. Alongside your own words runs a structured A1→C1 course with lessons, dialogues, grammar notes and unit tests.

<p align="center">
  <img src="docs/screenshots/home-and-meet.png" alt="Home page, meeting a new word, and a recall card" width="900">
</p>

## Features

**Practice that follows the memory**
- Every word moves through four stages you can see — *Yeni* (new), *Öğreniyor* (learning), *Pekişiyor* (settling), *Kalıcı* (held) — drawn as signal bars on every card and list row.
- A **new** word is met before it is asked: the word, the word at work in a sentence, a moment to guess what it means, then the meaning. It is asked a few cards later, with a review in between.
- A word being **learned** is recognised: see it, recall the Turkish, flip, grade yourself — swipe right for *Bildim*, left for *Bilemedim*, up for *Zorlandım*. The next day it comes back as a gap in its own sentence, the Turkish open.
- A word that **holds** has to be produced: typed from its Turkish, into its sentence, into one of its chunks (“___ a crime”), by ear, and — once it is yours — into the sentence you wrote with it.
- Typed answers are marked by the app, fairly: the right form scores full marks, the right word in another form (“commit” for “committed”) nearly so, a small spelling slip counts as hard, a hint caps the mark, and “my answer was right too” takes back a wrong mark once.
- A miss comes back three cards later, easier and with its sentence, until it is got; only the first answer of a session is written to the schedule. A word missed three times is marked *inatçı* (a leech) and gets extra support.
- The moment a word is first recalled, you are asked to write a sentence of your own with it — the strongest cue a word can have. Later reviews blank the word out of it.

**Memory, made visible**
- The front page shows what is waiting, how many words sit at each stage, the next seven days of reviews, and last week's recall rate.
- Meanings of words that are about to be asked stay blurred in the list, so the answer isn't read a minute before the question.
- Each session ends with every word's new stage and when it comes back. Any word can be drilled on its own from its page without touching its schedule.

**A course, on the same paper**
- 60 units, A1 → C1, ~900 words: a lesson path per unit with meet / listen / recall rounds, a short dialogue that puts the unit's words to work, a grammar note in Tonton's voice with a mini quiz, and a unit test that gates the next unit.
- A placement test opens the path at the right level; any unit can be tested out of.

**Tonton**
- The mascot has a director, not a timer: a hello once a day, unexpected visits with different entrances, reactions to a run of right answers or a returning card, a nudge when you stare at a card too long, and an evening word when the streak is at risk. Long-press hushes him for two hours; dismiss him twice quickly and he takes the hint.

**Built for the phone**
- Installable PWA with an offline shell, Web Push reminders at the hour you choose (sent only when something is actually due), spoken words via the device voice, and a keyboard path for the desktop.

<p align="center">
  <img src="docs/screenshots/production.png" alt="A typed answer marked right, a small slip, and writing your own sentence" width="900">
</p>

<p align="center">
  <img src="docs/screenshots/progress-and-course.png" alt="Session summary, a word's page and the course path" width="900">
</p>

<p align="center">
  <img src="docs/screenshots/tonton.png" alt="Tonton visiting the home page" width="300">
</p>

## Stack

| | |
|---|---|
| **Web** | React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query, React Router 7, `vite-plugin-pwa` (Workbox, custom service worker), Vitest |
| **API** | Node, TypeScript, Express 5, PostgreSQL (`pg`), Zod, JWT + bcrypt, `web-push`, Vitest |
| **Hosting** | Web on Vercel, API on Render, Postgres on Neon, hourly reminder job on GitHub Actions |

## How it works

### Scheduling

Each card carries `repetitions`, `interval` (days) and `ease_factor` (starts at 2.5). A grade below 3 resets the card and brings it back ten minutes later; 3 or above schedules the first success for tomorrow, the second for six days out, and every later one for the previous interval × ease. The ease factor moves with your grades and never drops below 1.3. Due dates are stored as `timestamptz` and land on the learner's local midnight (`LEARNER_TIMEZONE`, default `Europe/Istanbul`), so "tomorrow" means tomorrow whatever hour you studied. Every graded review also lands in `review_log`, which feeds the weekly numbers. See [`backend/src/services/srs.service.ts`](backend/src/services/srs.service.ts) and its tests.

### Practice

[`web/src/lib/practice.ts`](web/src/lib/practice.ts) decides how each word is asked today, from its stage ([`lib/memory.ts`](web/src/lib/memory.ts)) and what its card carries: sentences, chunks, the learner's own sentence, whether sound is on. The choice rotates by day, so a word isn't always met from the same side. A session is built once when it starts — one known word to warm up, new words met in threes and each asked again a few cards later, then the rest in the order they fell due — and grows as misses are put back in. The marking (normalising, inflections, slips counted as an optimal string alignment distance, hints) lives in the same file, and both are covered by tests.

### Cards

A personal card is a small document: `senses[]` (part of speech, meaning, pattern, example, its Turkish), `collocations[]`, `related[]`, `watch_out`, the learner's `my_sentence`, a `tint` (the word's own colour), and `lapses` — how many graded reviews it was missed in.

### Reminders

Turning reminders on stores a Web Push subscription with the chosen hour and timezone. A public, idempotent `POST /api/v1/push/run` is called every hour by [`.github/workflows/reminders.yml`](.github/workflows/reminders.yml); it sends at most one notification per device per local day, and only when cards have been due for at least an hour. VAPID keys are generated once and kept in the `settings` table.

### Design system

One warm paper in three tints (page, lifted sheet, recessed band), tan hairlines, umber shadows, a bistre ink. Colours carry meaning: vermilion for *due / missed*, moss for *known / later*, gilt for *hard* and the streak. Each word adds a colour of its own, deepened into bistre on its cover. The motion scale, keyframes and the `tint-*` utilities live in [`web/src/index.css`](web/src/index.css); the per-word colour helper in [`web/src/lib/tint.ts`](web/src/lib/tint.ts).

## Running it locally

Prerequisites: Node 22+, a Postgres database (Neon, Supabase or local).

```bash
# 1. API
cd backend
cp .env.example .env          # DATABASE_URL, JWT_SECRET, CORS_ORIGIN
psql "$DATABASE_URL" -f schema.sql
npm install
npm run dev                   # http://localhost:3000

# 2. Web
cd ../web
npm install
npm run dev                   # http://localhost:5173
```

Optional API settings: `LEARNER_TIMEZONE` (default `Europe/Istanbul`), `ANTHROPIC_API_KEY` (enables auto-filling a new card's meanings and examples; without it the endpoint answers 503 and everything else works).

Checks:

```bash
cd backend && npx tsc --noEmit && npx vitest run
cd web && npm run lint && npm test && npm run build
```

## API

All routes are under `/api/v1`; everything except `auth/*` and `push/run` needs `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Auth | `POST auth/register`, `POST auth/login` |
| Decks | `GET decks`, `POST decks`, `POST decks/personal`, `PUT decks/:id`, `DELETE decks/:id`, `GET decks/:id/stats` |
| Cards | `GET decks/:id/cards`, `GET decks/:id/cards/due`, `POST decks/:id/cards`, `POST decks/:id/cards/suggest`, `PUT decks/:id/cards/:cardId`, `DELETE decks/:id/cards/:cardId`, `POST decks/:id/cards/:cardId/review` (`{ quality, kind? }`) |
| Course | `GET decks/:id/units`, `POST decks/:id/units/:unitId/result`, `POST decks/:id/placement` |
| Streak | `GET streak`, `POST streak` |
| Push | `GET push/key`, `GET push/status`, `POST push/subscribe`, `POST push/unsubscribe`, `POST push/test`, `POST push/run` |

## Project layout

```
flashcards/
├── backend/
│   ├── schema.sql                 users, decks, cards, review_log, units, unit_results, settings, push_subscriptions
│   ├── content/                   the course: one JSON per unit (words, dialogue, grammar note)
│   └── src/
│       ├── server.ts              Express app, CORS, routes
│       ├── controllers/           auth, deck, card, unit, streak, push, suggest
│       ├── routes/                one router per controller
│       ├── middleware/            bearer-token check
│       └── services/              SM-2 (srs.service.ts) + tests
├── web/
│   └── src/
│       ├── pages/                 Kartlar (home), Flashcards (practice), WordPage, Kurs, Study, UnitTest, Grammar, Dialogue, Placement, auth
│       ├── components/            Cover, StrengthBars, WordList, Mascot, TontonPopups, Sheet, WordCardBack, LearningPath, …
│       ├── lib/                   practice + memory (and tests), sentence, tint, tonton + tontonDirector, reminders, speech, …
│       ├── sw.ts                  service worker: precache + push handlers
│       └── index.css              design tokens, motion scale, utilities
├── docs/screenshots/
└── .github/workflows/             ci.yml (typecheck, tests, lint, build) · reminders.yml (hourly push job)
```

## Deployment

- **Web** — Vercel, root `web/`, build `npm run build`, output `dist/`; set `VITE_API_URL` to the API's `/api/v1` base.
- **API** — Render (or any Node host), root `backend/`, build `npm ci && npm run build`, start `npm start`; set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (the web origin). `GET /` reports the deployed commit.
- **Reminders** — the GitHub Actions cron in `.github/workflows/reminders.yml` calls `push/run` hourly; point it at your API URL.

## Roadmap

- Multi-user onboarding and a native "add a word" flow with automatic meanings and examples
- Speaking practice: say the word, have it checked
- Import from a phone's notes / screenshots
