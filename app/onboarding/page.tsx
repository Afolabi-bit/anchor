"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor, ArrowRight, ArrowLeft, Sun, Moon, Check, Sparkles, HeartHandshake } from "lucide-react";

const SUGGESTED_COMMITMENTS = [
  { name: "Stay sober", why: "To stay clear-headed and present for the people I love." },
  { name: "20-minute daily walk", why: "To breathe fresh air and calm my nervous system." },
  { name: "Mindful evening wind-down", why: "To protect my sleep and decompress peacefully." },
  { name: "No compulsive spending", why: "To rebuild financial peace and stability." },
  { name: "1 hour of focused creation", why: "To make steady progress without rushing." },
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
  const [step, setStep] = useState<1 | 2>(1);

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
    if (customDays.includes(dayId)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== dayId));
      }
    } else {
      setCustomDays([...customDays, dayId].sort());
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitmentName.trim()) {
      setError("Please write down what you would like to be accountable for.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError("");
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-4 shadow-xs">
            <Anchor className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-[#C86D51]" : "bg-[#EAE3D7] dark:bg-[#38332E]"}`} />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-medium">
            Step {step} of 2: {step === 1 ? "Your Commitment" : "Daily Cadence"}
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-7 sm:p-9 shadow-xs">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  What are you showing up for?
                </h2>
                <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5 leading-relaxed">
                  Anchor works best when you start with one core commitment.
                </p>
              </div>

              {/* Commitment Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="commitmentName">
                  Your Commitment
                </label>
                <input
                  id="commitmentName"
                  type="text"
                  required
                  value={commitmentName}
                  onChange={(e) => setCommitmentName(e.target.value)}
                  placeholder="e.g. Stay sober, 20m daily walk, Mindful wind-down"
                  className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                />
              </div>

              {/* Inspiration Pills */}
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-2">
                  Gentle ideas you can tap:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_COMMITMENTS.slice(0, 3).map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setCommitmentName(item.name);
                        setCommitmentWhy(item.why);
                      }}
                      className="text-xs px-3.5 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] transition-colors cursor-pointer text-left"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Why */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="commitmentWhy">
                  Your Reason / Why (Optional)
                </label>
                <textarea
                  id="commitmentWhy"
                  rows={2}
                  value={commitmentWhy}
                  onChange={(e) => setCommitmentWhy(e.target.value)}
                  placeholder="Why is this meaningful to you? This grounding thought will guide you."
                  className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-2">
                  Target Frequency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrequency("daily")}
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
                    onClick={() => setFrequency("custom_days")}
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

              <button
                type="submit"
                className="w-full py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                <span>Continue to check-in times</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Your Daily Rhythm
                </h2>
                <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5 leading-relaxed">
                  Anchor checks in twice a day: once in the morning to set intention, and once in the evening to reflect.
                </p>
              </div>

              {/* Morning Cadence */}
              <div className="p-5 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18]">
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
                        className="px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      />
                    </div>
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1">
                      Choose 1–2 small actions to guide your day.
                    </p>
                  </div>
                </div>
              </div>

              {/* Evening Cadence */}
              <div className="p-5 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18]">
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
                        className="px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      />
                    </div>
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1">
                      Honest reflection with zero judgment or streak resets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assurance Banner */}
              <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-xs text-[#2C2520] dark:text-[#ECE7E0] flex items-start gap-2.5">
                <HeartHandshake className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Missing a day will never reset your progress to zero. Every morning is a clean slate.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="py-4 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#FAF7F2] text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span>Anchoring your commitment...</span>
                  ) : (
                    <>
                      <span>Begin with Anchor</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
