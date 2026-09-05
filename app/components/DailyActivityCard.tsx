"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sun,
  Moon,
  CheckCircle as CheckCircle2,
  Clock,
} from "@phosphor-icons/react";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";
import { syncClientTimeLogs, ClientActivityLog } from "@/lib/client-time-log";

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
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Client-side time logs saved strictly in localStorage
  const [clientLogs, setClientLogs] = useState<ClientActivityLog[]>([]);

  useEffect(() => {
    // Synchronize client-side time logs in localStorage
    const synced = syncClientTimeLogs(todayStr, todayCheckIns, todayJournals, commitments);
    setClientLogs(synced);
  }, [todayStr, todayCheckIns, todayJournals, commitments]);

  // If user has no commitments, don't show the card
  if (commitments.length === 0) return null;

  const totalPossible = commitments.length * 2;
  const completedCheckIns = todayCheckIns.length;
  const progressPercent =
    totalPossible > 0 ? Math.round((completedCheckIns / totalPossible) * 100) : 0;

  return (
    <section
      aria-label="Daily Activity"
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-5"
    >
      {/* Header: Title and Progress */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] dark:bg-[#2E2A26] border border-[#EAE3D7] dark:border-[#38332E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
              Today&apos;s Activity
            </h2>
            <p className="text-2xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
              {completedCheckIns} of {totalPossible} check-ins completed
              {todayJournals.length > 0 && `, ${todayJournals.length} written reflection${todayJournals.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <div className="w-14 h-1.5 rounded-full bg-[#F3EFE7] dark:bg-[#1E1B18] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#658B70] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-2xs font-semibold text-[#786F66] dark:text-[#A8A096]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Anchor Status Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {commitments.map((comm) => {
          const isActive = comm.id === activeCommitmentId;
          const colorHex = PALETTE_HEX[comm.colorIndex % PALETTE_HEX.length] || "#C86D51";

          const morningLog = clientLogs.find(
            (l) => l.commitmentId === comm.id && l.type === "morning_checkin"
          );
          const eveningLog = clientLogs.find(
            (l) => l.commitmentId === comm.id && l.type === "evening_checkin"
          );

          const isMorningSealed = Boolean(morningLog);
          const isEveningSealed = Boolean(eveningLog);

          return (
            <div
              key={comm.id}
              onClick={() => {
                if (!isActive) {
                  triggerHaptic(8);
                  onSelectCommitment(comm.id);
                }
              }}
              style={{ borderLeftColor: colorHex, borderLeftWidth: "3px" }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                isActive
                  ? "bg-[#FAF7F2] dark:bg-[#201D1A] border-[#C86D51]/40 ring-1 ring-[#C86D51]/20 shadow-2xs"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] hover:bg-[#FAF7F2]/50 hover:border-[#C86D51]/30"
              }`}
            >
              {/* Anchor Identity */}
              <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] truncate min-w-0">
                {comm.name}
              </span>

              {/* Status Actions: Morning & Evening */}
              <div className="flex items-center gap-2 shrink-0">
                {isMorningSealed ? (
                  <span
                    className="flex items-center gap-1 text-2xs text-[#658B70] dark:text-[#82A78C] font-medium"
                    title={morningLog?.timeStr ? `Completed at ${morningLog.timeStr}` : undefined}
                  >
                    <Sun className="w-3 h-3 text-[#B88452]" />
                    <span>{morningLog?.timeStr || "Done"}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(8);
                      onOpenStepper("morning", comm);
                    }}
                    className="flex items-center gap-1 text-2xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] transition-colors cursor-pointer"
                    title="Set morning intention"
                  >
                    <Sun className="w-3 h-3 opacity-40" />
                    <span>Morning</span>
                  </button>
                )}

                {isEveningSealed ? (
                  <span
                    className="flex items-center gap-1 text-2xs text-[#658B70] dark:text-[#82A78C] font-medium"
                    title={eveningLog?.timeStr ? `Completed at ${eveningLog.timeStr}` : undefined}
                  >
                    <Moon className="w-3 h-3 text-[#C86D51]" />
                    <span>{eveningLog?.timeStr || "Done"}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(8);
                      onOpenStepper("evening", comm);
                    }}
                    className="flex items-center gap-1 text-2xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] transition-colors cursor-pointer"
                    title="Review evening"
                  >
                    <Moon className="w-3 h-3 opacity-40" />
                    <span>Evening</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Chronological Timeline */}
      <div className="pt-2 border-t border-[#EAE3D7] dark:border-[#38332E] space-y-3">
        <div className="flex items-center justify-between text-2xs text-[#786F66] dark:text-[#A8A096]">
          <span className="uppercase tracking-wider font-semibold">
            Timeline
          </span>
          {clientLogs.length > 0 && (
            <span>{clientLogs.length} {clientLogs.length === 1 ? "entry" : "entries"}</span>
          )}
        </div>

        {clientLogs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-center space-y-1">
            <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096]">
              No activity recorded yet today.
            </p>
            <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
              Set your morning intention above to begin today&apos;s timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clientLogs.map((log) => {
              const colorHex =
                PALETTE_HEX[(log.commitmentColorIndex ?? 0) % PALETTE_HEX.length] || "#C86D51";

              return (
                <div
                  key={log.id}
                  style={{ borderLeftColor: colorHex, borderLeftWidth: "3px" }}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs space-y-2 shadow-2xs"
                >
                  {/* Event Header: Anchor, Type, Time */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0] truncate">
                        {log.commitmentName}
                      </span>
                      <span className="text-[#786F66]/40 dark:text-[#A8A096]/40">/</span>
                      <span className="text-2xs text-[#786F66] dark:text-[#A8A096] truncate">
                        {log.title}
                      </span>
                    </div>

                    <span className="text-2xs text-[#786F66] dark:text-[#A8A096] font-medium shrink-0">
                      {log.timeStr}
                    </span>
                  </div>

                  {/* Event Specific Details */}
                  {log.type === "morning_checkin" && (
                    <div className="space-y-1.5 pt-0.5">
                      {log.plannedActions && log.plannedActions.length > 0 && (
                        <div className="space-y-1">
                          {log.plannedActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[#2C2520] dark:text-[#ECE7E0]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {log.detail && (
                        <p className="font-serif italic text-[#786F66] dark:text-[#A8A096]">
                          &ldquo;{log.detail}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {log.type === "evening_checkin" && (
                    <div className="space-y-1.5 pt-0.5">
                      {(log.status || log.emotion) && (
                        <div className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                          <span>
                            {log.status === "yes"
                              ? "Followed Through"
                              : log.status === "partial"
                              ? "Adjusted"
                              : "Learned"}
                          </span>
                          {log.emotion && (
                            <span className="italic text-[#658B70] dark:text-[#82A78C] ml-1.5">
                              ({log.emotion})
                            </span>
                          )}
                        </div>
                      )}
                      {log.detail && (
                        <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                          &ldquo;{log.detail}&rdquo;
                        </p>
                      )}
                      {log.lessonsLearned && (
                        <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                          <strong className="text-[#C86D51] font-medium">Lesson: </strong>
                          <span className="italic">{log.lessonsLearned}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {log.type === "journal_entry" && (
                    <div className="space-y-1 pt-0.5">
                      {log.detail && (
                        <p className="font-serif text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed whitespace-pre-wrap">
                          {log.detail}
                        </p>
                      )}
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5 text-2xs text-[#786F66] dark:text-[#A8A096]">
                          {log.tags.map((tg) => (
                            <span key={tg}>#{tg}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
