import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  archived: integer("archived").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
})

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
})

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startAt: integer("start_at").notNull(),
    endAt: integer("end_at").notNull(),
    allDay: integer("all_day").notNull().default(0),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    color: text("color"),
    notes: text("notes"),
    googleId: text("google_id").unique(),
    googleEtag: text("google_etag"),
    rrule: text("rrule"),
    parentId: text("parent_id"),
    dirty: integer("dirty").notNull().default(0),
    deletedAt: integer("deleted_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_events_range").on(table.startAt, table.endAt, table.deletedAt),
    index("idx_events_category").on(table.categoryId),
    index("idx_events_parent").on(table.parentId),
  ],
)

export const eventTags = sqliteTable(
  "event_tags",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.tagId] })],
)

export const pomodoroSessions = sqliteTable("pomodoro_sessions", {
  id: text("id").primaryKey().notNull(),
  eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  type: text("type", { enum: ["focus", "short_break", "long_break"] }).notNull(),
  targetMinutes: integer("target_minutes").notNull(),
  actualMinutes: integer("actual_minutes"),
  interrupted: integer("interrupted").notNull().default(0),
  createdAt: integer("created_at").notNull(),
})

export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey().notNull(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  source: text("source", { enum: ["manual", "pomodoro", "auto"] }).notNull(),
  createdAt: integer("created_at").notNull(),
})

export const syncState = sqliteTable(
  "sync_state",
  {
    provider: text("provider").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.key] })],
)

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
})

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type EventRow = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type PomodoroSession = typeof pomodoroSessions.$inferSelect
export type NewPomodoroSession = typeof pomodoroSessions.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
