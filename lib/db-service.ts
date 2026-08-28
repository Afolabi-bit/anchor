import { db, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Local storage fallback for seamless testing when DATABASE_URL is not yet connected
const LOCAL_STORE_FILE = path.join(process.cwd(), ".local-db-store.json");

interface LocalDBStore {
  users: Array<schema.User>;
  commitments: Array<schema.Commitment>;
  checkIns: Array<schema.CheckIn>;
  weeklyRecaps: Array<schema.WeeklyRecap>;
}

function readLocalStore(): LocalDBStore {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading local DB store:", e);
  }
  return { users: [], commitments: [], checkIns: [], weeklyRecaps: [] };
}

function writeLocalStore(store: LocalDBStore) {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing to local DB store:", e);
  }
}

// ----------------- USERS -----------------
export async function getUserByEmail(email: string): Promise<schema.User | null> {
  if (db) {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).limit(1);
    return result[0] || null;
  }
  const store = readLocalStore();
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export async function getUserById(id: string): Promise<schema.User | null> {
  if (db) {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0] || null;
  }
  const store = readLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  timezone?: string;
  morningNotificationTime?: string;
  eveningNotificationTime?: string;
}): Promise<schema.User> {
  const normalizedEmail = data.email.toLowerCase().trim();
  if (db) {
    const result = await db.insert(schema.users).values({
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      timezone: data.timezone || "UTC",
      morningNotificationTime: data.morningNotificationTime || "08:00",
      eveningNotificationTime: data.eveningNotificationTime || "20:00",
      isOnboarded: false,
    }).returning();
    return result[0];
  }
  const store = readLocalStore();
  const newUser: schema.User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: data.passwordHash,
    timezone: data.timezone || "UTC",
    morningNotificationTime: data.morningNotificationTime || "08:00",
    eveningNotificationTime: data.eveningNotificationTime || "20:00",
    isOnboarded: false,
    createdAt: new Date(),
  };
  store.users.push(newUser);
  writeLocalStore(store);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<schema.User, "id" | "createdAt">>
): Promise<schema.User | null> {
  if (db) {
    const result = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return result[0] || null;
  }
  const store = readLocalStore();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  store.users[index] = { ...store.users[index], ...updates };
  writeLocalStore(store);
  return store.users[index];
}

// ----------------- COMMITMENTS -----------------
export async function getActiveCommitmentByUserId(userId: string): Promise<schema.Commitment | null> {
  if (db) {
    const result = await db
      .select()
      .from(schema.commitments)
      .where(and(eq(schema.commitments.userId, userId), eq(schema.commitments.active, true)))
      .orderBy(desc(schema.commitments.createdAt))
      .limit(1);
    return result[0] || null;
  }
  const store = readLocalStore();
  return store.commitments.find((c) => c.userId === userId && c.active) || null;
}

export async function createCommitment(data: {
  userId: string;
  name: string;
  why?: string;
  frequency?: string;
  customDays?: number[];
}): Promise<schema.Commitment> {
  if (db) {
    const result = await db.insert(schema.commitments).values({
      userId: data.userId,
      name: data.name.trim(),
      why: data.why?.trim() || null,
      frequency: data.frequency || "daily",
      customDays: data.customDays || [0, 1, 2, 3, 4, 5, 6],
      active: true,
    }).returning();
    return result[0];
  }
  const store = readLocalStore();
  // Deactivate existing
  store.commitments.forEach((c) => {
    if (c.userId === data.userId) c.active = false;
  });
  const newCommitment: schema.Commitment = {
    id: crypto.randomUUID(),
    userId: data.userId,
    name: data.name.trim(),
    why: data.why?.trim() || null,
    frequency: data.frequency || "daily",
    customDays: data.customDays || [0, 1, 2, 3, 4, 5, 6],
    active: true,
    createdAt: new Date(),
  };
  store.commitments.push(newCommitment);
  writeLocalStore(store);
  return newCommitment;
}

export async function updateCommitment(
  id: string,
  userId: string,
  updates: Partial<Omit<schema.Commitment, "id" | "userId" | "createdAt">>
): Promise<schema.Commitment | null> {
  if (db) {
    const result = await db
      .update(schema.commitments)
      .set(updates)
      .where(and(eq(schema.commitments.id, id), eq(schema.commitments.userId, userId)))
      .returning();
    return result[0] || null;
  }
  const store = readLocalStore();
  const index = store.commitments.findIndex((c) => c.id === id && c.userId === userId);
  if (index === -1) return null;
  store.commitments[index] = { ...store.commitments[index], ...updates };
  writeLocalStore(store);
  return store.commitments[index];
}

