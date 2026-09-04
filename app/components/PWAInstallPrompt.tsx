"use client";

import { useState, useEffect } from "react";
import { DownloadSimple as Download, X, Anchor } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch (e) {
    console.warn(`SafeStorage get failed for ${key}:`, e);
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch (e) {
    console.warn(`SafeStorage set failed for ${key}:`, e);
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode or marked as installed
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        safeGet(window.localStorage, "anchor_pwa_installed") === "true")
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if already prompted in this session
      const alreadyPrompted = safeGet(window.sessionStorage, "anchor_pwa_prompt_shown");
      if (alreadyPrompted === "true") {
        return;
      }

      // Wait 10 seconds after initial page interaction before showing gentle prompt once per session
      setTimeout(() => {
        if (safeGet(window.sessionStorage, "anchor_pwa_prompt_shown") === "true") return;
        safeSet(window.sessionStorage, "anchor_pwa_prompt_shown", "true");
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      safeSet(window.localStorage, "anchor_pwa_installed", "true");
      safeSet(window.sessionStorage, "anchor_pwa_prompt_shown", "true");
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    triggerHaptic(12);
    safeSet(window.sessionStorage, "anchor_pwa_prompt_shown", "true");
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      safeSet(window.localStorage, "anchor_pwa_installed", "true");
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic(8);
    safeSet(window.sessionStorage, "anchor_pwa_prompt_shown", "true");
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-24 sm:bottom-6 right-5 left-5 sm:left-auto sm:max-w-md z-40 p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-lg clay-card flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shrink-0 shadow-2xs">
            <Anchor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block truncate">
              Install Anchor App
            </span>
            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] block truncate">
              Quick homescreen access & quiet daily check-ins
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="text-xs px-3.5 py-1.5 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium flex items-center gap-1 shadow-organic-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-[#9E948A] hover:text-[#2C2520] rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
