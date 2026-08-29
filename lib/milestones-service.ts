export interface Milestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thresholdDays: number;
  iconName: string;
  accentColor: string;
  unlocked: boolean;
  progressPercent: number;
}

export const MILESTONE_DEFINITIONS = [
  {
    id: "step-1",
    title: "The First Step",
    subtitle: "1 Day Anchored",
    description: "You stepped into the sanctuary and chose self-honesty over perfection.",
    thresholdDays: 1,
    iconName: "Compass",
    accentColor: "#C86D51",
  },
  {
    id: "step-7",
    title: "7 Days of Steadiness",
    subtitle: "One Full Week",
    description: "One complete cycle around the sun. Seven quiet moments of showing up.",
    thresholdDays: 7,
    iconName: "Sun",
    accentColor: "#B88452",
  },
  {
    id: "step-14",
    title: "Fortnight Anchor",
    subtitle: "14 Days Anchored",
    description: "Two continuous weeks of grounding, building quiet muscle memory.",
    thresholdDays: 14,
    iconName: "Anchor",
    accentColor: "#658B70",
  },
  {
    id: "step-30",
    title: "One Month Sanctuary",
    subtitle: "30 Days of Reflection",
    description: "A full month of non-judgmental presence and deep self-compassion.",
    thresholdDays: 30,
    iconName: "Sparkles",
    accentColor: "#D4A373",
  },
  {
    id: "step-60",
    title: "60 Days of Resilience",
    subtitle: "Two Months Deep",
    description: "Navigating storms with steady breath, trusting your daily anchor.",
    thresholdDays: 60,
    iconName: "Shield",
    accentColor: "#786F66",
  },
  {
    id: "step-90",
    title: "Quarterly Horizon",
    subtitle: "90 Days of Growth",
    description: "Neurological rewiring in action. Your anchor is now a natural reflex.",
    thresholdDays: 90,
    iconName: "Award",
    accentColor: "#658B70",
  },
  {
    id: "step-180",
    title: "Half-Year Equilibrium",
    subtitle: "180 Days Anchored",
    description: "Six full months of honoring your intentions and recovering with grace.",
    thresholdDays: 180,
    iconName: "Flame",
    accentColor: "#C86D51",
  },
  {
    id: "step-365",
    title: "A Full Year of Self-Loyalty",
    subtitle: "365 Days Anchored",
    description: "365 moments of choosing yourself, through every season and tide.",
    thresholdDays: 365,
    iconName: "Crown",
    accentColor: "#B88452",
  },
];

export function calculateMilestones(totalAnchoredDays: number): Milestone[] {
  return MILESTONE_DEFINITIONS.map((m) => {
    const unlocked = totalAnchoredDays >= m.thresholdDays;
    const progressPercent = Math.min(
      100,
      Math.round((totalAnchoredDays / m.thresholdDays) * 100)
    );

    return {
      ...m,
      unlocked,
      progressPercent,
    };
  });
}
