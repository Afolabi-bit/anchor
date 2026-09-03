import { db, schema } from "@/db";
import { eq, and, desc, asc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { encryptField, decryptField } from "@/lib/encryption";

// Helpers for transparent field decryption
function decryptCheckIn(c: schema.CheckIn): schema.CheckIn {
  return {
    ...c,
    intentionNote: c.intentionNote
      ? decryptField(c.intentionNote, c.intentionNoteIv, c.intentionNoteKeyVersion) ?? c.intentionNote
      : c.intentionNote,
    reflection: c.reflection
      ? decryptField(c.reflection, c.reflectionIv, c.reflectionKeyVersion) ?? c.reflection
      : c.reflection,
  };
}

function decryptJournalEntry(j: schema.JournalEntry): schema.JournalEntry {
  return {
    ...j,
    content: j.content
      ? decryptField(j.content, j.encryptionIv, j.encryptionKeyVersion) ?? j.content
      : j.content,
  };
}


// Local storage fallback for seamless testing when DATABASE_URL is not yet connected
const LOCAL_STORE_FILE = path.join(process.cwd(), ".local-db-store.json");

interface LocalDBStore {
  users: Array<schema.User>;
  commitments: Array<schema.Commitment>;
  checkIns: Array<schema.CheckIn>;
  weeklyRecaps: Array<schema.WeeklyRecap>;
  journalEntries: Array<schema.JournalEntry>;
}

function readLocalStore(): LocalDBStore {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || [],
        commitments: parsed.commitments || [],
        checkIns: parsed.checkIns || [],
        weeklyRecaps: parsed.weeklyRecaps || [],
        journalEntries: parsed.journalEntries || [],
      };
    }
  } catch (e) {
    console.error("Error reading local DB store:", e);
  }
  return { users: [], commitments: [], checkIns: [], weeklyRecaps: [], journalEntries: [] };
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
    const rows = await db
      .select()
      .from(schema.checkIns)
      .where(eq(schema.checkIns.userId, userId))
      .orderBy(desc(schema.checkIns.date), desc(schema.checkIns.createdAt));
    return rows.map(decryptCheckIn);
  }
  const store = readLocalStore();
  return (store.checkIns || [])
    .filter((c) => c.userId === userId)
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .map(decryptCheckIn);
}

