export interface AnchorTemplate {
  id: string;
  name: string;
  category: "Sobriety & Recovery" | "Mental Health & Calm" | "Physical Vitality" | "Mindful Living";
  why: string;
  suggestedActions: string[];
  suggestedColorIndex: number; // 0..4
  icon: string;
  description: string;
}

export const ANCHOR_TEMPLATES: AnchorTemplate[] = [
  // Sobriety & Recovery
  {
    id: "sobriety-alcohol",
    name: "Alcohol Freedom & Clarity",
    category: "Sobriety & Recovery",
    why: "I deserve to wake up clear-headed, present for the people I love, and in alignment with my values.",
    suggestedActions: [
      "Keep non-alcoholic sparkling water stocked",
      "Step outside for fresh air if craving strikes",
      "Text my support friend before 8 PM",
    ],
    suggestedColorIndex: 0, // Terracotta
    icon: "Anchor",
    description: "Protect your sobriety one gentle evening at a time with compassionate reflection.",
  },
  {
    id: "sobriety-smoke",
    name: "Clean Lungs & Fresh Air",
    category: "Sobriety & Recovery",
    why: "My breath is my life force. I choose stamina and longevity over temporary smoke relief.",
    suggestedActions: [
      "Take 10 deep belly breaths when urged",
      "Chew mint gum after meals",
      "Drink a cold glass of lemon water",
    ],
    suggestedColorIndex: 2, // Sage
    icon: "Sun",
    description: "Break the nicotine habit loop through vagus nerve breathing and hydration.",
  },
  {
    id: "sobriety-gambling",
    name: "Financial Clarity & Peace",
    category: "Sobriety & Recovery",
    why: "My worth is not tied to chance. I protect my family's peace and my hard-earned security.",
    suggestedActions: [
      "Keep banking notifications enabled",
      "Pause for 24 hours before any speculative choice",
      "Engage in physical movement during urge windows",
    ],
    suggestedColorIndex: 1, // Ochre
    icon: "Shield",
    description: "Release compulsive betting and rebuild steady financial security.",
  },
  {
    id: "sobriety-digital",
    name: "Digital Detox & Focus",
    category: "Sobriety & Recovery",
    why: "My attention is my most precious finite resource. I choose presence over infinite scrolling.",
    suggestedActions: [
      "No phone in the bedroom after 9 PM",
      "Read physical book for 20 minutes",
      "Turn screen to grayscale in the evening",
    ],
    suggestedColorIndex: 3, // Stone
    icon: "Compass",
    description: "Reclaim hours of deep life by placing healthy boundaries on social media algorithms.",
  },

  // Mental Health & Calm
  {
    id: "mental-winddown",
    name: "Mindful Evening Wind-Down",
    category: "Mental Health & Calm",
    why: "Transitioning softly into the night honors my nervous system and heals fatigue.",
    suggestedActions: [
      "Dim overhead lights by 8:30 PM",
      "Sip herbal chamomile tea",
      "Write down tomorrow's 3 tasks to clear my head",
    ],
    suggestedColorIndex: 1, // Ochre
    icon: "Moon",
    description: "A gentle evening check-in to release workday stress and prepare for restorative sleep.",
  },
  {
    id: "mental-breathing",
    name: "Daily 4-4-4-4 Box Breathing",
    category: "Mental Health & Calm",
    why: "Calming my nervous system allows me to respond with wisdom rather than react in stress.",
    suggestedActions: [
      "Open the Grounding Drawer at noon",
      "Complete 4 full box-breath cycles",
      "Notice physical tension release in shoulders",
    ],
    suggestedColorIndex: 2, // Sage
    icon: "Wind",
    description: "Use somatic vagus nerve regulation to prevent midday anxiety spikes.",
  },
  {
    id: "mental-gratitude",
    name: "Three Daily Glimmers",
    category: "Mental Health & Calm",
    why: "Training my brain to notice small sparks of goodness rewires my negativity bias.",
    suggestedActions: [
      "Notice one pleasant sensory detail in the morning",
      "Thank someone sincerely",
      "Record a quiet glimmer in my evening check-in",
    ],
    suggestedColorIndex: 4, // Sand
    icon: "Sun",
    description: "Anchor daily perspective in small, undeniable moments of warmth and gratitude.",
  },

  // Physical Vitality
  {
    id: "vitality-walk",
    name: "Daily 20m Nature Walk",
    category: "Physical Vitality",
    why: "Moving my body through open air grounds my thoughts and regulates my circadian clock.",
    suggestedActions: [
      "Put on walking shoes right after lunch",
      "Leave phone on silent during the stroll",
      "Notice the colors of the trees and sky",
    ],
    suggestedColorIndex: 2, // Sage
    icon: "Compass",
    description: "Gentle daily outdoor movement for physical longevity and mental clarity.",
  },
  {
    id: "vitality-sleep",
    name: "8-Hour Protected Sleep",
    category: "Physical Vitality",
    why: "Sleep is the foundation of emotional resilience, memory consolidation, and physical recovery.",
    suggestedActions: [
      "In bed with lights off by 10:30 PM",
      "Keep bedroom temperature cool and quiet",
      "No caffeine after 1:00 PM",
    ],
    suggestedColorIndex: 0, // Terracotta
    icon: "Moon",
    description: "Prioritize consistent, uncompromised sleep to replenish your emotional bandwidth.",
  },
  {
    id: "vitality-hydration",
    name: "Daily Hydration Habit",
    category: "Physical Vitality",
    why: "Hydration energizes my brain cells and supports clean cellular detoxification.",
    suggestedActions: [
      "Drink 16oz of water immediately upon waking",
      "Carry reusable water bottle throughout the day",
      "Refill bottle before afternoon slump",
    ],
    suggestedColorIndex: 3, // Stone
    icon: "Sun",
    description: "A steady hydration habit that prevents headaches and mental sluggishness.",
  },

  // Mindful Living
  {
    id: "living-spending",
    name: "No Impulsive Spending",
    category: "Mindful Living",
    why: "True contentment is found in peace, not in delivery boxes.",
    suggestedActions: [
      "Wait 72 hours before purchasing any non-essential item",
      "Unsubscribe from promotional shopping emails",
      "Check in on financial values before checkout",
    ],
    suggestedColorIndex: 1, // Ochre
    icon: "Shield",
    description: "Overcome emotional retail therapy by creating space between urge and purchase.",
  },
  {
    id: "living-creation",
    name: "Daily 30m Creative Focus",
    category: "Mindful Living",
    why: "Creating gives me an outlet to express, play, and build what matters to me.",
    suggestedActions: [
      "Close all tabs except my workspace",
      "Put phone in another room",
      "Focus for 30 uninterrupted minutes",
    ],
    suggestedColorIndex: 0, // Terracotta
    icon: "Flame",
    description: "Protect uninterrupted creative flow for writing, art, music, or building.",
  },
];
