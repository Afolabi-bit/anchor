import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

// Store in-memory/fallback or Neon table
let sponsorShares: Record<string, { userId: string; token: string; includeJournalNotes: boolean; createdAt: string }> = {};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = Object.values(sponsorShares).find((s) => s.userId === session.id);
  return NextResponse.json({ share: existing || null });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { includeJournalNotes = false } = body;

    const token = crypto.randomBytes(16).toString("hex");
    const shareData = {
      userId: session.id,
      token,
      includeJournalNotes: Boolean(includeJournalNotes),
      createdAt: new Date().toISOString(),
    };

    sponsorShares[token] = shareData;

    return NextResponse.json({
      success: true,
      shareUrl: `/share/${token}`,
      share: shareData,
    });
  } catch (error) {
    console.error("Sponsor share error:", error);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
