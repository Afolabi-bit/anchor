import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveCommitmentByUserId, updateCommitment, createCommitment } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commitment = await getActiveCommitmentByUserId(session.id);
  return NextResponse.json({ commitment });
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, why, frequency, customDays, active } = body;

    if (!id) {
      return NextResponse.json({ error: "Commitment ID required" }, { status: 400 });
    }

    const updated = await updateCommitment(id, session.id, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(why !== undefined ? { why: why.trim() } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(customDays !== undefined ? { customDays } : {}),
      ...(active !== undefined ? { active } : {}),
    });

    return NextResponse.json({ commitment: updated });
  } catch (error) {
    console.error("Update commitment error:", error);
    return NextResponse.json({ error: "Failed to update commitment" }, { status: 500 });
  }
}
