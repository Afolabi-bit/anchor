import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db-service";
import { verifyPassword, createSessionToken, setSessionCookie, attachSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Please enter your email address", code: "MISSING_EMAIL" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Please enter your password", code: "MISSING_PASSWORD" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        {
          error: "Email not registered. No account found with this address.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Wrong password. Please check your password and try again.",
          code: "WRONG_PASSWORD",
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isOnboarded: user.isOnboarded,
      morningNotificationTime: user.morningNotificationTime,
      eveningNotificationTime: user.eveningNotificationTime,
      timezone: user.timezone,
    });

    await setSessionCookie(token);

    const response = NextResponse.json({
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
      token,
    });

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
