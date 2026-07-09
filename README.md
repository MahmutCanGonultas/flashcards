# Flashcards

A spaced repetition app. You write cards, the app decides when to show them again.

The scheduling is SM-2, the algorithm behind Anki and SuperMemo. Every time you grade a card,
the interval before you see it next either grows or collapses back to a day. Cards you find easy
drift out to weeks and months; cards you keep forgetting stay in your face. Reviewing a full deck
of a hundred cards takes a couple of minutes a day once the intervals settle.

The repository holds two things: an Express API backed by Postgres, and a React web client.
A mobile client is planned; the API doesn't assume anything about who is calling it.

## How the scheduling works

Each card carries three numbers: `repetitions` (how many times you've recalled it in a row),
`interval` (days until it's next due), and `ease_factor` (how easy you find it, starting at 2.5).

When you grade a card from 0 to 5:

- **Below 3** — you forgot it. `repetitions` resets to 0 and the interval drops to 1 day.
- **3 or above** — you recalled it. The first success schedules it for tomorrow, the second for
  six days out, and after that each interval is the previous one multiplied by the ease factor.

The ease factor itself moves with your grades, using SM-2's formula, and never drops below 1.3 —
that floor is what stops a card you keep failing from being scheduled every few minutes forever.

The web client exposes four of the six grades, which is what Anki does too: Again (1), Hard (3),
Good (4), Easy (5). Grades 0 and 2 exist in the API but add little in practice.

See `backend/src/services/srs.service.ts` for the implementation and its tests.

## Stack

**Backend** — Node, TypeScript, Express 5, Postgres (via `pg`), Zod for request validation,
bcrypt for password hashing, JWT for sessions, Vitest for tests.

**Web** — Vite, React 19, TypeScript, Tailwind v4, TanStack Query, React Router.

## Layout

```
flashcards/
├── backend/
│   ├── schema.sql              tables: users, decks, cards
│   └── src/
│       ├── server.ts
│       ├── db.ts               pg pool
│       ├── routes/             auth, deck, card
│       ├── controllers/
│       ├── middleware/         bearer token check
│       └── services/           the SM-2 algorithm, plus its tests
└── web/
    └── src/
        ├── lib/api.ts          fetch wrapper: attaches the token, throws ApiError
        ├── lib/themes.ts       the pastel palette, cycled per deck
        ├── components/
        └── pages/              Login, Register, Decks, DeckDetail, Study
```

## Running it locally

You need Node 20 or newer — the backend's dev script relies on `--env-file` — and a Postgres
database. A free Neon instance is enough.

Create the tables:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

Point the API at your database:

```bash
cd backend
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev               # http://localhost:3000
```

Then, in a second terminal:

```bash
cd web
npm install
npm run dev               # http://localhost:5173
```

The client talks to `http://localhost:3000/api/v1` by default. Set `VITE_API_URL` if your API
lives somewhere else.

## API

Everything is under `/api/v1`. The deck and card routes need an `Authorization: Bearer <token>`
header; the auth routes don't.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ email, password }` | `{ user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token }` |
| GET | `/decks` | | `{ decks }` |
| POST | `/decks` | `{ name }` | `{ deck }` |
| PUT | `/decks/:id` | `{ name }` | `{ deck }` |
| DELETE | `/decks/:id` | | `{ message }` |
| GET | `/decks/:deckId/cards` | | `{ cards }` |
| POST | `/decks/:deckId/cards` | `{ front, back }` | `{ card }` |
| PUT | `/decks/:deckId/cards/:cardId` | `{ front, back }` | `{ card }` |
| DELETE | `/decks/:deckId/cards/:cardId` | | `{ message }` |
| GET | `/decks/:deckId/cards/due` | | `{ cards }` — due now, soonest first, max 20 |
| POST | `/decks/:deckId/cards/:cardId/review` | `{ quality }` | `{ card }` — runs SM-2 |

Passwords must be at least six characters. Every query is scoped to the user in the token, so
you can't read or write another account's decks by guessing an id.

## Notes on the client

The token lives in `localStorage`. `lib/api.ts` is the only place that knows that: it attaches the
header, throws a typed `ApiError` on a failed response, and on a 401 it clears the token and sends
you back to the login page. Nothing else calls `fetch`.

Reads go through TanStack Query under three keys — `["decks"]`, `["cards", deckId]` and
`["dueCards", deckId]` — and every write invalidates the keys it touched.

The study screen is the one place that deliberately doesn't read live query data. Grading a card
pushes its `due_date` into the future, so refetching the due list mid-session returns a shorter
one, and anything indexing into it would skip cards. Instead the session snapshots the due list
once, when the fetch settles, and works from that copy. The caches are refreshed when you leave.

## Tests

The SM-2 implementation is unit tested, since it's the one piece where a subtle mistake quietly
ruins the scheduling months later:

```bash
cd backend && npm test
```

The web client is checked with the compiler and the linter:

```bash
cd web && npm run build && npm run lint
```

## Rough edges

Worth knowing before you build on this:

- The API's error messages are Turkish while the interface is English. The client maps status
  codes to its own copy rather than showing whatever the server said.
- There is no error-handling middleware, so an unhandled throw becomes a 500 with an HTML body.
  Registering an email that already exists is the case you'll actually hit.
- Sessions are a seven-day JWT with no refresh. When it expires you sign in again.
- The decks page fetches each deck's cards to show its counts, which is one request per deck.
  Fine for a personal deck list, not for hundreds.
- `due` returns at most 20 cards. A long backlog is worked through 20 at a time.

## What's next

A React Native client, sharing the same API. Deck sharing and import/export are the obvious
features after that.
