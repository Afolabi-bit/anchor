"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Check,
  CheckCircle as CheckCircle2,
  Shield,
} from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";
import { ANCHOR_TEMPLATES } from "@/lib/templates";
import type { User } from "@/db/schema";

// Derive onboarding presets from canonical, vetted ANCHOR_TEMPLATES
const INTENTION_PRESETS = [
  {
    name: ANCHOR_TEMPLATES.find((t) => t.id === "sobriety-alcohol")?.name || "Alcohol Freedom & Clarity",
    why: ANCHOR_TEMPLATES.find((t) => t.id === "sobriety-alcohol")?.why || "To stay clear-headed and present for the people I love.",
    tag: "Recovery",
  },
  {
    name: ANCHOR_TEMPLATES.find((t) => t.id === "mental-anxiety")?.name || "Nervous System Calm & Grounding",
    why: ANCHOR_TEMPLATES.find((t) => t.id === "mental-anxiety")?.why || "To breathe through midday stress and respond with patience.",
    tag: "Calm",
  },
  {
    name: ANCHOR_TEMPLATES.find((t) => t.id === "mindful-evening")?.name || "Mindful Evening Wind-Down",
    why: ANCHOR_TEMPLATES.find((t) => t.id === "mindful-evening")?.why || "To protect my sleep quality and decompress peacefully.",
    tag: "Rest",
  },
  {
    name: ANCHOR_TEMPLATES.find((t) => t.id === "mindful-deep-work")?.name || "Deep Focus & Mindful Craft",
    why: ANCHOR_TEMPLATES.find((t) => t.id === "mindful-deep-work")?.why || "To make steady creative progress without distraction.",
    tag: "Focus",
  },
];

