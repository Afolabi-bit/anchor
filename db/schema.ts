import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 128 }),
  lastName: varchar("last_name", { length: 128 }),
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
  colorIndex: integer("color_index").default(0).notNull(), // 0 to 4
  icon: varchar("icon", { length: 32 }).default("anchor").notNull(),
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
  intentionNoteIv: varchar("intention_note_iv", { length: 64 }),
  intentionNoteKeyVersion: varchar("intention_note_key_version", { length: 32 }),
  
  // Evening fields
  status: varchar("status", { length: 16 }), // 'yes' | 'partial' | 'no'
  reflection: text("reflection"),
  reflectionIv: varchar("reflection_iv", { length: 64 }),
  reflectionKeyVersion: varchar("reflection_key_version", { length: 32 }),
  lessonsLearned: text("lessons_learned"),
  blockerTags: jsonb("blocker_tags").$type<string[]>(), // ['stress', 'time', 'urge', 'forgot', 'unmotivated', 'other']
  moodOrCraving: integer("mood_or_craving"), // 1 - 5 (kept for backward compat)
  emotionName: varchar("emotion_name", { length: 64 }), // 'Peaceful' | 'Grateful' | 'Anxious' etc.
  moodValence: integer("mood_valence"), // -5 (unpleasant) to +5 (pleasant)
  moodArousal: integer("mood_arousal"), // 1 (low energy/calm) to 5 (high energy/intense)
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

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const communityReflections = pgTable("community_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  category: varchar("category", { length: 64 }).default("Sobriety & Recovery").notNull(),
  emotionName: varchar("emotion_name", { length: 64 }).default("Grounded").notNull(),
  anchoredDays: integer("anchored_days").default(1).notNull(),
  resonatesCount: integer("resonates_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  encryptionIv: varchar("encryption_iv", { length: 64 }),
  encryptionKeyVersion: varchar("encryption_key_version", { length: 32 }),
  moodValence: integer("mood_valence"),
  moodEnergy: integer("mood_energy"),
  tags: jsonb("tags").$type<string[]>(),
  isStarred: boolean("is_starred").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const partnerPermissions = pgTable("partner_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  partnerEmail: varchar("partner_email", { length: 255 }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  shareConsistency: boolean("share_consistency").default(false).notNull(),
  shareMilestones: boolean("share_milestones").default(false).notNull(),
  shareMoodTrends: boolean("share_mood_trends").default(false).notNull(),
  shareBlockers: boolean("share_blockers").default(false).notNull(),
  shareJournalNotes: boolean("share_journal_notes").default(false).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Commitment = typeof commitments.$inferSelect;
export type NewCommitment = typeof commitments.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect & {
  /** Circumplex arousal dimension alias (1 to 5) for consistent cross-module consumption */
  moodEnergy?: number | null;
};
export type NewCheckIn = typeof checkIns.$inferInsert & {
  moodEnergy?: number | null;
};
export type WeeklyRecap = typeof weeklyRecaps.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type CommunityReflection = typeof communityReflections.$inferSelect;
export type NewCommunityReflection = typeof communityReflections.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect & {
  /** Circumplex arousal dimension alias (1 to 5) for consistent cross-module consumption */
  moodArousal?: number | null;
};
export type NewJournalEntry = typeof journalEntries.$inferInsert & {
  moodArousal?: number | null;
};
export type PartnerPermission = typeof partnerPermissions.$inferSelect;
export type NewPartnerPermission = typeof partnerPermissions.$inferInsert;

