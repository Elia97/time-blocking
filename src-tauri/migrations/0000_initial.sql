-- Initial schema for the time-blocking app.
-- All timestamps are stored as Unix epoch milliseconds in UTC.
-- Soft deletes via `deleted_at` are used so that Google Calendar sync can
-- propagate deletions and resolve conflicts.

PRAGMA foreign_keys = ON;

CREATE TABLE categories (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    archived    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE tags (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL UNIQUE,
    color       TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE events (
    id           TEXT PRIMARY KEY NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    start_at     INTEGER NOT NULL,
    end_at       INTEGER NOT NULL,
    all_day      INTEGER NOT NULL DEFAULT 0,
    category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
    color        TEXT,
    notes        TEXT,
    google_id    TEXT UNIQUE,
    google_etag  TEXT,
    rrule        TEXT,
    parent_id    TEXT REFERENCES events(id) ON DELETE CASCADE,
    dirty        INTEGER NOT NULL DEFAULT 0,
    deleted_at   INTEGER,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);

CREATE INDEX idx_events_range ON events (start_at, end_at, deleted_at);
CREATE INDEX idx_events_category ON events (category_id);
CREATE INDEX idx_events_dirty ON events (dirty) WHERE dirty = 1;
CREATE INDEX idx_events_parent ON events (parent_id);

CREATE TABLE event_tags (
    event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

CREATE INDEX idx_event_tags_tag ON event_tags (tag_id);

CREATE TABLE pomodoro_sessions (
    id              TEXT PRIMARY KEY NOT NULL,
    event_id        TEXT REFERENCES events(id) ON DELETE SET NULL,
    started_at      INTEGER NOT NULL,
    ended_at        INTEGER,
    type            TEXT NOT NULL CHECK (type IN ('focus', 'short_break', 'long_break')),
    target_minutes  INTEGER NOT NULL,
    actual_minutes  INTEGER,
    interrupted     INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
);

CREATE INDEX idx_pomodoro_event ON pomodoro_sessions (event_id);
CREATE INDEX idx_pomodoro_started ON pomodoro_sessions (started_at);

CREATE TABLE time_entries (
    id          TEXT PRIMARY KEY NOT NULL,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    source      TEXT NOT NULL CHECK (source IN ('manual', 'pomodoro', 'auto')),
    created_at  INTEGER NOT NULL
);

CREATE INDEX idx_time_entries_event ON time_entries (event_id);
CREATE INDEX idx_time_entries_started ON time_entries (started_at);

CREATE TABLE sync_state (
    provider  TEXT NOT NULL,
    key       TEXT NOT NULL,
    value     TEXT NOT NULL,
    PRIMARY KEY (provider, key)
);

CREATE TABLE settings (
    key    TEXT PRIMARY KEY NOT NULL,
    value  TEXT NOT NULL
);
