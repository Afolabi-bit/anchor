"use client";

import { useState, useEffect, useRef } from "react";
import {
  PencilSimple as PenLine,
  Check,
  X,
  Plus,
  Tag,
  Smiley as Smile,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import EmotionWheel, { EmotionState, EMOTIONS_CATALOG } from "@/app/components/EmotionWheel";
import VoiceDictationButton from "@/app/components/VoiceDictationButton";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

interface JournalComposerProps {
  onEntryCreated?: (entry: any) => void;
  variant?: "full" | "compact";
  defaultDate?: string;
  placeholder?: string;
}

const PRESET_TAGS = [
  "recovery",
  "gratitude",
  "grounding",
  "urge-surfing",
  "therapy-notes",
  "boundaries",
  "nervous-system",
];

export default function JournalComposer({
  onEntryCreated,
  variant = "full",
  defaultDate,
  placeholder = "Write freely. Your thoughts stay safe here...",
}: JournalComposerProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionState | null>(null);
  const [showEmotionWheel, setShowEmotionWheel] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Status & Auto-save
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(variant === "full");

  const storageKey = `anchor_journal_draft_${defaultDate || "today"}`;

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content) setContent(parsed.content);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.tags && Array.isArray(parsed.tags)) setTags(parsed.tags);
        if (parsed.emotionName) {
          const match = EMOTIONS_CATALOG.find((e) => e.name === parsed.emotionName);
          if (match) setSelectedEmotion(match);
        }
      }
    } catch (e) {
      console.warn("Could not parse saved journal draft:", e);
    }
  }, [storageKey]);

  // Debounced auto-save draft
  useEffect(() => {
    if (!content.trim() && !title.trim() && tags.length === 0 && !selectedEmotion) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            content,
            title,
            tags,
            emotionName: selectedEmotion?.name,
            updatedAt: Date.now(),
          })
        );
        setDraftSaved(true);
        const hideTimer = setTimeout(() => setDraftSaved(false), 2500);
        return () => clearTimeout(hideTimer);
      } catch (e) {
        console.warn("Could not auto-save journal draft:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [content, title, tags, selectedEmotion, storageKey]);

  const handleAddTag = (t: string) => {
    const clean = t.trim().toLowerCase().replace(/^#/, "");
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setTagInput("");
    triggerHaptic(8);
  };

  const handleRemoveTag = (t: string) => {
    setTags((prev) => prev.filter((item) => item !== t));
    triggerHaptic(8);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please add a few thoughts before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      triggerHaptic([15, 30, 20]);

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: defaultDate || new Date().toISOString().slice(0, 10),
          title: title.trim() || undefined,
          content: content.trim(),
          moodValence: selectedEmotion?.valence,
          moodEnergy: selectedEmotion?.arousal,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "That didn't save — want to try again?");
        setSaving(false);
        return;
      }

      // Clear draft
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn("Could not remove saved draft from storage:", e);
      }

      playSingingBowlChime();
      setContent("");
      setTitle("");
      setTags([]);
      setSelectedEmotion(null);
      setShowEmotionWheel(false);
      setShowTagInput(false);

      if (variant === "compact") {
        setIsExpanded(false);
      }

      if (onEntryCreated && data.entry) {
        onEntryCreated(data.entry);
      }
    } catch (err) {
      setError("That didn't save — want to try again?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-3.5 transition-all">
      {/* Header & Prompt */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shrink-0">
              <PenLine className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#786F66] dark:text-[#A8A096]">
              Daily Reflection
            </span>
          </div>
          <h3 className="font-serif-title text-base sm:text-lg text-[#2C2520] dark:text-[#ECE7E0]">
            What&apos;s on your mind right now?
          </h3>
        </div>

        {/* Auto-save & Collapsible Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {draftSaved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-[#658B70] flex items-center gap-1 font-medium bg-[#EEF4F0] dark:bg-[#202D24] px-2 py-0.5 rounded-full"
              >
                <Check className="w-2.5 h-2.5" />
                <span>Saved</span>
              </motion.span>
            )}
          </AnimatePresence>

          {variant === "compact" && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setIsExpanded(!isExpanded);
              }}
              className="text-xs text-[#786F66] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] p-1 cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Composer Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-1"
          >
            {/* Optional Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title or focus (optional)"
              className="w-full px-3.5 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C86D51]"
            />

            {/* Reflection Text Area */}
            <div className="relative">
              <textarea
                rows={variant === "full" ? 4 : 3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-3 pr-10 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs sm:text-sm text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C86D51] resize-none leading-relaxed"
              />
              <div className="absolute right-2.5 bottom-3.5">
                <VoiceDictationButton
                  onAppendText={(txt: string) =>
                    setContent((prev) => (prev ? `${prev} ${txt}` : txt))
                  }
                />
              </div>
            </div>

            {/* Mood & Tags Bar */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Mood Selector Button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setShowEmotionWheel(!showEmotionWheel);
                  }}
                  className={`px-3 py-1.5 rounded-full border cursor-pointer flex items-center gap-1.5 transition-all ${
                    selectedEmotion
                      ? `${selectedEmotion.bgLight} ${selectedEmotion.bgDark} ${selectedEmotion.textColor} font-semibold border-current`
                      : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>
                    {selectedEmotion ? `${selectedEmotion.name} (${selectedEmotion.valence > 0 ? `+${selectedEmotion.valence}` : selectedEmotion.valence})` : "Attach mood"}
                  </span>
                  {selectedEmotion && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmotion(null);
                      }}
                      className="hover:opacity-70 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>

                {/* Add Tag Button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setShowTagInput(!showTagInput);
                  }}
                  className="px-3 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] cursor-pointer flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>Add tag</span>
                </button>

                {/* Active Tags */}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-[#F3EFE7] dark:bg-[#2D2824] text-[#786F66] dark:text-[#A8A096] text-[11px] font-medium flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[#C86D51]"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Input Drawer */}
              <AnimatePresence>
                {showTagInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            handleAddTag(tagInput);
                          }
                        }}
                        placeholder="Type a tag & press enter (e.g. recovery)"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(tagInput)}
                        className="px-3 py-1.5 rounded-xl bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.filter((pt) => !tags.includes(pt)).map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => handleAddTag(pt)}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] hover:border-[#C86D51] hover:text-[#C86D51] cursor-pointer"
                        >
                          +{pt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emotion Wheel Expandable Drawer */}
              <AnimatePresence>
                {showEmotionWheel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 sm:p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                        How does your nervous system feel?
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEmotionWheel(false)}
                        className="text-xs text-[#786F66] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                      >
                        Done
                      </button>
                    </div>

                    <EmotionWheel
                      selectedEmotion={selectedEmotion?.name}
                      onSelectEmotion={(em: EmotionState) => {
                        setSelectedEmotion(em);
                        triggerHaptic(10);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] border border-[#F2D7CE] dark:border-[#4D332B] text-xs text-[#C86D51] dark:text-[#E07A5F]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#9E948A]">
                {content.length > 0 ? `${content.length} characters` : "Takes ~1 minute"}
              </span>

              <div className="flex items-center gap-2">
                {variant === "compact" && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setIsExpanded(false);
                    }}
                    className="px-3 py-2 rounded-xl text-xs text-[#786F66] hover:text-[#2C2520] cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  className="px-4 py-2 rounded-xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs font-semibold shadow-organic-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Spinner size="xs" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save reflection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state click target if compact */}
      {!isExpanded && variant === "compact" && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            setIsExpanded(true);
          }}
          className="w-full py-2 px-3 rounded-xl border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-left text-xs text-[#9E948A] hover:border-[#C86D51] hover:text-[#C86D51] transition-colors cursor-pointer"
        >
          Tap to write a quiet note or reflection...
        </button>
      )}
    </div>
  );
}
