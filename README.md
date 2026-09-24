# Kelimece

An English vocabulary app for Turkish speakers. You add the words you come across, and the app keeps bringing them back until you know them. It also has 21 grammar topics with quizzes, a 60-unit course, and a mascot called Tonton.

It's a web app made for the phone (you can install it like a regular app), built around a short daily session: a few new words a day and about fifteen minutes of practice.

<p align="center">
  <img src="docs/screenshots/home-and-meet.png" alt="The home page with its two buttons, meeting a new word, and the back of a card" width="900">
  <br><sub>The home page, a new word being introduced on the cards, and the back of a card.</sub>
</p>

## Features

### Cards and exercises, kept apart

- **Cards** (*Tekrar et*) are plain flashcards, and they are the only thing that changes the schedule. A new word is introduced first: you see it in a sentence, guess what it means, then check, and it's asked a few cards later. Every other word is the word on the front and its meaning on the back. Flip it and grade yourself: swipe right for *Bildim* (knew it), left for *Bilemedim* (didn't), up for *Zorlandım* (hard). When nothing is due you can still go through your cards; only the due ones count.
- Every word has a stage you can see: *Yeni* (new), *Öğreniyor* (learning), *Pekişiyor* (getting there), *Kalıcı* (learned). Stages show up as signal bars on cards and word pages.
- A missed card comes back three cards later with its sentence, until you get it. Only your first answer in a session changes the schedule. A word you miss three times is marked *inatçı* (stubborn).
- You can pass any card without answering: tap *Geç*, swipe down or press the down arrow. Nothing is saved. The card comes back once at the end of the round, and if you pass it again it just stays due for next time.
- **Exercises** (*Egzersiz yap*) have their own button and never change the schedule. You fill the word into its sentence (with the Turkish shown while the word is new), complete one of its phrases ("___ your options"), type it from its Turkish meanings, fill it into your own sentence, or recognise it by ear. Which one you get depends on how well you know the word. A missed exercise comes back once.
- Typed answers are marked fairly. The right word in a different form ("commit" instead of "committed") gets nearly full marks, a small typo counts as hard, using a hint lowers the mark, and you can overrule a wrong mark once if your answer was actually fine.
- After a right answer, an exercise round asks you once to write your own sentence with the word. Later exercises blank the word out of it.
- Example sentences only use grammar from the learner's own list (the present simple and continuous, *will* / *going to*, imperatives, *there is / there are* and so on), so a new word never comes wrapped in grammar that hasn't been covered yet.
- A right answer plays a short chime that goes up a little with each right answer in a row. A miss plays a soft, low tone instead of a buzzer.

<p align="center">
  <img src="docs/screenshots/production.png" alt="Exercises: filling a gap in a sentence, typing a word from its Turkish meanings, and completing a phrase" width="900">
  <br><sub>Exercises: filling a gap, typing the word from its meanings, and completing a phrase.</sub>
</p>

### Your word list

- *Kelimelerim* is made to hold hundreds of words. Each row shows the word and its meaning, nothing else. Tap a row to see all its meanings, an example sentence, its stage and next review, and buttons to hear it, practise it or open its page.
- One search box covers everything on a card, in English or Turkish, with or without Turkish letters ("endise" finds *endişe*). You can filter by stage (with counts) and sort by next review, A–Z or newest, with headings between groups.
- Search and filters are saved in the URL, so going back from a word page keeps your place.

### Word pages

- Every word has its own colour, and its meanings are numbered in colours that stay the same everywhere in the app, so meaning 2 is always green.
- Each meaning has a plain-English definition, common patterns, and example sentences with the word highlighted and a Turkish translation underneath.
- The page also shows the phrases the word is used in, related words, your own sentence, and one common mistake as a wrong sentence next to a right one.

<p align="center">
  <img src="docs/screenshots/word-pages.png" alt="The word list, a row opened, and a word's page" width="900">
  <br><sub>The word list, a row tapped open, and a word's page.</sub>
</p>

### Grammar

