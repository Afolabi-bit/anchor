import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckInsByUserId, getWeeklyRecapsByUserId, saveWeeklyRecap } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allCheckIns = await getCheckInsByUserId(session.id);
  const existingRecaps = await getWeeklyRecapsByUserId(session.id);

  // Generate rolling 7-day metrics dynamically
  const today = new Date();
  const past7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    past7Days.push(d.toISOString().slice(0, 10));
  }

  const weekStartDate = past7Days[0];
  const weekEndDate = past7Days[6];

  const recentCheckIns = allCheckIns.filter((c) => past7Days.includes(c.date));

  // Compute stats
  let totalDaysWithEvening = 0;
  let positiveOutcomes = 0;
  const tagCounts: Record<string, number> = {};
  const lessonsLearnedList: string[] = [];

  const dailyTrend = past7Days.map((dateStr) => {
    const morning = recentCheckIns.find((c) => c.date === dateStr && c.type === "morning");
    const evening = recentCheckIns.find((c) => c.date === dateStr && c.type === "evening");

    if (evening) {
      totalDaysWithEvening++;
      if (evening.status === "yes" || evening.status === "partial") {
        positiveOutcomes++;
      }
      if (evening.blockerTags && Array.isArray(evening.blockerTags)) {
        evening.blockerTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (evening.lessonsLearned && evening.lessonsLearned.trim().length > 0) {
        lessonsLearnedList.push(evening.lessonsLearned.trim());
      }
    }

    return {
      date: dateStr,
      morningPlanned: Boolean(morning),
      plannedActionsCount: morning?.plannedActions?.length || 0,
      eveningStatus: evening?.status || null,
      moodOrCraving: evening?.moodOrCraving || null,
      isLate: evening?.isLate || false,
    };
  });

  const completionRate = totalDaysWithEvening > 0
    ? Math.round((positiveOutcomes / totalDaysWithEvening) * 100)
    : 0;

  // Streak calculations (non-punitive: counts recent days checked in)
  let streakCurrent = 0;
  let streakLongest = 0;
  let tempStreak = 0;

  // Sort chronological
  const sortedDates = [...new Set(allCheckIns.map((c) => c.date))].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    tempStreak++;
    if (tempStreak > streakLongest) streakLongest = tempStreak;
  }
  streakCurrent = recentCheckIns.filter((c) => c.type === "evening").length;

  const topBlockerTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const pinnedLessons = lessonsLearnedList.slice(-3).reverse();

  return NextResponse.json({
    currentRecap: {
      weekStartDate,
      weekEndDate,
      completionRate,
      streakCurrent,
      streakLongest: Math.max(streakLongest, streakCurrent),
      topBlockerTags,
      pinnedLessons,
      dailyTrend,
      totalDaysWithEvening,
      totalCheckIns: recentCheckIns.length,
    },
    historyRecaps: existingRecaps,
  });
}
