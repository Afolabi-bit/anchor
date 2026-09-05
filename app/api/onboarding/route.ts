import { NextResponse } from "next/server";
import { getSession, createSessionToken, setSessionCookie, attachSessionCookie, hashPassword } from "@/lib/auth";
import { updateUser, createCommitment, getUserByEmail, createUser, getUserById } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      commitmentName,
      commitmentWhy,
      frequency = "daily",
      customDays = [0, 1, 2, 3, 4, 5, 6],
      morningNotificationTime = "08:00",
      eveningNotificationTime = "20:00",
      timezone,
      email,
      password,
      firstName,
      lastName,
    } = body;

    let session = await getSession(request);
    let userId = session?.id;

    // If no active session, check if account credentials are provided to complete in one step
    if (!userId) {
      if (email && password) {
        if (typeof email !== "string" || !email.includes("@")) {
          return NextResponse.json(
            { error: "Please provide a valid email address" },
            { status: 400 }
          );
        }
        if (typeof password !== "string" || password.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters long" },
            { status: 400 }
          );
        }

        const existing = await getUserByEmail(email);
        if (existing) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in." },
            { status: 409 }
          );
        }

        const passwordHash = await hashPassword(password);
        const newUser = await createUser({
          email: email.trim().toLowerCase(),
          firstName: firstName?.trim() || "User",
          lastName: lastName?.trim() || "",
          passwordHash,
          timezone: timezone || "UTC",
          morningNotificationTime,
          eveningNotificationTime,
        });

        userId = newUser.id;
      } else {
        return NextResponse.json(
          { error: "Please sign in or create an account to save your anchor." },
          { status: 401 }
        );
      }
    }

    if (!commitmentName || typeof commitmentName !== "string" || !commitmentName.trim()) {
      return NextResponse.json(
        { error: "Please enter an anchor habit name" },
        { status: 400 }
      );
    }

    // 1. Create commitment
    const commitment = await createCommitment({
      userId,
      name: commitmentName.trim(),
      why: commitmentWhy ? commitmentWhy.trim() : "",
      frequency,
      customDays,
    });

    // 2. Update user profile & notification times
    const updatedUser = await updateUser(userId, {
      isOnboarded: true,
      morningNotificationTime,
      eveningNotificationTime,
      ...(timezone ? { timezone } : {}),
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // 3. Create fresh session token
    const token = await createSessionToken({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isOnboarded: true,
      morningNotificationTime: updatedUser.morningNotificationTime,
      eveningNotificationTime: updatedUser.eveningNotificationTime,
      timezone: updatedUser.timezone,
    });

    await setSessionCookie(token);

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isOnboarded: true,
        morningNotificationTime: updatedUser.morningNotificationTime,
        eveningNotificationTime: updatedUser.eveningNotificationTime,
      },
      commitment,
      token,
    });

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