- 21 topics in three levels (Beginner, Elementary, Pre-Intermediate), in the order they were taught: *to be*, possessives, *have got*, jobs, word types, the present simple, *wh-* questions, word order, *to / by / from*, numbers, ordinals and frequency, likes and dislikes, articles, countable nouns, *there is / there are*, quantifiers, the present continuous, imperatives, linking words and the future.
- Each topic is a page to read, with rules, tables and examples. Colours mark the parts of a sentence (green for the form being taught, blue for what decides it, orange for extras such as time words). Every example has a Turkish translation and can be played aloud.
- Each topic has a 10-question quiz: pick the answer, find the wrong sentence, fill the gap, or build the sentence from word tiles with a few extra tiles mixed in. Mistakes come back at the end, and your best score is saved with up to three stars. A mixed quiz takes questions from topics you've already done, more from your weakest ones.

<p align="center">
  <img src="docs/screenshots/grammar.png" alt="The grammar topics, a topic page with a colour-coded table, and a quiz answer" width="900">
  <br><sub>The grammar topics, a table from the present continuous, and a quiz question.</sub>
</p>

### Tonton

- Tonton says hello once a day, drops by now and then on the reading pages, reacts to your answers during practice, and reminds you in the evening if your streak is about to break. He knows your grammar scores and points you to the next topic.
- He doesn't always talk. Sometimes he just waves and goes, and every now and then he turns up huge: standing up from the bottom of the screen, leaning in from the side, or popping up in the middle. Tap anywhere and he leaves.
- Press and hold him to mute him for two hours. Close him twice in a row and he gets the hint.

<p align="center">
  <img src="docs/screenshots/tonton.png" alt="Tonton visiting at full size on the home page and the word list, and a normal visit on the grammar page" width="900">
  <br><sub>Tonton's big visits, and a normal one.</sub>
</p>

### Progress and the course

- The home page shows what's due, how many words are at each stage, reviews for the next seven days and how much you remembered last week. Every session ends with each word's new stage and when you'll see it again.
- The course has 60 units from A1 to C1 (about 900 words), each with lessons, a short dialogue, a grammar note with a mini quiz, and a unit test. A placement test starts you at the right level.

<p align="center">
  <img src="docs/screenshots/progress-and-course.png" alt="Writing your own sentence, the end of a round of cards, and the course" width="900">
  <br><sub>Writing your own sentence, the end of a round of cards, and the course.</sub>
</p>

### Made for the phone

- Installable, with an offline shell, push reminders at the hour you pick (only sent when something is due), words read aloud with the phone's own voice, and keyboard shortcuts on a computer.

## Stack

| | |
|---|---|
| **Web** | React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query, React Router 7, `vite-plugin-pwa` (Workbox, custom service worker), Vitest |
| **API** | Node, TypeScript, Express 5, PostgreSQL (`pg`), Zod, JWT + bcrypt, `web-push`, Vitest |
| **Hosting** | Web on Vercel, API on Render, Postgres on Neon, hourly reminder job on GitHub Actions |

## How it works

### Scheduling

Each card stores `repetitions`, `interval` (in days) and `ease_factor` (starting at 2.5). A grade below 3 resets the card and shows it again ten minutes later. A grade of 3 or more schedules the first success for tomorrow, the second for six days later, and each one after that for the previous interval times the ease factor. The ease factor moves with your grades and never goes below 1.3. Due dates are `timestamptz` values set to the learner's local midnight (`LEARNER_TIMEZONE`, default `Europe/Istanbul`), so "tomorrow" means tomorrow no matter what time you studied. Every graded review is also written to `review_log`, which feeds the weekly numbers. See [`backend/src/services/srs.service.ts`](backend/src/services/srs.service.ts) and its tests.

### Practice

