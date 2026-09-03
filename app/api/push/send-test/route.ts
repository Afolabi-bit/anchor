import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPushSubscriptionsByUserId } from "@/lib/db-service";
import { sendPushNotification } from "@/lib/push-service";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await getPushSubscriptionsByUserId(session.id);
    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No active push subscription found on this device" }, { status: 400 });
    }

    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendPushNotification(sub, {
          title: "Anchor • Test Notification",
          body: "Your daily anchor notifications are active and ready.",
          url: "/today",
          tag: "anchor-test",
        })
      )
    );

    return NextResponse.json({ success: true, deliveredCount: results.filter((r) => r.success).length });
  } catch (error) {
    console.error("Send test push error:", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}
