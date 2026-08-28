import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  morningNotificationTime: varchar("morning_notification_time", { length: 5 }).default("08:00").notNull(),
  eveningNotificationTime: varchar("evening_notification_time", { length: 5 }).default("20:00").notNull(),
  isOnboarded: boolean("is_onboarded").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const commitments = pgTable("commitments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  why: text("why"),
  frequency: varchar("frequency", { length: 32 }).default("daily").notNull(), // 'daily' | 'custom_days'
  customDays: jsonb("custom_days").$type<number[]>(), // [0, 1, 2, ...] (0 = Sunday)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  commitmentId: uuid("commitment_id").references(() => commitments.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  type: varchar("type", { length: 16 }).notNull(), // 'morning' | 'evening'
  
  // Morning fields
  plannedActions: jsonb("planned_actions").$type<string[]>(),
  intentionNote: text("intention_note"),
  
  // Evening fields
  status: varchar("status", { length: 16 }), // 'yes' | 'partial' | 'no'
  reflection: text("reflection"),
  lessonsLearned: text("lessons_learned"),
  blockerTags: jsonb("blocker_tags").$type<string[]>(), // ['stress', 'time', 'urge', 'forgot', 'unmotivated', 'other']
  moodOrCraving: integer("mood_or_craving"), // 1 - 5
  isLate: boolean("is_late").default(false).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weeklyRecaps = pgTable("weekly_recaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  weekStartDate: varchar("week_start_date", { length: 10 }).notNull(),
  weekEndDate: varchar("week_end_date", { length: 10 }).notNull(),
  completionRate: integer("completion_rate").notNull(), // 0 to 100
  streakCurrent: integer("streak_current").notNull(),
  streakLongest: integer("streak_longest").notNull(),
  topBlockerTags: jsonb("top_blocker_tags").$type<{ tag: string; count: number }[]>(),
  pinnedLessons: jsonb("pinned_lessons").$type<string[]>(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Commitment = typeof commitments.$inferSelect;
export type NewCommitment = typeof commitments.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect;
export type NewCheckIn = typeof checkIns.$inferInsert;
export type WeeklyRecap = typeof weeklyRecaps.$inferSelect;
