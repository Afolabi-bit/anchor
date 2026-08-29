import webPush from "web-push";
import { deletePushSubscription } from "@/lib/db-service";

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@anchor.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    console.error("VAPID details setup error:", err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    const result = await webPush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/today",
        tag: payload.tag || "anchor-reminder",
        icon: "/icon-192.png",
      })
    );
    return { success: true, statusCode: result.statusCode };
  } catch (error: any) {
    console.error("Push delivery error for endpoint:", subscription.endpoint, error?.statusCode);
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      // Subscription has expired or been unsubscribed
      await deletePushSubscription(subscription.endpoint);
    }
    return { success: false, error: error?.message || "Delivery failed" };
  }
}
