import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import {
  getShareByUserId,
  saveShare,
  getEncouragementMessages,
  markMessageAsRead,
} from "@/lib/sponsor-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = getShareByUserId(session.id);
  const messages = getEncouragementMessages(session.id);

  return NextResponse.json({
    share: existing || null,
    messages,
  });
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

    saveShare(shareData);

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

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId } = body;
    if (messageId) {
      markMessageAsRead(messageId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}
