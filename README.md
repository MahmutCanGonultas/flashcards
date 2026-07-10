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

## Deploying

The two halves deploy separately. The database is already remote if you're on Neon, so there are
three pieces: Postgres, the API, and the static client.

Apply the schema to the production database once:

```bash
psql "$PRODUCTION_DATABASE_URL" -f backend/schema.sql
```

Deploy the API first, because the client bakes the API's address into its bundle at build time and
you need the URL before you can build it. Any host that runs `npm start` works — Render, Railway,
Fly. Point it at the `backend` directory and run:

```bash
npm ci --include=dev && npm run build   # build
npm start                               # run
```

`--include=dev` is not optional. Hosts set `NODE_ENV=production`, which makes npm skip
devDependencies — and `typescript` and the `@types/*` packages live there, so a plain
`npm install` leaves `tsc` with nothing to compile against and the build dies.

The service needs:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | your production Postgres connection string |
| `JWT_SECRET` | a fresh secret, not the one from your laptop — `openssl rand -base64 32` |
| `CORS_ORIGIN` | where the client is served from; comma-separated for more than one |
| `NODE_ENV` | `production`, so Express stops putting stack traces in error responses |

`PORT` is set by the host and read from the environment; don't set it yourself. If `DATABASE_URL` or
`JWT_SECRET` is missing the server refuses to start, rather than booting green and failing on the
first request. A trailing slash on `CORS_ORIGIN` is ignored, since browsers never send one.

Then deploy the client with `web` as the project root. Vercel and Netlify both detect Vite. Set
`VITE_API_URL` to the API's address including the path prefix — `https://your-api.onrender.com/api/v1`
— before the first build. It is compiled into the JavaScript, so changing it later means rebuilding.

Because the client is a single-page app, the host has to serve `index.html` for routes like
`/decks/12` instead of returning a 404. `web/vercel.json` does this on Vercel; on Netlify add a
`_redirects` file containing `/* /index.html 200`.

Finally, come back to the API and set `CORS_ORIGIN` to the client's real URL. The API is deployed
twice: once to learn its address, once to learn the client's.

## Where it runs

| Piece | Service | Address |
| --- | --- | --- |
| Web | Vercel, project root `web` | https://flashcards-two-black.vercel.app |
| API | Render, service `flashcards-api`, root `backend` | https://flashcards-api-66g9.onrender.com |
| Database | Neon, project `flashcards-prod` | — |

Both platforms redeploy on every push to `main`.

Two pieces of configuration live in a dashboard and in no committed file, so they would be lost if
either service were recreated from scratch:

- Render's **Build Command**: `npm ci --include=dev && npm run build`, for the reason above.
- The environment variables listed in the previous section. `CORS_ORIGIN` has to be the frontend's
  origin — no path, no trailing slash — and has to change whenever the frontend's URL does.

Everything is on a free tier, which costs latency rather than money: Render sleeps after fifteen
minutes of quiet and takes about a minute to wake, and Neon's compute sleeps after five and takes
about half a second. The first visit after a long pause is slow; the rest are not.

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