export async function getCheckInsForDate(userId: string, dateStr: string): Promise<schema.CheckIn[]> {
  if (db) {
    const rows = await db
      .select()
      .from(schema.checkIns)
      .where(and(eq(schema.checkIns.userId, userId), eq(schema.checkIns.date, dateStr)));
    return rows.map(decryptCheckIn);
  }
  const store = readLocalStore();
  return (store.checkIns || [])
    .filter((c) => c.userId === userId && c.date === dateStr)
    .map(decryptCheckIn);
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
  // Transparently encrypt sensitive free-text fields before writing
  const writeData: any = { ...data };

  if (data.intentionNote !== undefined) {
    if (data.intentionNote && data.intentionNote.trim()) {
      const enc = encryptField(data.intentionNote);
      if (enc) {
        writeData.intentionNote = enc.ciphertext;
        writeData.intentionNoteIv = enc.iv;
        writeData.intentionNoteKeyVersion = enc.keyVersion;
      }
    } else {
      writeData.intentionNote = null;
      writeData.intentionNoteIv = null;
      writeData.intentionNoteKeyVersion = null;
    }
  }

  if (data.reflection !== undefined) {
    if (data.reflection && data.reflection.trim()) {
      const enc = encryptField(data.reflection);
      if (enc) {
        writeData.reflection = enc.ciphertext;
        writeData.reflectionIv = enc.iv;
        writeData.reflectionKeyVersion = enc.keyVersion;
      }
    } else {
      writeData.reflection = null;
      writeData.reflectionIv = null;
      writeData.reflectionKeyVersion = null;
    }
  }

  if (db) {
    const existing = await db
      .select()
      .from(schema.checkIns)
      .where(
        and(
          eq(schema.checkIns.userId, writeData.userId),
          eq(schema.checkIns.commitmentId, writeData.commitmentId),
          eq(schema.checkIns.date, writeData.date),
          eq(schema.checkIns.type, writeData.type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const result = await db
        .update(schema.checkIns)
        .set(writeData)
        .where(eq(schema.checkIns.id, existing[0].id))
        .returning();
      return decryptCheckIn(result[0]);
    }

    const result = await db.insert(schema.checkIns).values(writeData).returning();
    return decryptCheckIn(result[0]);
  }

  const store = readLocalStore();
  const index = store.checkIns.findIndex(
    (c) =>
      c.userId === writeData.userId &&
      c.commitmentId === writeData.commitmentId &&
      c.date === writeData.date &&
      c.type === writeData.type
  );

  if (index !== -1) {
    store.checkIns[index] = {
      ...store.checkIns[index],
      ...writeData,
    };
    writeLocalStore(store);
    return decryptCheckIn(store.checkIns[index]);
  }

  const newCheckIn: schema.CheckIn = {
    id: crypto.randomUUID(),
    userId: writeData.userId,
    commitmentId: writeData.commitmentId,
    date: writeData.date,
    type: writeData.type,
    plannedActions: writeData.plannedActions || null,
    intentionNote: writeData.intentionNote || null,
    intentionNoteIv: writeData.intentionNoteIv || null,
    intentionNoteKeyVersion: writeData.intentionNoteKeyVersion || null,
    status: writeData.status || null,
    reflection: writeData.reflection || null,
    reflectionIv: writeData.reflectionIv || null,
    reflectionKeyVersion: writeData.reflectionKeyVersion || null,
    lessonsLearned: writeData.lessonsLearned || null,
    blockerTags: writeData.blockerTags || null,
    moodOrCraving: writeData.moodOrCraving ?? null,
    emotionName: writeData.emotionName || null,
    moodValence: writeData.moodValence ?? null,
    moodArousal: writeData.moodArousal ?? null,
    isLate: writeData.isLate ?? false,
    createdAt: new Date(),
  };
  store.checkIns.push(newCheckIn);
  writeLocalStore(store);
  return decryptCheckIn(newCheckIn);
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

// ----------------- JOURNAL ENTRIES -----------------
export async function getJournalEntriesForUser(userId: string): Promise<schema.JournalEntry[]> {
  if (db) {
    const rows = await db
      .select()
      .from(schema.journalEntries)
      .where(eq(schema.journalEntries.userId, userId))
      .orderBy(desc(schema.journalEntries.date), desc(schema.journalEntries.createdAt));
    return rows.map(decryptJournalEntry);
  }
  const store = readLocalStore();
  return (store.journalEntries || [])
    .filter((j) => j.userId === userId)
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .map(decryptJournalEntry);
}

export async function getJournalEntriesForDate(userId: string, dateStr: string): Promise<schema.JournalEntry[]> {
  if (db) {
    const rows = await db
      .select()
      .from(schema.journalEntries)
      .where(and(eq(schema.journalEntries.userId, userId), eq(schema.journalEntries.date, dateStr)))
      .orderBy(desc(schema.journalEntries.createdAt));
    return rows.map(decryptJournalEntry);
  }
  const store = readLocalStore();
  return (store.journalEntries || [])
    .filter((j) => j.userId === userId && j.date === dateStr)
    .map(decryptJournalEntry);
}

export async function createJournalEntry(data: {
  userId: string;
  date: string;
  title?: string;
  content: string;
  moodValence?: number;
  moodEnergy?: number;
  tags?: string[];
  isStarred?: boolean;
}): Promise<schema.JournalEntry> {
  const now = new Date();
  let contentPayload = data.content.trim();
  let ivPayload: string | null = null;
  let keyVerPayload: string | null = null;

  const enc = encryptField(contentPayload);
  if (enc) {
    contentPayload = enc.ciphertext;
    ivPayload = enc.iv;
    keyVerPayload = enc.keyVersion;
  }

  if (db) {
    const result = await db
      .insert(schema.journalEntries)
      .values({
        userId: data.userId,
        date: data.date,
        title: data.title?.trim() || null,
        content: contentPayload,
        encryptionIv: ivPayload,
        encryptionKeyVersion: keyVerPayload,
        moodValence: typeof data.moodValence === "number" ? data.moodValence : null,
        moodEnergy: typeof data.moodEnergy === "number" ? data.moodEnergy : null,
        tags: data.tags || [],
        isStarred: data.isStarred || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return decryptJournalEntry(result[0]);
  }

  const store = readLocalStore();
  const newEntry: schema.JournalEntry = {
    id: crypto.randomUUID(),
    userId: data.userId,
    date: data.date,
    title: data.title?.trim() || null,
    content: contentPayload,
    encryptionIv: ivPayload,
    encryptionKeyVersion: keyVerPayload,
    moodValence: typeof data.moodValence === "number" ? data.moodValence : null,
    moodEnergy: typeof data.moodEnergy === "number" ? data.moodEnergy : null,
    tags: data.tags || [],
    isStarred: data.isStarred || false,
    createdAt: now,
    updatedAt: now,
  };
  store.journalEntries = store.journalEntries || [];
  store.journalEntries.unshift(newEntry);
  writeLocalStore(store);
  return decryptJournalEntry(newEntry);
}

export async function updateJournalEntry(
  id: string,
  userId: string,
  updates: Partial<Omit<schema.JournalEntry, "id" | "userId" | "createdAt">>
): Promise<schema.JournalEntry | null> {
  const now = new Date();
  const writeUpdates: any = { ...updates, updatedAt: now };

  if (updates.content !== undefined) {
    if (updates.content && updates.content.trim()) {
      const enc = encryptField(updates.content);
      if (enc) {
        writeUpdates.content = enc.ciphertext;
        writeUpdates.encryptionIv = enc.iv;
        writeUpdates.encryptionKeyVersion = enc.keyVersion;
      }
    } else {
      writeUpdates.content = "";
      writeUpdates.encryptionIv = null;
      writeUpdates.encryptionKeyVersion = null;
    }
  }

  if (db) {
    const result = await db
      .update(schema.journalEntries)
      .set(writeUpdates)
      .where(and(eq(schema.journalEntries.id, id), eq(schema.journalEntries.userId, userId)))
      .returning();
    return result[0] ? decryptJournalEntry(result[0]) : null;
  }

  const store = readLocalStore();
  store.journalEntries = store.journalEntries || [];
  const index = store.journalEntries.findIndex((j) => j.id === id && j.userId === userId);
  if (index === -1) return null;
  store.journalEntries[index] = {
    ...store.journalEntries[index],
    ...writeUpdates,
  };
  writeLocalStore(store);
  return decryptJournalEntry(store.journalEntries[index]);
}

export async function deleteJournalEntry(id: string, userId: string): Promise<boolean> {
  if (db) {
    const result = await db
      .delete(schema.journalEntries)
      .where(and(eq(schema.journalEntries.id, id), eq(schema.journalEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }
  const store = readLocalStore();
  store.journalEntries = store.journalEntries || [];
  const initialLen = store.journalEntries.length;
  store.journalEntries = store.journalEntries.filter((j) => !(j.id === id && j.userId === userId));
  writeLocalStore(store);
  return store.journalEntries.length < initialLen;
}


