import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateJournalEntry, deleteJournalEntry } from "@/lib/db-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, moodValence, moodEnergy, moodArousal, tags, isStarred } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title ? title.trim() : null;
    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return NextResponse.json({ error: "Reflection content cannot be empty" }, { status: 400 });
      }
      updates.content = content.trim();
    }
    if (moodValence !== undefined) updates.moodValence = moodValence;
    const effectiveEnergy = typeof moodEnergy === "number"
      ? moodEnergy
      : typeof moodArousal === "number"
      ? moodArousal
      : undefined;
    if (effectiveEnergy !== undefined) updates.moodEnergy = effectiveEnergy;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (isStarred !== undefined) updates.isStarred = Boolean(isStarred);

    const updated = await updateJournalEntry(id, session.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error("Journal entry update error:", error);
    return NextResponse.json({ error: "That didn't save — want to try again?" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteJournalEntry(id, session.id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Journal entry deletion error:", error);
    return NextResponse.json({ error: "That didn't remove cleanly — want to try again?" }, { status: 500 });
  }
}