[`web/src/lib/practice.ts`](web/src/lib/practice.ts) builds both kinds of practice. A round of cards is planned when it starts (one familiar word to warm up, new words introduced in threes and asked again a few cards later, then the rest in the order they became due) and grows as missed cards are added back. A round of exercises takes up to twelve words, the ones already met first, and picks each word's exercise from its stage ([`lib/memory.ts`](web/src/lib/memory.ts)) and what the card has: sentences, phrases, your own sentence, and whether sound is on. Exercises are never sent to the schedule. Answer marking lives in the same file: normalising, other forms of the word, typos measured as an edit distance, and hints. All of it is covered by tests.

### Cards

A personal card holds `senses[]` (part of speech, meaning, a plain-English `definition`, pattern, an example with its Turkish, and more `examples[]`), `collocations[]`, `related[]`, `watch_out` (written as "✗ wrong → ✓ right. Why…" and split for display by [`lib/watchOut.ts`](web/src/lib/watchOut.ts)), the learner's `my_sentence`, a `tint` (the word's colour) and `lapses` (how many reviews it was missed in). Search, filters, sorting and grouping for the word list are in [`lib/wordBrowser.ts`](web/src/lib/wordBrowser.ts), with tests.

### Grammar

The topics ship with the web app as typed content in [`web/src/content/grammar/`](web/src/content/grammar). `catalog.ts` has the order and titles (small enough for the home page), and there is one file per level with the pages. English lines can carry colour marks (`{form}`, `[subject]`, `<extra>`, `**bold**`, `~~wrong~~`), which [`lib/rich.ts`](web/src/lib/rich.ts) parses and `components/Rich.tsx` draws. Each topic's `legend` explains its colours. A content test checks every topic: marks are closed, table rows match their header, there are three kinds of question, answers exist, and tiles really build their sentence. The quiz logic (shuffling, marking, scoring, and the mixed quiz weighted towards weak topics) is in [`lib/grammarQuiz.ts`](web/src/lib/grammarQuiz.ts). Only scores are stored on the server: `grammar_progress` keeps each topic's best score and number of attempts.

### Tonton

[`lib/tontonDirector.ts`](web/src/lib/tontonDirector.ts) decides when Tonton appears and what he says: how long to wait between visits, which pages he may visit, how often a visit is silent or full-screen, and when to keep out of the way (he never interrupts a question). [`components/TontonPopups.tsx`](web/src/components/TontonPopups.tsx) only draws the current visit and passes taps back.

### Sounds

The right and wrong answer sounds are two short recordings in [`web/public/sounds/`](web/public/sounds) (see Credits). They are loaded when audio is first allowed and cached for offline use. Everything else, and a fallback until the recordings load, is generated with the Web Audio API in [`lib/sound.ts`](web/src/lib/sound.ts).

### Reminders

Turning reminders on saves a Web Push subscription with the chosen hour and timezone. [`.github/workflows/reminders.yml`](.github/workflows/reminders.yml) calls a public, idempotent `POST /api/v1/push/run` every hour. It sends at most one notification per device per day, and only when cards have been due for at least an hour. VAPID keys are generated once and kept in the `settings` table.

### Design

The look is based on Duolingo's: a white page, white cards with a 2px grey border and a grey edge underneath, and solid-colour buttons with a darker bottom edge that press down when tapped. There are eight colour families (grass, ocean, berry, sunny, tangerine, plum, teal, rose), each with a base, a darker shade for the edge, a light background and a readable text colour. Colours keep their meaning: green is right or go, orange is the middle ground and the streak, red is due or missed, and stages go grey, orange, blue, green. Every word has its own bright colour, and its meanings take the family colours in a fixed order. Nothing is blurred and nothing is black. Tokens, the 3D utilities (`card-3d`, `press`, `press-3d`) and animation timings are in [`web/src/index.css`](web/src/index.css), word colours in [`web/src/lib/tint.ts`](web/src/lib/tint.ts), and the families in [`web/src/lib/palette.ts`](web/src/lib/palette.ts).

## Running it locally

You need Node 22+ and a Postgres database (Neon, Supabase or local).

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

Optional API settings: `LEARNER_TIMEZONE` (default `Europe/Istanbul`) and `ANTHROPIC_API_KEY`, which turns on auto-filling a new card's meanings and examples (kept within the learner's grammar, `LEARNER_GRAMMAR` in `suggest.controller.ts`). Without the key, that one endpoint returns 503 and everything else works.

