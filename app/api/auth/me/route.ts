import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, getActiveCommitmentByUserId } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const commitment = await getActiveCommitmentByUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      isOnboarded: user.isOnboarded,
      morningNotificationTime: user.morningNotificationTime,
      eveningNotificationTime: user.eveningNotificationTime,
      timezone: user.timezone,
    },
    commitment,
  });
}
