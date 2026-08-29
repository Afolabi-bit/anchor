import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckInsByUserId, getWeeklyRecapsByUserId, getUserById } from "@/lib/db-service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.id);
  const { searchParams } = new URL(request.url);
  const commitmentId = searchParams.get("commitmentId");
  const rangeParam = searchParams.get("range") || "7"; // "7" | "30" | "90" | "all"

  // Baseline account creation date & elapsed journey days
  const accountCreationDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const accountStartDate = accountCreationDate.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const msPerDay = 1000 * 60 * 60 * 24;
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const creationMidnight = new Date(
    accountCreationDate.getFullYear(),
    accountCreationDate.getMonth(),
    accountCreationDate.getDate()
  ).getTime();
  const accountAgeInDays = Math.max(
    1,
    Math.round((todayMidnight - creationMidnight) / msPerDay) + 1
  );

  const rawCheckIns = await getCheckInsByUserId(session.id);
  // Filter check-ins so we only evaluate records on or after the account creation date
  const validCheckIns = rawCheckIns.filter((c) => c.date >= accountStartDate);
  const allCheckIns = commitmentId
    ? validCheckIns.filter((c) => !c.commitmentId || c.commitmentId === commitmentId)
    : validCheckIns;
  const existingRecaps = await getWeeklyRecapsByUserId(session.id);

  const requestedLimit =
    rangeParam === "30"
      ? 30
      : rangeParam === "90"
      ? 90
      : rangeParam === "all"
      ? accountAgeInDays
      : 7;

  // Window cannot exceed the actual age of the account
  const effectiveDays = Math.min(requestedLimit, accountAgeInDays);

  // Generate rolling date array strictly on or after account creation date
  const rangeDays: string[] = [];
  for (let i = effectiveDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    if (dStr >= accountStartDate) {
      rangeDays.push(dStr);
    }
  }

  if (rangeDays.length === 0) {
    rangeDays.push(todayStr);
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

  // Heatmap matrix (90 days window, tagged with account start boundary)
  const heatmapDays: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    heatmapDays.push(d.toISOString().slice(0, 10));
  }

  const heatmapData = heatmapDays.map((dateStr) => {
    const isPreAccount = dateStr < accountStartDate;
    if (isPreAccount) {
      return {
        date: dateStr,
        status: "empty" as const,
        level: 0,
        emotionName: null,
        morningDone: false,
        eveningDone: false,
        isPreAccount: true,
      };
    }

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
      isPreAccount: false,
    };
  });

  const completionRate =
    totalDaysWithEvening > 0
      ? Math.round((positiveOutcomes / totalDaysWithEvening) * 100)
      : 0;

  // Streak calculations strictly from account start
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

  const windowLabel =
    accountAgeInDays <= effectiveDays
      ? accountAgeInDays === 1
        ? "Day 1 of journey"
        : `${accountAgeInDays}d on path`
      : `${effectiveDays}d window`;

  return NextResponse.json({
    recap: {
      range: rangeParam,
      weekStartDate,
      weekEndDate,
      accountStartDate,
      accountAgeInDays,
      totalDays: effectiveDays,
      windowLabel,
      completionRate,
      streakCurrent,
      streakLongest: Math.max(streakLongest, streakCurrent, totalAnchoredDays),
      totalAnchoredDays,
      daysAnchored: totalAnchoredDays,
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
