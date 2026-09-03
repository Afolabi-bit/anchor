// Anchor Progress Summary Service
// Non-diagnostic, transparent behavioral summary generated from self-reported user check-ins.

export const FIXED_PROGRESS_DISCLAIMER =
  "This is a self-reported summary from the Anchor app, not a clinical assessment.";

export interface ProgressSummaryData {
  generatedAt: string;
  userName: string;
  commitmentName: string;
  commitmentWhy: string;
  dateRange: string;
  totalDaysEvaluated: number;
  totalAnchoredDays: number;
  followThroughPercentage: number;
  affectiveProfile: {
    averageValence: number; // -5 to +5
    averageEnergy: number; // 1 to 5
    dominantEmotion: string;
    emotionBreakdown: { emotion: string; percentage: number }[];
  };
  barrierDistribution: { tag: string; label: string; count: number; percentage: number }[];
  observations: string[];
  reflections: string[]; // Excluded by default; only populated if user explicitly opts in
  disclaimer: string;
}

export interface GenerateSummaryOptions {
  includeJournalNotes?: boolean;
}

export function generateProgressSummary(
  user: any,
  commitment: any,
  checkIns: any[],
  journalEntries: any[] = [],
  options: GenerateSummaryOptions = {}
): ProgressSummaryData {
  const eveningCheckIns = (checkIns || []).filter((c) => c.type === "evening");
  const totalDays = eveningCheckIns.length || 1;
  const anchoredDays = eveningCheckIns.filter((c) => c.status === "yes").length;
  const percentage = Math.round((anchoredDays / totalDays) * 100);

  // Affective Valence & Energy
  let sumValence = 0;
  let sumEnergy = 0;
  const emotionCounts: Record<string, number> = {};

  eveningCheckIns.forEach((c) => {
    sumValence += c.moodValence ?? 0;
    sumEnergy += c.moodEnergy ?? c.moodArousal ?? 3;
    const em = c.emotionName || "Grounded";
    emotionCounts[em] = (emotionCounts[em] || 0) + 1;
  });

  const avgValence = Math.round((sumValence / totalDays) * 10) / 10;
  const avgEnergy = Math.round((sumEnergy / totalDays) * 10) / 10;

  const emotionBreakdown = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      percentage: Math.round((count / totalDays) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const dominantEmotion = emotionBreakdown[0]?.emotion || "Grounded";

  // Barrier / Blocker Distribution
  const barrierLabels: Record<string, string> = {
    stress: "Stress & Tension",
    time: "Time & Schedule Strain",
    urge: "Cravings & Impulse Urges",
    forgot: "Distraction & Memory",
    unmotivated: "Fatigue & Depletion",
    other: "Situational / Environment",
  };

  const barrierCounts: Record<string, number> = {};
  let totalBarriers = 0;

  eveningCheckIns.forEach((c) => {
    if (c.blockerTags && Array.isArray(c.blockerTags)) {
      c.blockerTags.forEach((tag: string) => {
        barrierCounts[tag] = (barrierCounts[tag] || 0) + 1;
        totalBarriers++;
      });
    }
  });

  const barrierDistribution = Object.entries(barrierCounts)
    .map(([tag, count]) => ({
      tag,
      label: barrierLabels[tag] || tag,
      count,
      percentage: totalBarriers > 0 ? Math.round((count / totalBarriers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Non-diagnostic behavioral observations
  const observations: string[] = [];

  if (percentage >= 80) {
    observations.push(
      "High consistency: You have maintained steady adherence to your daily anchor across most checked days."
    );
  } else if (percentage >= 50) {
    observations.push(
      "Moderate consistency: You have actively logged reflections even when follow-through faced challenges."
    );
  } else {
    observations.push(
      "Gentle pause: Progress is nonlinear. Showing up to check in remains a meaningful step forward."
    );
  }

  if (dominantEmotion) {
    observations.push(
      `Most frequently logged emotional state was "${dominantEmotion}".`
    );
  }

  if (barrierDistribution.length > 0) {
    const topBarrier = barrierDistribution[0];
    observations.push(
      `Most frequently identified obstacle was "${topBarrier.label}" (${topBarrier.count} times).`
    );
  }

  // Reflections: EXCLUDED BY DEFAULT. Only included if explicitly opted in.
  const reflections: string[] = [];
  if (options.includeJournalNotes) {
    // Collect non-empty reflections from check-ins and journal entries
    eveningCheckIns
      .filter((c) => c.reflection && c.reflection.trim().length > 0)
      .slice(0, 5)
      .forEach((c) => reflections.push(c.reflection.trim()));

    (journalEntries || [])
      .filter((j) => j.content && j.content.trim().length > 0)
      .slice(0, 5)
      .forEach((j) => reflections.push(j.content.trim()));
  }

  // Date range label
  const sortedDates = eveningCheckIns
    .map((c) => c.date)
    .filter(Boolean)
    .sort();
  const dateRange =
    sortedDates.length > 0
      ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
      : "Past 30 days";

  const userName =
    user?.firstName || user?.name || user?.email?.split("@")[0] || "Anchor Member";

  return {
    generatedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    userName,
    commitmentName: commitment?.name || "Daily Anchor Habit",
    commitmentWhy: commitment?.why || "Showing up one day at a time.",
    dateRange,
    totalDaysEvaluated: eveningCheckIns.length,
    totalAnchoredDays: anchoredDays,
    followThroughPercentage: percentage,
    affectiveProfile: {
      averageValence: avgValence,
      averageEnergy: avgEnergy,
      dominantEmotion,
      emotionBreakdown,
    },
    barrierDistribution,
    observations,
    reflections,
    disclaimer: FIXED_PROGRESS_DISCLAIMER,
  };
}
