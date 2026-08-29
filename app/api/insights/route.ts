import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckInsByUserId, getActiveCommitmentsByUserId, getUserById } from "@/lib/db-service";
import { generateAIPatternInsights } from "@/lib/insights-service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commitmentId = searchParams.get("commitmentId");

    const user = await getUserById(session.id);
    const accountStartDate = user?.createdAt
      ? new Date(user.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const allCheckIns = await getCheckInsByUserId(session.id);
    const validCheckIns = allCheckIns.filter((c) => c.date >= accountStartDate);
    const commitments = await getActiveCommitmentsByUserId(session.id);
    const activeCommitment = commitmentId
      ? commitments.find((c) => c.id === commitmentId) || commitments[0]
      : commitments[0];

    const targetCheckIns = commitmentId
      ? validCheckIns.filter((c) => !c.commitmentId || c.commitmentId === commitmentId)
      : validCheckIns;

    const synthesis = await generateAIPatternInsights(
      targetCheckIns,
      activeCommitment?.name || "Daily Anchor",
      activeCommitment?.why
    );

    return NextResponse.json(synthesis);
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json({ error: "Failed to generate pattern insights" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, helpful } = body;

    // Log reaction for future reinforcement tuning
    return NextResponse.json({ success: true, insightId, helpful });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record reaction" }, { status: 500 });
  }
}
