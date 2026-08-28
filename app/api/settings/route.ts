import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateUser, getUserById } from "@/lib/db-service";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { morningNotificationTime, eveningNotificationTime, timezone } = body;

    const updatedUser = await updateUser(session.id, {
      ...(morningNotificationTime ? { morningNotificationTime } : {}),
      ...(eveningNotificationTime ? { eveningNotificationTime } : {}),
      ...(timezone ? { timezone } : {}),
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
