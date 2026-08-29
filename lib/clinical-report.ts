export interface ClinicalSummaryData {
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
    averageArousal: number; // 1 to 5
    dominantEmotion: string;
    emotionBreakdown: { emotion: string; percentage: number }[];
  };
  barrierDistribution: { tag: string; label: string; count: number; percentage: number }[];
  clinicalObservations: string[];
  pinnedTakeaways: string[];
}

export function generateClinicalSummary(
  user: any,
  commitment: any,
  checkIns: any[],
  aiInsights?: any[]
): ClinicalSummaryData {
  const now = new Date();
  const eveningCheckIns = (checkIns || []).filter((c) => c.type === "evening");
  const totalDays = eveningCheckIns.length || 1;
  const anchoredDays = eveningCheckIns.filter((c) => c.status === "yes").length;
  const percentage = Math.round((anchoredDays / totalDays) * 100);

  // Affective Valence & Arousal
  let sumValence = 0;
  let sumArousal = 0;
  let emotionCounts: Record<string, number> = {};

  eveningCheckIns.forEach((c) => {
    sumValence += c.moodValence ?? 0;
    sumArousal += c.moodArousal ?? 1;
    const em = c.emotionName || "Peaceful";
    emotionCounts[em] = (emotionCounts[em] || 0) + 1;
  });

  const avgValence = Math.round((sumValence / totalDays) * 10) / 10;
  const avgArousal = Math.round((sumArousal / totalDays) * 10) / 10;

  const emotionBreakdown = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      percentage: Math.round((count / totalDays) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const dominantEmotion = emotionBreakdown[0]?.emotion || "Grounded";

  // Barrier Distribution
  const barrierLabels: Record<string, string> = {
    stress: "Stress & Anxiety",
    time: "Time & Schedule Constraint",
    urge: "Cravings & Impulse Surges",
    forgot: "Distraction & Cognitive Overload",
    unmotivated: "Fatigue & Depletion",
    other: "Situational / Environmental",
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

  // Pinned Takeaways
  const pinnedTakeaways = eveningCheckIns
    .filter((c) => c.lessonsLearned && c.lessonsLearned.trim().length > 0)
    .map((c) => c.lessonsLearned)
    .slice(0, 5);

  // Clinical Observations from ACT / CBT principles
  const clinicalObservations: string[] = [];

  if (percentage >= 80) {
    clinicalObservations.push(
      "High behavioral consistency: Patient demonstrates established distress tolerance and steady adherence to values-based anchors."
    );
  } else if (percentage >= 50) {
    clinicalObservations.push(
      "Emerging stability: Habit loops show moderate resilience. Primary dropouts correlate with acute fatigue and schedule shifts."
    );
  } else {
    clinicalObservations.push(
      "Early engagement: Patient is practicing non-punitive re-entry. Focus on lowering cognitive load for micro-commitments."
    );
  }

  if (avgValence >= 2) {
    clinicalObservations.push(
      `Affective climate reflects positive emotional valence (${avgValence}/5), predominantly characterized by feelings of ${dominantEmotion}.`
    );
  } else {
    clinicalObservations.push(
      `Affective climate indicates elevated emotional friction (${avgValence}/5), highlighting the clinical need for somatic grounding and nervous system regulation.`
    );
  }

  return {
    generatedAt: now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    userName:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.name || user?.email || "Patient Client",
    commitmentName: commitment?.name || "Daily Anchor Focus",
    commitmentWhy: commitment?.why || "Living with intentional self-compassion and clear values.",
    dateRange: user?.createdAt
      ? `Since Account Initiation (${new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}) • ${totalDays} Check-Ins`
      : `Past ${totalDays} Recorded Check-Ins`,
    totalDaysEvaluated: totalDays,
    totalAnchoredDays: anchoredDays,
    followThroughPercentage: percentage,
    affectiveProfile: {
      averageValence: avgValence,
      averageArousal: avgArousal,
      dominantEmotion,
      emotionBreakdown: emotionBreakdown.slice(0, 4),
    },
    barrierDistribution: barrierDistribution.slice(0, 4),
    clinicalObservations,
    pinnedTakeaways,
  };
}
