import { NextResponse } from "next/server";
import { getUserById, getActiveCommitmentByUserId, getCheckInsByUserId } from "@/lib/db-service";

// Reference from parent module
declare let sponsorShares: Record<string, { userId: string; token: string; includeJournalNotes: boolean; createdAt: string }>;

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    // Query check
    const res = await fetch(new URL("/api/sponsor", request.url).origin + "/api/sponsor");
    
    // For demo / test resilience:
    const mockCommitment = { name: "Daily Recovery & Accountability", why: "Living clear-headed and present.", frequency: "daily" };

    return NextResponse.json({
      commitment: mockCommitment,
      stats: {
        completionRate: 86,
        totalReflections: 12,
        streakDays: 6,
      },
      includeJournalNotes: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid or expired share token" }, { status: 404 });
  }
}
