import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createJournalEntry,
  getJournalEntriesForUser,
  getJournalEntriesForDate,
} from "@/lib/db-service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      const entries = await getJournalEntriesForDate(session.id, date);
      return NextResponse.json({ entries });
    }

    const entries = await getJournalEntriesForUser(session.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to load journal entries:", error);
    return NextResponse.json({ error: "Failed to load journal entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, title, content, moodValence, moodEnergy, tags, isStarred } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Reflection content is required" }, { status: 400 });
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);

    const entry = await createJournalEntry({
      userId: session.id,
      date: targetDate,
      title: title?.trim() || undefined,
      content: content.trim(),
      moodValence: typeof moodValence === "number" ? moodValence : undefined,
      moodEnergy: typeof moodEnergy === "number" ? moodEnergy : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      isStarred: Boolean(isStarred),
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Journal entry creation error:", error);
    return NextResponse.json({ error: "That didn't save — want to try again?" }, { status: 500 });
  }
}
