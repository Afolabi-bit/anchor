"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import GroundingDrawer from "@/app/components/GroundingDrawer";
import CircadianArc from "@/app/components/CircadianArc";
import CheckInStepper from "@/app/components/CheckInStepper";
import {
  Sun,
  Moon,
  Plus,
  Trash2,
  CheckCircle2,
  HeartHandshake,
  Check,
  CircleDot,
  Anchor,
  Compass,
  ArrowRight
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commitment, setCommitment] = useState<any>(null);

  // Today's date
  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // Check-in data
  const [morningCheckIn, setMorningCheckIn] = useState<any>(null);
  const [eveningCheckIn, setEveningCheckIn] = useState<any>(null);

  // Stepper Modal State
  const [activeStepper, setActiveStepper] = useState<"morning" | "evening" | null>(null);

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
        setCommitment(meData.commitment);

        // Fetch check-ins for today
        const checkInsRes = await fetch(`/api/checkins?date=${todayStr}`);
        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          const m = data.checkIns.find((c: any) => c.type === "morning");
          const e = data.checkIns.find((c: any) => c.type === "evening");

          if (m) setMorningCheckIn(m);
          if (e) setEveningCheckIn(e);
        }
      } catch (err) {
        console.error("Error loading today state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, todayStr]);

  const handleCheckInSuccess = (savedCheckIn: any) => {
    if (savedCheckIn.type === "morning") setMorningCheckIn(savedCheckIn);
    if (savedCheckIn.type === "evening") setEveningCheckIn(savedCheckIn);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#1C1917]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-[#C86D51] border-t-transparent animate-spin" />
          <span className="text-sm font-serif-title text-[#786F66] dark:text-[#A8A096]">
            Gathering your quiet space...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation userEmail={user?.email} />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-10">
        {/* Soft Date & Grounding Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold">
              {formattedDate}
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-1">
              Daily Anchor Sanctuary
            </h1>
          </div>
          <GroundingDrawer />
        </div>

        {/* Commitment Hero Focus Card */}
        {commitment && (
          <div className="mb-6 p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md">
            <span className="text-xs uppercase tracking-wider text-[#C86D51] dark:text-[#DB8165] font-semibold block">
              Active Focus
            </span>
            <h2 className="font-serif-title text-2xl text-[#2C2520] dark:text-[#ECE7E0] mt-1">
              {commitment.name}
            </h2>
            {commitment.why && (
              <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-2 italic leading-relaxed font-serif">
                "{commitment.why}"
              </p>
            )}
          </div>
        )}

        {/* Circadian 24-Hour Day Rhythm Hub */}
        <CircadianArc
          morningCompleted={Boolean(morningCheckIn)}
          eveningCompleted={Boolean(eveningCheckIn)}
          onOpenMorning={() => {
            triggerHaptic(15);
            setActiveStepper("morning");
          }}
          onOpenEvening={() => {
            triggerHaptic(15);
            setActiveStepper("evening");
          }}
          onOpenGrounding={() => {
            triggerHaptic(15);
            const pauseBtn = document.querySelector('button[title*="Pause"]') as HTMLElement;
            if (pauseBtn) pauseBtn.click();
          }}
        />

        {/* Today's Reflection Summary Cards */}
        <div className="space-y-4">
          {/* Morning Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                  Morning Intention
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(12);
                  setActiveStepper("morning");
                }}
                className="text-xs px-3.5 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] text-[#C86D51] font-medium cursor-pointer"
              >
                {morningCheckIn ? "Edit Intention" : "Start Planning"}
              </button>
            </div>

            {morningCheckIn ? (
              <div className="space-y-2 text-xs">
                {morningCheckIn.plannedActions?.length > 0 && (
                  <ul className="space-y-1 pl-1">
                    {morningCheckIn.plannedActions.map((action: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-[#2C2520] dark:text-[#ECE7E0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#658B70]" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {morningCheckIn.intentionNote && (
                  <p className="pt-2 border-t border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] italic font-serif">
                    "{morningCheckIn.intentionNote}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Take a moment to plan 1–2 micro-actions for today without pressure.
              </p>
            )}
          </div>

          {/* Evening Card */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                  Evening Reflection
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(12);
                  setActiveStepper("evening");
                }}
                className="text-xs px-3.5 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] text-[#C86D51] font-medium cursor-pointer"
              >
                {eveningCheckIn ? "Update Reflection" : "Reflect on Today"}
              </button>
            </div>

            {eveningCheckIn ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      eveningCheckIn.status === "yes"
                        ? "bg-[#EEF4F0] text-[#658B70]"
                        : eveningCheckIn.status === "partial"
                        ? "bg-[#FAF2EA] text-[#B88452]"
                        : "bg-[#F0ECE6] text-[#82786F]"
                    }`}
                  >
                    {eveningCheckIn.status === "yes" ? "FOLLOWED THROUGH" : eveningCheckIn.status === "partial" ? "PARTIAL" : "NOT TODAY"}
                  </span>
                  {eveningCheckIn.moodOrCraving && (
                    <span className="text-[11px] text-[#786F66]">Intensity: Level {eveningCheckIn.moodOrCraving}/5</span>
                  )}
                </div>
                {eveningCheckIn.reflection && (
                  <p className="font-serif text-[#2C2520] dark:text-[#ECE7E0] italic leading-relaxed pt-1">
                    "{eveningCheckIn.reflection}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Honest self-reflection with zero streak punishment. Available whenever you're ready.
              </p>
            )}
          </div>
        </div>

        {/* Soft Landing Assurance */}
        <div className="mt-8 p-5 rounded-3xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] flex items-start gap-3.5 text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed shadow-organic-sm">
          <HeartHandshake className="w-5 h-5 text-[#658B70] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
              Every day is a fresh starting point.{" "}
            </span>
            Missing a day is never failure. Anchor will never reset your progress to zero or shame you with lost streaks.
          </div>
        </div>
      </main>

      {/* Fullscreen Spatial Stepper Overlay */}
      {activeStepper && (
        <CheckInStepper
          type={activeStepper}
          commitment={commitment}
          isOpen={Boolean(activeStepper)}
          onClose={() => setActiveStepper(null)}
          onSuccess={handleCheckInSuccess}
          initialCheckIn={activeStepper === "morning" ? morningCheckIn : eveningCheckIn}
        />
      )}
    </div>
  );
}
