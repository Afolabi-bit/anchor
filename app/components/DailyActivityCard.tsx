"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sun,
  Moon,
  PencilSimple as PenLine,
  CheckCircle as CheckCircle2,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";
import { syncClientTimeLogs, ClientActivityLog } from "@/lib/client-time-log";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

interface DailyActivityCardProps {
  commitments: Commitment[];
  todayCheckIns: CheckIn[];
  todayJournals: JournalEntry[];
  // Optional backwards-compatibility props
  activeCommitmentId?: string;
  onSelectCommitment?: (id: string) => void;
  onOpenStepper?: (stage: "morning" | "evening", commitment: Commitment) => void;
}

export default function DailyActivityCard({
  commitments,
  todayCheckIns,
  todayJournals,
}: DailyActivityCardProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Client-side time logs saved strictly in localStorage
  const [clientLogs, setClientLogs] = useState<ClientActivityLog[]>([]);

  useEffect(() => {
    // Synchronize client-side time logs in localStorage
    const synced = syncClientTimeLogs(todayStr, todayCheckIns, todayJournals, commitments);
    setClientLogs(synced);
  }, [todayStr, todayCheckIns, todayJournals, commitments]);

  if (commitments.length === 0) return null;

  return (
    <section
      aria-label="Today's Journey Timeline"
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4"
    >
      {/* Header: Title and count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] dark:bg-[#2E2A26] border border-[#EAE3D7] dark:border-[#38332E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
              Today&apos;s Journey
            </h3>
            <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
              {clientLogs.length === 0
                ? "No entries recorded yet today"
                : `${clientLogs.length} moment${clientLogs.length === 1 ? "" : "s"} logged`}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {clientLogs.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#FAF7F2]/60 dark:bg-[#1E1B18]/60 border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-center space-y-1.5">
          <Sparkle className="w-4 h-4 text-[#B88452] mx-auto opacity-70" />
          <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096]">
            Your day is an open page.
          </p>
          <p className="text-2xs text-[#786F66] dark:text-[#A8A096]">
            Set your morning intention above to begin today&apos;s timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-5 space-y-4 before:absolute before:left-1.5 sm:before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE3D7] dark:before:bg-[#38332E]">
          {clientLogs.map((log) => {
            const colorHex =
              PALETTE_HEX[(log.commitmentColorIndex ?? 0) % PALETTE_HEX.length] || "#C86D51";

            return (
              <div key={log.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className="absolute -left-4 sm:-left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border-2 flex items-center justify-center -translate-x-1/2"
                  style={{ borderColor: colorHex }}
                />

                {/* Entry Card */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs space-y-2 transition-all">
                  {/* Event Header: Anchor, Type, Time */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0] truncate">
                        {log.commitmentName}
                      </span>
                      <span className="text-[#786F66]/40 dark:text-[#A8A096]/40">/</span>
                      <span className="text-2xs text-[#786F66] dark:text-[#A8A096] truncate flex items-center gap-1">
                        {log.type === "morning_checkin" && <Sun className="w-3 h-3 text-[#B88452]" />}
                        {log.type === "evening_checkin" && <Moon className="w-3 h-3 text-[#C86D51]" />}
                        {log.type === "journal_entry" && <PenLine className="w-3 h-3 text-[#658B70]" />}
                        <span>{log.title}</span>
                      </span>
                    </div>

                    <span className="text-2xs text-[#786F66] dark:text-[#A8A096] font-mono shrink-0">
                      {log.timeStr}
                    </span>
                  </div>

                  {/* Morning details */}
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
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096]">
                          &ldquo;{log.detail}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Evening details */}
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
                        <p className="font-serif italic text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
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

                  {/* Journal entry details */}
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
