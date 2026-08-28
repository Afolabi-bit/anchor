"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import {
  BookOpen,
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "yes" | "partial" | "no">("all");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

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
        setUser(meData.user);

        const checkInsRes = await fetch("/api/checkins");
        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          setCheckIns(data.checkIns || []);
        }
      } catch (err) {
        console.error("Journal loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Group check-ins by Date
  const groupedByDate: Record<string, { morning?: any; evening?: any }> = {};
  checkIns.forEach((item) => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = {};
    }
    if (item.type === "morning") groupedByDate[item.date].morning = item;
    if (item.type === "evening") groupedByDate[item.date].evening = item;
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1));

  // Past 7 Days Strip
  const past7Days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    past7Days.push(d.toISOString().slice(0, 10));
  }

  // Filtered dates
  const filteredDates = sortedDates.filter((dateStr) => {
    if (filterStatus === "all") return true;
    const evening = groupedByDate[dateStr].evening;
    return evening?.status === filterStatus;
  });

  const toggleExpand = (dateStr: string) => {
    triggerHaptic(10);
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation userEmail={user?.email} />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-medium">
              Reflective Archive
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-1">
              Personal Journal
            </h1>
          </div>
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#F3EFE7] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] font-medium border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm">
            {filteredDates.length} {filteredDates.length === 1 ? "reflection" : "reflections"}
          </span>
        </div>

        {/* 7-Day Tactile Pebble Strip */}
        <div className="mb-8 p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
          <div className="flex items-center justify-between gap-1">
            {past7Days.map((dStr) => {
              const entry = groupedByDate[dStr];
              const eveningStatus = entry?.evening?.status;
              const hasMorning = Boolean(entry?.morning);

              return (
                <div key={dStr} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-[#786F66] dark:text-[#A8A096] font-medium">
                    {formatDateShort(dStr)}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs ${
                      eveningStatus === "yes"
                        ? "bg-[#658B70] text-white"
                        : eveningStatus === "partial"
                        ? "bg-[#B88452] text-white"
                        : eveningStatus === "no"
                        ? "bg-[#82786F] text-white"
                        : hasMorning
                        ? "border-2 border-[#B88452] bg-transparent"
                        : "bg-[#F3EFE7] dark:bg-[#2D2A26]"
                    }`}
                  >
                    {eveningStatus === "yes" ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : hasMorning ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88452]" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setFilterStatus("all");
              triggerHaptic(10);
            }}
            className={`text-xs px-4 py-2 rounded-full border transition-all cursor-pointer shrink-0 ${
              filterStatus === "all"
                ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] border-[#2C2520] font-medium shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            All Days
          </button>
          <button
            onClick={() => {
              setFilterStatus("yes");
              triggerHaptic(10);
            }}
            className={`text-xs px-4 py-2 rounded-full border transition-all cursor-pointer shrink-0 ${
              filterStatus === "yes"
                ? "bg-[#658B70] text-white border-[#658B70] font-medium shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            Followed Through
          </button>
          <button
            onClick={() => {
              setFilterStatus("partial");
              triggerHaptic(10);
            }}
            className={`text-xs px-4 py-2 rounded-full border transition-all cursor-pointer shrink-0 ${
              filterStatus === "partial"
                ? "bg-[#B88452] text-white border-[#B88452] font-medium shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            Partially
          </button>
          <button
            onClick={() => {
              setFilterStatus("no");
              triggerHaptic(10);
            }}
            className={`text-xs px-4 py-2 rounded-full border transition-all cursor-pointer shrink-0 ${
              filterStatus === "no"
                ? "bg-[#82786F] text-white border-[#82786F] font-medium shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            Learning Moments
          </button>
        </div>

        {/* Timeline Entries */}
        {loading ? (
          <div className="p-12 text-center text-sm font-serif-title text-[#786F66] dark:text-[#A8A096]">
            Gathering journal entries...
          </div>
        ) : filteredDates.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center space-y-3 clay-card shadow-organic-sm">
            <div className="w-12 h-12 rounded-full bg-[#F3EFE7] dark:bg-[#2E2A26] text-[#786F66] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
              Your journal is ready
            </h3>
            <p className="text-xs text-[#786F66] dark:text-[#A8A096] max-w-sm mx-auto leading-relaxed">
              As you complete your daily morning intentions and evening reflections, your honest reflections will gracefully appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDates.map((dateStr) => {
              const { morning, evening } = groupedByDate[dateStr];
              const isExpanded = expandedDates[dateStr] ?? true;

              return (
                <div
                  key={dateStr}
                  className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md transition-all duration-200"
                >
                  {/* Card Header Bar */}
                  <div
                    onClick={() => toggleExpand(dateStr)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center shadow-organic-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif-title text-base sm:text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                          {formatDate(dateStr)}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
                          {morning && <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-[#B88452]" /> Intention set</span>}
                          {morning && evening && <span>•</span>}
                          {evening && (
                            <span className="flex items-center gap-1">
                              <Moon className="w-3 h-3 text-[#C86D51]" />
                              {evening.status === "yes" ? "Followed through" : evening.status === "partial" ? "Partially" : "Reflected"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {evening?.status && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            evening.status === "yes"
                              ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C]"
                              : evening.status === "partial"
                              ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] dark:text-[#CFA070]"
                              : "bg-[#F0ECE6] dark:bg-[#2B2824] text-[#82786F] dark:text-[#A39A91]"
                          }`}
                        >
                          {evening.status === "yes" ? "Followed Through" : evening.status === "partial" ? "Partial" : "Reflected"}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#786F66]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#786F66]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[#EAE3D7] dark:border-[#38332E] space-y-4 text-xs">
                      {/* Morning Planned Micro-actions */}
                      {morning && (
                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2 shadow-organic-sm">
                          <span className="font-semibold uppercase tracking-wider text-[#B88452] flex items-center gap-1.5 text-[10px]">
                            <Sun className="w-3.5 h-3.5" />
                            Morning Intention & Plan:
                          </span>
                          {morning.plannedActions && morning.plannedActions.length > 0 ? (
                            <ul className="space-y-1.5 pl-1">
                              {morning.plannedActions.map((action: string, idx: number) => (
                                <li key={idx} className="text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C86D51]" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-[#786F66] dark:text-[#A8A096] italic">No specific actions set.</span>
                          )}

                          {morning.intentionNote && (
                            <p className="mt-2.5 pt-2 border-t border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] leading-relaxed italic font-serif">
                              "{morning.intentionNote}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Evening Reflection */}
                      {evening && (
                        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 shadow-organic-sm">
                          <span className="font-semibold uppercase tracking-wider text-[#C86D51] dark:text-[#DB8165] flex items-center gap-1.5 text-[10px]">
                            <Moon className="w-3.5 h-3.5" />
                            Evening Reflection:
                          </span>

                          {evening.reflection && (
                            <p className="font-serif text-sm text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed italic">
                              "{evening.reflection}"
                            </p>
                          )}

                          {/* Tag Chips */}
                          {evening.blockerTags && evening.blockerTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {evening.blockerTags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[10px] text-[#786F66] dark:text-[#A8A096] font-medium shadow-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Lessons Learned */}
                          {evening.lessonsLearned && (
                            <div className="pt-2 border-t border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]">
                              <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0]">Takeaway:</span> {evening.lessonsLearned}
                            </div>
                          )}

                          {/* Mood/Craving rating */}
                          {evening.moodOrCraving && (
                            <div className="text-[11px] text-[#786F66] dark:text-[#A8A096] pt-1">
                              Craving / Intensity: <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">Level {evening.moodOrCraving} / 5</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
