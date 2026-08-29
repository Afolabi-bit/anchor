"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Anchor,
  ShieldCheck,
  HeartHandshake,
  Calendar,
  Send,
  CheckCircle2,
  Sparkles,
  Heart,
  MessageSquareHeart,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

const CHEER_PRESETS = [
  "Proud of your courage and consistency! 🌟",
  "One day at a time. Sending love and strength. ❤️",
  "You've got this! Honoring your daily anchor. ⚓",
  "Inspiring to see your dedication to healing. ✨",
];

export default function SponsorSharePage() {
  const params = useParams();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Encouragement Form State
  const [senderName, setSenderName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sponsor/${token || "default"}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Companion load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleSendEncouragement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    try {
      setSending(true);
      triggerHaptic(15);
      playSingingBowlChime(528);

      const res = await fetch(`/api/sponsor/${token || "default"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: senderName.trim() || "Accountability Partner",
          message: customNote.trim(),
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#C86D51", "#658B70", "#FAF2EA", "#E2A365"],
        });
        setSentSuccess(true);
        setCustomNote("");
      }
    } catch (err) {
      console.error("Failed to send encouragement:", err);
    } finally {
      setSending(false);
    }
  };

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
            A private, compassionate window into daily follow-through.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-serif text-[#786F66] dark:text-[#A8A096]">
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
                {data?.commitment?.name || "Daily Anchor Habit"}
              </h2>
              {data?.commitment?.why && (
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] italic leading-relaxed">
                  "{data?.commitment?.why}"
                </p>
              )}
            </div>

            {/* High-level metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block">Follow-Through</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data?.stats?.completionRate ?? 100}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block">Reflections</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data?.stats?.totalReflections ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center clay-card shadow-organic-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block">Anchored Days</span>
                <span className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {data?.stats?.streakDays ?? 0}d
                </span>
              </div>
            </div>

            {/* 7-Day Cadence Stream */}
            {data?.recentCadence && data.recentCadence.length > 0 && (
              <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4">
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C86D51]" />
                  Recent 7-Day Rhythm
                </h3>

                <div className="grid grid-cols-7 gap-2 pt-1">
                  {data.recentCadence.map((c: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E]">
                      <span className="text-[10px] text-[#786F66] dark:text-[#A8A096] font-medium">{c.day}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          c.status === "yes"
                            ? "bg-[#658B70]"
                            : c.status === "partial"
                            ? "bg-[#B88452]"
                            : c.status === "no"
                            ? "bg-[#82786F]"
                            : "bg-[#FAF7F2] border border-[#EAE3D7] text-[#9E948A]"
                        }`}
                      >
                        {c.status === "yes" ? "✓" : c.status === "partial" ? "~" : "•"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send Encouragement Note Section */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
                  <MessageSquareHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                    Send a Gentle Word of Support
                  </h3>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                    Your cheer will appear directly in their daily sanctuary.
                  </p>
                </div>
              </div>

              {sentSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-center space-y-2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#658B70] text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                    Encouragement Delivered
                  </h4>
                  <p className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                    Thank you for showing up as a compassionate partner in their recovery journey.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSentSuccess(false)}
                    className="text-xs text-[#C86D51] hover:underline font-medium pt-1 cursor-pointer block mx-auto"
                  >
                    Send another note
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSendEncouragement} className="space-y-3">
                  {/* Preset Cheer Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block">
                      Quick Words of Encouragement:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CHEER_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            triggerHaptic(8);
                            setCustomNote(preset);
                          }}
                          className="text-[11px] px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:border-[#C86D51] cursor-pointer text-left transition-colors shadow-2xs"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Name (e.g. Sarah, Support Partner)"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      required
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Write a warm note of encouragement..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs focus:outline-none focus:border-[#C86D51] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !customNote.trim()}
                    className="w-full py-3 rounded-2xl bg-[#658B70] hover:bg-[#53735C] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "Sending..." : "Send Encouragement"}</span>
                  </button>
                </form>
              )}
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
