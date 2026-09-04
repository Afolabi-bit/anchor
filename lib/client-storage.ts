import { clearOfflineDatabase } from "./offline-sync";

/**
 * Purges all Anchor-specific data from browser client storage (localStorage, sessionStorage, IndexedDB).
 *
 * Ensures that when a user signs out, no private information remains accessible
 * on a shared or public computer.
 *
 * Cleared items include:
 * - Unsubmitted / in-progress journal drafts (`anchor_journal_draft_*`)
 * - Starred journal dates (`anchor_starred_journal_dates`)
 * - Bookmarked daily affirmations (`anchor_bookmarked_quotes`)
 * - Legacy local state (`anchor_guest_state`)
 * - Dismissed AI pattern cards (`anchor_dismissed_patterns`)
 * - Community resonance IDs (`anchor_resonated_ids`)
 * - PWA prompt flags (`anchor_pwa_*`)
 * - Offline sync queues and snapshot caches (`anchor_offline_db`)
 */
export async function clearAnchorClientStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // 1. Purge all localStorage keys belonging to Anchor
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("anchor_") || key.startsWith("anchor:"))) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove localStorage key "${key}":`, e);
      }
    });

    // 2. Purge all sessionStorage keys belonging to Anchor
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("anchor_") || key.startsWith("anchor:"))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove sessionStorage key "${key}":`, e);
      }
    });

    // 3. Purge offline IndexedDB database
    await clearOfflineDatabase();

    // 4. Purge guest session cookie
    if (typeof document !== "undefined") {
      document.cookie = "anchor_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } catch (err) {
    console.warn("Failed to completely clear Anchor client storage:", err);
  }
}

/**
 * High-level logout handler for client components:
 * 1. Posts to `/api/auth/logout` to clear HTTP-only session cookies
 * 2. Unconditionally purges all client-side local/session storage and IndexedDB
 */
export async function performClientLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    await clearAnchorClientStorage();
  }
}
