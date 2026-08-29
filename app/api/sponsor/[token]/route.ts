import { NextResponse } from "next/server";
import { getShareByToken, addEncouragementMessage } from "@/lib/sponsor-service";
import { getActiveCommitmentByUserId, getCheckInsByUserId } from "@/lib/db-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = getShareByToken(token);

    if (!share) {
      // Fallback demo data for previewing without prior token generation
      return NextResponse.json({
        commitment: {
          name: "Daily Recovery & Mindful Presence",
          why: "To show up for the people I love with a clear mind and steady spirit.",
          frequency: "daily",
        },
        stats: {
          completionRate: 88,
          totalReflections: 14,
          streakDays: 7,
        },
        recentCadence: [
          { day: "Mon", status: "yes" },
          { day: "Tue", status: "yes" },
          { day: "Wed", status: "yes" },
          { day: "Thu", status: "partial" },
          { day: "Fri", status: "yes" },
          { day: "Sat", status: "yes" },
          { day: "Sun", status: "yes" },
        ],
        includeJournalNotes: false,
        timestamp: new Date().toISOString(),
      });
    }

    const commitment = await getActiveCommitmentByUserId(share.userId);
    const checkIns = await getCheckInsByUserId(share.userId);

    const eveningCheckIns = checkIns.filter((c) => c.type === "evening");
    const followedThroughCount = eveningCheckIns.filter((c) => c.status === "yes").length;
    const rate =
      eveningCheckIns.length > 0
        ? Math.round((followedThroughCount / eveningCheckIns.length) * 100)
        : 100;

    // Past 7 days cadence
    const recentCadence: { day: string; status: string }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = eveningCheckIns.find((c) => c.date === dStr);
      recentCadence.push({
        day: dayName,
        status: found?.status || "none",
      });
    }

    return NextResponse.json({
      commitment: commitment || {
        name: "Daily Anchor Focus",
        why: "Showing up one day at a time.",
      },
      stats: {
        completionRate: rate,
        totalReflections: checkIns.length,
        streakDays: followedThroughCount,
      },
      recentCadence,
      includeJournalNotes: share.includeJournalNotes,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Sponsor route error:", err);
    return NextResponse.json({ error: "Failed to load companion portal" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = getShareByToken(token);
    const body = await request.json();
    const { senderName = "Accountability Partner", message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userId = share ? share.userId : "demo-user";
    const newMsg = addEncouragementMessage(userId, senderName, message);

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (err) {
    console.error("Post encouragement error:", err);
    return NextResponse.json({ error: "Failed to send encouragement" }, { status: 500 });
  }
}
