import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePushSubscription, deletePushSubscription, getPushSubscriptionsByUserId } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subs = await getPushSubscriptionsByUserId(session.id);
  return NextResponse.json({ isSubscribed: subs.length > 0, count: subs.length });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    const saved = await savePushSubscription({
      userId: session.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ success: true, subscription: saved });
  } catch (error) {
    console.error("Save subscription error:", error);
    return NextResponse.json({ error: "Failed to save push subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
    }

    await deletePushSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete subscription error:", error);
    return NextResponse.json({ error: "Failed to delete push subscription" }, { status: 500 });
  }
}
