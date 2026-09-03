// Sponsor and Accountability Partner Companion Service
import { db, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export interface PartnerPermissionData {
  id?: string;
  userId: string;
  partnerEmail?: string | null;
  token: string;
  shareConsistency: boolean;
  shareMilestones: boolean;
  shareMoodTrends: boolean;
  shareBlockers: boolean;
  shareJournalNotes: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface EncouragementMessage {
  id: string;
  userId: string;
  senderName: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// In-memory runtime cache for fallback / demo
const inMemoryShares: Record<string, PartnerPermissionData> = {};
const encouragementMessages: EncouragementMessage[] = [];

/**
 * Checks if a partner token is expired.
 */
export function isTokenExpired(share: PartnerPermissionData | schema.PartnerPermission): boolean {
  if (!share.expiresAt) return false;
  return new Date(share.expiresAt).getTime() < Date.now();
}

/**
 * Fetches a partner share record by token, verifying server-side expiration.
 */
export async function getShareByToken(
  token: string
): Promise<schema.PartnerPermission | PartnerPermissionData | null> {
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.partnerPermissions)
        .where(eq(schema.partnerPermissions.token, token))
        .limit(1);

      if (results.length > 0) {
        return results[0];
      }
    } catch (e) {
      console.warn("DB partner lookup error, checking memory:", e);
    }
  }

  const mem = inMemoryShares[token] || null;
  return mem;
}

/**
 * Fetches all partner shares for a specific user.
 */
export async function getSharesByUserId(
  userId: string
): Promise<Array<schema.PartnerPermission | PartnerPermissionData>> {
  if (db) {
    try {
      return await db
        .select()
        .from(schema.partnerPermissions)
        .where(eq(schema.partnerPermissions.userId, userId))
        .orderBy(desc(schema.partnerPermissions.createdAt));
    } catch (e) {
      console.warn("DB partner lookup error, checking memory:", e);
    }
  }

  return Object.values(inMemoryShares).filter((s) => s.userId === userId);
}

/**
 * Backwards compatibility helper for existing single-share caller.
 */
export async function getShareByUserId(
  userId: string
): Promise<schema.PartnerPermission | PartnerPermissionData | null> {
  const all = await getSharesByUserId(userId);
  return all[0] || null;
}

/**
 * Creates a new partner permission invite with granular flags (all default FALSE).
 */
export async function createPartnerShare(data: {
  userId: string;
  partnerEmail?: string;
  shareConsistency?: boolean;
  shareMilestones?: boolean;
  shareMoodTrends?: boolean;
  shareBlockers?: boolean;
  shareJournalNotes?: boolean;
  expiresInDays?: number;
}): Promise<schema.PartnerPermission | PartnerPermissionData> {
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const days = data.expiresInDays && data.expiresInDays > 0 ? data.expiresInDays : 60;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const newShare: schema.NewPartnerPermission = {
    userId: data.userId,
    partnerEmail: data.partnerEmail?.trim() || null,
    token,
    shareConsistency: Boolean(data.shareConsistency),
    shareMilestones: Boolean(data.shareMilestones),
    shareMoodTrends: Boolean(data.shareMoodTrends),
    shareBlockers: Boolean(data.shareBlockers),
    shareJournalNotes: Boolean(data.shareJournalNotes), // DEFAULT FALSE
    expiresAt,
    createdAt: now,
  };

  if (db) {
    try {
      const result = await db
        .insert(schema.partnerPermissions)
        .values(newShare)
        .returning();
      return result[0];
    } catch (e) {
      console.warn("DB partner insert error, writing to memory:", e);
    }
  }

  const memRecord: PartnerPermissionData = {
    id: crypto.randomUUID(),
    userId: newShare.userId,
    partnerEmail: newShare.partnerEmail || null,
    token: newShare.token,
    shareConsistency: Boolean(newShare.shareConsistency),
    shareMilestones: Boolean(newShare.shareMilestones),
    shareMoodTrends: Boolean(newShare.shareMoodTrends),
    shareBlockers: Boolean(newShare.shareBlockers),
    shareJournalNotes: Boolean(newShare.shareJournalNotes),
    createdAt: now,
    expiresAt,
  };
  inMemoryShares[token] = memRecord;
  return memRecord;
}

/**
 * Updates granular permissions for a partner link.
 */
export async function updatePartnerShare(
  token: string,
  userId: string,
  updates: Partial<Omit<schema.PartnerPermission, "id" | "userId" | "token" | "createdAt">>
): Promise<schema.PartnerPermission | PartnerPermissionData | null> {
  if (db) {
    try {
      const result = await db
        .update(schema.partnerPermissions)
        .set(updates)
        .where(
          and(
            eq(schema.partnerPermissions.token, token),
            eq(schema.partnerPermissions.userId, userId)
          )
        )
        .returning();
      return result[0] || null;
    } catch (e) {
      console.warn("DB partner update error, updating memory:", e);
    }
  }

  const existing = inMemoryShares[token];
  if (existing && existing.userId === userId) {
    inMemoryShares[token] = { ...existing, ...updates };
    return inMemoryShares[token];
  }
  return null;
}

/**
 * Revokes a partner token immediately ("Disconnect partner").
 */
export async function revokePartnerShare(token: string, userId: string): Promise<boolean> {
  if (db) {
    try {
      const result = await db
        .delete(schema.partnerPermissions)
        .where(
          and(
            eq(schema.partnerPermissions.token, token),
            eq(schema.partnerPermissions.userId, userId)
          )
        )
        .returning();
      return result.length > 0;
    } catch (e) {
      console.warn("DB partner delete error:", e);
    }
  }

  if (inMemoryShares[token] && inMemoryShares[token].userId === userId) {
    delete inMemoryShares[token];
    return true;
  }
  return false;
}

/**
 * Compatibility saveShare
 */
export function saveShare(share: any) {
  inMemoryShares[share.token] = {
    userId: share.userId,
    token: share.token,
    shareConsistency: Boolean(share.shareConsistency),
    shareMilestones: Boolean(share.shareMilestones),
    shareMoodTrends: Boolean(share.shareMoodTrends),
    shareBlockers: Boolean(share.shareBlockers),
    shareJournalNotes: Boolean(share.shareJournalNotes ?? share.includeJournalNotes),
    expiresAt: share.expiresAt ? new Date(share.expiresAt) : null,
    createdAt: new Date(),
  };
}

// ----------------- ENCOURAGEMENT MESSAGES -----------------
export function addEncouragementMessage(
  userId: string,
  senderName: string,
  message: string
): EncouragementMessage {
  const newMsg: EncouragementMessage = {
    id: `enc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    senderName: senderName.trim() || "Accountability Partner",
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  encouragementMessages.unshift(newMsg);
  return newMsg;
}

export function getEncouragementMessages(userId: string): EncouragementMessage[] {
  return encouragementMessages.filter((m) => m.userId === userId);
}

export function markMessageAsRead(id: string) {
  const msg = encouragementMessages.find((m) => m.id === id);
  if (msg) msg.read = true;
}
