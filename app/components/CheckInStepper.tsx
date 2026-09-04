"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Plus,
  Trash as Trash2,
  Check,
  Anchor,
  CheckCircle as CheckCircle2,
  HandHeart as HeartHandshake,
  Microphone as Mic,
  ChatCircle as MessageSquare,
} from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";
import EmotionWheel, { EmotionState } from "@/app/components/EmotionWheel";
import VoiceDictationButton from "@/app/components/VoiceDictationButton";
import { enqueuePendingCheckIn } from "@/lib/offline-sync";
import type { Commitment, CheckIn } from "@/db/schema";

const SMART_INTENTION_PRESETS = [
  "15-min gentle walk",
  "Reach out to my partner",
  "10 minutes of quiet breathing",
  "Protect 7+ hours of sleep",
  "Read 10 pages of calm reflection",
];

const BLOCKER_TAGS = [
  { id: "stress", label: "Stress & Anxiety" },
  { id: "time", label: "Time & Schedule" },
  { id: "urge", label: "Urges & Cravings" },
  { id: "forgot", label: "Distraction" },
  { id: "unmotivated", label: "Fatigue & Depletion" },
  { id: "other", label: "Situational / Other" },
];

interface CheckInStepperProps {
  type?: "morning" | "evening";
  initialStage?: "morning" | "evening";
  commitment?: Commitment | null;
  commitmentName?: string;
  commitmentWhy?: string;
  commitmentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (checkIn: CheckIn) => void;
  initialCheckIn?: CheckIn | null;
  targetDate?: string;
  isLate?: boolean;
}

