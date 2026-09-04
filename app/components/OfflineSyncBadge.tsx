"use client";

import { useState, useEffect } from "react";
import { WifiSlash as WifiOff, CloudArrowUp as CloudUpload, CheckCircle as CheckCircle2, ShieldCheck } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { flushPendingCheckIns, getPendingCheckIns } from "@/lib/offline-sync";
import { triggerHaptic } from "@/lib/sensory";

export default function OfflineSyncBadge() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnlineStatus = async () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);

      if (!offline) {
        // We are online — flush pending queue
        setSyncing(true);
        const { syncedCount } = await flushPendingCheckIns();
        setSyncing(false);
        const remaining = await getPendingCheckIns();
        setPendingCount(remaining.length);

        if (syncedCount > 0) {
          triggerHaptic([20, 40, 20]);
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 4000);
        }
      } else {
        const pending = await getPendingCheckIns();
        setPendingCount(pending.length);
      }
    };

    setIsOffline(!navigator.onLine);
    getPendingCheckIns().then((p) => setPendingCount(p.length));

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  if (!isOffline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] pointer-events-none">
        {isOffline ? (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] shadow-organic-md text-[#B88452] dark:text-[#E2A365] flex items-center justify-between text-xs pointer-events-auto"
          >
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-semibold block">Offline Mode Active</span>
                <span className="text-[10px] opacity-80">
                  {pendingCount > 0
                    ? `${pendingCount} reflection${pendingCount > 1 ? "s" : ""} saved locally`
                    : "Reflections will save locally & sync later"}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFFFF]/60 dark:bg-[#1E1B18]/60 font-medium">
              Offline
            </span>
          </motion.div>
        ) : justSynced ? (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="p-3.5 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] shadow-organic-md text-[#658B70] dark:text-[#82A78C] flex items-center justify-between text-xs pointer-events-auto"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">All offline reflections synced securely</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5" />
          </motion.div>
        ) : syncing ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm text-[#786F66] dark:text-[#A8A096] flex items-center justify-center gap-2 text-xs"
          >
            <CloudUpload className="w-4 h-4 animate-bounce text-[#C86D51]" />
            <span>Syncing reflections...</span>
          </motion.div>
        ) : null}
      </div>
    </AnimatePresence>
  );
}
