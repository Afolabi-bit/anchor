// Sponsor and Accountability Partner Companion Service

export interface SponsorShare {
  userId: string;
  token: string;
  includeJournalNotes: boolean;
  createdAt: string;
}

export interface EncouragementMessage {
  id: string;
  userId: string;
  senderName: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// In-memory runtime cache
const sponsorShares: Record<string, SponsorShare> = {};
const encouragementMessages: EncouragementMessage[] = [];

export function getShareByToken(token: string): SponsorShare | null {
  return sponsorShares[token] || null;
}

export function getShareByUserId(userId: string): SponsorShare | null {
  return Object.values(sponsorShares).find((s) => s.userId === userId) || null;
}

export function saveShare(share: SponsorShare) {
  sponsorShares[share.token] = share;
}

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