export default function CheckInStepper({
  type,
  initialStage,
  commitment,
  commitmentName,
  commitmentWhy,
  commitmentId,
  isOpen,
  onClose,
  onSuccess,
  initialCheckIn,
  targetDate,
  isLate,
}: CheckInStepperProps) {
  const activeType = type || initialStage || "morning";
  const activeName = commitmentName || commitment?.name || "Daily Anchor Focus";
  const activeWhy = commitmentWhy || commitment?.why || "";
  const activeCommId = commitmentId || commitment?.id;

  // Step state: Morning has 2 steps, Evening has 3 steps
  const totalSteps = activeType === "morning" ? 2 : 3;
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Morning State
  const [actionInput, setActionInput] = useState("");
  const [plannedActions, setPlannedActions] = useState<string[]>(
    initialCheckIn?.plannedActions || [SMART_INTENTION_PRESETS[0]]
  );
  const [intentionNote, setIntentionNote] = useState(initialCheckIn?.intentionNote || "");

  // Evening State
  const [eveningStatus, setEveningStatus] = useState<"yes" | "partial" | "no" | null>(
    (initialCheckIn?.status as "yes" | "partial" | "no" | null) || "yes"
  );
  const [reflection, setReflection] = useState(initialCheckIn?.reflection || "");
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>(initialCheckIn?.blockerTags || []);
  const [lessonsLearned, setLessonsLearned] = useState(initialCheckIn?.lessonsLearned || "");
  const [emotionName, setEmotionName] = useState<string>(initialCheckIn?.emotionName || "Peaceful");
  const [moodValence, setMoodValence] = useState<number>(initialCheckIn?.moodValence ?? 4);
  const [moodArousal, setMoodArousal] = useState<number>(initialCheckIn?.moodArousal ?? 1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDirection(1);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = targetDate || new Date().toISOString().slice(0, 10);

  const handleNext = () => {
    triggerHaptic(8);
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    triggerHaptic(8);
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddAction = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || plannedActions.includes(trimmed)) return;
    setPlannedActions([...plannedActions, trimmed]);
    setActionInput("");
    triggerHaptic(10);
  };

  const handleRemoveAction = (index: number) => {
    setPlannedActions(plannedActions.filter((_, i) => i !== index));
    triggerHaptic(8);
  };

  const toggleBlocker = (tagId: string) => {
    triggerHaptic(10);
    if (selectedBlockers.includes(tagId)) {
      setSelectedBlockers(selectedBlockers.filter((id) => id !== tagId));
    } else {
      setSelectedBlockers([...selectedBlockers, tagId]);
    }
  };

  const handleSaveCheckIn = async () => {
    try {
      setSaving(true);
      setError("");
      triggerHaptic(15);
      playSingingBowlChime(528);

      const payload = {
        date: todayStr,
        type: activeType,
        commitmentId: activeCommId,
        plannedActions: activeType === "morning" ? plannedActions : undefined,
        intentionNote: activeType === "morning" ? intentionNote : undefined,
        status: activeType === "evening" ? (eveningStatus || "yes") : undefined,
        reflection: activeType === "evening" ? reflection : undefined,
        lessonsLearned: activeType === "evening" ? lessonsLearned : undefined,
        blockerTags: activeType === "evening" ? selectedBlockers : undefined,
        emotionName: activeType === "evening" ? emotionName : undefined,
        moodValence: activeType === "evening" ? moodValence : undefined,
        moodArousal: activeType === "evening" ? moodArousal : undefined,
        isLate: Boolean(isLate),
      };

      try {
        const res = await fetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          confetti({
            particleCount: 55,
            spread: 75,
            origin: { y: 0.6 },
            colors: ["#C86D51", "#B88452", "#658B70", "#E2A365"],
          });
          onSuccess(data.checkIn);
          onClose();
          return;
        }
      } catch (err) {
        console.warn("Offline check-in fallback:", err);
        // Enqueue offline if network fails
        enqueuePendingCheckIn({
          commitmentId: activeCommId,
          date: todayStr,
          type: activeType,
          payload,
        });
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#658B70", "#B88452"],
        });
        onSuccess(payload as unknown as CheckIn);
        onClose();
        return;
      }

      setError("Could not complete check-in. Please try again.");
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2C2520]/60 backdrop-blur-md"
        />

        {/* Modal Card (Bottom sheet on mobile, centered dialog on sm+) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          className="relative max-w-lg w-full bg-[#FFFFFF] dark:bg-[#201D1A] border-t sm:border border-[#EAE3D7] dark:border-[#38332E] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-organic-lg clay-card flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D7] dark:border-[#38332E]">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-2xs ${
                  activeType === "morning"
                    ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]"
                    : "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]"
                }`}
              >
                {activeType === "morning" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#786F66] dark:text-[#A8A096]">
                  {activeType === "morning" ? "Morning Intention" : "Evening Reflection"}
                </span>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] leading-none">
                  {activeName}
                </h3>
              </div>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === i + 1
                      ? `w-5 ${activeType === "morning" ? "bg-[#B88452]" : "bg-[#C86D51]"}`
                      : step > i + 1
                      ? "w-2 bg-[#658B70]"
                      : "w-2 bg-[#EAE3D7] dark:bg-[#38332E]"
                  }`}
                />
              ))}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#786F66] hover:text-[#2C2520] cursor-pointer ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-5 space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-[#FDF2F0] text-[#C86D51] text-xs">
                {error}
              </div>
            )}

            {/* ================= MORNING CHECK-IN (2 STEPS) ================= */}
            {activeType === "morning" && (
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="morning-step-1"
                    initial={{ opacity: 0, x: direction * 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 15 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Plan 1–2 Actions for Today
                      </h4>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        Small steps protect your energy. Tap a suggestion or add your own.
                      </p>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {SMART_INTENTION_PRESETS.map((preset) => {
                        const isSelected = plannedActions.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => (isSelected ? setPlannedActions(plannedActions.filter((p) => p !== preset)) : handleAddAction(preset))}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? "bg-[#FAF2EA] dark:bg-[#352A1E] border-[#B88452] text-[#B88452] font-semibold"
                                : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAction(actionInput))}
                        placeholder="Or add a custom micro-action..."
                        className="flex-1 px-4 py-2.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#B88452]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAction(actionInput)}
                        disabled={!actionInput.trim()}
                        className="p-2.5 rounded-2xl bg-[#B88452] text-white text-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Optional Note with Voice Dictation */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                          Optional Thought / Intention Note
                        </label>
                        <VoiceDictationButton
                          onAppendText={(txt: string) =>
                            setIntentionNote((prev: string) => (prev ? `${prev} ${txt}` : txt))
                          }
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={intentionNote}
                        onChange={(e) => setIntentionNote(e.target.value)}
                        placeholder="e.g. Keep my head clear and stay focused."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] resize-none focus:outline-none focus:border-[#B88452]"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="morning-step-2"
                    initial={{ opacity: 0, x: direction * 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 15 }}
                    className="py-6 text-center space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="font-serif-title text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Lock In Today's Intention
                      </h4>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096] max-w-xs mx-auto">
                        Take a breath, then confirm your focus for the day.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#B88452]/30 max-w-xs mx-auto text-left space-y-1.5 text-xs">
                      <span className="text-xs uppercase tracking-wider font-bold text-[#B88452] block">
                        Today's Focus:
                      </span>
                      <p className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">{activeName}</p>
                      {plannedActions.length > 0 && (
                        <p className="text-[#786F66] dark:text-[#A8A096]">• {plannedActions[0]}</p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveCheckIn}
                      disabled={saving}
                      className="w-28 h-28 mx-auto rounded-full bg-[#B88452] hover:bg-[#A37445] text-white shadow-organic-md flex flex-col items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Anchor className="w-8 h-8" />
                      <span className="text-xs font-semibold">{saving ? <Spinner size="xs" /> : "Seal Anchor"}</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* ================= EVENING CHECK-IN (3 STEPS) ================= */}
            {activeType === "evening" && (
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* Step 1: Follow-Through Status */
                  <motion.div
                    key="evening-step-1"
                    initial={{ opacity: 0, x: direction * 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 15 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        How Did Today Go?
                      </h4>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        Be honest. No judgment here.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        {
                          id: "yes",
                          title: "Yes, Followed Through",
                          desc: "Showed up and did the work.",
                          color: "border-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70]",
                        },
                        {
                          id: "partial",
                          title: "Partially / Adjusted",
                          desc: "Did part of it, or adapted to the day.",
                          color: "border-[#B88452] bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]",
                        },
                        {
                          id: "no",
                          title: "Didn't Get There",
                          desc: "Today was hard. Tomorrow is a fresh start.",
                          color: "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]",
                        },
                      ].map((opt) => {
                        const isSelected = eveningStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic(10);
                              setEveningStatus(opt.id as any);
                            }}
                            className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer clay-card shadow-2xs ${
                              isSelected ? `${opt.color} border-2` : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                                {opt.title}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-0.5">
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : step === 2 ? (
                  /* Step 2: Emotional Climate (Russell Circumplex) */
                  <motion.div
                    key="evening-step-2"
                    initial={{ opacity: 0, x: direction * 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 15 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Emotional Climate
                      </h4>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        How did you feel today?
                      </p>
                    </div>

                    <EmotionWheel
                      selectedEmotion={emotionName}
                      onSelectEmotion={(em: EmotionState) => {
                        setEmotionName(em.name);
                        setMoodValence(em.valence);
                        setMoodArousal(em.arousal);
                      }}
                    />
                  </motion.div>
                ) : (
                  /* Step 3: Reflection & Takeaway */
                  <motion.div
                    key="evening-step-3"
                    initial={{ opacity: 0, x: direction * 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 15 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        What Did Today Teach You?
                      </h4>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        Brief note or key takeaway from today.
                      </p>
                    </div>

                    {/* Blocker Chips if not full yes */}
                    {eveningStatus !== "yes" && (
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                          Obstacle Triggers (Optional)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {BLOCKER_TAGS.map((tag) => {
                            const isSelected = selectedBlockers.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleBlocker(tag.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-[#F9EBE7] dark:bg-[#38251F] border-[#C86D51] text-[#C86D51] font-semibold"
                                    : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
                                }`}
                              >
                                {tag.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reflection Box with Voice Dictation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                          Evening Note / Takeaway
                        </label>
                        <VoiceDictationButton
                          onAppendText={(txt: string) =>
                            setReflection((prev: string) => (prev ? `${prev} ${txt}` : txt))
                          }
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="e.g. Stayed steady despite a rough afternoon."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] resize-none focus:outline-none focus:border-[#C86D51] leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2 rounded-xl text-xs text-[#786F66] hover:text-[#2C2520] flex items-center gap-1 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className={`px-5 py-2.5 rounded-2xl text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-organic-sm transition-colors ${
                  activeType === "morning" ? "bg-[#B88452] hover:bg-[#A37445]" : "bg-[#C86D51] hover:bg-[#B35D43]"
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveCheckIn}
                disabled={saving}
                className={`px-6 py-2.5 rounded-2xl text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-organic-sm transition-colors disabled:opacity-50 ${
                  activeType === "morning" ? "bg-[#B88452] hover:bg-[#A37445]" : "bg-[#C86D51] hover:bg-[#B35D43]"
                }`}
              >
                {saving ? (
                  <>
                    <Spinner size="xs" />
                    <span>{activeType === "morning" ? "Sealing..." : "Recording..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{activeType === "morning" ? "Seal Anchor" : "Complete Reflection"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
