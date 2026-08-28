"use client";

import { useState, useEffect } from "react";
import { Anchor, ShieldCheck, HeartHandshake, Calendar, CheckCircle2, Moon, Sun, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SponsorSharePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Load public read-only companion data
    setTimeout(() => {
      setData({
        commitmentName: "Daily Recovery & Mindful Presence",
        why: "To show up for the people I love with clear mind and steady spirit.",
        completionRate: 88,
        totalReflections: 14,
        activeStreak: 6,
        recentCadence: [
          { day: "Mon", status: "yes" },
          { day: "Tue", status: "yes" },
          { day: "Wed", status: "partial" },
          { day: "Thu", status: "yes" },
          { day: "Fri", status: "yes" },
          { day: "Sat", status: "yes" },
          { day: "Sun", status: "yes" },
        ],
      });
      setLoading(false);
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col justify-between py-10 px-5 transition-colors duration-200">
      <div className="max-w-xl mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-3 shadow-organic-sm">
            <Anchor className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
            Anchor Companion View
          </span>
          <h1 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0] mt-1">
            Accountability & Sponsor Portal
          </h1>
          <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1">
            A private, read-only window into daily follow-through.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-serif-title text-[#786F66]">
            Connecting to companion stream...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Commitment Card */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#C86D51] font-semibold block">
                Tracked Commitment
              </span>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                {data.commitmentName}
              </h2>
              {data.why && (
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] italic leading-relaxed">
                  "{data.why}"
                </p>
              )}
            </div>

            {/* High-level metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold block">Follow-Through</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data.completionRate}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold block">Reflections</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data.totalReflections}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold block">Steady Days</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data.activeStreak}d
                </span>
              </div>
            </div>

            {/* 7-Day Cadence Stream */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4">
              <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C86D51]" />
                Recent 7-Day Rhythm
              </h3>

              <div className="grid grid-cols-7 gap-2 pt-1">
                {data.recentCadence.map((c: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E]">
                    <span className="text-[10px] text-[#786F66] font-medium">{c.day}</span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        c.status === "yes" ? "bg-[#658B70]" : "bg-[#B88452]"
                      }`}
                    >
                      {c.status === "yes" ? "✓" : "~"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Redaction Assurance */}
            <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] flex items-start gap-3 text-xs text-[#786F66] dark:text-[#A8A096]">
              <ShieldCheck className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
              <span>
                Personal journal reflections are encrypted and redacted by default for user confidentiality.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center pt-8">
        <Link href="/" className="text-xs text-[#C86D51] hover:underline font-medium">
          Powered by Anchor • Daily Accountability & Recovery
        </Link>
      </footer>
    </div>
  );
}
