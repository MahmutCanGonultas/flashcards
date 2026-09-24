CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    -- Consecutive days studied, and the local date the run was last extended.
    -- The date comes from the client because the server's clock is UTC.
    streak_count INTEGER NOT NULL DEFAULT 0,
    last_study_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE decks(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    -- 'personal' is the learner's own words: one per user, created on
    -- demand, reviewed as flip cards on their own schedule — independent of
    -- the course.
    kind VARCHAR(20) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cards(
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    -- Optional grouping label. For a deck organised as a learning path this
    -- holds the unit title the card's lesson belongs to.
    tag VARCHAR(50),
    -- Optional lesson number (1, 2, 3...). When a deck's cards carry these,
    -- the deck renders as a Duolingo-style path of lesson nodes instead of a
    -- flat card list, and lessons unlock in order rather than by calendar.
    lesson INTEGER,
    -- Optional: a sentence using `front` in context.
    example_sentence TEXT,
    -- Its natural Turkish translation, shown under the sentence while the
    -- word is being taught.
    example_tr TEXT,
    -- A second sentence from a different angle, with its Turkish.
    example2 TEXT,
    example2_tr TEXT,
    -- The learner's own note about the word ("where I heard it").
    mnemonic TEXT,
    -- A rich card (the learner's own words): every sense of the word with its
    -- pattern and an example, words that grow from it, and one thing to watch.
    --   senses:  [{ "pos", "meaning", "pattern", "example_en", "example_tr", "note" }]
    --   related: [{ "word", "pos", "meaning" }]
    senses JSONB,
    related JSONB,
    watch_out TEXT,
    -- The chunks the word lives in: [{ "en", "tr" }].
    collocations JSONB,
    -- The word's own colour ("#c4713f"). Optional: the client derives one
    -- from the spelling when null.
    tint VARCHAR(9),
    -- A sentence the learner wrote with the word. Writing it is the
    -- strongest thing they can do for the memory, and later reviews blank
    -- the word out of it.
    my_sentence TEXT,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    -- How many graded reviews the word was missed in, over its life, and
    -- when it was last reviewed. A word missed again and again is a leech
    -- and gets extra support.
    lapses INTEGER NOT NULL DEFAULT 0,
    reviewed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ DEFAULT NOW(),
    -- The learner day (Istanbul, 04:00 rollover) the word's first answer was
    -- written to the schedule. Null until then. At most three words a day
    -- get one, counted over every deck.
    introduced_on DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX cards_deck_introduced ON cards (deck_id, introduced_on);
-- A unit is one themed stretch of a deck's path: a handful of lessons, a
-- dialogue that puts their words to work, and a test that gates the next
-- unit. Cards point at their unit; the path is drawn from that.
CREATE TABLE units(
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    -- CEFR level of the unit's words: A1, A2, B1...
    level VARCHAR(10),
    -- The title in the learner's language, shown beside the English one.
    title_tr VARCHAR(100),
    -- { title_en, title_tr, hook, rules[], watch_out, memory_trick, quiz[] } --
    -- one short grammar note per unit, in the mascot's voice.
    grammar JSONB,
    -- { title, lines: [{ speaker, en, tr }] } -- a short conversation that
    -- uses the unit's vocabulary, shown after its lessons and before its test.
    dialogue JSONB,
    UNIQUE (deck_id, position)
);

ALTER TABLE cards ADD COLUMN unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL;

-- Every attempt at a unit's test. One pass is enough to open the next unit;
-- failed attempts are kept so the score history is honest.
CREATE TABLE unit_results(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    -- Percentage, 0-100.
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    -- 'test' for a real attempt; 'placement' when the placement test let the
    -- learner skip the unit, so the two are never confused in the history.
    source VARCHAR(20) NOT NULL DEFAULT 'test',
    taken_at TIMESTAMP DEFAULT NOW()
);

-- Every answer, for the learner's weekly numbers ("how much did I
-- remember"). The card's own columns hold the schedule; this is history.
CREATE TABLE review_log (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quality SMALLINT NOT NULL,
    -- Which exercise asked: recall, reverse, listen, produce, cloze, chunk,
    -- own; null for the course's screens.
    kind VARCHAR(20),
    -- True for a graded review that moved the card's schedule; false for
    -- practice that never touched it (learning steps, repeats, exercises).
    scheduled BOOLEAN NOT NULL DEFAULT TRUE,
    -- How it was asked: 'learn' or 'review' when scheduled; 'learn-step',
    -- 'relearn', 'filler', 'practice', 'exercise' or 'drill' when not.
    phase VARCHAR(12),
    -- 'fwd' (English to Turkish) or 'rev', and the milliseconds before the flip.
    direction VARCHAR(3),
    think_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX review_log_user_time ON review_log (user_id, created_at);

-- The grammar topics in the learner's own section (their content ships
-- with the web app): the best quiz score per topic, 0-100, and how often
-- it was practised. `topic` is the topic's slug ("to-be").
CREATE TABLE grammar_progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(60) NOT NULL,
    best INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic)
);

-- Server-side settings that must survive deploys without env vars: the
-- Web Push VAPID key pair, generated on first use.
CREATE TABLE settings (
    key VARCHAR(60) PRIMARY KEY,
    value TEXT NOT NULL
);

-- One row per device the learner turned reminders on from. `hour` is the
-- local hour they chose; `last_sent_on` stops a second reminder that day.
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    hour INTEGER NOT NULL DEFAULT 20,
    timezone VARCHAR(60) NOT NULL DEFAULT 'Europe/Istanbul',
    last_sent_on DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