Checks:

```bash
cd backend && npx tsc --noEmit && npx vitest run
cd web && npm run lint && npm test && npm run build
```

## API

All routes are under `/api/v1`. Everything except `auth/*` and `push/run` needs `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Auth | `POST auth/register`, `POST auth/login` |
| Decks | `GET decks`, `POST decks`, `POST decks/personal`, `PUT decks/:id`, `DELETE decks/:id`, `GET decks/:id/stats` |
| Cards | `GET decks/:id/cards`, `GET decks/:id/cards/due`, `POST decks/:id/cards`, `POST decks/:id/cards/suggest`, `PUT decks/:id/cards/:cardId`, `DELETE decks/:id/cards/:cardId`, `POST decks/:id/cards/:cardId/review` (`{ quality, kind? }`) |
| Course | `GET decks/:id/units`, `POST decks/:id/units/:unitId/result`, `POST decks/:id/placement` |
| Streak | `GET streak`, `POST streak` |
| Grammar | `GET grammar/progress`, `POST grammar/progress` (`{ topic, score }`, keeps the best score and counts the attempt) |
| Push | `GET push/key`, `GET push/status`, `POST push/subscribe`, `POST push/unsubscribe`, `POST push/test`, `POST push/run` |

## Project layout

```
flashcards/
├── backend/
│   ├── schema.sql                 users, decks, cards, review_log, units, unit_results, grammar_progress, settings, push_subscriptions
│   ├── content/                   the course: one JSON file per unit (words, dialogue, grammar note)
│   └── src/
│       ├── server.ts              Express app, CORS, routes
│       ├── controllers/           auth, deck, card, unit, streak, push, suggest, grammar
│       ├── routes/                one router per controller
│       ├── middleware/            bearer token check
│       └── services/              SM-2 (srs.service.ts) and its tests
├── web/
│   ├── public/sounds/             the right and wrong answer sounds
│   └── src/
│       ├── pages/                 Kartlar (home), Kelimelerim, WordPage, Flashcards (practice), GrammarHub, GrammarTopic, GrammarQuiz, Kurs, Study, UnitTest, Grammar (course notes), Dialogue, Placement, auth
│       ├── components/            Cover, StrengthBars, WordList, WordCardBack, MeaningText, Rich, Mascot, TontonLine, TontonPopups, Sheet, LearningPath, …
│       ├── content/grammar/       the 21 topics: catalog, one file per level, and the content test
│       ├── lib/                   practice, memory, wordBrowser, grammarQuiz, rich, watchOut (all tested), palette, tint, sound, tonton, tontonDirector, …
│       ├── sw.ts                  service worker: precache and push handlers
│       └── index.css              design tokens, animations, utilities
├── docs/screenshots/
└── .github/workflows/             ci.yml (typecheck, tests, lint, build) and reminders.yml (hourly push job)
```

## Deployment

- **Web**: Vercel, root `web/`, build `npm run build`, output `dist/`. Set `VITE_API_URL` to the API's `/api/v1` base.
- **API**: Render (or any Node host), root `backend/`, build `npm ci && npm run build`, start `npm start`. Set `DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGIN` (the web origin). `GET /` reports the deployed commit.
- **Reminders**: the GitHub Actions cron in `.github/workflows/reminders.yml` calls `push/run` every hour. Point it at your API URL.

## Credits

Both answer sounds come from [Freesound](https://freesound.org) under CC0 (public domain), trimmed and levelled for the app:

- Right answer: ["victory chime"](https://freesound.org/people/1bob/sounds/717771/) by 1bob
- Wrong answer: ["Training Program, Incorrect1.aif"](https://freesound.org/people/timgormly/sounds/181858/) by timgormly

## Roadmap

- Sign-up for more learners, and an "add a word" flow that fills in meanings and examples automatically
- Speaking practice: say the word and have it checked
- Importing words from a phone's notes or screenshots
