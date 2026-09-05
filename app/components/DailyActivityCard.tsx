"use client";

import { useState, useMemo } from "react";
import {
  Sun,
  Moon,
  PencilSimple as PenLine,
  CheckCircle as CheckCircle2,
  Circle,
  Compass,
  CaretDown,
  CaretUp,
  ArrowRight,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

interface DailyActivityCardProps {
  commitments: Commitment[];
  activeCommitmentId: string;
  onSelectCommitment: (id: string) => void;
  todayCheckIns: CheckIn[];
  todayJournals: JournalEntry[];
  onOpenStepper: (stage: "morning" | "evening", commitment: Commitment) => void;
}

export default function DailyActivityCard({
  commitments,
  activeCommitmentId,
  onSelectCommitment,
  todayCheckIns,
  todayJournals,
  onOpenStepper,
}: DailyActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute total possible check-ins today across all active anchors (2 per anchor: morning + evening)
  const totalPossibleCheckIns = commitments.length * 2;
  const completedCheckInsCount = todayCheckIns.length;
  const progressPercent =
    totalPossibleCheckIns > 0
      ? Math.round((completedCheckInsCount / totalPossibleCheckIns) * 100)
      : 0;

  // Aggregate chronological activities today
  const activities = useMemo(() => {
    const list: Array<{
      id: string;
      type: "morning" | "evening" | "journal";
      timestamp?: string | Date;
      commitment?: Commitment;
      commitmentName: string;
      commitmentColor: string;
      checkIn?: CheckIn;
      journal?: JournalEntry;
    }> = [];

    // Morning check-ins
    todayCheckIns
      .filter((c) => c.type === "morning")
      .forEach((c) => {
        const comm = commitments.find((cm) => cm.id === c.commitmentId);
        const color = PALETTE_HEX[(comm?.colorIndex ?? 0) % PALETTE_HEX.length] || "#C86D51";
        list.push({
          id: `morning-${c.id}`,
          type: "morning",
          timestamp: c.createdAt || undefined,
          commitment: comm,
          commitmentName: comm?.name || "Daily Anchor",
          commitmentColor: color,
          checkIn: c,
        });
      });

    // Evening check-ins
    todayCheckIns
      .filter((c) => c.type === "evening")
      .forEach((c) => {
        const comm = commitments.find((cm) => cm.id === c.commitmentId);
        const color = PALETTE_HEX[(comm?.colorIndex ?? 0) % PALETTE_HEX.length] || "#C86D51";
        list.push({
          id: `evening-${c.id}`,
          type: "evening",
          timestamp: c.createdAt || undefined,
          commitment: comm,
          commitmentName: comm?.name || "Daily Anchor",
          commitmentColor: color,
          checkIn: c,
        });
      });

    // Written journals
    todayJournals.forEach((j) => {
      const comm = commitments.find((cm) => cm.id === j.commitmentId);
      const color = comm
        ? PALETTE_HEX[(comm.colorIndex ?? 0) % PALETTE_HEX.length]
        : "#786F66";
      list.push({
        id: `journal-${j.id}`,
        type: "journal",
        timestamp: j.createdAt || undefined,
        commitment: comm,
        commitmentName: comm?.name || "Journal Entry",
        commitmentColor: color,
        journal: j,
      });
    });

    return list;
  }, [todayCheckIns, todayJournals, commitments]);

  const totalActionsToday = activities.length;

  return (
    <section
      aria-label="Daily Activity Across All Anchors"
      className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-title text-base sm:text-lg font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                Today Across All Anchors
              </h2>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E] font-medium">
                {commitments.length} {commitments.length === 1 ? "anchor" : "anchors"}
              </span>
            </div>
            <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
              {completedCheckInsCount} of {totalPossibleCheckIns} check-ins logged
              {todayJournals.length > 0 && ` • ${todayJournals.length} written ${todayJournals.length === 1 ? "note" : "notes"}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            setIsExpanded(!isExpanded);
          }}
          className="p-2 rounded-xl text-[#786F66] dark:text-[#A8A096] hover:bg-[#FAF7F2] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
          aria-label={isExpanded ? "Collapse daily activity" : "Expand daily activity"}
          title={isExpanded ? "Collapse activity view" : "Expand activity view"}
        >
          {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress Momentum Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096]">
          <span className="uppercase tracking-wider font-semibold">Today's Rhythm</span>
          <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
            {progressPercent}% completed
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#F3EFE7] dark:bg-[#1E1B18] overflow-hidden p-0.5 border border-[#EAE3D7] dark:border-[#38332E]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C86D51] via-[#B88452] to-[#658B70] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, totalActionsToday > 0 ? 8 : 0)}%` }}
          />
        </div>
      </div>

      {/* Per-Anchor Status Matrix */}
      {commitments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {commitments.map((comm) => {
            const isActive = comm.id === activeCommitmentId;
            const colorHex = PALETTE_HEX[comm.colorIndex % PALETTE_HEX.length] || "#C86D51";

            const morningDone = todayCheckIns.some(
              (c) => c.commitmentId === comm.id && c.type === "morning"
            );
            const eveningCheckIn = todayCheckIns.find(
              (c) => c.commitmentId === comm.id && c.type === "evening"
            );
            const eveningDone = Boolean(eveningCheckIn);

            return (
              <div
                key={comm.id}
                onClick={() => {
                  if (!isActive) {
                    triggerHaptic(10);
                    onSelectCommitment(comm.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 cursor-pointer ${
                  isActive
                    ? "bg-[#FAF7F2] dark:bg-[#201D1A] border-[#C86D51]/50 shadow-2xs ring-1 ring-[#C86D51]/20"
                    : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51]/30 hover:bg-[#FAF7F2]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] truncate">
                      {comm.name}
                    </span>
                  </div>
                  {isActive ? (
                    <span className="text-2xs px-2 py-0.5 rounded-full bg-[#C86D51] text-white font-semibold shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="text-2xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] shrink-0 font-medium underline">
                      Focus →
                    </span>
                  )}
                </div>

                {/* Status Badges for Morning & Evening */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Morning Chip */}
                  <div
                    onClick={(e) => {
                      if (!morningDone) {
                        e.stopPropagation();
                        triggerHaptic(10);
                        onOpenStepper("morning", comm);
                      }
                    }}
                    className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-2xs transition-colors ${
                      morningDone
                        ? "bg-[#FAF2EA] dark:bg-[#352A1E] border-[#F2D7CE] dark:border-[#4D332B] text-[#B88452] font-semibold"
                        : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:border-[#B88452]/50 cursor-pointer"
                    }`}
                    title={morningDone ? "Morning intention anchored" : "Click to anchor morning intention"}
                  >
                    {morningDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-[#B88452] shrink-0 opacity-70" />
                    )}
                    <span className="truncate">
                      {morningDone ? "Morning Set" : "Set Morning +"}
                    </span>
                  </div>

                  {/* Evening Chip */}
                  <div
                    onClick={(e) => {
                      if (!eveningDone) {
                        e.stopPropagation();
                        triggerHaptic(10);
                        onOpenStepper("evening", comm);
                      }
                    }}
                    className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-2xs transition-colors ${
                      eveningDone
                        ? "bg-[#F9EBE7] dark:bg-[#38251F] border-[#F2D7CE] dark:border-[#4D332B] text-[#C86D51] font-semibold"
                        : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:border-[#C86D51]/50 cursor-pointer"
                    }`}
                    title={
                      eveningDone
                        ? `Evening reviewed (${eveningCheckIn?.status || "done"})`
                        : "Click to review evening"
                    }
                  >
                    {eveningDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-[#C86D51] shrink-0 opacity-70" />
                    )}
                    <span className="truncate">
                      {eveningDone
                        ? eveningCheckIn?.status === "yes"
                          ? "Reviewed ✓"
                          : eveningCheckIn?.status === "partial"
                          ? "Adjusted ✓"
                          : "Learned ✓"
                        : "Review Day +"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Activity Stream */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-[#EAE3D7] dark:border-[#38332E] space-y-3 overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096]">
              <span className="uppercase tracking-wider font-semibold">
                Completed Activities ({activities.length})
              </span>
              <span>All anchors</span>
            </div>

            {activities.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-center space-y-2">
                <Sparkle className="w-5 h-5 text-[#B88452] mx-auto opacity-75" />
                <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096]">
                  No activities recorded yet today across your anchors.
                </p>
                <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                  Take 15 seconds to set your morning intention or jot down a quick thought.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.map((act) => {
                  if (act.type === "morning" && act.checkIn) {
                    const c = act.checkIn;
                    return (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: act.commitmentColor }}
                            />
                            <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                              {act.commitmentName}
                            </span>
                            <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FFFFFF]/80 dark:bg-[#201D1A]/80 text-[#B88452] font-semibold flex items-center gap-1">
                              <Sun className="w-3 h-3" />
                              Morning Intention
                            </span>
                          </div>

                          {act.commitment && act.commitment.id !== activeCommitmentId && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic(8);
                                onSelectCommitment(act.commitment!.id);
                              }}
                              className="text-2xs text-[#B88452] hover:underline font-medium cursor-pointer"
                            >
                              Switch to this anchor
                            </button>
                          )}
                        </div>

                        {c.plannedActions && c.plannedActions.length > 0 && (
                          <div className="space-y-1 text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                            {c.plannedActions.map((action: string, i: number) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {c.intentionNote && (
                          <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096]">
                            "{c.intentionNote}"
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (act.type === "evening" && act.checkIn) {
                    const c = act.checkIn;
                    return (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] border border-[#F2D7CE] dark:border-[#4D332B] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: act.commitmentColor }}
                            />
                            <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                              {act.commitmentName}
                            </span>
                            <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FFFFFF]/80 dark:bg-[#201D1A]/80 text-[#C86D51] font-semibold flex items-center gap-1">
                              <Moon className="w-3 h-3" />
                              Evening Reflection
                            </span>
                          </div>

                          <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#201D1A] text-[#C86D51] font-semibold">
                            {c.status === "yes"
                              ? "Followed Through"
                              : c.status === "partial"
                              ? "Adjusted"
                              : "Learned"}
                          </span>
                        </div>

                        {c.reflection && (
                          <p className="font-serif italic text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                            "{c.reflection}"
                          </p>
                        )}

                        {c.lessonsLearned && (
                          <div className="pt-1 text-2xs border-t border-[#C86D51]/20">
                            <span className="font-semibold text-[#C86D51]">Lesson Learned: </span>
                            <span className="italic text-[#2C2520] dark:text-[#ECE7E0]">
                              {c.lessonsLearned}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (act.type === "journal" && act.journal) {
                    const j = act.journal;
                    return (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: act.commitmentColor }}
                            />
                            <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                              {act.commitmentName}
                            </span>
                            <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E] flex items-center gap-1">
                              <PenLine className="w-3 h-3 text-[#C86D51]" />
                              Journal Reflection
                            </span>
                          </div>

                          {j.moodValence !== null && j.moodValence !== undefined && (
                            <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold">
                              Mood {j.moodValence > 0 ? `+${j.moodValence}` : j.moodValence}
                            </span>
                          )}
                        </div>

                        <p className="font-serif text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed whitespace-pre-wrap">
                          {j.content}
                        </p>

                        {j.tags && j.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {j.tags.map((tg) => (
                              <span
                                key={tg}
                                className="text-2xs px-2 py-0.5 rounded-md bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E]"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
