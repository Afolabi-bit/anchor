import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveCommitmentByUserId, getCheckInsByUserId, getCheckInsForDate, upsertCheckIn } from "@/lib/db-service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (date) {
    const checkIns = await getCheckInsForDate(session.id, date);
    return NextResponse.json({ checkIns });
  }

  const allCheckIns = await getCheckInsByUserId(session.id);
  return NextResponse.json({ checkIns: allCheckIns });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      type, // 'morning' | 'evening'
      plannedActions,
      intentionNote,
      status, // 'yes' | 'partial' | 'no'
      reflection,
      lessonsLearned,
      blockerTags,
      moodOrCraving,
      emotionName,
      moodValence,
      moodArousal,
      commitmentId: customCommitmentId,
    } = body;

    if (!date || !type) {
      return NextResponse.json({ error: "Date and check-in type are required" }, { status: 400 });
    }

    let commitmentId = customCommitmentId;
    if (!commitmentId) {
      const activeCommitment = await getActiveCommitmentByUserId(session.id);
      if (!activeCommitment) {
        return NextResponse.json({ error: "No active commitment found" }, { status: 400 });
      }
      commitmentId = activeCommitment.id;
    }

    // Check if entry is late (> 24h from checkin date)
    const checkInDate = new Date(date + "T23:59:59Z");
    const now = new Date();
    const isLate = (now.getTime() - checkInDate.getTime()) > (24 * 60 * 60 * 1000);

    const checkIn = await upsertCheckIn({
      userId: session.id,
      commitmentId,
      date,
      type,
      plannedActions: Array.isArray(plannedActions) ? plannedActions : undefined,
      intentionNote: intentionNote?.trim() || undefined,
      status: status || undefined,
      reflection: reflection?.trim() || undefined,
      lessonsLearned: lessonsLearned?.trim() || undefined,
      blockerTags: Array.isArray(blockerTags) ? blockerTags : undefined,
      moodOrCraving: typeof moodOrCraving === "number" ? moodOrCraving : undefined,
      emotionName: emotionName?.trim() || undefined,
      moodValence: typeof moodValence === "number" ? moodValence : undefined,
      moodArousal: typeof moodArousal === "number" ? moodArousal : undefined,
      isLate,
    });

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    console.error("Check-in submission error:", error);
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }
}