// ----------------- CHECK-INS -----------------
export async function getCheckInsByUserId(userId: string): Promise<schema.CheckIn[]> {
  if (db) {
    return db
      .select()
      .from(schema.checkIns)
      .where(eq(schema.checkIns.userId, userId))
      .orderBy(desc(schema.checkIns.date), desc(schema.checkIns.createdAt));
  }
  const store = readLocalStore();
  return store.checkIns
    .filter((c) => c.userId === userId)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function getCheckInsForDate(userId: string, dateStr: string): Promise<schema.CheckIn[]> {
  if (db) {
    return db
      .select()
      .from(schema.checkIns)
      .where(and(eq(schema.checkIns.userId, userId), eq(schema.checkIns.date, dateStr)));
  }
  const store = readLocalStore();
  return store.checkIns.filter((c) => c.userId === userId && c.date === dateStr);
}

export async function upsertCheckIn(data: {
  userId: string;
  commitmentId: string;
  date: string;
  type: "morning" | "evening";
  plannedActions?: string[];
  intentionNote?: string;
  status?: "yes" | "partial" | "no";
  reflection?: string;
  lessonsLearned?: string;
  blockerTags?: string[];
  moodOrCraving?: number;
  isLate?: boolean;
}): Promise<schema.CheckIn> {
  if (db) {
    const existing = await db
      .select()
      .from(schema.checkIns)
      .where(
        and(
          eq(schema.checkIns.userId, data.userId),
          eq(schema.checkIns.commitmentId, data.commitmentId),
          eq(schema.checkIns.date, data.date),
          eq(schema.checkIns.type, data.type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const result = await db
        .update(schema.checkIns)
        .set(data)
        .where(eq(schema.checkIns.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(schema.checkIns).values(data).returning();
    return result[0];
  }

  const store = readLocalStore();
  const index = store.checkIns.findIndex(
    (c) =>
      c.userId === data.userId &&
      c.commitmentId === data.commitmentId &&
      c.date === data.date &&
      c.type === data.type
  );

  if (index !== -1) {
    store.checkIns[index] = {
      ...store.checkIns[index],
      ...data,
    };
    writeLocalStore(store);
    return store.checkIns[index];
  }

  const newCheckIn: schema.CheckIn = {
    id: crypto.randomUUID(),
    userId: data.userId,
    commitmentId: data.commitmentId,
    date: data.date,
    type: data.type,
    plannedActions: data.plannedActions || null,
    intentionNote: data.intentionNote || null,
    status: data.status || null,
    reflection: data.reflection || null,
    lessonsLearned: data.lessonsLearned || null,
    blockerTags: data.blockerTags || null,
    moodOrCraving: data.moodOrCraving ?? null,
    isLate: data.isLate ?? false,
    createdAt: new Date(),
  };
  store.checkIns.push(newCheckIn);
  writeLocalStore(store);
  return newCheckIn;
}

// ----------------- WEEKLY RECAPS -----------------
export async function getWeeklyRecapsByUserId(userId: string): Promise<schema.WeeklyRecap[]> {
  if (db) {
    return db
      .select()
      .from(schema.weeklyRecaps)
      .where(eq(schema.weeklyRecaps.userId, userId))
      .orderBy(desc(schema.weeklyRecaps.weekStartDate));
  }
  const store = readLocalStore();
  return store.weeklyRecaps
    .filter((r) => r.userId === userId)
    .sort((a, b) => (b.weekStartDate > a.weekStartDate ? 1 : -1));
}

export async function saveWeeklyRecap(data: {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  completionRate: number;
  streakCurrent: number;
  streakLongest: number;
  topBlockerTags: { tag: string; count: number }[];
  pinnedLessons: string[];
}): Promise<schema.WeeklyRecap> {
  if (db) {
    const result = await db.insert(schema.weeklyRecaps).values(data).returning();
    return result[0];
  }
  const store = readLocalStore();
  const newRecap: schema.WeeklyRecap = {
    id: crypto.randomUUID(),
    ...data,
    generatedAt: new Date(),
  };
  store.weeklyRecaps.push(newRecap);
  writeLocalStore(store);
  return newRecap;
}
