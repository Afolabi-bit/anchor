"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import GroundingDrawer from "@/app/components/GroundingDrawer";
import CheckInStepper from "@/app/components/CheckInStepper";
import NewCommitmentModal from "@/app/components/NewCommitmentModal";
import PageTransition from "@/app/components/PageTransition";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import { TodaySkeleton } from "@/app/components/Skeletons";
import { getTodayAffirmation } from "@/lib/affirmations";
import JournalComposer from "@/app/components/JournalComposer";
import {
  Sun,
  Moon,
  CheckCircle2,
  Check,
  Anchor,
  Compass,
  ArrowRight,
  Sparkles,
  Plus,
  MessageSquareHeart,
  Quote,
  Clock,
  Wind
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [activeCommitmentId, setActiveCommitmentId] = useState<string>("");
  const [newModalOpen, setNewModalOpen] = useState(false);

  // Time-aware horizon
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 14; // After 2:00 PM is Evening reflection horizon

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const greeting = isEvening ? "Good Evening" : "Good Morning";

  // Check-in data
  const [morningCheckIn, setMorningCheckIn] = useState<any>(null);
  const [eveningCheckIn, setEveningCheckIn] = useState<any>(null);
  const [partnerMessages, setPartnerMessages] = useState<any[]>([]);

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);

  // Daily Affirmation quote
  const affirmation = getTodayAffirmation();

  const dismissPartnerMessage = async (msgId: string) => {
    triggerHaptic(10);
    setPartnerMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await fetch("/api/sponsor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId }),
      });
    } catch {}
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        if (!meData.user.isOnboarded) {
          router.push("/onboarding");
          return;
        }
        setUser(meData.user);
        const comms = meData.commitments || (meData.commitment ? [meData.commitment] : []);
        setCommitments(comms);
        if (comms.length > 0) {
          setActiveCommitmentId((prev) => prev || comms[0].id);
        }

        // Fetch check-ins for today
        const checkInsRes = await fetch(`/api/checkins?date=${todayStr}`);
        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          const targetCommId = comms[0]?.id;
          const m = data.checkIns.find((c: any) => c.type === "morning" && (!c.commitmentId || c.commitmentId === targetCommId));
          const e = data.checkIns.find((c: any) => c.type === "evening" && (!c.commitmentId || c.commitmentId === targetCommId));

          if (m) setMorningCheckIn(m);
          if (e) setEveningCheckIn(e);
        }

        // Fetch sponsor encouragement messages
        try {
          const sponsorRes = await fetch("/api/sponsor");
          if (sponsorRes.ok) {
            const sponsorData = await sponsorRes.json();
            setPartnerMessages(sponsorData.messages?.filter((m: any) => !m.read) || []);
          }
        } catch {}
      } catch (err) {
        console.error("Error loading today state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, todayStr]);

  // Refetch check-ins when active commitment changes
  useEffect(() => {
    if (!activeCommitmentId) return;
    async function reloadCommitmentCheckIns() {
      try {
        const checkInsRes = await fetch(`/api/checkins?date=${todayStr}`);
        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          const m = data.checkIns.find((c: any) => c.type === "morning" && (!c.commitmentId || c.commitmentId === activeCommitmentId));
          const e = data.checkIns.find((c: any) => c.type === "evening" && (!c.commitmentId || c.commitmentId === activeCommitmentId));
          setMorningCheckIn(m || null);
          setEveningCheckIn(e || null);
        }
      } catch (e) {
        console.error("Failed to load checkins for commitment", e);
      }
    }
    reloadCommitmentCheckIns();
  }, [activeCommitmentId, todayStr]);

  const activeCommitment = commitments.find((c) => c.id === activeCommitmentId) || commitments[0] || null;
  const activeColorHex = PALETTE_HEX[activeCommitment?.colorIndex ?? 0] || "#C86D51";

  const handleCheckInSuccess = (savedCheckIn: any) => {
    if (savedCheckIn.type === "morning") setMorningCheckIn(savedCheckIn);
    if (savedCheckIn.type === "evening") setEveningCheckIn(savedCheckIn);
  };

  const handleCommitmentCreated = (newComm: any) => {
    setCommitments((prev) => [...prev, newComm]);
    setActiveCommitmentId(newComm.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
        <Navigation />
        <TodaySkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={user?.firstName ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}` : undefined}
      />
      <OfflineSyncBadge />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-5 py-5 sm:py-8 space-y-5 sm:space-y-6">
          {/* Top Bar: Clean Greeting & Grounding Access */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                {formattedDate}
              </span>
              <h1 className="font-serif-title text-xl sm:text-2xl md:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5 truncate">
                {greeting}{user?.firstName ? `, ${user.firstName}` : user?.email ? `, ${user.email.split("@")[0]}` : ""}
              </h1>
            </div>

            <div className="shrink-0">
              <GroundingDrawer />
            </div>
          </div>

          {/* Partner Encouragement Notification Banner (Only if active cheer exists) */}
          {partnerMessages.length > 0 && (
            <div className="space-y-2">
              {partnerMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] clay-card shadow-organic-sm flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#658B70] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <MessageSquareHeart className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#658B70] dark:text-[#82A78C]">
                        Word from {msg.senderName}
                      </span>
                      <p className="text-xs sm:text-sm font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                        "{msg.message}"
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissPartnerMessage(msg.id)}
                    className="text-[11px] font-medium text-[#658B70] hover:text-[#2C2520] bg-white/80 dark:bg-[#1E1B18]/80 px-2.5 py-1 rounded-full border border-[#D9E6DD] dark:border-[#2C4032] shrink-0 cursor-pointer"
                  >
                    Thank you
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Mindful Daily Capsule (Sleek, integrated 1-line wisdom) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Quote className="w-4 h-4 text-[#B88452] shrink-0 opacity-75" />
              <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate">
                "{affirmation.quote}"
              </p>
            </div>
            <span className="text-[10px] text-[#B88452] font-semibold shrink-0 uppercase tracking-wider">
              {affirmation.category}
            </span>
          </div>

          {/* Multi-Anchor Segmented Selector */}
          {commitments.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-2xs overflow-x-auto no-scrollbar">
              {commitments.map((comm) => {
                const isActive = comm.id === activeCommitmentId;
                const commColor = PALETTE_HEX[comm.colorIndex ?? 0] || "#C86D51";

                return (
                  <button
                    key={comm.id}
                    onClick={() => {
                      triggerHaptic(8);
                      setActiveCommitmentId(comm.id);
                    }}
                    className={`relative text-xs px-3.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 z-10 flex items-center gap-1.5 ${
                      isActive
                        ? "text-[#2C2520] dark:text-[#ECE7E0]"
                        : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAnchorTab"
                        className="absolute inset-0 bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] rounded-xl shadow-2xs -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: commColor }} />
                    <span>{comm.name}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  triggerHaptic(10);
                  setNewModalOpen(true);
                }}
                className="p-1.5 rounded-xl text-[#786F66] hover:text-[#2C2520] shrink-0 cursor-pointer ml-auto"
                title="Add Anchor"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Commitment Focus Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-1"
                style={{ color: activeColorHex }}
              >
                <Anchor className="w-3.5 h-3.5" />
                Today's Core Anchor
              </span>
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
              {activeCommitment?.name || "Daily Anchor Focus"}
            </h2>
            {activeCommitment?.why && (
              <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] font-serif italic">
                "{activeCommitment.why}"
              </p>
            )}
          </div>

          {/* 2-Phase Ritual Cadence Strip */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-xs shadow-2xs">
            <div className={`p-2.5 rounded-xl flex items-center gap-2 ${morningCheckIn ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]" : "text-[#786F66]"}`}>
              <Sun className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate">1. Morning Intention</span>
              {morningCheckIn && <Check className="w-3.5 h-3.5 ml-auto text-[#B88452]" />}
            </div>

            <div className={`p-2.5 rounded-xl flex items-center gap-2 ${eveningCheckIn ? "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]" : "text-[#786F66]"}`}>
              <Moon className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate">2. Evening Reflection</span>
              {eveningCheckIn && <Check className="w-3.5 h-3.5 ml-auto text-[#C86D51]" />}
            </div>
          </div>

          {/* ========================================================= */}
          {/* THE TIME-AWARE RITUAL HERO CARD (Single Primary Focus)     */}
          {/* ========================================================= */}
          
          {!isEvening ? (
            /* ---------------- MORNING HORIZON (< 2:00 PM) ---------------- */
            <div className="space-y-4">
              {/* Primary Focus: Morning Intention */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border-2 border-[#B88452]/40 dark:border-[#B88452]/30 clay-card shadow-organic-md space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#B88452]">
                        Morning Ritual
                      </span>
                      <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Set Your Intention
                      </h3>
                    </div>
                  </div>

                  {morningCheckIn && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold border border-[#B88452]/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Sealed</span>
                    </span>
                  )}
                </div>

                {morningCheckIn ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold block">
                      Intention Sealed for Today:
                    </span>
                    {morningCheckIn.plannedActions && morningCheckIn.plannedActions.length > 0 && (
                      <div className="space-y-1.5">
                        {morningCheckIn.plannedActions.map((act: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[#2C2520] dark:text-[#ECE7E0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70]" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {morningCheckIn.intentionNote && (
                      <p className="font-serif italic text-[#786F66] dark:text-[#A8A096] pt-1">
                        "{morningCheckIn.intentionNote}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      Anchor your mindset before the day unfolds. Choose 1 or 2 small actions to protect your peace.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("morning");
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#B88452] hover:bg-[#A37445] text-white font-semibold text-sm shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Anchor Your Day (15s)</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Secondary Preview: Evening Reflection */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-[#C86D51]" />
                  <span>Evening Reflection opens this evening</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveStepper("evening");
                  }}
                  className="font-medium text-[#C86D51] hover:underline cursor-pointer"
                >
                  Record early →
                </button>
              </div>
            </div>
          ) : (
            /* ---------------- EVENING HORIZON (>= 2:00 PM) ---------------- */
            <div className="space-y-4">
              {/* Primary Focus: Evening Reflection */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border-2 border-[#C86D51]/40 dark:border-[#C86D51]/30 clay-card shadow-organic-md space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center shadow-2xs">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C86D51]">
                        Evening Ritual
                      </span>
                      <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                        Close Your Day
                      </h3>
                    </div>
                  </div>

                  {eveningCheckIn && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] font-semibold border border-[#C86D51]/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {eveningCheckIn ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold">
                        Day Recorded & Anchored
                      </span>
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold">
                        {eveningCheckIn.status === "yes" ? "Followed Through" : eveningCheckIn.status === "partial" ? "Partially" : "Learned"}
                      </span>
                    </div>

                    {eveningCheckIn.reflection && (
                      <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                        "{eveningCheckIn.reflection}"
                      </p>
                    )}

                    <div className="pt-2 text-[#786F66] dark:text-[#A8A096] italic text-[11px]">
                      Your day is honored without judgment. Rest peacefully tonight.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                      Take 30 seconds to reflect on your anchor with honesty and self-compassion.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerHaptic(12);
                        setActiveStepper("evening");
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-semibold text-sm shadow-organic-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Close Your Day with Compassion (30s)</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Secondary Review: Morning Intention Recap */}
              {morningCheckIn ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                  <div className="flex items-center gap-2 truncate">
                    <Sun className="w-4 h-4 text-[#B88452] shrink-0" />
                    <span className="truncate">Morning: {morningCheckIn.plannedActions?.[0] || "Intention set"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold shrink-0">
                    Sealed ✓
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#786F66]" />
                    <span>Morning intention was skipped today</span>
                  </div>
                  <span className="text-[11px] text-[#786F66]">No penalty</span>
                </div>
              )}
            </div>
          )}

          {/* Lightweight Daily Reflection Composer */}
          <div className="pt-1">
            <JournalComposer variant="compact" />
          </div>
        </main>
      </PageTransition>

      {/* Stepper Modal for Morning / Evening */}
      {activeStepper && (
        <CheckInStepper
          isOpen={Boolean(activeStepper)}
          initialStage={activeStepper}
          commitmentName={activeCommitment?.name || "Daily Anchor"}
          commitmentWhy={activeCommitment?.why}
          commitmentId={activeCommitment?.id}
          onClose={() => setActiveStepper(null)}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {/* New Commitment Modal */}
      {newModalOpen && (
        <NewCommitmentModal
          isOpen={newModalOpen}
          onClose={() => setNewModalOpen(false)}
          onCreated={handleCommitmentCreated}
        />
      )}
    </div>
  );
}
