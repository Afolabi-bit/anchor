"use client";

import { useState, useEffect, useMemo } from "react";
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
  Check,
  CheckCircle as CheckCircle2,
  ArrowRight,
  Plus,
  CaretDown,
  HandHeart as MessageSquareHeart,
  Sparkle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";
import { recordClientActivityLog, formatTimeFromTimestamp } from "@/lib/client-time-log";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function TodayPage() {
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
  const [showCommitmentDropdown, setShowCommitmentDropdown] = useState(false);

  // Time-aware greeting & windows
  const currentHour = new Date().getHours();
  const isMorning = currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isEvening = currentHour >= 17;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date());
    } catch {
      return "Today";
    }
  }, []);

  const greeting = isMorning
    ? "Good morning"
    : isAfternoon
    ? "Good afternoon"
    : "Good evening";

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);
  const [stepperCommitment, setStepperCommitment] = useState<Commitment | null>(null);

  // Daily Affirmation quote (confirmed not duplicated elsewhere)
  const affirmation = getTodayAffirmation();

  // Background refresh of check-ins, journals, and sponsor messages
  useEffect(() => {
    refreshCheckIns(todayStr);
    refreshJournals();
    refreshPartnerMessages();
  }, [todayStr, refreshCheckIns, refreshJournals, refreshPartnerMessages]);

  // Strictly scoped check-ins for the active commitment
  const todayCheckIns = useMemo(() => {
    return checkIns.filter(
      (c: CheckIn) => c.date === todayStr && c.commitmentId === activeCommitment?.id
    );
  }, [checkIns, todayStr, activeCommitment?.id]);

  // Strictly scoped journals for the active commitment
  const todayJournals = useMemo(() => {
    return journalEntries.filter(
      (j: JournalEntry) => j.date === todayStr && j.commitmentId === activeCommitment?.id
    );
  }, [journalEntries, todayStr, activeCommitment?.id]);

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

  const isMorningDone = Boolean(morningCheckIn);
  const isEveningDone = Boolean(eveningCheckIn);
  const isAllCheckInsDone = isMorningDone && isEveningDone;

  const activeColorHex = PALETTE_HEX[activeCommitment?.colorIndex ?? 0] || "#C86D51";

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
    const isAlreadySealed = checkIns.some(
      (c) => c.commitmentId === comm.id && c.date === todayStr && c.type === stage
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
      <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-6 sm:py-8 space-y-6 pb-28">
        {/* ========================================================================= */}
        {/* 1. SIMPLIFIED HEADER: Greeting, Breathe, Dropdown, Why Quote              */}
        {/* ========================================================================= */}
        <header className="space-y-3">
          {/* Top Line: Date, Greeting, Icon-only Grounding */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-2xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                {formattedDate}
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] tracking-tight truncate">
                {greeting}{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
            </div>

            {/* Top-Right Tools: Icon-only Pause & Breathe */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <GroundingDrawer iconOnly />
            </div>
          </div>

          {/* Commitment Dropdown Switcher */}
          {commitments.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setShowCommitmentDropdown(!showCommitmentDropdown);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={showCommitmentDropdown}
                  className="w-full sm:w-auto min-w-[200px] px-4 py-2 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs hover:border-[#C86D51]/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: activeColorHex }}
                    />
                    <span className="font-semibold text-sm text-[#2C2520] dark:text-[#ECE7E0] truncate">
                      {activeCommitment?.name || "Select Anchor"}
                    </span>
                  </div>
                  <CaretDown
                    className={`w-3.5 h-3.5 text-[#786F66] dark:text-[#A8A096] transition-transform duration-200 shrink-0 ${
                      showCommitmentDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popover */}
                <AnimatePresence>
                  {showCommitmentDropdown && (
                    <>
                      {/* Click outside overlay */}
                      <div
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={() => setShowCommitmentDropdown(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-full sm:w-80 p-2 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-lg z-40 space-y-1"
                      >
                        <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold border-b border-[#EAE3D7] dark:border-[#38332E]">
                          Switch Active Anchor
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                          {commitments.map((c) => {
                            const isSelected = c.id === activeCommitmentId;
                            const colorHex = PALETTE_HEX[c.colorIndex % PALETTE_HEX.length] || "#C86D51";

                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic(10);
                                  setActiveCommitmentId(c.id);
                                  setShowCommitmentDropdown(false);
                                }}
                                className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-[#FAF7F2] dark:bg-[#2E2A26] text-[#2C2520] dark:text-[#ECE7E0] font-medium"
                                    : "hover:bg-[#FAF7F2]/60 dark:hover:bg-[#2E2A26]/60 text-[#786F66] dark:text-[#A8A096]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: colorHex }}
                                  />
                                  <div className="truncate">
                                    <span className="text-xs sm:text-sm block truncate text-[#2C2520] dark:text-[#ECE7E0]">
                                      {c.name}
                                    </span>
                                    {c.why && (
                                      <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] italic block truncate">
                                        &ldquo;{c.why}&rdquo;
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

                        {commitments.length < 5 && (
                          <div className="pt-1 border-t border-[#EAE3D7] dark:border-[#38332E]">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCommitmentDropdown(false);
                                setNewModalOpen(true);
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-[#2E2A26] text-xs font-semibold text-[#C86D51] dark:text-[#DB8165] flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Anchor</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected Commitment's Why Quote */}
              {activeCommitment?.why && (
                <p className="font-serif italic text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed pt-0.5">
                  &ldquo;{activeCommitment.why}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card text-center space-y-3">
              <Sparkle className="w-5 h-5 text-[#C86D51] mx-auto opacity-80" />
              <div className="space-y-1">
                <h3 className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">
                  Begin Your Journey
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                  Anchor is your daily compass. Set your first personal commitment to begin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Create First Anchor
              </button>
            </div>
          )}
        </header>

        {/* Partner Encouragement Message Banner */}
        {partnerMessages.length > 0 && (
          <div className="space-y-2">
            {partnerMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -4 }}
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
                      &ldquo;{msg.message}&rdquo;
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
        {/* 2. THE DAY'S RHYTHM (NEXT PENDING ACTION ONLY - DEDUPLICATED)              */}
        {/* ========================================================================= */}
        {activeCommitment && (
          <section aria-label="Daily Rhythm" className="space-y-2.5">
            <div className="flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096]">
              <span className="uppercase tracking-wider font-semibold">
                Daily Rhythm
              </span>
            </div>

            {/* Condition 1: Both check-ins done or evening check-in is complete -> Collapsed Reassurance */}
            {isAllCheckInsDone || isEveningDone ? (
              <div className="p-4 rounded-3xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] clay-card shadow-2xs flex items-center justify-between gap-3 text-xs text-[#658B70] dark:text-[#82A78C] font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#658B70]" />
                  <span>All check-ins complete for {activeCommitment.name} today.</span>
                </div>
              </div>
            ) : !isEvening ? (
              /* ========================================================================= */
              /* DAYTIME (Not evening yet)                                                 */
              /* ========================================================================= */
              !isMorningDone ? (
                /* Daytime & Morning NOT set: Morning Intention Card */
                <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#B88452]/40 clay-card shadow-2xs space-y-3.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
                        <Sun className="w-4 h-4" />
                      </div>
                      <h2 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
                        Morning Intention
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    Set your focus and intentional planned actions for today.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      handleOpenStepper("morning", activeCommitment);
                    }}
                    className="btn-primary w-full py-2.5 text-xs font-semibold shadow-organic-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Set Morning Intention</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Daytime & Morning IS set: Display Active Daytime Intention Guide */
                <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
                        <Sun className="w-4 h-4" />
                      </div>
                      <h2 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
                        Today&apos;s Intention
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        handleOpenStepper("evening", activeCommitment);
                      }}
                      className="text-2xs text-[#786F66] hover:text-[#C86D51] dark:text-[#A8A096] dark:hover:text-[#DB8165] transition-colors cursor-pointer font-medium"
                      title="Review day early"
                    >
                      Review early &rarr;
                    </button>
                  </div>

                  {morningCheckIn?.intentionNote && (
                    <p className="font-serif italic text-xs sm:text-sm text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed bg-[#FAF7F2] dark:bg-[#1E1B18] p-3 rounded-2xl border border-[#EAE3D7]/70 dark:border-[#38332E]/70">
                      &ldquo;{morningCheckIn.intentionNote}&rdquo;
                    </p>
                  )}

                  {morningCheckIn?.plannedActions && morningCheckIn.plannedActions.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-2xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                        Planned Actions
                      </span>
                      <div className="space-y-1">
                        {morningCheckIn.plannedActions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                            <span className="leading-snug">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096] border-t border-[#EAE3D7]/60 dark:border-[#38332E]/60">
                    <span>Carrying your intention through today</span>
                    <span className="font-mono">Evening review opens at 5 PM</span>
                  </div>
                </div>
              )
            ) : (
              /* ========================================================================= */
              /* EVENING (>= 17:00 / 5:00 PM)                                              */
              /* ========================================================================= */
              <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51]/40 clay-card shadow-2xs space-y-3.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs shrink-0">
                      <Moon className="w-4 h-4" />
                    </div>
                    <h2 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
                      Evening Review
                    </h2>
                  </div>
                </div>

                {/* Contextual guidance based on whether morning intention was set */}
                {isMorningDone && morningCheckIn?.intentionNote ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      Pause and reflect on your day against your morning intention:
                    </p>
                    <p className="font-serif italic text-xs text-[#2C2520] dark:text-[#ECE7E0] bg-[#FAF7F2] dark:bg-[#1E1B18] px-3 py-2 rounded-xl border border-[#EAE3D7]/60 dark:border-[#38332E]/60">
                      &ldquo;{morningCheckIn.intentionNote}&rdquo;
                    </p>
                  </div>
                ) : isMorningDone ? (
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    Pause and reflect honestly on how today unfolded.
                  </p>
                ) : (
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    No morning intention set today — your evening reflection still counts.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    handleOpenStepper("evening", activeCommitment);
                  }}
                  className="btn-primary w-full py-2.5 text-xs font-semibold shadow-organic-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Review Day</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {!isMorningDone && (
                  <div className="pt-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        handleOpenStepper("morning", activeCommitment);
                      }}
                      className="text-2xs text-[#786F66] hover:text-[#B88452] dark:text-[#A8A096] dark:hover:text-[#D4A373] transition-colors cursor-pointer"
                    >
                      Set morning intention retroactively &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. AMBIENT CAPTURE COMPOSER (FIXED CONSISTENT POSITION)                   */}
        {/* ========================================================================= */}
        <div className="pt-0.5">
          <JournalComposer
            variant="compact"
            commitmentId={activeCommitment?.id}
            onEntryCreated={handleJournalEntryCreated}
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. ACTIVITIES (STRICTLY SCOPED TO SELECTED COMMITMENT)                    */}
        {/* ========================================================================= */}
        <DailyActivityCard
          commitments={commitments}
          activeCommitmentId={activeCommitment?.id}
          todayCheckIns={todayCheckIns}
          todayJournals={todayJournals}
        />

        {/* ========================================================================= */}
        {/* 5. BOTTOM-OF-SCROLL DAILY WISDOM (NOT DUPLICATED ELSEWHERE)               */}
        {/* ========================================================================= */}
        <footer className="pt-2 pb-4 text-center space-y-1">
          <p className="font-serif italic text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed max-w-md mx-auto">
            &ldquo;{affirmation.quote}&rdquo;
          </p>
          <span className="text-2xs font-semibold text-[#B88452] block">
            — {affirmation.author}
          </span>
        </footer>
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
