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
    -- Optional: a sentence using `front` in context, and a photo for cards
    -- where a real image actually helps (concrete nouns) -- most words in a
    -- vocabulary deck are function/abstract words a photo can't represent.
    example_sentence TEXT,
    image_url TEXT,
    -- Optional: a memory aid (usually the word's etymology/root) explaining
    -- why it means what it means, rather than just asking you to memorize it.
    mnemonic TEXT,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);