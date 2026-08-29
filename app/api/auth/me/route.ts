import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, getActiveCommitmentsByUserId, getAllCommitmentsByUserId } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const activeCommitments = await getActiveCommitmentsByUserId(user.id);
  const allCommitments = await getAllCommitmentsByUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isOnboarded: user.isOnboarded,
      morningNotificationTime: user.morningNotificationTime,
      eveningNotificationTime: user.eveningNotificationTime,
      timezone: user.timezone,
    },
    commitment: activeCommitments[0] || null,
    commitments: activeCommitments,
    allCommitments,
  });
}