const PREVIEW_BLOCKER_TAGS = [
  { id: "stress", label: "Stress" },
  { id: "fatigue", label: "Fatigue" },
  { id: "time", label: "Time strain" },
  { id: "urges", label: "Impulse urges" },
  { id: "distraction", label: "Distraction" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Load user if already authenticated
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.warn("Could not load user in onboarding:", e);
      }
    }
    loadUser();
  }, []);

  // Form State - start with clean, un-autofilled fields
  const [commitmentName, setCommitmentName] = useState("");
  const [commitmentWhy, setCommitmentWhy] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "custom_days">("daily");
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");


  // Restore draft anchor from sessionStorage if available
  useEffect(() => {
    try {
      const savedName = sessionStorage.getItem("anchor_draft_name");
      const savedWhy = sessionStorage.getItem("anchor_draft_why");
      if (savedName && !commitmentName) setCommitmentName(savedName);
      if (savedWhy && !commitmentWhy) setCommitmentWhy(savedWhy);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      if (commitmentName) sessionStorage.setItem("anchor_draft_name", commitmentName);
      if (commitmentWhy) sessionStorage.setItem("anchor_draft_why", commitmentWhy);
    } catch {
      // Ignore storage errors
    }
  }, [commitmentName, commitmentWhy]);

  // Screen 2 Interactive Preview State
  const [previewStatus, setPreviewStatus] = useState<"yes" | "partial" | "no">("yes");
  const [previewValence, setPreviewValence] = useState<number>(2);
  const [previewBlockers, setPreviewBlockers] = useState<string[]>([]);
  const [previewSealed, setPreviewSealed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePreviewBlocker = (id: string) => {
    triggerHaptic(8);
    setPreviewBlockers((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSealPreview = () => {
    playSingingBowlChime(432);
    triggerHaptic([15, 30, 20]);
    setPreviewSealed(true);
  };

  // Complete onboarding: save anchor and land on /today
  const handleCompleteAccount = async () => {
    try {
      setLoading(true);
      setError("");
      playSingingBowlChime(432);
      triggerHaptic([20, 50, 30]);

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentName: commitmentName.trim(),
          commitmentWhy: commitmentWhy.trim(),
          frequency,
          customDays: [0, 1, 2, 3, 4, 5, 6],
          morningNotificationTime: morningTime,
          eveningNotificationTime: eveningTime,
          timezone: userTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/signup";
          return;
        }
        setError(data.error || "Failed to complete setup");
        return;
      }

      // Clear draft storage
      try {
        sessionStorage.removeItem("anchor_draft_name");
        sessionStorage.removeItem("anchor_draft_why");
      } catch {}

      // Hard redirect to ensure browser document request sends newly set session cookie
      window.location.href = "/today";
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-5 py-8 sm:py-12 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-lg">
        {/* Top Brand & Step Indicator */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-3.5 shadow-organic-sm"
          >
            <Anchor className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
            <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
            <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
          </div>

          <span className="text-xs sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
            {step === 1
              ? "Screen 1 of 3: Primary Intention"
              : step === 2
              ? "Screen 2 of 3: Check-in Preview"
              : "Screen 3 of 3: Cadence & Privacy"}
          </span>
        </div>

        {/* Card Frame */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-5 sm:p-8 shadow-organic-md clay-card">
          <AnimatePresence mode="wait">
            {/* ================= SCREEN 1: PRIMARY INTENTION ================= */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0] leading-tight">
                    What anchor are you anchoring right now?
                  </h1>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    Choose one core focus to show up for each day. Anchor is designed around single-habit clarity.
                  </p>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#786F66] dark:text-[#A8A096] block">
                    Suggested Focuses
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {INTENTION_PRESETS.map((preset) => {
                      const isSelected = commitmentName === preset.name;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            setCommitmentName(preset.name);
                            setCommitmentWhy(preset.why);
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? "bg-[#FAF2EA] dark:bg-[#352A1E] border-[#C86D51] text-[#2C2520] dark:text-[#ECE7E0] shadow-2xs"
                              : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:border-[#B88452]"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-semibold text-xs sm:text-sm block text-[#2C2520] dark:text-[#ECE7E0] truncate">
                              {preset.name}
                            </span>
                            <span className="text-xs text-[#786F66] dark:text-[#A8A096] line-clamp-1">
                              {preset.why}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#C86D51] text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Name & Why Input */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block mb-1">
                      Anchor Name
                    </label>
                    <input
                      type="text"
                      value={commitmentName}
                      onChange={(e) => setCommitmentName(e.target.value)}
                      placeholder="e.g. Daily breathwork & sobriety"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block mb-1">
                      Your Why
                    </label>
                    <input
                      type="text"
                      value={commitmentWhy}
                      onChange={(e) => setCommitmentWhy(e.target.value)}
                      placeholder="e.g. To stay clear-headed and calm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!commitmentName.trim()}
                    onClick={() => {
                      triggerHaptic(12);
                      setStep(2);
                    }}
                    className="w-full py-3 rounded-full bg-[#C86D51] hover:bg-[#B35D43] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-organic-sm cursor-pointer transition-colors"
                  >
                    <span>Try a Check-In Preview</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= SCREEN 2: CHECK-IN PREVIEW (TRY BEFORE COMMIT) ================= */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] text-xs font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Interactive Preview • Try It Now</span>
                  </div>
                  <h2 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                    Experience the Evening Check-in
                  </h2>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    Check-ins take under 45 seconds. Tap below to see how Anchor reflects self-honesty without shame or guilt.
                  </p>
                </div>

                {/* Simulated Interactive Check-in Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-4">
                  {/* Focus Header */}
                  <div className="border-b border-[#EAE3D7] dark:border-[#38332E] pb-3">
                    <span className="text-xs uppercase tracking-wider text-[#C86D51] font-semibold block">
                      Focus: {commitmentName}
                    </span>
                    <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096] mt-0.5">
                      "{commitmentWhy}"
                    </p>
                  </div>

                  {/* Question 1: Follow-through */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Did you honor your intention today?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "yes", label: "Yes ✓", color: "text-[#658B70]" },
                        { id: "partial", label: "Partial ~", color: "text-[#B88452]" },
                        { id: "no", label: "Paused •", color: "text-[#C86D51]" },
                      ].map((opt) => {
                        const isSelected = previewStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              setPreviewStatus(opt.id as any);
                            }}
                            className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white dark:bg-[#25221F] border-[#658B70] shadow-2xs " + opt.color
                                : "border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question 2: Mood & Energy */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                        Emotional Valence (Mood)
                      </span>
                      <span className="font-medium text-[#658B70]">
                        {previewValence > 0 ? `+${previewValence} (Grounded)` : `${previewValence} (Low)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      value={previewValence}
                      onChange={(e) => setPreviewValence(Number(e.target.value))}
                      className="w-full accent-[#658B70] cursor-pointer"
                    />
                  </div>

                  {/* Question 3: Obstacle Tags */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Did any obstacles arise?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PREVIEW_BLOCKER_TAGS.map((tag) => {
                        const isSelected = previewBlockers.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => togglePreviewBlocker(tag.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#C86D51] border-[#C86D51] text-white shadow-2xs"
                                : "bg-white dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Seal Button */}
                  {!previewSealed ? (
                    <button
                      type="button"
                      onClick={handleSealPreview}
                      className="w-full py-2.5 rounded-xl bg-[#658B70] hover:bg-[#53735C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-organic-sm cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Seal Sample Reflection</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] text-xs text-center font-medium flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Check-in recorded. That's your daily anchor.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-3 rounded-full border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] hover:text-[#2C2520] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setStep(3);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-organic-sm cursor-pointer transition-colors"
                  >
                    <span>Next: Cadence & Privacy</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= SCREEN 3: CADENCE, PRIVACY & GUEST MODE ================= */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <h2 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                    Daily Cadence & Data Privacy
                  </h2>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                    Set your quiet reminder times and choose how you want to start.
                  </p>
                </div>

                {/* Cadence Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#C86D51] font-semibold">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Morning Intention</span>
                    </div>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#658B70] font-semibold">
                      <Moon className="w-3.5 h-3.5" />
                      <span>Evening Reflection</span>
                    </div>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Plain-Language Privacy Box */}
                <div className="p-4 rounded-2xl bg-[#FAF2EA] dark:bg-[#2C221A] border border-[#EAE3D7] dark:border-[#38332E] text-xs space-y-2 text-[#786F66] dark:text-[#D5CFC7]">
                  <div className="flex items-center gap-2 font-semibold text-[#B88452] dark:text-[#E2A365]">
                    <Shield className="w-4 h-4" />
                    <span>How Your Reflections Are Protected</span>
                  </div>
                  <ul className="space-y-1 text-xs leading-relaxed">
                    <li>• Sensitive free-text is encrypted with server-managed <strong>AES-256-GCM</strong>.</li>
                    <li>• <strong>Zero third-party trackers</strong>, zero advertising pixels, no data brokers.</li>
                    <li>• Partner sharing is strictly <strong>opt-in and defaults to zero</strong>.</li>
                  </ul>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#F9EBE7] text-[#C86D51] text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCompleteAccount}
                    className="w-full py-3.5 rounded-full bg-[#C86D51] hover:bg-[#B35D43] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-organic-md cursor-pointer transition-colors"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        <span>Saving your anchor...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Anchor & Start Today</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
