import { GoogleGenerativeAI } from "@google/generative-ai";
import { schema } from "@/db";

export interface AIInsight {
  id: string;
  category: "breakthrough" | "recommendation" | "rhythm";
  title: string;
  observation: string;
  evidence: string;
  tag: string;
  accentColor: string;
}

export interface InsightsSynthesis {
  headline: string;
  analyzedDaysCount: number;
  overallHealthScore: number;
  isAiGenerated?: boolean;
  insights: AIInsight[];
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function generateAIPatternInsights(
  checkIns: schema.CheckIn[],
  commitmentName: string = "Daily Anchor",
  commitmentWhy?: string | null
): Promise<InsightsSynthesis> {
  // If no check-ins exist, return welcome state
  if (!checkIns || checkIns.length === 0) {
    return synthesizeDeterministicInsights(checkIns, commitmentName);
  }

  // Attempt live Gemini synthesis if API key is present
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const checkInSummary = checkIns.map((c) => ({
        date: c.date,
        type: c.type,
        status: c.status,
        plannedActions: c.plannedActions,
        intentionNote: c.intentionNote,
        reflection: c.reflection,
        blockerTags: c.blockerTags,
        emotionName: c.emotionName,
        moodValence: c.moodValence,
        moodArousal: c.moodArousal,
        lessonsLearned: c.lessonsLearned,
      }));

      const prompt = `
You are an expert clinical psychologist and supportive behavioral mentor specializing in Acceptance and Commitment Therapy (ACT) and gentle habit recovery.
You are analyzing a user's recent daily reflections for their anchor goal: "${commitmentName}"${commitmentWhy ? ` (Why: "${commitmentWhy}")` : ""}.

Here are their recent reflection logs:
${JSON.stringify(checkInSummary, null, 2)}

Synthesize these reflections into 3 deeply supportive, non-judgmental, psychologically grounded pattern insights.

Respond ONLY with valid JSON matching this exact structure:
{
  "headline": "A short, warm 3-6 word summary headline for their journey",
  "analyzedDaysCount": ${checkIns.length},
  "overallHealthScore": 85,
  "insights": [
    {
      "id": "breakthrough-1",
      "category": "breakthrough",
      "title": "Short title (e.g. Morning Intention Anchor)",
      "observation": "A 1-2 sentence empathetic behavioral observation explaining what helps them succeed.",
      "evidence": "Evidence from their data (e.g. 'Observed across 5 morning rituals')",
      "tag": "Habit Anchor",
      "accentColor": "#658B70"
    },
    {
      "id": "recommendation-1",
      "category": "recommendation",
      "title": "Short title (e.g. Navigating Fatigue with Self-Compassion)",
      "observation": "A 1-2 sentence gentle, practical recommendation for when blockers or challenging emotions arise.",
      "evidence": "Evidence from blockers/emotions (e.g. 'Noted when stress was logged')",
      "tag": "Emotional Grounding",
      "accentColor": "#C86D51"
    },
    {
      "id": "rhythm-1",
      "category": "rhythm",
      "title": "Short title (e.g. Mid-Week Circadian Momentum)",
      "observation": "A 1-2 sentence reflection on their weekly rhythm, time cadence, or consistency pattern.",
      "evidence": "Timing / cadence pattern",
      "tag": "Circadian Rhythm",
      "accentColor": "#B88452"
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        return {
          ...parsed,
          isAiGenerated: true,
          analyzedDaysCount: checkIns.length,
        };
      }
    } catch (error) {
      console.error("Gemini AI synthesis error, using deterministic fallback:", error);
    }
  }

  // Graceful deterministic fallback if API is unavailable or rate-limited
  return synthesizeDeterministicInsights(checkIns, commitmentName);
}

export function synthesizeDeterministicInsights(
  checkIns: schema.CheckIn[],
  commitmentName: string = "Daily Anchor"
): InsightsSynthesis {
  if (!checkIns || checkIns.length === 0) {
    return {
      headline: "Welcome to your reflection journey",
      analyzedDaysCount: 0,
      overallHealthScore: 100,
      isAiGenerated: false,
      insights: [
        {
          id: "welcome-1",
          category: "breakthrough",
          title: "Starting with a quiet pause",
          observation: "Every steady habit begins with a single honest check-in.",
          evidence: "First day in sanctuary",
          tag: "Beginning",
          accentColor: "#658B70",
        },
      ],
    };
  }

  const dateMap: Record<string, { morning?: schema.CheckIn; evening?: schema.CheckIn }> = {};
  checkIns.forEach((c) => {
    if (!dateMap[c.date]) dateMap[c.date] = {};
    if (c.type === "morning") dateMap[c.date].morning = c;
    if (c.type === "evening") dateMap[c.date].evening = c;
  });

  const dates = Object.keys(dateMap);
  const totalDays = dates.length;

  let daysWithMorning = 0;
  let morningFollowThrough = 0;
  let daysWithoutMorning = 0;
  let noMorningFollowThrough = 0;

  const blockerCounts: Record<string, number> = {};
  const dayOfWeekCounts: Record<number, { total: number; followed: number }> = {};

  dates.forEach((dateStr) => {
    const { morning, evening } = dateMap[dateStr];
    const d = new Date(dateStr + "T12:00:00Z");
    const dayOfWeek = d.getDay();

    if (!dayOfWeekCounts[dayOfWeek]) {
      dayOfWeekCounts[dayOfWeek] = { total: 0, followed: 0 };
    }
    dayOfWeekCounts[dayOfWeek].total++;

    if (morning) {
      daysWithMorning++;
      if (evening?.status === "yes" || evening?.status === "partial") {
        morningFollowThrough++;
      }
    } else {
      daysWithoutMorning++;
      if (evening?.status === "yes" || evening?.status === "partial") {
        noMorningFollowThrough++;
      }
    }

    if (evening) {
      if (evening.status === "yes" || evening.status === "partial") {
        dayOfWeekCounts[dayOfWeek].followed++;
      }
      if (evening.blockerTags && Array.isArray(evening.blockerTags)) {
        evening.blockerTags.forEach((tag) => {
          blockerCounts[tag] = (blockerCounts[tag] || 0) + 1;
        });
      }
    }
  });

  const morningRate =
    daysWithMorning > 0 ? Math.round((morningFollowThrough / daysWithMorning) * 100) : 75;
  const noMorningRate =
    daysWithoutMorning > 0 ? Math.round((noMorningFollowThrough / daysWithoutMorning) * 100) : 45;

  const topBlockers = Object.entries(blockerCounts).sort((a, b) => b[1] - a[1]);
  const dominantBlocker = topBlockers[0];

  const insights: AIInsight[] = [];

  if (daysWithMorning > 0) {
    insights.push({
      id: "morning-impact",
      category: "breakthrough",
      title: "Morning Intention Multiplier",
      observation: `Days where you set a morning intention had an estimated ${morningRate}% follow-through rate vs ${noMorningRate}% without one.`,
      evidence: `Based on ${daysWithMorning} morning intention rituals`,
      tag: "Habit Anchor",
      accentColor: "#658B70",
    });
  } else {
    insights.push({
      id: "morning-recommend",
      category: "breakthrough",
      title: "The Power of Morning Framing",
      observation: `Setting a quiet 1-minute morning intention primes your nervous system and significantly protects evening follow-through.`,
      evidence: "Clinical behavioural observation",
      tag: "Mindset",
      accentColor: "#B88452",
    });
  }

  if (dominantBlocker) {
    const blockerNames: Record<string, string> = {
      stress: "Stress & Anxiety",
      time: "Time & Schedule Pressures",
      urge: "Urges & Impulses",
      forgot: "Distraction / Forgetting",
      unmotivated: "Fatigue & Low Energy",
      other: "Unexpected Circumstances",
    };
    const friendlyName = blockerNames[dominantBlocker[0]] || dominantBlocker[0];
    insights.push({
      id: "blocker-pattern",
      category: "recommendation",
      title: `Navigating "${friendlyName}"`,
      observation: `When ${friendlyName.toLowerCase()} arises, pausing with the 4-4-4-4 Grounding Drawer reduces urgency before decision moments.`,
      evidence: `Noted ${dominantBlocker[1]} times in recent reflections`,
      tag: "Emotional Grounding",
      accentColor: "#C86D51",
    });
  } else {
    insights.push({
      id: "steady-rhythm",
      category: "recommendation",
      title: "Steady Compass Grounding",
      observation: `You are sustaining clear self-honesty with ${commitmentName}. Protecting sleep and rest keeps this momentum effortless.`,
      evidence: `${totalDays} reflections logged`,
      tag: "Resilience",
      accentColor: "#658B70",
    });
  }

  const dayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  let strongestDayIdx = 1;
  let highestRatio = -1;
  Object.entries(dayOfWeekCounts).forEach(([day, stat]) => {
    const ratio = stat.total > 0 ? stat.followed / stat.total : 0;
    if (ratio > highestRatio && stat.total >= 1) {
      highestRatio = ratio;
      strongestDayIdx = Number(day);
    }
  });

  insights.push({
    id: "rhythm-pattern",
    category: "rhythm",
    title: "Weekly Circadian Momentum",
    observation: `${dayNames[strongestDayIdx]} have shown your most peaceful alignment. Scheduling restful transition buffers on other days supports steady ease.`,
    evidence: "Weekly cadence pattern",
    tag: "Circadian Rhythm",
    accentColor: "#B88452",
  });

  return {
    headline: `Patterns & Insights for ${commitmentName}`,
    analyzedDaysCount: totalDays,
    overallHealthScore: Math.min(100, Math.max(60, morningRate)),
    isAiGenerated: false,
    insights,
  };
}
