"use client";

import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";

export interface ClientActivityLog {
  id: string;
  date: string;
  timestamp: number; // ms
  timeStr: string; // "8:30 AM"
  type: "morning_checkin" | "evening_checkin" | "journal_entry";
  commitmentId?: string;
  commitmentName?: string;
  commitmentColorIndex?: number;
  title: string;
  detail?: string;
  plannedActions?: string[];
  status?: string;
  emotion?: string;
  lessonsLearned?: string;
  tags?: string[];
  isSealed: boolean;
}

const STORAGE_KEY = "anchor_client_activity_timelogs";

export function formatTimeFromTimestamp(timestamp: number | Date | string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "";
  }
}

export function getAllClientTimeLogs(): Record<string, ClientActivityLog[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Could not read client time logs:", e);
    return {};
  }
}

export function getClientTimeLogsForDate(dateStr: string): ClientActivityLog[] {
  const all = getAllClientTimeLogs();
  return all[dateStr] || [];
}

export function recordClientActivityLog(log: ClientActivityLog): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllClientTimeLogs();
    const dateLogs = all[log.date] || [];
    // If already exists with this ID, don't overwrite if sealed
    const existingIndex = dateLogs.findIndex((l) => l.id === log.id);
    if (existingIndex >= 0) {
      // Keep original timestamp if already sealed
      return;
    }
    dateLogs.push(log);
    // Sort chronologically ascending
    dateLogs.sort((a, b) => a.timestamp - b.timestamp);
    all[log.date] = dateLogs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Could not persist client time log:", e);
  }
}

/**
 * Ensures today's client-side time log contains all sealed activities from today,
 * preserving existing local client timestamps and deriving timestamps for newly loaded data.
 * Saved strictly client-side in localStorage.
 */
export function syncClientTimeLogs(
  dateStr: string,
  checkIns: CheckIn[],
  journals: JournalEntry[],
  commitments: Commitment[]
): ClientActivityLog[] {
  if (typeof window === "undefined") return [];

  const all = getAllClientTimeLogs();
  const existingList = all[dateStr] || [];
  const existingMap = new Map(existingList.map((l) => [l.id, l]));

  let hasChanged = false;

  // Sync Check-ins
  checkIns
    .filter((c) => c.date === dateStr)
    .forEach((c) => {
      const logId = `checkin_${c.id}`;
      if (!existingMap.has(logId)) {
        const comm = commitments.find((cm) => cm.id === c.commitmentId);
        const createdAt = c.createdAt ? new Date(c.createdAt).getTime() : Date.now();
        const newLog: ClientActivityLog = {
          id: logId,
          date: dateStr,
          timestamp: createdAt,
          timeStr: formatTimeFromTimestamp(createdAt) || formatTimeFromTimestamp(Date.now()),
          type: c.type === "morning" ? "morning_checkin" : "evening_checkin",
          commitmentId: c.commitmentId || undefined,
          commitmentName: comm?.name || "Daily Anchor",
          commitmentColorIndex: comm?.colorIndex ?? 0,
          title: c.type === "morning" ? "Morning Intention" : "Evening Reflection",
          detail: c.type === "morning" ? c.intentionNote || undefined : c.reflection || undefined,
          plannedActions: c.plannedActions || undefined,
          status: c.status || undefined,
          emotion: c.emotionName || undefined,
          lessonsLearned: c.lessonsLearned || undefined,
          isSealed: true,
        };
        existingMap.set(logId, newLog);
        hasChanged = true;
      }
    });

  // Sync Journals
  journals
    .filter((j) => j.date === dateStr)
    .forEach((j) => {
      const logId = `journal_${j.id}`;
      if (!existingMap.has(logId)) {
        const comm = commitments.find((cm) => cm.id === j.commitmentId);
        const createdAt = j.createdAt ? new Date(j.createdAt).getTime() : Date.now();
        const newLog: ClientActivityLog = {
          id: logId,
          date: dateStr,
          timestamp: createdAt,
          timeStr: formatTimeFromTimestamp(createdAt) || formatTimeFromTimestamp(Date.now()),
          type: "journal_entry",
          commitmentId: j.commitmentId || undefined,
          commitmentName: comm?.name || "Daily Reflection",
          commitmentColorIndex: comm?.colorIndex ?? 0,
          title: j.title || "Daily Reflection",
          detail: j.content,
          tags: j.tags || undefined,
          isSealed: true,
        };
        existingMap.set(logId, newLog);
        hasChanged = true;
      }
    });

  const updatedList = Array.from(existingMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  if (hasChanged) {
    all[dateStr] = updatedList;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Could not sync client time logs to localStorage:", e);
    }
  }

  return updatedList;
}
