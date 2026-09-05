import { NextResponse } from "next/server";
import { getSession, clearSessionCookie, attachClearSessionCookie } from "@/lib/auth";
import { getUserById, getActiveCommitmentsByUserId, getAllCommitmentsByUserId } from "@/lib/db-service";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    // Session token is signed but user does not exist in DB (e.g. DB reset or stale test cookie)
    await clearSessionCookie();
    const response = NextResponse.json({ user: null }, { status: 401 });
    return attachClearSessionCookie(response);
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
