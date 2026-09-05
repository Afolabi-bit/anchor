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
  ArrowRight,
  Plus,
  HandHeart as MessageSquareHeart,
  Sparkle,
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

  // Time-aware horizon: before 2:00 PM is Morning Intention, after 2:00 PM is Evening Reflection
  const currentHour = new Date().getHours();
  const isEveningHorizon = currentHour >= 14;

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

  const greeting = isEveningHorizon ? "Good evening" : "Good morning";

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);
  const [stepperCommitment, setStepperCommitment] = useState<Commitment | null>(null);

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
      <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-6 sm:py-8 space-y-6 pb-28">
        {/* ========================================================================= */}
        {/* 1. SANCTUARY HEADER & HORIZONTAL ANCHOR BAR                               */}
        {/* ========================================================================= */}
        <header className="space-y-3.5">
          {/* Top Line: Date, Greeting, Grounding Drawer */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-2xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
                {formattedDate}
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] tracking-tight">
                {greeting}{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
            </div>
            <div className="shrink-0 pt-0.5">
              <GroundingDrawer />
            </div>
          </div>

          {/* Horizontal Anchor Pill Switcher */}
          {commitments.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {commitments.map((c) => {
                  const isSelected = c.id === activeCommitmentId;
                  const colorHex = PALETTE_HEX[c.colorIndex % PALETTE_HEX.length] || "#C86D51";

                  const isMorningDone = todayCheckIns.some(
                    (ck) => ck.commitmentId === c.id && ck.type === "morning"
                  );
                  const isEveningDone = todayCheckIns.some(
                    (ck) => ck.commitmentId === c.id && ck.type === "evening"
                  );
                  const isAllDone = isMorningDone && isEveningDone;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveCommitmentId(c.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] shadow-organic-sm font-semibold"
                          : "bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span>{c.name}</span>
                      {isAllDone && <Check className="w-3 h-3 text-[#658B70]" />}
                    </button>
                  );
                })}

                {/* Inline Add Anchor Button */}
                {commitments.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setNewModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:border-[#C86D51] hover:text-[#C86D51] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Add new anchor"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Anchor</span>
                  </button>
                )}
              </div>

              {/* Active Anchor Purpose / Why */}
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
        {/* 2. THE DAY'S RHYTHM (Unified Morning & Evening Ritual)                     */}
        {/* ========================================================================= */}
        {activeCommitment && (
          <section aria-label="Today's Rhythm" className="space-y-3">
            <div className="flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096]">
              <span className="uppercase tracking-wider font-semibold">
                Daily Rhythm
              </span>
              <span>{activeCommitment.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* -------------------- MORNING INTENTION CARD -------------------- */}
              <div
                className={`p-5 rounded-3xl border clay-card shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
                  morningCheckIn
                    ? "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E]"
                    : !isEveningHorizon
                    ? "bg-[#FFFFFF] dark:bg-[#25221F] border-[#B88452]/40 ring-1 ring-[#B88452]/20"
                    : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E]"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
                        <Sun className="w-4 h-4" />
                      </div>
                      <h2 className="font-serif-title text-base font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                        Morning Intention
                      </h2>
                    </div>

                    {morningCheckIn ? (
                      <span className="text-2xs text-[#658B70] dark:text-[#82A78C] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </span>
                    ) : !isEveningHorizon ? (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]">
                        Active
                      </span>
                    ) : null}
                  </div>

                  {/* Card Content */}
                  {morningCheckIn ? (
                    <div className="space-y-2 text-xs pt-1">
                      {morningCheckIn.plannedActions && morningCheckIn.plannedActions.length > 0 && (
                        <div className="space-y-1.5">
                          {morningCheckIn.plannedActions.map((act: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[#2C2520] dark:text-[#ECE7E0]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                              <span className="leading-snug">{act}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {morningCheckIn.intentionNote && (
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] pt-1 leading-relaxed">
                          &ldquo;{morningCheckIn.intentionNote}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed pt-1">
                      Set your focus and intentional actions for today.
                    </p>
                  )}
                </div>

                {/* Card Footer / Action */}
                {morningCheckIn ? (
                  morningCheckIn.createdAt && (
                    <div className="pt-1 text-right text-2xs text-[#786F66]/60 dark:text-[#A8A096]/60">
                      {formatTimeFromTimestamp(morningCheckIn.createdAt)}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      handleOpenStepper("morning", activeCommitment);
                    }}
                    className="btn-primary w-full py-2.5 text-xs font-semibold shadow-organic-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Set Intention</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* -------------------- EVENING REFLECTION CARD -------------------- */}
              <div
                className={`p-5 rounded-3xl border clay-card shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
                  eveningCheckIn
                    ? "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E]"
                    : isEveningHorizon
                    ? "bg-[#FFFFFF] dark:bg-[#25221F] border-[#C86D51]/40 ring-1 ring-[#C86D51]/20"
                    : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E]"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs shrink-0">
                        <Moon className="w-4 h-4" />
                      </div>
                      <h2 className="font-serif-title text-base font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                        Evening Review
                      </h2>
                    </div>

                    {eveningCheckIn ? (
                      <span className="text-2xs text-[#658B70] dark:text-[#82A78C] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </span>
                    ) : isEveningHorizon ? (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]">
                        Active
                      </span>
                    ) : null}
                  </div>

                  {/* Card Content */}
                  {eveningCheckIn ? (
                    <div className="space-y-2 text-xs pt-1">
                      {eveningCheckIn.reflection && (
                        <p className="font-serif italic text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                          &ldquo;{eveningCheckIn.reflection}&rdquo;
                        </p>
                      )}
                      {eveningCheckIn.lessonsLearned && (
                        <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                          <strong className="text-[#C86D51] font-medium">Lesson: </strong>
                          <span className="italic">{eveningCheckIn.lessonsLearned}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed pt-1">
                      Pause and reflect honestly on how today unfolded.
                    </p>
                  )}
                </div>

                {/* Card Footer / Action */}
                {eveningCheckIn ? (
                  eveningCheckIn.createdAt && (
                    <div className="pt-1 text-right text-2xs text-[#786F66]/60 dark:text-[#A8A096]/60">
                      {formatTimeFromTimestamp(eveningCheckIn.createdAt)}
                    </div>
                  )
                ) : (
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
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. AMBIENT QUICK REFLECTION CAPTURE                                       */}
        {/* ========================================================================= */}
        <div className="pt-1">
          <JournalComposer
            variant="compact"
            commitmentId={activeCommitment?.id}
            onEntryCreated={handleJournalEntryCreated}
          />
        </div>

        {/* ========================================================================= */}
        {/* 4. TODAY'S JOURNEY (Connected Activity Timeline)                          */}
        {/* ========================================================================= */}
        <DailyActivityCard
          commitments={commitments}
          todayCheckIns={todayCheckIns}
          todayJournals={todayJournals}
        />

        {/* ========================================================================= */}
        {/* 5. AMBIENT DAILY WISDOM                                                   */}
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
