// Transparent, Explainable Pattern Surfacing Service
// Computes direct statistical correlations from the user's self-reported check-ins.
// No external LLM or opaque AI calls are used.

import { schema } from "@/db";

export const MIN_PATTERN_SAMPLE_SIZE = 3; // Minimum occurrences required before surfacing a pattern

export interface LoggedPattern {
  id: string;
  category: "blocker" | "rhythm" | "consistency";
  title: string;
  observation: string;
  evidence: string;
  tag: string;
  accentColor: string;
  sampleSize: number;
}

export interface InsightsSynthesis {
  headline: string;
  analyzedDaysCount: number;
  overallHealthScore: number;
  insights: LoggedPattern[];
}

const BLOCKER_DISPLAY_NAMES: Record<string, string> = {
  stress: "Stress",
  time: "Time constraints",
  urge: "Cravings / Urges",
  forgot: "Distraction",
  unmotivated: "Fatigue / Low Motivation",
  other: "Situational friction",
};

/**
 * Computes direct, explainable statistical correlations on the user's logged check-ins.
 * Identifies blocker tag frequencies by day of week and check-in time (morning vs evening).
 */
export function computeBlockerCorrelations(checkIns: schema.CheckIn[]): LoggedPattern[] {
  if (!checkIns || checkIns.length === 0) return [];

  const patterns: LoggedPattern[] = [];

  // Group check-ins by day-of-week and time-of-day
  // Key format: `${tag}:${dayOfWeek}:${type}`
  const tagWindowCounts: Record<string, { count: number; tag: string; day: string; type: string }> = {};
  const tagOverallCounts: Record<string, number> = {};

  const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  checkIns.forEach((c) => {
    if (!c.date) return;
    const dateObj = new Date(c.date + "T12:00:00Z"); // Neutral UTC midday to avoid timezone shifts
    const dayName = DAYS_OF_WEEK[dateObj.getUTCDay()];
    const timeType = c.type === "morning" ? "morning" : "evening";

    if (Array.isArray(c.blockerTags)) {
      c.blockerTags.forEach((tag) => {
        if (!tag) return;
        const normalizedTag = tag.toLowerCase().trim();
        tagOverallCounts[normalizedTag] = (tagOverallCounts[normalizedTag] || 0) + 1;

        const windowKey = `${normalizedTag}:${dayName}:${timeType}`;
        if (!tagWindowCounts[windowKey]) {
          tagWindowCounts[windowKey] = {
            count: 0,
            tag: normalizedTag,
            day: dayName,
            type: timeType,
          };
        }
        tagWindowCounts[windowKey].count++;
      });
    }
  });

  // 1. Surface day/time specific blocker patterns that meet the threshold (>= 3)
  Object.entries(tagWindowCounts).forEach(([key, data]) => {
    if (data.count >= MIN_PATTERN_SAMPLE_SIZE) {
      const displayTag = BLOCKER_DISPLAY_NAMES[data.tag] || data.tag;
      patterns.push({
        id: `pattern-${data.tag}-${data.day.toLowerCase()}-${data.type}`,
        category: "blocker",
        title: `${data.day} ${data.type === "morning" ? "Morning" : "Evening"} ${displayTag}`,
        observation: `You've logged "${displayTag.toLowerCase()}" on ${data.count} recent ${data.day} ${data.type} check-ins. Want to set an earlier grounding reminder for that window?`,
        evidence: `Logged ${data.count} times during ${data.day} ${data.type}s`,
        tag: displayTag,
        accentColor: "#C86D51",
        sampleSize: data.count,
      });
    }
  });

  // 2. Surface general obstacle recurrence if a tag has >= 3 occurrences overall but not clustered on a single day
  if (patterns.length === 0) {
    Object.entries(tagOverallCounts).forEach(([tag, count]) => {
      if (count >= MIN_PATTERN_SAMPLE_SIZE) {
        const displayTag = BLOCKER_DISPLAY_NAMES[tag] || tag;
        patterns.push({
          id: `pattern-${tag}-overall`,
          category: "blocker",
          title: `Recurring Barrier: ${displayTag}`,
          observation: `"${displayTag}" was noted as a barrier ${count} times in your recent reflections. Consider dedicating your next morning intention to supporting yourself through it.`,
          evidence: `Logged ${count} times across evaluated check-ins`,
          tag: displayTag,
          accentColor: "#B88452",
          sampleSize: count,
        });
      }
    });
  }

  // 3. Positive consistency rhythm pattern
  const eveningCheckIns = checkIns.filter((c) => c.type === "evening");
  const followThroughCount = eveningCheckIns.filter((c) => c.status === "yes").length;
  if (followThroughCount >= MIN_PATTERN_SAMPLE_SIZE) {
    const rate = Math.round((followThroughCount / eveningCheckIns.length) * 100);
    patterns.push({
      id: `pattern-consistency-momentum`,
      category: "consistency",
      title: "Follow-Through Momentum",
      observation: `You have successfully completed ${followThroughCount} evening anchor commitments (${rate}% follow-through). Consistent presence creates the foundation for steady recovery.`,
      evidence: `${followThroughCount} completed evening check-ins`,
      tag: "Anchored Habit",
      accentColor: "#658B70",
      sampleSize: followThroughCount,
    });
  }

  return patterns;
}

/**
 * Main synthesis function called by route handlers.
 * Computes transparent, non-diagnostic pattern reflections.
 */
export async function generateAIPatternInsights(
  checkIns: schema.CheckIn[],
  commitmentName: string = "Daily Anchor",
  commitmentWhy?: string | null
): Promise<InsightsSynthesis> {
  const analyzedDates = [...new Set(checkIns.map((c) => c.date))];
  const daysCount = analyzedDates.length || 1;

  if (!checkIns || checkIns.length === 0) {
    return {
      headline: "Welcome to your reflection space",
      analyzedDaysCount: 0,
      overallHealthScore: 100,
      insights: [
        {
          id: "welcome-1",
          category: "rhythm",
          title: "Your Reflection Space",
          observation: "As you complete daily morning and evening check-ins, Anchor will gently observe recurring rhythms and obstacles you log.",
          evidence: "Start by completing your first check-in",
          tag: "Daily Rhythm",
          accentColor: "#658B70",
          sampleSize: 0,
        },
      ],
    };
  }

  const eveningCheckIns = checkIns.filter((c) => c.type === "evening");
  const followedThrough = eveningCheckIns.filter((c) => c.status === "yes").length;
  const rate = eveningCheckIns.length > 0 ? Math.round((followedThrough / eveningCheckIns.length) * 100) : 100;

  const insights = computeBlockerCorrelations(checkIns);

  let headline = "Steady daily rhythm";
  if (rate >= 80) headline = "Strong, grounded follow-through";
  else if (rate >= 50) headline = "Honest, mindful engagement";
  else headline = "Gentle daily presence";

  return {
    headline,
    analyzedDaysCount: daysCount,
    overallHealthScore: rate,
    insights,
  };
}

// Backwards compatibility alias
export type AIInsight = LoggedPattern;
