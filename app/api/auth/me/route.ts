import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById, getActiveCommitmentsByUserId, getAllCommitmentsByUserId } from "@/lib/db-service";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let user = null;
    let activeCommitments: any[] = [];
    let allCommitments: any[] = [];

    try {
      user = await getUserById(session.id);
      if (user) {
        activeCommitments = await getActiveCommitmentsByUserId(user.id);
        allCommitments = await getAllCommitmentsByUserId(user.id);
      }
    } catch (dbErr) {
      console.warn("DB query in /api/auth/me fell back to session:", dbErr);
    }

    const userData = {
      id: user?.id || session.id,
      email: user?.email || session.email,
      firstName: user?.firstName ?? session.firstName ?? null,
      lastName: user?.lastName ?? session.lastName ?? null,
      isOnboarded: user ? Boolean(user.isOnboarded) : Boolean(session.isOnboarded),
      morningNotificationTime: user?.morningNotificationTime || session.morningNotificationTime || "08:00",
      eveningNotificationTime: user?.eveningNotificationTime || session.eveningNotificationTime || "20:00",
      timezone: user?.timezone || session.timezone || "UTC",
    };

    return NextResponse.json({
      user: userData,
      commitment: activeCommitments[0] || null,
      commitments: activeCommitments,
      allCommitments,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
