import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCommunityReflections, createCommunityReflection } from "@/lib/db-service";

const SEED_REFLECTIONS = [
  {
    id: "seed-1",
    content: "Day 14. First weekend without a drink. Kept sparkling water close and went for a sunset walk.",
    category: "Sobriety & Recovery",
    emotionName: "Peaceful",
    anchoredDays: 14,
    resonatesCount: 28,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "seed-2",
    content: "Paused to take 4 box breaths during a high-stress team meeting. I chose response over reaction.",
    category: "Mental Health & Calm",
    emotionName: "Grounded",
    anchoredDays: 21,
    resonatesCount: 42,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "seed-3",
    content: "Walked 20 minutes in the cool evening air. Moving my body healed the afternoon brain fog.",
    category: "Physical Vitality",
    emotionName: "Energized",
    anchoredDays: 7,
    resonatesCount: 19,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "seed-4",
    content: "Left my phone in the kitchen at 9 PM and read a physical book. Woke up feeling actually rested.",
    category: "Mindful Living",
    emotionName: "Serene",
    anchoredDays: 30,
    resonatesCount: 65,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "seed-5",
    content: "Resisted the urge to impulse-buy during a lonely moment. True peace isn't found in delivery boxes.",
    category: "Sobriety & Recovery",
    emotionName: "Courageous",
    anchoredDays: 45,
    resonatesCount: 51,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";

    const dbReflections = await getCommunityReflections(category);

    // Merge with seeds if database is fresh
    let combined: any[] = [...(dbReflections || [])];
    if (combined.length === 0) {
      combined = category === "All"
        ? SEED_REFLECTIONS
        : SEED_REFLECTIONS.filter((s) => s.category === category);
    }

    return NextResponse.json({
      reflections: combined,
    });
  } catch (error) {
    console.error("Community feed error:", error);
    return NextResponse.json({ reflections: SEED_REFLECTIONS });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { content, category, emotionName, anchoredDays } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Reflection text is required" }, { status: 400 });
    }

    const created = await createCommunityReflection({
      userId: session?.id,
      content: content.trim(),
      category: category || "Sobriety & Recovery",
      emotionName: emotionName || "Grounded",
      anchoredDays: Number(anchoredDays) || 1,
    });

    return NextResponse.json({
      success: true,
      reflection: created,
    });
  } catch (error) {
    console.error("Post community reflection error:", error);
    return NextResponse.json({ error: "Failed to share reflection" }, { status: 500 });
  }
}
