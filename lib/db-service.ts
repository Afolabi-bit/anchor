import { db, schema } from "@/db";
import { eq, and, desc, asc } from "drizzle-orm";
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
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  timezone?: string;
  morningNotificationTime?: string;
  eveningNotificationTime?: string;
}): Promise<schema.User> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const firstName = data.firstName?.trim() || null;
  const lastName = data.lastName?.trim() || null;

  if (db) {
    const result = await db.insert(schema.users).values({
      email: normalizedEmail,
      firstName,
      lastName,
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
    firstName,
    lastName,
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
  const commitments = await getActiveCommitmentsByUserId(userId);
  return commitments[0] || null;
}

export async function getActiveCommitmentsByUserId(userId: string): Promise<schema.Commitment[]> {
  if (db) {
    return db
      .select()
      .from(schema.commitments)
      .where(and(eq(schema.commitments.userId, userId), eq(schema.commitments.active, true)))
      .orderBy(asc(schema.commitments.createdAt));
  }
  const store = readLocalStore();
  return store.commitments.filter((c) => c.userId === userId && c.active);
}

export async function getAllCommitmentsByUserId(userId: string): Promise<schema.Commitment[]> {
  if (db) {
    return db
      .select()
      .from(schema.commitments)
      .where(eq(schema.commitments.userId, userId))
      .orderBy(desc(schema.commitments.active), asc(schema.commitments.createdAt));
  }
  const store = readLocalStore();
  return store.commitments.filter((c) => c.userId === userId);
}

export async function createCommitment(data: {
  userId: string;
  name: string;
  why?: string;
  frequency?: string;
  customDays?: number[];
  colorIndex?: number;
  icon?: string;
}): Promise<schema.Commitment> {
  if (db) {
    const result = await db.insert(schema.commitments).values({
      userId: data.userId,
      name: data.name.trim(),
      why: data.why?.trim() || null,
      frequency: data.frequency || "daily",
      customDays: data.customDays || [0, 1, 2, 3, 4, 5, 6],
      colorIndex: data.colorIndex ?? 0,
      icon: data.icon || "anchor",
      active: true,
    }).returning();
    return result[0];
  }
  const store = readLocalStore();
  const newCommitment: schema.Commitment = {
    id: crypto.randomUUID(),
    userId: data.userId,
    name: data.name.trim(),
    why: data.why?.trim() || null,
    frequency: data.frequency || "daily",
    customDays: data.customDays || [0, 1, 2, 3, 4, 5, 6],
    colorIndex: data.colorIndex ?? 0,
    icon: data.icon || "anchor",
    active: true,
    createdAt: new Date(),
  };
  store.commitments.push(newCommitment);
  writeLocalStore(store);
  return newCommitment;
}

export async function deleteCommitment(id: string, userId: string): Promise<boolean> {
  if (db) {
    const result = await db
      .delete(schema.commitments)
      .where(and(eq(schema.commitments.id, id), eq(schema.commitments.userId, userId)))
      .returning();
    return result.length > 0;
  }
  const store = readLocalStore();
  const initialLen = store.commitments.length;
  store.commitments = store.commitments.filter((c) => !(c.id === id && c.userId === userId));
  writeLocalStore(store);
  return store.commitments.length < initialLen;
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
  emotionName?: string;
  moodValence?: number;
  moodArousal?: number;
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
    emotionName: data.emotionName || null,
    moodValence: data.moodValence ?? null,
    moodArousal: data.moodArousal ?? null,
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

// ----------------- PUSH SUBSCRIPTIONS -----------------
export async function savePushSubscription(data: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<schema.PushSubscription> {
  if (db) {
    const existing = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, data.endpoint))
      .limit(1);

    if (existing.length > 0) {
      const result = await db
        .update(schema.pushSubscriptions)
        .set({ ...data, createdAt: new Date() })
        .where(eq(schema.pushSubscriptions.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(schema.pushSubscriptions).values(data).returning();
    return result[0];
  }

  return {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };
}

export async function getPushSubscriptionsByUserId(userId: string): Promise<schema.PushSubscription[]> {
  if (db) {
    return db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userId));
  }
  return [];
}

export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  if (db) {
    const result = await db
      .delete(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.endpoint, endpoint))
      .returning();
    return result.length > 0;
  }
  return true;
}

export async function getAllPushSubscriptionsWithUsers() {
  if (db) {
    return db
      .select({
        subscription: schema.pushSubscriptions,
        user: schema.users,
      })
      .from(schema.pushSubscriptions)
      .innerJoin(schema.users, eq(schema.pushSubscriptions.userId, schema.users.id));
  }
  return [];
}

export async function getCommunityReflections(category?: string): Promise<schema.CommunityReflection[]> {
  if (db) {
    if (category && category !== "All") {
      return db
        .select()
        .from(schema.communityReflections)
        .where(eq(schema.communityReflections.category, category))
        .orderBy(desc(schema.communityReflections.createdAt))
        .limit(50);
    }
    return db
      .select()
      .from(schema.communityReflections)
      .orderBy(desc(schema.communityReflections.createdAt))
      .limit(50);
  }
  return [];
}

export async function createCommunityReflection(data: {
  userId?: string;
  content: string;
  category: string;
  emotionName?: string;
  anchoredDays?: number;
}): Promise<schema.CommunityReflection> {
  if (db) {
    const result = await db
      .insert(schema.communityReflections)
      .values({
        userId: data.userId || null,
        content: data.content.trim(),
        category: data.category || "Sobriety & Recovery",
        emotionName: data.emotionName || "Grounded",
        anchoredDays: data.anchoredDays ?? 1,
        resonatesCount: 0,
      })
      .returning();
    return result[0];
  }
  return {
    id: crypto.randomUUID(),
    userId: data.userId || null,
    content: data.content.trim(),
    category: data.category || "Sobriety & Recovery",
    emotionName: data.emotionName || "Grounded",
    anchoredDays: data.anchoredDays ?? 1,
    resonatesCount: 0,
    createdAt: new Date(),
  };
}

export async function incrementReflectionResonates(id: string): Promise<boolean> {
  if (db) {
    const existing = await db
      .select()
      .from(schema.communityReflections)
      .where(eq(schema.communityReflections.id, id));
    if (existing.length > 0) {
      await db
        .update(schema.communityReflections)
        .set({ resonatesCount: (existing[0].resonatesCount || 0) + 1 })
        .where(eq(schema.communityReflections.id, id));
      return true;
    }
  }
  return false;
}

