// Guest Mode Service
// Enables first-time visitors to explore Anchor, complete check-ins, and write journals locally
// before creating an account. Stored securely in localStorage on the client.

export const GUEST_STORAGE_KEY = "anchor_guest_state";

export interface GuestCommitment {
  id: string;
  name: string;
  why: string;
  frequency: "daily" | "custom_days";
  customDays?: number[];
  morningTime: string;
  eveningTime: string;
}

export interface GuestCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  type: "morning" | "evening";
  status: "yes" | "partial" | "no";
  plannedActions?: string[];
  intentionNote?: string;
  reflection?: string;
  moodValence?: number; // -5 to +5
  moodEnergy?: number;  // 1 to 5
  blockerTags?: string[];
  createdAt: string;
}

export interface GuestJournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  moodValence?: number;
  moodEnergy?: number;
  tags?: string[];
  isStarred?: boolean;
  createdAt: string;
}

export interface GuestState {
  isGuest: boolean;
  commitment?: GuestCommitment;
  checkIns: GuestCheckIn[];
  journalEntries: GuestJournalEntry[];
}

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.isGuest);
  } catch {
    return false;
  }
}

export function getGuestState(): GuestState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestState;
  } catch {
    return null;
  }
}

export function setGuestState(state: GuestState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to persist guest state to localStorage:", err);
  }
}

export function initializeGuestCommitment(commitment: Omit<GuestCommitment, "id">): GuestState {
  const current = getGuestState() || { isGuest: true, checkIns: [], journalEntries: [] };
  const updated: GuestState = {
    ...current,
    isGuest: true,
    commitment: {
      ...commitment,
      id: "guest-commitment-1",
    },
  };
  setGuestState(updated);
  return updated;
}

export function saveGuestCheckIn(checkIn: Omit<GuestCheckIn, "id" | "createdAt">): GuestCheckIn {
  const current = getGuestState() || { isGuest: true, checkIns: [], journalEntries: [] };
  const existingIdx = current.checkIns.findIndex(
    (c) => c.date === checkIn.date && c.type === checkIn.type
  );

  const fullRecord: GuestCheckIn = {
    ...checkIn,
    id: `guest-checkin-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    current.checkIns[existingIdx] = fullRecord;
  } else {
    current.checkIns.push(fullRecord);
  }

  setGuestState(current);
  return fullRecord;
}

export function saveGuestJournalEntry(entry: Omit<GuestJournalEntry, "id" | "createdAt">): GuestJournalEntry {
  const current = getGuestState() || { isGuest: true, checkIns: [], journalEntries: [] };
  const fullRecord: GuestJournalEntry = {
    ...entry,
    id: `guest-journal-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  current.journalEntries.unshift(fullRecord);
  setGuestState(current);
  return fullRecord;
}

export function clearGuestState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {}
}
