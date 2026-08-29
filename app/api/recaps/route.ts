import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckInsByUserId, getWeeklyRecapsByUserId } from "@/lib/db-service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commitmentId = searchParams.get("commitmentId");
  const rangeParam = searchParams.get("range") || "7"; // "7" | "30" | "90" | "all"

  const rawCheckIns = await getCheckInsByUserId(session.id);
  const allCheckIns = commitmentId
    ? rawCheckIns.filter((c) => !c.commitmentId || c.commitmentId === commitmentId)
    : rawCheckIns;
  const existingRecaps = await getWeeklyRecapsByUserId(session.id);

  const numDays =
    rangeParam === "30"
      ? 30
      : rangeParam === "90"
      ? 90
      : rangeParam === "all"
      ? Math.max(90, Math.ceil((Date.now() - new Date(session.id ? 2026 : 2025).getTime()) / (1000 * 60 * 60 * 24)) || 90)
      : 7;

  // Generate rolling date array
  const today = new Date();
  const rangeDays: string[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    rangeDays.push(d.toISOString().slice(0, 10));
  }

  const weekStartDate = rangeDays[0];
  const weekEndDate = rangeDays[rangeDays.length - 1];

  const rangeCheckIns = allCheckIns.filter((c) => rangeDays.includes(c.date));

  // Compute stats across the selected range
  let totalDaysWithEvening = 0;
  let positiveOutcomes = 0;
  const tagCounts: Record<string, number> = {};
  const lessonsLearnedList: string[] = [];
  const emotionCounts: Record<string, number> = {};

  const dailyTrend = rangeDays.map((dateStr) => {
    const morning = rangeCheckIns.find((c) => c.date === dateStr && c.type === "morning");
    const evening = rangeCheckIns.find((c) => c.date === dateStr && c.type === "evening");

    if (evening) {
      totalDaysWithEvening++;
      if (evening.status === "yes" || evening.status === "partial") {
        positiveOutcomes++;
      }
      if (evening.emotionName) {
        emotionCounts[evening.emotionName] = (emotionCounts[evening.emotionName] || 0) + 1;
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
      emotionName: evening?.emotionName || null,
      moodValence: evening?.moodValence ?? null,
      moodArousal: evening?.moodArousal ?? null,
      isLate: evening?.isLate || false,
    };
  });

  // Heatmap matrix (90 days window for calendar view)
  const heatmapDays: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    heatmapDays.push(d.toISOString().slice(0, 10));
  }

  const heatmapData = heatmapDays.map((dateStr) => {
    const morning = allCheckIns.find((c) => c.date === dateStr && c.type === "morning");
    const evening = allCheckIns.find((c) => c.date === dateStr && c.type === "evening");

    let level = 0;
    let status: "yes" | "partial" | "no" | "empty" = "empty";

    if (evening) {
      status = (evening.status as any) || "no";
      level = evening.status === "yes" ? 3 : evening.status === "partial" ? 2 : 1;
    } else if (morning) {
      level = 1;
    }

    return {
      date: dateStr,
      status,
      level,
      emotionName: evening?.emotionName || null,
      morningDone: Boolean(morning),
      eveningDone: Boolean(evening),
    };
  });

  const completionRate =
    totalDaysWithEvening > 0
      ? Math.round((positiveOutcomes / totalDaysWithEvening) * 100)
      : 0;

  // Streak calculations
  const allUniqueDates = [...new Set(allCheckIns.map((c) => c.date))].sort();
  const totalAnchoredDays = allUniqueDates.length;

  let streakCurrent = 0;
  let streakLongest = 0;
  let tempStreak = 0;

  for (let i = 0; i < allUniqueDates.length; i++) {
    tempStreak++;
    if (tempStreak > streakLongest) streakLongest = tempStreak;
  }
  streakCurrent = rangeCheckIns.filter((c) => c.type === "evening").length;

  const topBlockerTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const topEmotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);

  const pinnedLessons = lessonsLearnedList.slice(-4).reverse();

  return NextResponse.json({
    currentRecap: {
      range: rangeParam,
      weekStartDate,
      weekEndDate,
      completionRate,
      streakCurrent,
      streakLongest: Math.max(streakLongest, streakCurrent, totalAnchoredDays),
      totalAnchoredDays,
      topBlockerTags,
      topEmotions,
      pinnedLessons,
      dailyTrend,
      heatmapData,
      totalDaysWithEvening,
      totalCheckIns: rangeCheckIns.length,
    },
    historyRecaps: existingRecaps,
  });
}
