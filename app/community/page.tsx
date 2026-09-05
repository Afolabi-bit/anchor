"use client";

import { useState, useEffect } from "react";
import PageTransition from "@/app/components/PageTransition";
import {
  Heart,
  Anchor,
  PaperPlaneRight as Send,
  Plus,
  Compass,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle as CheckCircle2,
  Users,
  HandHeart as MessageSquareHeart,
  Quotes as Quote,
} from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";
import { useAppContext } from "@/app/context/AppContext";

const CATEGORIES = [
  "All",
  "Sobriety & Recovery",
  "Mental Health & Calm",
  "Physical Vitality",
  "Mindful Living",
];

const EMOTION_PRESETS = ["Peaceful", "Grounded", "Grateful", "Courageous", "Serene", "Reflective"];

export default function CommunityPage() {
  const { user, communityReflections, setCategoryReflections } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reflections, setReflections] = useState<any[]>(() => communityReflections["All"] || []);
  const [loading, setLoading] = useState(() => !(communityReflections["All"]?.length > 0));

  // Sharing form state
  const [isComposing, setIsComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Sobriety & Recovery");
  const [newEmotion, setNewEmotion] = useState("Grounded");
  const [newDays, setNewDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  // Local resonance tracker to prevent spam
  const [resonatedIds, setResonatedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("anchor_resonated_ids") || "{}");
      setResonatedIds(saved);
    } catch (e) {
      console.warn("Failed to load resonated reflections from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    // If cached reflections exist for this category, load them immediately
    if (communityReflections[selectedCategory]?.length > 0) {
      setReflections(communityReflections[selectedCategory]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function loadReflections() {
      try {
        const res = await fetch(`/api/community?category=${encodeURIComponent(selectedCategory)}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.reflections || [];
          setReflections(list);
          setCategoryReflections(selectedCategory, list);
        }
      } catch (err) {
        console.error("Community feed load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReflections();
  }, [selectedCategory, communityReflections, setCategoryReflections]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setSubmitting(true);
      triggerHaptic(15);
      playSingingBowlChime(528);

      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          emotionName: newEmotion,
          anchoredDays: newDays,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C86D51", "#658B70", "#FAF2EA", "#E2A365"],
        });
        setReflections((prev) => [data.reflection, ...prev]);
        setNewContent("");
        setIsComposing(false);
      }
    } catch (err) {
      console.error("Failed to share reflection:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResonate = async (id: string, isSilentStrength = false) => {
    if (resonatedIds[id]) return;
    triggerHaptic(12);

    // Optimistic UI update
    setReflections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, resonatesCount: (r.resonatesCount || 0) + 1 } : r))
    );

    const next = { ...resonatedIds, [id]: true };
    setResonatedIds(next);
    try {
      localStorage.setItem("anchor_resonated_ids", JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to persist resonated ID:", e);
    }

    try {
      await fetch("/api/community/resonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.warn("Failed to sync resonance to server:", e);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 pb-36">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Quiet Space
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5 truncate">
                Community Moments
              </h1>
            </div>

            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsComposing(!isComposing);
              }}
              className="text-xs px-3.5 py-2 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium shadow-organic-sm flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share Moment</span>
            </motion.button>
          </div>

          {/* Guiding Warmth Subhead */}
          <div className="mb-6 p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-xs text-[#786F66] dark:text-[#A8A096] flex items-start gap-2.5 clay-card shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#2C2520] dark:text-[#ECE7E0]">100% Anonymous & Judgment-Free: </strong>
              No profiles, no follower counts, no comments. Just the quiet reassurance that you are not alone in showing up.
            </span>
          </div>

          {/* Share Moment Form Expandable */}
          <AnimatePresence>
            {isComposing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <form
                  onSubmit={handleShare}
                  className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#C86D51]">
                      Share an Anonymous Reflection
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold">
                      Private & Anonymous
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    required
                    maxLength={280}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g. Day 14. First weekend without a drink. Kept sparkling water close and went for a long sunset walk."
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] resize-none leading-relaxed"
                  />

                  {/* Category & Emotion Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1">
                        Recognized Emotion
                      </label>
                      <select
                        value={newEmotion}
                        onChange={(e) => setNewEmotion(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      >
                        {EMOTION_PRESETS.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[#9E948A]">
                      {280 - newContent.length} characters left
                    </span>

                    <button
                      type="submit"
                      disabled={submitting || !newContent.trim()}
                      className="px-5 py-2.5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-organic-sm transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Spinner size="xs" />
                          <span>Sharing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Anonymously</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 relative no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setSelectedCategory(cat);
                  }}
                  className={`relative text-xs px-3.5 py-2 rounded-full font-medium transition-colors cursor-pointer shrink-0 z-10 ${
                    isActive
                      ? "text-white dark:text-[#1C1917]"
                      : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCommunityCategory"
                      className="absolute inset-0 bg-[#2C2520] dark:bg-[#ECE7E0] rounded-full shadow-organic-sm -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Reflections Stream */}
          {loading ? (
            <div className="p-12 text-center text-xs font-serif text-[#786F66] dark:text-[#A8A096]">
              Gathering quiet moments from the community...
            </div>
          ) : reflections.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center space-y-3 clay-card shadow-organic-sm">
              <div className="w-12 h-12 rounded-full bg-[#F3EFE7] dark:bg-[#2E2A26] text-[#786F66] flex items-center justify-center mx-auto">
                <Quote className="w-6 h-6" />
              </div>
              <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                No moments shared in this category yet
              </h3>
              <p className="text-xs text-[#786F66] dark:text-[#A8A096] max-w-sm mx-auto">
                Be the first to share an anonymous gentle reflection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reflections.map((ref) => {
                const hasResonated = resonatedIds[ref.id];

                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm space-y-3.5 relative overflow-hidden"
                  >
                    {/* Header Chips */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] font-semibold uppercase tracking-wider">
                          {ref.category}
                        </span>
                        {ref.emotionName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#658B70]" />
                            <span>{ref.emotionName}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-[#9E948A]">
                        {formatRelativeTime(ref.createdAt)}
                      </span>
                    </div>

                    {/* Reflection Content */}
                    <p className="font-serif italic text-sm sm:text-base text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                      "{ref.content}"
                    </p>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EAE3D7]/60 dark:border-[#38332E]/60 text-xs">
                      <div className="flex items-center gap-1.5 text-xs text-[#786F66] dark:text-[#A8A096]">
                        <Anchor className="w-3.5 h-3.5 text-[#C86D51]" />
                        <span>Day {ref.anchoredDays || 1}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Send Silent Strength */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleResonate(ref.id, true)}
                          className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                            hasResonated
                              ? "bg-[#F9EBE7] dark:bg-[#38251F] border-[#C86D51] text-[#C86D51]"
                              : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] hover:text-[#2C2520]"
                          }`}
                        >
                          <Anchor className={`w-3.5 h-3.5 ${hasResonated ? "text-[#C86D51]" : ""}`} />
                          <span>Strength</span>
                        </motion.button>

                        {/* Gently Resonate */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleResonate(ref.id, false)}
                          className={`px-3 py-1.5 rounded-full border text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                            hasResonated
                              ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#658B70] text-[#658B70]"
                              : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] hover:text-[#2C2520]"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasResonated ? "fill-current text-[#658B70]" : ""}`} />
                          <span>{ref.resonatesCount || 0}</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
