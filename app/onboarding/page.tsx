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
  Sparkles,
  HeartHandshake,
  Shield,
  Clock,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

const SUGGESTED_COMMITMENTS = [
  { name: "Stay sober & clean", why: "To stay clear-headed and present for the people I love.", tag: "Recovery" },
  { name: "20-minute daily walk", why: "To breathe fresh air and calm my nervous system.", tag: "Wellness" },
  { name: "Mindful evening wind-down", why: "To protect my sleep and decompress peacefully.", tag: "Rest" },
  { name: "No compulsive spending", why: "To rebuild financial peace and stability.", tag: "Habits" },
  { name: "1 hour of focused craft", why: "To make steady progress without rushing.", tag: "Growth" },
];

const DAYS_OF_WEEK = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {}
    }
    loadUser();
  }, []);

  // Form State
  const [commitmentName, setCommitmentName] = useState("");
  const [commitmentWhy, setCommitmentWhy] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "custom_days">("daily");
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (dayId: number) => {
    triggerHaptic(10);
    if (customDays.includes(dayId)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== dayId));
      }
    } else {
      setCustomDays([...customDays, dayId].sort());
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");
      playSingingBowlChime(528);
      triggerHaptic([20, 50, 30]);

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentName,
          commitmentWhy,
          frequency,
          customDays: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : customDays,
          morningNotificationTime: morningTime,
          eveningNotificationTime: eveningTime,
          timezone: userTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete setup");
        setLoading(false);
        return;
      }

      router.push("/today");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-5 py-12 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-lg">
        {/* Top Indicator */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-4 shadow-organic-sm"
          >
            <Anchor className="w-7 h-7" />
          </motion.div>

          {step > 0 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`h-1.5 w-10 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
              <div className={`h-1.5 w-10 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
              <div className={`h-1.5 w-10 rounded-full transition-colors duration-300 ${step >= 3 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
            </div>
          )}

          <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold">
            {step === 0
              ? "Welcome to Anchor"
              : step === 1
              ? "Step 1 of 3: Core Commitment"
              : step === 2
              ? "Step 2 of 3: Grounding Reason"
              : "Step 3 of 3: Daily Cadence"}
          </span>
        </div>

        {/* Card Frame with Animated Transitions */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-7 sm:p-9 shadow-organic-md clay-card">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ---------------- STEP 0: SANCTUARY WELCOME ---------------- */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
              >
                <div>
                  <h2 className="font-serif-title text-3xl text-[#2C2520] dark:text-[#ECE7E0] leading-snug">
                    Take a breath{user?.firstName ? `, ${user.firstName}` : ""}. <br />
                    <span className="italic text-[#C86D51] dark:text-[#DB8165]">You are safe here.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-3 leading-relaxed max-w-sm mx-auto">
                    Anchor is built differently. There are no shame scorecards, no broken streak punishments, and no judgment.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-left space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-[#2C2520] dark:text-[#ECE7E0]">
                    <Sparkles className="w-4 h-4 text-[#B88452] shrink-0" />
                    <span>Two quiet moments each day: Morning & Evening.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#2C2520] dark:text-[#ECE7E0]">
                    <HeartHandshake className="w-4 h-4 text-[#658B70] shrink-0" />
                    <span>Soft landings when days don't go according to plan.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#2C2520] dark:text-[#ECE7E0]">
                    <Shield className="w-4 h-4 text-[#C86D51] shrink-0" />
                    <span>Encrypted and private to you.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    setStep(1);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Set up my daily anchor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ---------------- STEP 1: COMMITMENT DISCOVERY ---------------- */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                    {user?.firstName ? `${user.firstName}, what` : "What"} are you showing up for?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5 leading-relaxed">
                    Anchor works best when focused on one core daily anchor.
                  </p>
                </div>

                {/* Commitment Input */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5" htmlFor="commitmentName">
                    Your Commitment
                  </label>
                  <input
                    id="commitmentName"
                    type="text"
                    required
                    value={commitmentName}
                    onChange={(e) => setCommitmentName(e.target.value)}
                    placeholder="e.g. Stay sober, 20m daily walk, Mindful wind-down"
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors shadow-2xs"
                  />
                </div>

                {/* Inspiration Quick-picks */}
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-2">
                    Gentle ideas you can tap:
                  </span>
                  <div className="space-y-2">
                    {SUGGESTED_COMMITMENTS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          setCommitmentName(item.name);
                          setCommitmentWhy(item.why);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                          commitmentName === item.name
                            ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] font-medium"
                            : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                        }`}
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setStep(0);
                    }}
                    className="py-4 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!commitmentName.trim()) {
                        setError("Please enter your commitment.");
                        return;
                      }
                      setError("");
                      triggerHaptic(12);
                      setStep(2);
                    }}
                    className="flex-1 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---------------- STEP 2: THE GROUNDING WHY ---------------- */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                    Your Grounding "Why"
                  </h2>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5 leading-relaxed">
                    When urges or resistance surface, Anchor will gently remind you of this grounding thought.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5" htmlFor="commitmentWhy">
                    Personal Reason
                  </label>
                  <textarea
                    id="commitmentWhy"
                    rows={3}
                    value={commitmentWhy}
                    onChange={(e) => setCommitmentWhy(e.target.value)}
                    placeholder="e.g. To be fully present for my children, to wake up without regret..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors resize-none leading-relaxed shadow-2xs"
                  />
                </div>

                {/* Target Frequency */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-2">
                    Cadence
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setFrequency("daily");
                      }}
                      className={`py-3.5 px-4 rounded-2xl border text-sm font-medium transition-all text-center cursor-pointer ${
                        frequency === "daily"
                          ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] font-semibold"
                          : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096]"
                      }`}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setFrequency("custom_days");
                      }}
                      className={`py-3.5 px-4 rounded-2xl border text-sm font-medium transition-all text-center cursor-pointer ${
                        frequency === "custom_days"
                          ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] font-semibold"
                          : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096]"
                      }`}
                    >
                      Specific Days
                    </button>
                  </div>

                  {frequency === "custom_days" && (
                    <div className="mt-3 flex items-center justify-between gap-1 pt-1">
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = customDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDay(d.id)}
                            className={`w-9 h-9 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#C86D51] text-white font-semibold"
                                : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096]"
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setStep(1);
                    }}
                    className="py-4 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setStep(3);
                    }}
                    className="flex-1 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Check-in Times</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---------------- STEP 3: CIRCADIAN CADENCE ---------------- */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                    Your Daily Rhythm
                  </h2>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5 leading-relaxed">
                    Anchor invites you to check in twice a day: once in the morning to set intention, and once in the evening to reflect.
                  </p>
                </div>

                {/* Morning Time Box */}
                <div className="p-5 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] mt-0.5">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">Morning Intention</span>
                        <input
                          type="time"
                          value={morningTime}
                          onChange={(e) => setMorningTime(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                        />
                      </div>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1">
                        Choose 1�2 small actions to guide your day.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evening Time Box */}
                <div className="p-5 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] shadow-2xs">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] mt-0.5">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">Evening Reflection</span>
                        <input
                          type="time"
                          value={eveningTime}
                          onChange={(e) => setEveningTime(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                        />
                      </div>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1">
                        Honest reflection with zero judgment or streak resets.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Soft Landing Reassurance Banner */}
                <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-xs text-[#2C2520] dark:text-[#ECE7E0] flex items-start gap-2.5 shadow-2xs">
                  <HeartHandshake className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Missing a day will never erase your journey. Tomorrow is always a clean slate.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setStep(2);
                    }}
                    disabled={loading}
                    className="py-4 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex-1 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-organic-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Anchoring your sanctuary...</span>
                    ) : (
                      <>
                        <span>Seal & Begin with Anchor</span>
                        <Check className="w-4 h-4" />
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
