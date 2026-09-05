"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import GroundingDrawer from "@/app/components/GroundingDrawer";
import CheckInStepper from "@/app/components/CheckInStepper";
import NewCommitmentModal from "@/app/components/NewCommitmentModal";
import { TodaySkeleton } from "@/app/components/Skeletons";
import { getTodayAffirmation } from "@/lib/affirmations";
import JournalComposer from "@/app/components/JournalComposer";
import DailyActivityCard from "@/app/components/DailyActivityCard";
import { useAppContext } from "@/app/context/AppContext";
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
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";
import { recordClientActivityLog, formatTimeFromTimestamp } from "@/lib/client-time-log";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function TodayPage() {
  const router = useRouter();
  const {
    user,
    commitments,
    setCommitments,
    activeCommitmentId,
    setActiveCommitmentId,
    activeCommitment,
    checkIns,
    journalEntries,
    partnerMessages,
    setPartnerMessages,
    isInitialLoading,
    refreshCheckIns,
    refreshJournals,
    refreshPartnerMessages,
    updateCheckInLocally,
  } = useAppContext();

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [showAnchorMenu, setShowAnchorMenu] = useState(false);

  // Time-aware horizon
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 14; // After 2:00 PM is Evening reflection horizon

  const todayStr = new Date().toISOString().slice(0, 10);

  const greeting = isEvening ? "Good Evening" : "Good Morning";

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);
  const [stepperCommitment, setStepperCommitment] = useState<Commitment | null>(null);

  // Optional manual view override to review or edit the other check-in
  const [viewOverride, setViewOverride] = useState<"morning" | "evening" | null>(null);
  const currentView = viewOverride || (isEvening ? "evening" : "morning");

  // Daily Affirmation quote
  const affirmation = getTodayAffirmation();

  // Background refresh of check-ins, journals, and sponsor messages
  useEffect(() => {
    refreshCheckIns(todayStr);
    refreshJournals();
    refreshPartnerMessages();
  }, [todayStr, refreshCheckIns, refreshJournals, refreshPartnerMessages]);

  const todayCheckIns = useMemo(() => {
    return checkIns.filter((c: CheckIn) => c.date === todayStr);
  }, [checkIns, todayStr]);

  const todayJournals = useMemo(() => {
    return journalEntries.filter((j: JournalEntry) => j.date === todayStr);
  }, [journalEntries, todayStr]);

  const morningCheckIn = useMemo(() => {
    if (!activeCommitment?.id) return null;
    return (
      checkIns.find(
        (c: CheckIn) =>
          c.type === "morning" &&
          c.date === todayStr &&
          c.commitmentId === activeCommitment.id
      ) || null
    );
  }, [checkIns, todayStr, activeCommitment?.id]);

  const eveningCheckIn = useMemo(() => {
    if (!activeCommitment?.id) return null;
    return (
      checkIns.find(
        (c: CheckIn) =>
          c.type === "evening" &&
          c.date === todayStr &&
          c.commitmentId === activeCommitment.id
      ) || null
    );
  }, [checkIns, todayStr, activeCommitment?.id]);

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

  const activeColorHex = PALETTE_HEX[activeCommitment?.colorIndex ?? 0] || "#C86D51";

  const handleCheckInSuccess = (savedCheckIn: CheckIn) => {
    updateCheckInLocally(savedCheckIn);
    const comm = commitments.find((c) => c.id === savedCheckIn.commitmentId);
    const now = Date.now();
    recordClientActivityLog({
      id: `checkin_${savedCheckIn.id}`,
      date: savedCheckIn.date,
      timestamp: now,
      timeStr: formatTimeFromTimestamp(now),
      type: savedCheckIn.type === "morning" ? "morning_checkin" : "evening_checkin",
      commitmentId: savedCheckIn.commitmentId || undefined,
      commitmentName: comm?.name || "Daily Anchor",
      commitmentColorIndex: comm?.colorIndex ?? 0,
      title: savedCheckIn.type === "morning" ? "Morning Intention" : "Evening Reflection",
      detail:
        savedCheckIn.type === "morning"
          ? savedCheckIn.intentionNote || undefined
          : savedCheckIn.reflection || undefined,
      plannedActions: savedCheckIn.plannedActions || undefined,
      status: savedCheckIn.status || undefined,
      emotion: savedCheckIn.emotionName || undefined,
      lessonsLearned: savedCheckIn.lessonsLearned || undefined,
      isSealed: true,
    });
  };

  const handleJournalEntryCreated = (newEntry: any) => {
    const comm = commitments.find((c) => c.id === newEntry.commitmentId);
    const now = Date.now();
    recordClientActivityLog({
      id: `journal_${newEntry.id}`,
      date: newEntry.date,
      timestamp: now,
      timeStr: formatTimeFromTimestamp(now),
      type: "journal_entry",
      commitmentId: newEntry.commitmentId || undefined,
      commitmentName: comm?.name || "Daily Reflection",
      commitmentColorIndex: comm?.colorIndex ?? 0,
      title: newEntry.title || "Daily Reflection",
      detail: newEntry.content,
      tags: newEntry.tags || undefined,
      isSealed: true,
    });
  };

  const handleOpenStepper = (stage: "morning" | "evening", comm: Commitment) => {
    const isAlreadySealed = todayCheckIns.some(
      (c) => c.commitmentId === comm.id && c.type === stage
    );
    if (isAlreadySealed) {
      triggerHaptic(10);
      alert(
        `Your ${stage} check-in for "${comm.name}" is already complete for today.`
      );
      return;
    }
    setStepperCommitment(comm);
    setActiveCommitmentId(comm.id);
    setActiveStepper(stage);
  };

  const handleCommitmentCreated = (newComm: Commitment) => {
    setCommitments((prev) => [...prev, newComm]);
    setActiveCommitmentId(newComm.id);
  };

  if (isInitialLoading && !user) {
    return <TodaySkeleton />;
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 pb-36">
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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
                    <Check className="w-3 h-3 text-[#658B70]" />
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
                    <Check className="w-3 h-3 text-[#658B70]" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {currentView === "morning" ? (
              /* ----------------------- MORNING CHECK-IN CARD ----------------------- */
              <motion.div
                key="morning-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-serif-title text-lg font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                        Morning Intention
                      </h2>
                      <span className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                        {activeCommitment?.name}
                      </span>
                    </div>
                  </div>

                  {morningCheckIn && (
                    <span className="text-2xs text-[#658B70] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {morningCheckIn ? (
                  <div className="space-y-2.5 text-xs pt-1">
                    {morningCheckIn.plannedActions && morningCheckIn.plannedActions.length > 0 && (
                      <div className="space-y-1.5">
                        {morningCheckIn.plannedActions.map((act: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[#2C2520] dark:text-[#ECE7E0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {morningCheckIn.intentionNote && (
                      <p className="font-serif italic text-[#786F66] dark:text-[#A8A096] pt-0.5">
                        "{morningCheckIn.intentionNote}"
                      </p>
                    )}
                    {morningCheckIn.createdAt && (
                      <div className="pt-2 text-right text-2xs text-[#786F66]/70 dark:text-[#A8A096]/70">
                        {formatTimeFromTimestamp(morningCheckIn.createdAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096]">
                      Set your focus and planned actions for today.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("morning");
                      }}
                      className="btn-primary w-full py-3 text-sm font-semibold shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Set Morning Intention</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ----------------------- EVENING CHECK-IN CARD ----------------------- */
              <motion.div
                key="evening-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs shrink-0">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-serif-title text-lg font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                        Evening Reflection
                      </h2>
                      <span className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                        {activeCommitment?.name}
                      </span>
                    </div>
                  </div>

                  {eveningCheckIn && (
                    <span className="text-2xs text-[#658B70] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {eveningCheckIn ? (
                  <div className="space-y-2.5 text-xs pt-1">
                    {eveningCheckIn.reflection && (
                      <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                        "{eveningCheckIn.reflection}"
                      </p>
                    )}
                    {eveningCheckIn.lessonsLearned && (
                      <p className="text-2xs text-[#786F66] dark:text-[#A8A096] pt-0.5">
                        <strong className="text-[#C86D51] font-semibold">Lesson: </strong>
                        <span className="italic">{eveningCheckIn.lessonsLearned}</span>
                      </p>
                    )}
                    {eveningCheckIn.createdAt && (
                      <div className="pt-2 text-right text-2xs text-[#786F66]/70 dark:text-[#A8A096]/70">
                        {formatTimeFromTimestamp(eveningCheckIn.createdAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096]">
                      Pause and reflect honestly on how today unfolded.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("evening");
                      }}
                      className="btn-primary w-full py-3 text-sm font-semibold shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Review Your Day</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* 3. WHAT'S ON YOUR MIND (Quick Reflection Composer)                       */}
          {/* ========================================================================= */}
          <div className="pt-0.5">
            <JournalComposer
              variant="compact"
              commitmentId={activeCommitment?.id}
              onEntryCreated={handleJournalEntryCreated}
            />
          </div>

          {/* ========================================================================= */}
          {/* 4. SECONDARY SUPPORTING AREA: Daily Quote & Pause & Breathe               */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Quote className="w-4 h-4 text-[#B88452] shrink-0 opacity-75 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-serif italic text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    "{affirmation.quote}"
                  </p>
                  <span className="text-2xs text-[#B88452] font-semibold block">
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
          {/* 5. DAILY ACTIVITY CARD (Across All Anchors - Last Element)                 */}
          {/* ========================================================================= */}
          <DailyActivityCard
            commitments={commitments}
            activeCommitmentId={activeCommitmentId}
            onSelectCommitment={(id) => {
              setActiveCommitmentId(id);
            }}
            todayCheckIns={todayCheckIns}
            todayJournals={todayJournals}
            onOpenStepper={handleOpenStepper}
          />
        </main>

      {/* Stepper Modal for Morning / Evening */}
      {activeStepper && (
        <CheckInStepper
          isOpen={Boolean(activeStepper)}
          initialStage={activeStepper}
          commitmentName={(stepperCommitment || activeCommitment)?.name || "Daily Anchor"}
          commitmentWhy={(stepperCommitment || activeCommitment)?.why || undefined}
          commitmentId={(stepperCommitment || activeCommitment)?.id}
          onClose={() => {
            setActiveStepper(null);
            setStepperCommitment(null);
          }}
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
        className="fixed bottom-floating-fab right-5 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white flex items-center justify-center shadow-organic-lg hover:shadow-organic-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#C86D51]/30 group"
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
