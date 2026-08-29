import { NextResponse } from "next/server";
import { incrementReflectionResonates } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Reflection ID is required" }, { status: 400 });
    }

    await incrementReflectionResonates(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resonate error:", error);
    return NextResponse.json({ error: "Failed to resonate" }, { status: 500 });
  }
}
