import { NextResponse } from "next/server";
import { getShareByToken, isTokenExpired, addEncouragementMessage } from "@/lib/sponsor-service";
import { getActiveCommitmentByUserId, getCheckInsByUserId, getJournalEntriesForUser } from "@/lib/db-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await getShareByToken(token);

    if (!share) {
      return NextResponse.json(
        { error: "This partner connection does not exist or has been disconnected." },
        { status: 404 }
      );
    }

    // Server-side expiration check
    if (isTokenExpired(share)) {
      return NextResponse.json(
        { error: "This companion invite has expired. Please ask the user for a new link.", isExpired: true },
        { status: 410 }
      );
    }

    const commitment = await getActiveCommitmentByUserId(share.userId);
    const checkIns = await getCheckInsByUserId(share.userId);

    const eveningCheckIns = checkIns.filter((c) => c.type === "evening");
    const followedThroughCount = eveningCheckIns.filter((c) => c.status === "yes").length;
    const completionRate =
      eveningCheckIns.length > 0
        ? Math.round((followedThroughCount / eveningCheckIns.length) * 100)
        : 100;

    // 1. Consistency Cadence (Only included if shareConsistency is true)
    let recentCadence: { day: string; status: string }[] | undefined = undefined;
    if (share.shareConsistency) {
      recentCadence = [];
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
    }

    // 2. Milestones (Only included if shareMilestones is true)
    let stats: { completionRate?: number; totalReflections?: number; streakDays?: number } | undefined = undefined;
    if (share.shareMilestones || share.shareConsistency) {
      stats = {
        completionRate: share.shareConsistency ? completionRate : undefined,
        totalReflections: share.shareMilestones ? checkIns.length : undefined,
        streakDays: share.shareMilestones ? followedThroughCount : undefined,
      };
    }

    // 3. Mood Trends (Only included if shareMoodTrends is true)
    let moodOverview: { averageValence?: number; dominantEmotion?: string } | undefined = undefined;
    if (share.shareMoodTrends) {
      const valenceSum = eveningCheckIns.reduce((acc, c) => acc + (c.moodValence ?? 0), 0);
      const avg = eveningCheckIns.length > 0 ? Math.round((valenceSum / eveningCheckIns.length) * 10) / 10 : 0;
      moodOverview = {
        averageValence: avg,
        dominantEmotion: eveningCheckIns[0]?.emotionName || "Grounded",
      };
    }

    // 4. Blockers / Obstacles (Only included if shareBlockers is true)
    let blockerSummary: { tag: string; count: number }[] | undefined = undefined;
    if (share.shareBlockers) {
      const counts: Record<string, number> = {};
      eveningCheckIns.forEach((c) => {
        if (Array.isArray(c.blockerTags)) {
          c.blockerTags.forEach((t: string) => {
            counts[t] = (counts[t] || 0) + 1;
          });
        }
      });
      blockerSummary = Object.entries(counts).map(([tag, count]) => ({ tag, count }));
    }

    // 5. Journal Notes (STRICTLY PRIVATE BY DEFAULT — only if shareJournalNotes is explicitly true)
    let journalReflections: { date: string; title?: string; content: string }[] | undefined = undefined;
    if (share.shareJournalNotes) {
      const entries = await getJournalEntriesForUser(share.userId);
      journalReflections = entries.slice(0, 10).map((e) => ({
        date: e.date,
        title: e.title || undefined,
        content: e.content,
      }));
    }

    return NextResponse.json({
      partnerEmail: share.partnerEmail,
      commitment: {
        name: commitment?.name || "Daily Anchor Focus",
        why: commitment?.why || "Showing up one day at a time.",
      },
      permissions: {
        shareConsistency: share.shareConsistency,
        shareMilestones: share.shareMilestones,
        shareMoodTrends: share.shareMoodTrends,
        shareBlockers: share.shareBlockers,
        shareJournalNotes: share.shareJournalNotes,
      },
      stats,
      recentCadence,
      moodOverview,
      blockerSummary,
      journalReflections,
      expiresAt: share.expiresAt,
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
    const share = await getShareByToken(token);

    if (!share || isTokenExpired(share)) {
      return NextResponse.json(
        { error: "This partner link is no longer active." },
        { status: 410 }
      );
    }

    const body = await request.json();
    const { senderName = "Accountability Partner", message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const newMsg = addEncouragementMessage(share.userId, senderName, message);

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (err) {
    console.error("Post encouragement error:", err);
    return NextResponse.json({ error: "Failed to send encouragement" }, { status: 500 });
  }
}
