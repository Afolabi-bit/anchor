// Client-side Web Push Helper
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BN_zMZgEgX7KT-a64SnUrvTB00M6_SBSRMzGSFvRgw75-o3zUqXziEq6pF_cqvkByeS47XspNuEoYxv9ohhkxiU";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      return reg;
    } catch (err) {
      console.error("Service worker registration error:", err);
      return null;
    }
  }
  return null;
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was not granted." };
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    const subJson = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: subJson.keys,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Failed to save subscription" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Push subscription error:", err);
    return { success: false, error: err?.message || "Failed to enable notifications." };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { success: false };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    return { success: true };
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return { success: false };
  }
}
