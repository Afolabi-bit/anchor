"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Plus,
  Trash2,
  Check,
  Sparkles,
  CircleDot,
  Anchor,
  CheckCircle2,
  HeartHandshake
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

const SMART_INTENTION_PRESETS = [
  "15-minute gentle walk",
  "Reach out to my support / sponsor",
  "10 minutes of quiet breathing",
  "Protect 7+ hours of sleep",
  "Read 15 pages of calm reflection",
];

const BLOCKER_TAGS = [
  { id: "stress", label: "Stress & Anxiety" },
  { id: "time", label: "Time & Schedule" },
  { id: "urge", label: "Urges & Temptation" },
  { id: "forgot", label: "Distraction / Forgot" },
  { id: "unmotivated", label: "Low Energy / Fatigue" },
  { id: "other", label: "Unexpected Circumstances" },
];

interface CheckInStepperProps {
  type: "morning" | "evening";
  commitment: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (checkIn: any) => void;
  initialCheckIn?: any;
}

export default function CheckInStepper({
  type,
  commitment,
  isOpen,
  onClose,
  onSuccess,
  initialCheckIn,
}: CheckInStepperProps) {
  const [stage, setStage] = useState<number>(1);
  const totalStages = type === "morning" ? 4 : 4;

  // Morning State
  const [actionInput, setActionInput] = useState("");
  const [plannedActions, setPlannedActions] = useState<string[]>(initialCheckIn?.plannedActions || []);
  const [intentionNote, setIntentionNote] = useState(initialCheckIn?.intentionNote || "");

  // Hold-to-Anchor State
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Evening State
  const [eveningStatus, setEveningStatus] = useState<"yes" | "partial" | "no" | null>(initialCheckIn?.status || null);
  const [reflection, setReflection] = useState(initialCheckIn?.reflection || "");
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>(initialCheckIn?.blockerTags || []);
  const [lessonsLearned, setLessonsLearned] = useState(initialCheckIn?.lessonsLearned || "");
  const [moodOrCraving, setMoodOrCraving] = useState<number>(initialCheckIn?.moodOrCraving ?? 2);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStage(1);
      setHoldProgress(0);
      setIsHolding(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Morning Actions
  const handleAddAction = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || plannedActions.includes(trimmed)) return;
    setPlannedActions([...plannedActions, trimmed]);
    setActionInput("");
    triggerHaptic(12);
  };

  const handleRemoveAction = (index: number) => {
    setPlannedActions(plannedActions.filter((_, i) => i !== index));
    triggerHaptic(10);
  };

  // Hold-to-Anchor Sealing Ritual
  const startHold = () => {
    if (saving) return;
    setIsHolding(true);
    triggerHaptic(15);

    let current = 0;
    holdIntervalRef.current = setInterval(() => {
      current += 6.5;
      setHoldProgress(current);

      if (current % 20 === 0) triggerHaptic(10);

      if (current >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(100);
        submitMorning();
      }
    }, 45);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  };

  const submitMorning = async () => {
    try {
      setSaving(true);
      playSingingBowlChime(528);
      triggerHaptic([30, 60, 40]);

      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          type: "morning",
          plannedActions,
          intentionNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#C86D51", "#658B70", "#FAF2EA"],
        });
        onSuccess(data.checkIn);
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save morning check-in");
    } finally {
      setSaving(false);
    }
  };

  const submitEvening = async () => {
    if (!eveningStatus) return;
    try {
      setSaving(true);
      playSingingBowlChime(432);
      triggerHaptic([25, 50, 25]);

      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          type: "evening",
          status: eveningStatus,
          reflection,
          lessonsLearned,
          blockerTags: selectedBlockers,
          moodOrCraving,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (eveningStatus === "yes") {
          confetti({
            particleCount: 45,
            spread: 65,
            origin: { y: 0.75 },
            colors: ["#658B70", "#C86D51", "#FAF2EA"],
          });
        }
        onSuccess(data.checkIn);
        setStage(4); // Show peaceful closing stage
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save reflection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 sm:p-10 shadow-organic-lg clay-card flex flex-col justify-between min-h-[550px] max-h-[92vh] overflow-y-auto">
        {/* Top Header & Stage Dots */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalStages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stage === idx + 1
                      ? "w-8 bg-[#C86D51]"
                      : stage > idx + 1
                      ? "w-4 bg-[#658B70]"
                      : "w-4 bg-[#EAE3D7] dark:bg-[#38332E]"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
              {error}
            </div>
          )}

          {/* -------------------- MORNING STAGES -------------------- */}
          {type === "morning" && (
            <>
              {/* Stage 1: The Arrival */}
              {stage === 1 && (
                <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-xs">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#C86D51] font-semibold block mb-1">
                      Morning Intention
                    </span>
                    <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0] leading-tight">
                      What are you hoping to do today for {commitment?.name || "your anchor"}?
                    </h2>
                    <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-3 leading-relaxed">
                      Showing up starts with a quiet thought. Pick one or two micro-actions that feel gentle and doable.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 2: Micro-Actions */}
              {stage === 2 && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#786F66] font-semibold block mb-1">
                      Step 2 of 4: Micro-Actions
                    </span>
                    <h3 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      Choose your planned actions
                    </h3>
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SMART_INTENTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddAction(preset)}
                        className="text-xs px-3.5 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAction(actionInput);
                        }
                      }}
                      placeholder="Or type a custom micro-action..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAction(actionInput)}
                      className="px-5 py-3 rounded-2xl bg-[#F3EFE7] dark:bg-[#2E2A26] hover:bg-[#EBE5DB] text-[#2C2520] dark:text-[#ECE7E0] text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Added action list */}
                  {plannedActions.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {plannedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between gap-3 text-sm shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#C86D51] shrink-0" />
                            <span className="text-[#2C2520] dark:text-[#ECE7E0]">{action}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(idx)}
                            className="text-[#9E948A] hover:text-[#C86D51] p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] italic text-center py-2">
                      Select a chip above or type an action to proceed.
                    </p>
                  )}
                </div>
              )}

              {/* Stage 3: Mindset & Intention Note */}
              {stage === 3 && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#786F66] font-semibold block mb-1">
                      Step 3 of 4: Grounding Mindset
                    </span>
                    <h3 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      What thought will guide you today?
                    </h3>
                    <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-1.5">
                      Optional: A short anchor note to hold onto when urges or tension arise.
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={intentionNote}
                    onChange={(e) => setIntentionNote(e.target.value)}
                    placeholder="e.g. Remember to pause before responding, today is one breath at a time..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Stage 4: Hold-to-Anchor Sealing Ritual */}
              {stage === 4 && (
                <div className="space-y-6 py-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-organic-sm">
                    <Anchor className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#C86D51] font-semibold block mb-1">
                      Final Step: Anchor Intention
                    </span>
                    <h3 className="font-serif-title text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      Ready to seal today's plan?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-2 max-w-sm">
                      {plannedActions.length} planned micro-actions set. Press and hold the button below to anchor your intention.
                    </p>
                  </div>

                  {/* Tactile Hold Button */}
                  <div className="w-full max-w-xs pt-2">
                    <button
                      type="button"
                      onMouseDown={startHold}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                      onTouchStart={startHold}
                      onTouchEnd={cancelHold}
                      disabled={saving}
                      className="relative w-full py-4.5 px-6 rounded-2xl bg-[#C86D51] text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-organic-md overflow-hidden select-none active:scale-[0.98]"
                    >
                      <div
                        className="absolute inset-0 bg-[#A85338] transition-all ease-linear pointer-events-none"
                        style={{ width: `${holdProgress}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <Anchor className={`w-4 h-4 transition-transform ${isHolding ? "scale-115" : ""}`} />
                        <span>
                          {saving
                            ? "Anchoring in peace..."
                            : isHolding
                            ? `Hold steady (${Math.round(holdProgress)}%)...`
                            : "Press & hold to seal"}
                        </span>
                      </div>
                    </button>
                    <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] mt-2 block">
                      A 1.5s mindful pause to begin your day.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* -------------------- EVENING STAGES -------------------- */}
          {type === "evening" && (
            <>
              {/* Stage 1: The Three Full-Width Choice Cards */}
              {stage === 1 && (
                <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#C86D51] font-semibold block mb-1">
                      Evening Reflection
                    </span>
                    <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                      How did today unfold?
                    </h2>
                    <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-2 leading-relaxed">
                      Be gentle with yourself. Honest reflection builds real resilience.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEveningStatus("yes");
                        triggerHaptic(15);
                        setStage(2);
                      }}
                      className={`w-full p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        eveningStatus === "yes"
                          ? "border-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24] shadow-organic-sm"
                          : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#658B70] text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-serif-title text-base block text-[#2C2520] dark:text-[#ECE7E0]">
                            Yes, I followed through
                          </span>
                          <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                            Honored today's intention
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#786F66]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEveningStatus("partial");
                        triggerHaptic(15);
                        setStage(2);
                      }}
                      className={`w-full p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        eveningStatus === "partial"
                          ? "border-[#B88452] bg-[#FAF2EA] dark:bg-[#352A1E] shadow-organic-sm"
                          : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#B88452] text-white flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-serif-title text-base block text-[#2C2520] dark:text-[#ECE7E0]">
                            Partially, some progress
                          </span>
                          <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                            Made effort despite hurdles
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#786F66]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEveningStatus("no");
                        triggerHaptic(15);
                        setStage(2);
                      }}
                      className={`w-full p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        eveningStatus === "no"
                          ? "border-[#82786F] bg-[#F0ECE6] dark:bg-[#2B2824] shadow-organic-sm"
                          : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#82786F] text-white flex items-center justify-center">
                          <CircleDot className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-serif-title text-base block text-[#2C2520] dark:text-[#ECE7E0]">
                            Not today
                          </span>
                          <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                            Didn't happen — a moment to learn
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#786F66]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Deep Qualitative Reflection & Obstacle Tags */}
              {stage === 2 && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#786F66] font-semibold block mb-1">
                      Step 2 of 4: Deep Reflection
                    </span>
                    <h3 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      {eveningStatus === "yes"
                        ? "What helped you show up today?"
                        : "What got in the way?"}
                    </h3>
                  </div>

                  <textarea
                    rows={3}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={
                      eveningStatus === "yes"
                        ? "Acknowledge the small wins. What kept you grounded?"
                        : "Describe the circumstances without self-blame."
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors resize-none leading-relaxed"
                  />

                  {/* Obstacle tag chips */}
                  {(eveningStatus === "partial" || eveningStatus === "no") && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-[#786F66] dark:text-[#A8A096] block">
                        Themes that arose:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {BLOCKER_TAGS.map((tag) => {
                          const isSelected = selectedBlockers.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic(12);
                                if (isSelected) {
                                  setSelectedBlockers(selectedBlockers.filter((t) => t !== tag.id));
                                } else {
                                  setSelectedBlockers([...selectedBlockers, tag.id]);
                                }
                              }}
                              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#C86D51] text-white border-[#C86D51] font-medium"
                                  : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] hover:text-[#2C2520]"
                              }`}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 3: Craving Intensity & Takeaways */}
              {stage === 3 && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#786F66] font-semibold block mb-1">
                      Step 3 of 4: Recovery Intensity
                    </span>
                    <h3 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      Craving & Energy Level
                    </h3>
                  </div>

                  {/* Tactile Slider */}
                  <div className="p-5 rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-3 shadow-organic-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-[#786F66] font-medium">
                        Intensity Rating
                      </span>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F3EFE7] dark:bg-[#2D2A26] text-[#2C2520] dark:text-[#ECE7E0]">
                        Level {moodOrCraving} of 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={moodOrCraving}
                      onChange={(e) => {
                        setMoodOrCraving(Number(e.target.value));
                        triggerHaptic(8);
                      }}
                      className="w-full accent-[#C86D51] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#786F66] dark:text-[#A8A096]">
                      <span>1 (Peaceful)</span>
                      <span>3 (Moderate)</span>
                      <span>5 (Challenging)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#786F66] font-medium mb-1.5">
                      Gentle takeaway for tomorrow (Optional)
                    </label>
                    <input
                      type="text"
                      value={lessonsLearned}
                      onChange={(e) => setLessonsLearned(e.target.value)}
                      placeholder="e.g. Schedule rest earlier, step outside for 5 mins"
                      className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>
                </div>
              )}

              {/* Stage 4: Peaceful Closure */}
              {stage === 4 && (
                <div className="space-y-5 py-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#EEF4F0] text-[#658B70] flex items-center justify-center shadow-organic-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                      Reflection Sealed
                    </h3>
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-2 max-w-xs leading-relaxed">
                      Thank you for showing up for yourself tonight. Rest well, tomorrow is a brand new anchor.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Controls */}
        <div className="pt-6 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between gap-3">
          {stage > 1 && stage < 4 ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setStage(stage - 1);
              }}
              className="py-3.5 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Forward Button */}
          {type === "morning" && stage < 4 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setStage(stage + 1);
              }}
              className="py-3.5 px-6 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-organic-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {type === "evening" && stage === 2 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setStage(3);
              }}
              className="py-3.5 px-6 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-organic-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {type === "evening" && stage === 3 && (
            <button
              type="button"
              onClick={submitEvening}
              disabled={saving}
              className="py-3.5 px-6 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-organic-md disabled:opacity-50"
            >
              <span>{saving ? "Recording..." : "Record Reflection"}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
