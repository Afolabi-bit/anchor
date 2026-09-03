import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getSharesByUserId,
  createPartnerShare,
  updatePartnerShare,
  revokePartnerShare,
  getEncouragementMessages,
  markMessageAsRead,
} from "@/lib/sponsor-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await getSharesByUserId(session.id);
  const messages = getEncouragementMessages(session.id);

  return NextResponse.json({
    shares,
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
    const {
      partnerEmail,
      shareConsistency = false,
      shareMilestones = false,
      shareMoodTrends = false,
      shareBlockers = false,
      shareJournalNotes = false, // ALWAYS DEFAULT FALSE
      expiresInDays = 60,
    } = body;

    const share = await createPartnerShare({
      userId: session.id,
      partnerEmail,
      shareConsistency: Boolean(shareConsistency),
      shareMilestones: Boolean(shareMilestones),
      shareMoodTrends: Boolean(shareMoodTrends),
      shareBlockers: Boolean(shareBlockers),
      shareJournalNotes: Boolean(shareJournalNotes),
      expiresInDays: Number(expiresInDays) || 60,
    });

    return NextResponse.json({
      success: true,
      shareUrl: `/share/${share.token}`,
      share,
    });
  } catch (error) {
    console.error("Sponsor share error:", error);
    return NextResponse.json({ error: "Failed to generate partner link" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, token, permissions } = body;

    if (messageId) {
      markMessageAsRead(messageId);
      return NextResponse.json({ success: true });
    }

    if (token && permissions) {
      const updated = await updatePartnerShare(token, session.id, {
        shareConsistency: permissions.shareConsistency !== undefined ? Boolean(permissions.shareConsistency) : undefined,
        shareMilestones: permissions.shareMilestones !== undefined ? Boolean(permissions.shareMilestones) : undefined,
        shareMoodTrends: permissions.shareMoodTrends !== undefined ? Boolean(permissions.shareMoodTrends) : undefined,
        shareBlockers: permissions.shareBlockers !== undefined ? Boolean(permissions.shareBlockers) : undefined,
        shareJournalNotes: permissions.shareJournalNotes !== undefined ? Boolean(permissions.shareJournalNotes) : undefined,
      });

      if (!updated) {
        return NextResponse.json({ error: "Partner link not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, share: updated });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update partner permissions" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const revoked = await revokePartnerShare(token, session.id);
    if (!revoked) {
      return NextResponse.json({ error: "Partner link not found or already revoked" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Partner link disconnected." });
  } catch (error) {
    console.error("Revoke partner error:", error);
    return NextResponse.json({ error: "Failed to disconnect partner" }, { status: 500 });
  }
}
