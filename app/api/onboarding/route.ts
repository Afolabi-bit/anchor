import { NextResponse } from "next/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth";
import { updateUser, createCommitment } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      commitmentName,
      commitmentWhy,
      frequency = "daily",
      customDays = [0, 1, 2, 3, 4, 5, 6],
      morningNotificationTime = "08:00",
      eveningNotificationTime = "20:00",
      timezone,
    } = body;

    if (!commitmentName || typeof commitmentName !== "string" || !commitmentName.trim()) {
      return NextResponse.json(
        { error: "Please enter a commitment name" },
        { status: 400 }
      );
    }

    // 1. Create commitment
    const commitment = await createCommitment({
      userId: session.id,
      name: commitmentName,
      why: commitmentWhy,
      frequency,
      customDays,
    });

    // 2. Update user profile & notification times
    const updatedUser = await updateUser(session.id, {
      isOnboarded: true,
      morningNotificationTime,
      eveningNotificationTime,
      ...(timezone ? { timezone } : {}),
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // 3. Update session cookie
    const token = await createSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      isOnboarded: true,
      morningNotificationTime: updatedUser.morningNotificationTime,
      eveningNotificationTime: updatedUser.eveningNotificationTime,
      timezone: updatedUser.timezone,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isOnboarded: true,
        morningNotificationTime: updatedUser.morningNotificationTime,
        eveningNotificationTime: updatedUser.eveningNotificationTime,
      },
      commitment,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
