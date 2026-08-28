"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import StoryRecapModal from "@/app/components/StoryRecapModal";
import ExportReportModal from "@/app/components/ExportReportModal";
import {
  Calendar,
  Sun,
  Moon,
  Tag,
  Lightbulb,
  HeartHandshake,
  Sparkles,
  Printer,
  Compass,
  Play
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commitment, setCommitment] = useState<any>(null);
  const [recapData, setRecapData] = useState<any>(null);

  // Modal states
  const [storyOpen, setStoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    async function loadRecap() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        setCommitment(meData.commitment);

        const recapRes = await fetch("/api/recaps");
        if (recapRes.ok) {
          const data = await recapRes.json();
          setRecapData(data.currentRecap);
        }
      } catch (err) {
        console.error("Progress loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecap();
  }, [router]);

  const formatDateShort = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation userEmail={user?.email} />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold">
              Insight Sanctuary
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-1">
              7-Day Recap & Progress
            </h1>
          </div>
          <button
            onClick={() => {
              triggerHaptic(12);
              setExportOpen(true);
            }}
            className="text-xs px-3.5 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] font-medium border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Story Deck Banner Trigger */}
        <div className="mb-6 p-6 rounded-3xl bg-[#F9EBE7] dark:bg-[#38251F] border border-[#F2D7CE] dark:border-[#4D332B] shadow-organic-md flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#C86D51]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Story Experience</span>
            </div>
            <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
              Review Your 7-Day Story
            </h2>
            <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
              A 4-chapter mindful visual reflection of rhythm, obstacles & wisdom.
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic(15);
              setStoryOpen(true);
            }}
            className="w-12 h-12 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-organic-sm transition-transform hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-serif-title text-[#786F66] dark:text-[#A8A096]">
            Reflecting on your week...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stat Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Follow-Through Rate */}
              <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block mb-1">
                  Follow-Through
                </span>
                <span className="font-serif-title text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {recapData?.completionRate ?? 0}%
                </span>
                <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] mt-1 block">
                  Across {recapData?.totalDaysWithEvening || 0} reflections
                </span>
              </div>

              {/* Days Reflected */}
              <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block mb-1">
                  Days Reflected
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif-title text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                    {recapData?.streakCurrent ?? 0}
                  </span>
                  <span className="text-xs text-[#786F66] dark:text-[#A8A096]">days</span>
                </div>
                <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] mt-1 block">
                  Longest: {recapData?.streakLongest ?? 0} days
                </span>
              </div>

              {/* Total Check-in Touchpoints */}
              <div className="col-span-2 sm:col-span-1 p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block mb-1">
                  Touchpoints
                </span>
                <span className="font-serif-title text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {recapData?.totalCheckIns ?? 0}
                </span>
                <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] mt-1 block">
                  Morning & evening plans
                </span>
              </div>
            </div>

            {/* 7-Day Timeline Chart */}
            <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
              <div>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C86D51]" />
                  7-Day Rhythm
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
                  Visualizing morning intentions and evening reflections.
                </p>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {recapData?.dailyTrend?.map((day: any) => {
                  const hasEvening = Boolean(day.eveningStatus);
                  const isYes = day.eveningStatus === "yes";
                  const isPartial = day.eveningStatus === "partial";

                  return (
                    <div
                      key={day.date}
                      className="p-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] flex flex-col items-center justify-between min-h-[110px] text-center shadow-xs"
                    >
                      <span className="text-[10px] font-medium text-[#786F66] dark:text-[#A8A096]">
                        {formatDateShort(day.date)}
                      </span>

                      {/* Morning Dot */}
                      <div className="my-1">
                        {day.morningPlanned ? (
                          <div title="Morning intention set" className="p-1 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]">
                            <Sun className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div title="No morning plan" className="w-2.5 h-2.5 rounded-full bg-[#EAE3D7] dark:bg-[#38332E]" />
                        )}
                      </div>

                      {/* Evening Status Pill */}
                      <div className="w-full">
                        {hasEvening ? (
                          <span
                            className={`block w-full py-0.5 rounded-full text-[9px] font-semibold ${
                              isYes
                                ? "bg-[#EEF4F0] text-[#658B70]"
                                : isPartial
                                ? "bg-[#FAF2EA] text-[#B88452]"
                                : "bg-[#F0ECE6] text-[#82786F]"
                            }`}
                          >
                            {isYes ? "YES" : isPartial ? "PART" : "NO"}
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#9E948A]">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurring Themes */}
            <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
              <div>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#B88452]" />
                  Themes & Obstacles Observed
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
                  Spotting natural patterns helps remove self-blame.
                </p>
              </div>

              {recapData?.topBlockerTags && recapData.topBlockerTags.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {recapData.topBlockerTags.map((item: any) => (
                    <div
                      key={item.tag}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0] capitalize">
                        {item.tag}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] font-semibold">
                        Observed {item.count} {item.count === 1 ? "time" : "times"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-[#EAE3D7] text-center text-xs text-[#786F66]">
                  No obstacle themes tagged this week.
                </div>
              )}
            </div>

            {/* Pinned Lessons Learned */}
            <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
              <div>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#C86D51]" />
                  Notable Takeaways
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
                  Insights from your evening reflections.
                </p>
              </div>

              {recapData?.pinnedLessons && recapData.pinnedLessons.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {recapData.pinnedLessons.map((lesson: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed shadow-xs"
                    >
                      "{lesson}"
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-[#EAE3D7] text-center text-xs text-[#786F66]">
                  Add lessons learned during your evening reflections to see them surfaced here.
                </div>
              )}
            </div>

            {/* Grounding Message */}
            <div className="p-5 rounded-3xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] flex items-start gap-3.5 text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed shadow-organic-sm">
              <HeartHandshake className="w-5 h-5 text-[#658B70] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">A Mirror, Not a Scorecard: </span>
                This recap reflects your habits without evaluation or shame. Progress is showing up again tomorrow.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Story Recap Modal Deck */}
      {storyOpen && (
        <StoryRecapModal
          isOpen={storyOpen}
          onClose={() => setStoryOpen(false)}
          recapData={recapData}
        />
      )}

      {/* Clinical Report Export Modal */}
      {exportOpen && (
        <ExportReportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          userEmail={user?.email}
          commitment={commitment}
          recapData={recapData}
        />
      )}
    </div>
  );
}
