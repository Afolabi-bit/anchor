import { NextResponse } from "next/server";
import { getAllPushSubscriptionsWithUsers } from "@/lib/db-service";
import { sendPushNotification } from "@/lib/push-service";

export async function GET(request: Request) {
  try {
    const records = await getAllPushSubscriptionsWithUsers();
    const now = new Date();
    let sentCount = 0;

    for (const record of records) {
      const { user, subscription } = record;
      const userTz = user.timezone || "UTC";

      let userTimeStr = "";
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: userTz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        userTimeStr = dtf.format(now);
      } catch {
        userTimeStr = now.toISOString().slice(11, 16);
      }

      // Check morning match
      if (user.morningNotificationTime && userTimeStr === user.morningNotificationTime) {
        await sendPushNotification(subscription, {
          title: "Anchor • Morning Intention",
          body: "The day is beginning. Take a gentle breath and anchor your focus.",
          url: "/today",
          tag: "anchor-morning",
        });
        sentCount++;
      }

      // Check evening match
      if (user.eveningNotificationTime && userTimeStr === user.eveningNotificationTime) {
        await sendPushNotification(subscription, {
          title: "Anchor • Evening Soft Landing",
          body: "The sun is setting. Take 60 seconds for an honest, gentle review.",
          url: "/today",
          tag: "anchor-evening",
        });
        sentCount++;
      }
    }

    return NextResponse.json({
      status: "ok",
      checkedSubscriptions: records.length,
      sentCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron reminder error:", error);
    return NextResponse.json({ error: "Reminder dispatch failed" }, { status: 500 });
  }
}
