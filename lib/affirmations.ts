export interface Affirmation {
  id: string;
  quote: string;
  author: string;
  category: "Mindfulness" | "Self-Compassion" | "Resilience" | "Recovery" | "Patience";
  themeColor: string;
}

export const DAILY_AFFIRMATIONS: Affirmation[] = [
  {
    id: "aff-1",
    quote: "You do not have to be good. You only have to let the soft animal of your body love what it loves.",
    author: "Mary Oliver",
    category: "Self-Compassion",
    themeColor: "#658B70",
  },
  {
    id: "aff-2",
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Viktor E. Frankl",
    category: "Resilience",
    themeColor: "#C86D51",
  },
  {
    id: "aff-3",
    quote: "Smile, breathe, and go slowly. There is no need to hurry anywhere.",
    author: "Thich Nhat Hanh",
    category: "Mindfulness",
    themeColor: "#B88452",
  },
  {
    id: "aff-4",
    quote: "Talk to yourself like you would to someone you love.",
    author: "Brené Brown",
    category: "Self-Compassion",
    themeColor: "#658B70",
  },
  {
    id: "aff-5",
    quote: "Nothing ever goes away until it has taught us what we need to know.",
    author: "Pema Chödrön",
    category: "Patience",
    themeColor: "#786F66",
  },
  {
    id: "aff-6",
    quote: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman",
    category: "Recovery",
    themeColor: "#C86D51",
  },
  {
    id: "aff-7",
    quote: "The curious paradox is that when I accept myself just as I am, then I can change.",
    author: "Carl Rogers",
    category: "Self-Compassion",
    themeColor: "#658B70",
  },
  {
    id: "aff-8",
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
    category: "Resilience",
    themeColor: "#B88452",
  },
  {
    id: "aff-9",
    quote: "Feeling the feeling is the only way to heal the feeling.",
    author: "Tara Brach",
    category: "Mindfulness",
    themeColor: "#658B70",
  },
  {
    id: "aff-10",
    quote: "Never let a stumble in the road be the end of your journey.",
    author: "Unknown",
    category: "Recovery",
    themeColor: "#C86D51",
  },
  {
    id: "aff-11",
    quote: "Peace comes from within. Do not seek it without.",
    author: "Siddhartha Gautama",
    category: "Mindfulness",
    themeColor: "#B88452",
  },
  {
    id: "aff-12",
    quote: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
    category: "Patience",
    themeColor: "#786F66",
  },
];

export function getTodayAffirmation(dateStr?: string): Affirmation {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = Math.abs(dayOfYear) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}
