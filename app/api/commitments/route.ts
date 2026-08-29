import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getActiveCommitmentsByUserId,
  getAllCommitmentsByUserId,
  updateCommitment,
  createCommitment,
  deleteCommitment,
} from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeCommitments = await getActiveCommitmentsByUserId(session.id);
  const allCommitments = await getAllCommitmentsByUserId(session.id);
  return NextResponse.json({
    commitment: activeCommitments[0] || null,
    commitments: activeCommitments,
    allCommitments,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, why, frequency, customDays, colorIndex, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Commitment name is required" }, { status: 400 });
    }

    const newCommitment = await createCommitment({
      userId: session.id,
      name: name.trim(),
      why: why?.trim(),
      frequency: frequency || "daily",
      customDays: customDays || [0, 1, 2, 3, 4, 5, 6],
      colorIndex: colorIndex !== undefined ? Number(colorIndex) : 0,
      icon: icon || "anchor",
    });

    return NextResponse.json({ commitment: newCommitment }, { status: 201 });
  } catch (error) {
    console.error("Create commitment error:", error);
    return NextResponse.json({ error: "Failed to create commitment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, why, frequency, customDays, active, colorIndex, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "Commitment ID required" }, { status: 400 });
    }

    const updated = await updateCommitment(id, session.id, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(why !== undefined ? { why: why.trim() } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(customDays !== undefined ? { customDays } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(colorIndex !== undefined ? { colorIndex: Number(colorIndex) } : {}),
      ...(icon !== undefined ? { icon } : {}),
    });

    return NextResponse.json({ commitment: updated });
  } catch (error) {
    console.error("Update commitment error:", error);
    return NextResponse.json({ error: "Failed to update commitment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Commitment ID required" }, { status: 400 });
    }

    const deleted = await deleteCommitment(id, session.id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("Delete commitment error:", error);
    return NextResponse.json({ error: "Failed to delete commitment" }, { status: 500 });
  }
}
