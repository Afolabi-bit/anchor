"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import GroundingDrawer from "@/app/components/GroundingDrawer";
import CheckInStepper from "@/app/components/CheckInStepper";
import NewCommitmentModal from "@/app/components/NewCommitmentModal";
import PageTransition from "@/app/components/PageTransition";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import { TodaySkeleton } from "@/app/components/Skeletons";
import { getTodayAffirmation } from "@/lib/affirmations";
import JournalComposer from "@/app/components/JournalComposer";
import {
  Sun,
  Moon,
  CheckCircle as CheckCircle2,
  Check,
  Anchor,
  ArrowRight,
  Plus,
  HandHeart as MessageSquareHeart,
  Quotes as Quote,
  CaretDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import type { User, Commitment, CheckIn } from "@/db/schema";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [activeCommitmentId, setActiveCommitmentId] = useState<string>("");
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [showAnchorMenu, setShowAnchorMenu] = useState(false);

  // Time-aware horizon
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 14; // After 2:00 PM is Evening reflection horizon

  const todayStr = new Date().toISOString().slice(0, 10);

  const greeting = isEvening ? "Good Evening" : "Good Morning";

  // Check-in data
  const [morningCheckIn, setMorningCheckIn] = useState<CheckIn | null>(null);
  const [eveningCheckIn, setEveningCheckIn] = useState<CheckIn | null>(null);
  const [partnerMessages, setPartnerMessages] = useState<any[]>([]);

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);

  // Optional manual view override to review or edit the other check-in
  const [viewOverride, setViewOverride] = useState<"morning" | "evening" | null>(null);
  const currentView = viewOverride || (isEvening ? "evening" : "morning");

  // Daily Affirmation quote
  const affirmation = getTodayAffirmation();

  const dismissPartnerMessage = async (msgId: string) => {
    triggerHaptic(10);
    setPartnerMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await fetch("/api/sponsor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId }),
      });
    } catch (e) {
      console.warn("Failed to dismiss sponsor message:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        if (!meData.user.isOnboarded) {
          router.push("/onboarding");
          return;
        }
        setUser(meData.user);
        const comms: Commitment[] = meData.commitments || (meData.commitment ? [meData.commitment] : []);
        setCommitments(comms);
        if (comms.length > 0) {
          setActiveCommitmentId((prev) => prev || comms[0].id);
        }

        // Fetch sponsor encouragement messages
        try {
          const sponsorRes = await fetch("/api/sponsor");
          if (sponsorRes.ok) {
            const sponsorData = await sponsorRes.json();
            setPartnerMessages(sponsorData.messages?.filter((m: any) => !m.read) || []);
          }
        } catch (e) {
          console.warn("Failed to fetch sponsor encouragement messages:", e);
        }
      } catch (err) {
        console.error("Error loading today state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, todayStr]);

  // Unified single-loader for commitment check-ins when active commitment changes
  useEffect(() => {
    if (!activeCommitmentId) return;
    async function reloadCommitmentCheckIns() {
      try {
        const checkInsRes = await fetch(`/api/checkins?date=${todayStr}`);
        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          const m = data.checkIns.find((c: CheckIn) => c.type === "morning" && (!c.commitmentId || c.commitmentId === activeCommitmentId));
          const e = data.checkIns.find((c: CheckIn) => c.type === "evening" && (!c.commitmentId || c.commitmentId === activeCommitmentId));
          setMorningCheckIn(m || null);
          setEveningCheckIn(e || null);
        }
      } catch (e) {
        console.error("Failed to load checkins for commitment", e);
      }
    }
    reloadCommitmentCheckIns();
  }, [activeCommitmentId, todayStr]);

  const activeCommitment = commitments.find((c) => c.id === activeCommitmentId) || commitments[0];
  const activeColorHex = PALETTE_HEX[activeCommitment?.colorIndex ?? 0] || "#C86D51";

  const handleCheckInSuccess = (savedCheckIn: CheckIn) => {
    if (savedCheckIn.type === "morning") setMorningCheckIn(savedCheckIn);
    if (savedCheckIn.type === "evening") setEveningCheckIn(savedCheckIn);
  };

  const handleCommitmentCreated = (newComm: Commitment) => {
    setCommitments((prev) => [...prev, newComm]);
    setActiveCommitmentId(newComm.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
        <Navigation />
        <TodaySkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={user?.firstName ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}` : undefined}
        firstName={user?.firstName}
        lastName={user?.lastName}
      />
      <OfflineSyncBadge />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 pb-36">
          {/* ========================================================================= */}
          {/* 1. ANCHOR FOCUS HEADER: Uninhibited Greeting + Intuitive Anchor Selector   */}
          {/* ========================================================================= */}
          <div className="space-y-2 relative">
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
              {greeting}{user?.firstName ? `, ${user.firstName}` : ""}
            </span>

            {/* Anchor Title with Intuitive Dropdown Switcher */}
            <div className="relative inline-block">
              {commitments.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setShowAnchorMenu(!showAnchorMenu);
                  }}
                  className="group flex items-center gap-2.5 text-left cursor-pointer rounded-2xl -ml-2 px-2 py-1 hover:bg-[#F3EFE7]/80 dark:hover:bg-[#25221F]/80 transition-colors"
                  title="Switch Active Anchor"
                  aria-expanded={showAnchorMenu}
                >
                  <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] tracking-tight leading-snug">
                    {activeCommitment?.name || "Daily Anchor Focus"}
                  </h1>
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] dark:bg-[#2E2A26] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-center text-[#786F66] dark:text-[#A8A096] group-hover:text-[#2C2520] dark:group-hover:text-[#ECE7E0] transition-colors shrink-0 shadow-2xs">
                    <CaretDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAnchorMenu ? "rotate-180" : ""}`} />
                  </div>
                </button>
              ) : (
                <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] tracking-tight leading-snug">
                  {activeCommitment?.name || "Daily Anchor Focus"}
                </h1>
              )}

              {/* Intuitive Vertical Anchor Dropdown Popover */}
              <AnimatePresence>
                {showAnchorMenu && (
                  <>
                    {/* Click-outside overlay */}
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setShowAnchorMenu(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-72 sm:w-84 p-2 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-lg z-30 space-y-1"
                    >
                      <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold border-b border-[#EAE3D7] dark:border-[#38332E]">
                        Switch Active Anchor
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                        {commitments.map((c) => {
                          const isSelected = c.id === activeCommitmentId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic(10);
                                setActiveCommitmentId(c.id);
                                setShowAnchorMenu(false);
                              }}
                              className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#FAF7F2] dark:bg-[#2E2A26] text-[#2C2520] dark:text-[#ECE7E0] font-medium"
                                  : "hover:bg-[#FAF7F2]/60 dark:hover:bg-[#2E2A26]/60 text-[#786F66] dark:text-[#A8A096]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: PALETTE_HEX[c.colorIndex % PALETTE_HEX.length] || activeColorHex }}
                                />
                                <div className="truncate">
                                  <span className="text-xs sm:text-sm block truncate text-[#2C2520] dark:text-[#ECE7E0]">
                                    {c.name}
                                  </span>
                                  {c.why && (
                                    <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] italic block truncate">
                                      "{c.why}"
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#658B70] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1 border-t border-[#EAE3D7] dark:border-[#38332E]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAnchorMenu(false);
                            setNewModalOpen(true);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-[#2E2A26] text-xs font-semibold text-[#C86D51] dark:text-[#DB8165] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Anchor</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {activeCommitment?.why && (
              <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] font-serif italic leading-relaxed pt-0.5">
                "{activeCommitment.why}"
              </p>
            )}
          </div>

          {/* Partner Encouragement Message Banner (Only shown if cheer is unread) */}
          {partnerMessages.length > 0 && (
            <div className="space-y-2">
              {partnerMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] clay-card shadow-organic-sm flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#658B70] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <MessageSquareHeart className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#658B70] dark:text-[#82A78C]">
                        Word from {msg.senderName}
                      </span>
                      <p className="text-xs sm:text-sm font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                        "{msg.message}"
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissPartnerMessage(msg.id)}
                    className="text-xs font-medium text-[#658B70] hover:text-[#2C2520] bg-white/80 dark:bg-[#1E1B18]/80 px-2.5 py-1 rounded-full border border-[#D9E6DD] dark:border-[#2C4032] shrink-0 cursor-pointer"
                  >
                    Thank you
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ONE PRIMARY CHECK-IN CARD WITH TIME-OF-DAY TRACKER                     */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            {/* Segmented Morning / Evening View Tracker */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#F3EFE7] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setViewOverride("morning");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === "morning"
                      ? "bg-white dark:bg-[#2E2A26] text-[#B88452] shadow-2xs font-semibold"
                      : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-[#B88452]" />
                  <span>Morning Intention</span>
                  {morningCheckIn && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#658B70]" title="Sealed" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setViewOverride("evening");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === "evening"
                      ? "bg-white dark:bg-[#2E2A26] text-[#C86D51] dark:text-[#DB8165] shadow-2xs font-semibold"
                      : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-[#C86D51]" />
                  <span>Evening Review</span>
                  {eveningCheckIn && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#658B70]" title="Completed" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
            {currentView === "morning" ? (
              /* ----------------------- MORNING CHECK-IN CARD ----------------------- */
              <motion.div
                key="morning-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                className="p-7 sm:p-9 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border-2 border-[#B88452]/40 dark:border-[#B88452]/30 clay-card shadow-organic-md space-y-6 sm:space-y-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-[#B88452]">
                        Morning Check-in
                      </span>
                      <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Set Your Daily Intention
                      </h2>
                    </div>
                  </div>

                  {morningCheckIn && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold border border-[#B88452]/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Sealed</span>
                    </span>
                  )}
                </div>

                {morningCheckIn ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 text-xs">
                    <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block">
                      This morning's plan:
                    </span>
                    {morningCheckIn.plannedActions && morningCheckIn.plannedActions.length > 0 && (
                      <div className="space-y-1.5">
                        {morningCheckIn.plannedActions.map((act: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[#2C2520] dark:text-[#ECE7E0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70]" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {morningCheckIn.intentionNote && (
                      <p className="font-serif italic text-[#786F66] dark:text-[#A8A096] pt-1">
                        "{morningCheckIn.intentionNote}"
                      </p>
                    )}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveStepper("morning")}
                        className="text-xs text-[#B88452] hover:underline cursor-pointer font-medium"
                      >
                        Edit morning intention
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      Pick 1 or 2 specific actions that support your goal today.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("morning");
                      }}
                      className="btn-primary w-full py-3.5 text-sm font-semibold shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Anchor Your Day (15s)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ----------------------- EVENING CHECK-IN CARD ----------------------- */
              <motion.div
                key="evening-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                className="p-7 sm:p-9 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border-2 border-[#C86D51]/40 dark:border-[#C86D51]/30 clay-card shadow-organic-md space-y-6 sm:space-y-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center shadow-2xs">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-[#C86D51]">
                        Evening Check-in
                      </span>
                      <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Review Your Day
                      </h2>
                    </div>
                  </div>

                  {eveningCheckIn && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] font-semibold border border-[#C86D51]/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {/* Folded-in Supporting Morning Status Context */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs flex items-center justify-between gap-2">
                  {morningCheckIn ? (
                    <div className="flex items-center gap-2 text-[#786F66] dark:text-[#A8A096] truncate">
                      <Sun className="w-3.5 h-3.5 text-[#B88452] shrink-0" />
                      <span className="truncate">Morning: {morningCheckIn.plannedActions?.[0] || "Intention set"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#786F66] dark:text-[#A8A096]">
                      <Sun className="w-3.5 h-3.5 opacity-50 shrink-0" />
                      <span>No morning check-in — your evening still counts.</span>
                    </div>
                  )}
                  {morningCheckIn && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold shrink-0">
                      Sealed ✓
                    </span>
                  )}
                </div>

                {eveningCheckIn ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[#786F66] font-semibold">
                        Today Recorded
                      </span>
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold">
                        {eveningCheckIn.status === "yes" ? "Followed Through" : eveningCheckIn.status === "partial" ? "Partially" : "Learned"}
                      </span>
                    </div>

                    {eveningCheckIn.reflection && (
                      <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                        "{eveningCheckIn.reflection}"
                      </p>
                    )}

                    <div className="pt-2 text-[#786F66] dark:text-[#A8A096] italic text-xs flex items-center justify-between">
                      <span>Logged {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</span>
                      <button
                        type="button"
                        onClick={() => setActiveStepper("evening")}
                        className="text-xs text-[#C86D51] hover:underline cursor-pointer font-medium ml-2"
                      >
                        Edit reflection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      30 seconds. Reflect honestly on how today went.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("evening");
                      }}
                      className="btn-primary w-full py-3.5 text-sm font-semibold shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Review Your Day (30s)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* 3. SECONDARY SUPPORTING AREA: Daily Quote & Pause & Breathe               */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Quote className="w-4 h-4 text-[#B88452] shrink-0 opacity-75 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-serif italic text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    "{affirmation.quote}"
                  </p>
                  <span className="text-xs text-[#B88452] font-semibold block">
                    — {affirmation.author}
                  </span>
                </div>
              </div>
              <div className="shrink-0 pt-0.5">
                <GroundingDrawer />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. JOURNAL COMPOSER (Collapsed Accordion by Default)                      */}
          {/* ========================================================================= */}
          <div className="pt-1">
            <JournalComposer variant="compact" />
          </div>
        </main>
      </PageTransition>

      {/* Stepper Modal for Morning / Evening */}
      {activeStepper && (
        <CheckInStepper
          isOpen={Boolean(activeStepper)}
          initialStage={activeStepper}
          commitmentName={activeCommitment?.name || "Daily Anchor"}
          commitmentWhy={activeCommitment?.why || undefined}
          commitmentId={activeCommitment?.id}
          onClose={() => setActiveStepper(null)}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {/* Floating Action Button for Adding New Anchors */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          triggerHaptic(12);
          if (commitments.length >= 5) {
            alert("Anchor supports up to 5 active anchors to protect your focus and avoid cognitive overwhelm. You can pause or manage existing anchors in Settings.");
            return;
          }
          setNewModalOpen(true);
        }}
        className="fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white flex items-center justify-center shadow-organic-lg hover:shadow-organic-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#C86D51]/30 group"
        aria-label="Add new anchor"
        title="Add new anchor"
      >
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:rotate-90" />
      </motion.button>

      {/* New Commitment Modal */}
      {newModalOpen && (
        <NewCommitmentModal
          isOpen={newModalOpen}
          onClose={() => setNewModalOpen(false)}
          onCreated={handleCommitmentCreated}
        />
      )}
    </div>
  );
}
