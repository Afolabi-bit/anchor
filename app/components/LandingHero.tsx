"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Compass,
  Wind,
  Check,
  ChevronDown,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, playGentleChime } from "@/lib/sensory";

export default function LandingHero() {
  const [activeTab, setActiveTab] = useState<"morning" | "circadian" | "evening">("morning");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Somatic Breathing Simulator in Feature Bento
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale (4s)" | "Hold (7s)" | "Exhale (8s)">("Inhale (4s)");

  const toggleFaq = (index: number) => {
    triggerHaptic(8);
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const startBreathingDemo = () => {
    triggerHaptic(12);
    if (isBreathing) {
      setIsBreathing(false);
      return;
    }
    setIsBreathing(true);
    playGentleChime(432);
    setBreathPhase("Inhale (4s)");
    setTimeout(() => {
      setBreathPhase("Hold (7s)");
      setTimeout(() => {
        setBreathPhase("Exhale (8s)");
        setTimeout(() => {
          setIsBreathing(false);
        }, 8000);
      }, 7000);
    }, 4000);
  };

  const faqItems = [
    {
      q: "What happens if I miss a check-in?",
      a: "Nothing is lost. Anchor never resets your progress or displays stressful streak warnings. If you miss a morning check-in or have a demanding day, your evening is a clean slate. Showing up honestly is what matters.",
    },
    {
      q: "Who can read my reflections and journal entries?",
      a: "Only you. What you write is sealed directly on your device before it is saved. We don't read your words, sell data, or host third-party advertisers. Your personal journey is completely confidential.",
    },
    {
      q: "Is creating an account free and private?",
      a: "Yes. Creating an account takes less than a minute and is completely private. Your reflections are protected with application-layer encryption, and we never sell your data, run ads, or share your activity.",
    },
    {
      q: "Can I share my progress with an accountability partner or sponsor?",
      a: "Only if you choose to. Anchor includes an optional partner link where you decide exactly what to share (like check-in consistency). Your private written notes always stay strictly locked.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#0D0B0A] text-[#ECE7E0] selection:bg-[#C86D51]/30 selection:text-[#ECE7E0] overflow-x-hidden relative">
      {/* Ambient background glow points */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(101,139,112,0.12),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(200,109,81,0.08),transparent_65%)] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR (Unfloated, Clean Header)                            */}
      {/* ========================================================================= */}
      <nav className="w-full border-b border-[#201C19] bg-[#0D0B0A]/95 px-4 sm:px-8 py-3.5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#2A1D19] border border-[#482E25] text-[#C86D51] flex items-center justify-center shadow-xs transition-transform group-hover:scale-102">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="font-serif-title text-base font-normal tracking-tight text-[#ECE7E0]">
              Anchor
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs text-[#A8A096]">
            <a href="#features" className="hover:text-[#ECE7E0] transition-colors">
              How It Works
            </a>
            <a href="#mood" className="hover:text-[#ECE7E0] transition-colors">
              Emotional Space
            </a>
            <a href="#privacy" className="hover:text-[#ECE7E0] transition-colors">
              Privacy
            </a>
            <a href="#ethos" className="hover:text-[#ECE7E0] transition-colors">
              Our Ethos
            </a>
            <a href="#faq" className="hover:text-[#ECE7E0] transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              onClick={() => triggerHaptic(8)}
              className="text-xs text-[#A8A096] hover:text-[#ECE7E0] px-3 py-1.5 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => triggerHaptic(12)}
              className="text-xs font-semibold bg-[#C86D51] hover:bg-[#B35D43] text-white px-4 py-1.5 rounded-full transition-all duration-200 shadow-organic-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <header className="pt-14 sm:pt-20 pb-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Large Commanding Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-serif-title text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#ECE7E0] leading-[1.12] max-w-3xl"
        >
          Show up for yourself, <br />
          <span className="text-[#658B70] italic">one day at a time.</span>
        </motion.h1>

        {/* Welcoming, Emotionally Resonant Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base sm:text-lg text-[#A8A096] mt-5 max-w-xl leading-relaxed"
        >
          A calm sanctuary to build trust with yourself. Choose one daily anchor, check in morning and night in under 45 seconds, and leave streak anxiety behind.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-sm sm:max-w-none justify-center"
        >
          <Link
            href="/signup"
            onClick={() => triggerHaptic(12)}
            className="btn-primary btn-lg w-full sm:w-auto shadow-organic-md flex items-center justify-center gap-2"
          >
            <span>Start your daily anchor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#features"
            onClick={() => triggerHaptic(8)}
            className="w-full sm:w-auto text-xs sm:text-sm font-medium px-6 py-3.5 rounded-full border border-[#2E2824] bg-[#161311] hover:bg-[#201C19] text-[#ECE7E0] transition-colors duration-200"
          >
            <span>How it works</span>
          </a>
        </motion.div>

        {/* Trust & Reassurance Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#A8A096]"
        >
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#658B70]" />
            <span>Takes under 45 seconds a day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#658B70]" />
            <span>Completely private & confidential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#658B70]" />
            <span>Zero streak resets</span>
          </div>
        </motion.div>
      </header>

      {/* ========================================================================= */}
      {/* 4. HOW ANCHOR WORKS / HUMAN-CENTERED BENTO GRID                           */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2C4032] bg-[#18231B] text-[#82A78C] text-xs font-semibold uppercase tracking-wider mb-3">
            <span>How Anchor Works</span>
          </div>
          <h2 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#ECE7E0] tracking-tight">
            Accountability without the overwhelm
          </h2>
          <p className="text-sm sm:text-base text-[#A8A096] mt-3 max-w-2xl leading-relaxed">
            Most apps treat personal growth like a stressful scorecard. Anchor is built as a peaceful sanctuary — helping you stay honest, steady, and kind to yourself every day.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ===================================================================== */}
          {/* BENTO CARD 1 (Spans 2 cols): Daily Rhythm Check-in                    */}
          {/* ===================================================================== */}
          <div className="md:col-span-2 rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-organic-md flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              {/* Feature Tag */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B88452]">
                  Daily Rhythm
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#201C19] border border-[#38302A] text-[#A8A096]">
                  Try It Below
                </span>
              </div>

              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Two Minutes to Ground Your Day
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Set one intentional micro-step each morning. Reflect with kindness each evening. That's all — no complicated checklists or overwhelming routines.
              </p>

              {/* Interactive Tabs */}
              <div className="flex items-center gap-2 mb-4 border-b border-[#2E2824] pb-3">
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    setActiveTab("morning");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "morning"
                      ? "bg-[#2A2218] text-[#D4A373] border border-[#483A2A]"
                      : "text-[#A8A096] hover:text-[#ECE7E0]"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-[#B88452]" />
                  <span>Morning</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    setActiveTab("circadian");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "circadian"
                      ? "bg-[#2A1D19] text-[#DB8165] border border-[#482E25]"
                      : "text-[#A8A096] hover:text-[#ECE7E0]"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#C86D51]" />
                  <span>Daily Flow</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(8);
                    setActiveTab("evening");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "evening"
                      ? "bg-[#18231B] text-[#82A78C] border border-[#2C4032]"
                      : "text-[#A8A096] hover:text-[#ECE7E0]"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-[#658B70]" />
                  <span>Evening</span>
                </button>
              </div>

              {/* Dynamic Tab Body */}
              <AnimatePresence mode="wait">
                {activeTab === "morning" && (
                  <motion.div
                    key="morning"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#D4A373]">
                        Focus: Stay Sober & Grounded
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2A2218] text-[#D4A373] border border-[#483A2A]">
                        Sealed Today
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#ECE7E0]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70]" />
                        <span>Call sponsor / trusted friend if craving hits at 5pm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70]" />
                        <span>20m walk outside after work to decompress</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "circadian" && (
                  <motion.div
                    key="circadian"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2"
                  >
                    <svg viewBox="0 0 400 65" className="w-full h-14">
                      <path
                        d="M 20 55 Q 200 -5 380 55"
                        fill="none"
                        stroke="#C86D51"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                      <circle cx="200" cy="25" r="6" fill="#C86D51" />
                      <circle cx="200" cy="25" r="14" fill="#C86D51" opacity="0.15" />
                    </svg>
                    <div className="flex justify-between text-xs text-[#A8A096]">
                      <span>06:00 Morning Rise</span>
                      <span className="font-semibold text-[#C86D51]">Midday Steady</span>
                      <span>22:00 Evening Rest</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "evening" && (
                  <motion.div
                    key="evening"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#658B70]">Day Anchored & Closed</span>
                      <span className="text-xs text-[#A8A096]">No shame • Clean slate</span>
                    </div>
                    <p className="font-serif text-xs italic text-[#ECE7E0]">
                      "Stressful afternoon meeting, but took 5 deep breaths and stayed steady. Proud of showing up."
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#161311] border border-[#2E2824] text-[#A8A096]">
                        #stress
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#161311] border border-[#2E2824] text-[#A8A096]">
                        #work-fatigue
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Quick 45s flow</span>
              <span className="text-[#ECE7E0] font-medium">Auto-saves locally</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 2: Emotional Space / Nuanced Feelings                     */}
          {/* ===================================================================== */}
          <div id="mood" className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-organic-md flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#658B70] block mb-4">
                Emotional Space
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Check In With How You Truly Feel
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Low energy isn't failure, and feeling quiet isn't sadness. Anchor gives you room for real nuance, without the pressure of a harsh 1-to-10 score or forcing a cheerful face.
              </p>

              {/* Emotional State Showcase */}
              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A8A096] font-medium">Daily Reflection</span>
                  <span className="text-xs text-[#658B70] font-semibold">Honest Space</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#18231B] border border-[#2C4032] text-[#82A78C] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#658B70]" />
                    Peaceful & Calm
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#201C19] border border-[#38302A] text-[#A8A096]">
                    Low Energy · Resting
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#2A1D19] border border-[#482E25] text-[#DB8165]">
                    Grateful
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>No forced ratings</span>
              <span className="text-[#82A78C] font-medium">Honor your pace</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 3: Private Sanctuary                                       */}
          {/* ===================================================================== */}
          <div id="privacy" className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-organic-md flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C86D51] block mb-4">
                Private Sanctuary
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Completely Private to You
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Your reflections, struggles, and personal triumphs belong only to you. No ads, no data selling, and no snooping. What you write is sealed with medical-grade privacy before it ever leaves your device.
              </p>

              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2A1D19] border border-[#482E25] text-[#C86D51] flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#ECE7E0] block">
                      Protected with quiet device privacy
                    </span>
                    <span className="text-xs text-[#A8A096]">
                      Only you hold the key to your words
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#A8A096] leading-relaxed pt-1">
                  Write with complete honesty. Download your personal history anytime with structured data export.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Zero ads or trackers</span>
              <span className="text-[#C86D51] font-medium">100% Confidential</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 4: Somatic Breathing & Grounding Drawer                   */}
          {/* ===================================================================== */}
          <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-organic-md flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B88452] block mb-4">
                Calm in the Moment
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                A Breath When Things Feel Heavy
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                When stress, cravings, or anxiety strike, open the grounding drawer for a gentle 60-second breathing exercise and calming chimes to help your body settle.
              </p>

              {/* Breathing Visualizer Card */}
              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] flex flex-col items-center justify-center py-5">
                <motion.div
                  animate={{
                    scale: isBreathing ? (breathPhase.startsWith("Inhale") ? 1.35 : breathPhase.startsWith("Hold") ? 1.35 : 1) : 1,
                  }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-[#FAF2EA]/10 border-2 border-[#B88452] flex items-center justify-center shadow-lg mb-3"
                >
                  <Wind className="w-6 h-6 text-[#B88452]" />
                </motion.div>

                <button
                  type="button"
                  onClick={startBreathingDemo}
                  className="text-xs font-semibold text-[#D4A373] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{isBreathing ? breathPhase : "Tap to test breathing pacer"}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Guided 4-7-8 rhythm</span>
              <span className="text-[#B88452] font-medium">Soothing chimes</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 5: Gentle Pattern Clarity                                 */}
          {/* ===================================================================== */}
          <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-organic-md flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#658B70] block mb-4">
                Gentle Awareness
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Spot What Gets in the Way
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Notice your natural obstacles with curiosity rather than guilt. Anchor quietly highlights when certain days carry extra weight, so you can care for yourself in advance.
              </p>

              {/* Sample Insight Pill */}
              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#82A78C] font-medium">
                  <Activity className="w-3.5 h-3.5 text-[#658B70]" />
                  <span>Compassionate Observation</span>
                </div>
                <p className="text-xs text-[#ECE7E0] leading-relaxed">
                  "Tuesdays tend to bring fatigue — consider planning an earlier evening wind-down."
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Helpful observations</span>
              <span className="text-[#82A78C] font-medium">Zero shame</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ETHOS COMPARISON (Why Anchor Is Different)                             */}
      {/* ========================================================================= */}
      <section id="ethos" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-10 shadow-organic-lg">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C86D51] block mb-2">
              Why Anchor Is Different
            </span>
            <h2 className="font-serif-title text-2xl sm:text-4xl text-[#ECE7E0]">
              Built for Real Humans, Not Streaks
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Traditional Trackers */}
            <div className="p-5 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-3 opacity-85">
              <span className="font-semibold text-[#C86D51] block uppercase tracking-wider text-xs">
                Typical Habit Apps
              </span>
              <ul className="space-y-2.5 text-[#A8A096]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Broken streaks that erase weeks of hard work overnight.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Pushy notifications that trigger anxiety and guilt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Endless checklists that set you up for burnout.</span>
                </li>
              </ul>
            </div>

            {/* Anchor's Approach */}
            <div className="p-5 rounded-2xl bg-[#18231B] border border-[#2C4032] space-y-3">
              <span className="font-semibold text-[#658B70] block uppercase tracking-wider text-xs">
                The Anchor Way
              </span>
              <ul className="space-y-2.5 text-[#ECE7E0]">
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>Every day counts. Your progress is never erased or reset.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>One primary anchor habit: clarity and calm over clutter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>Total personal privacy: your words stay completely confidential.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ ACCORDION SECTION                                                  */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#B88452] block mb-2">
            Questions & Answers
          </span>
          <h2 className="font-serif-title text-2xl sm:text-4xl text-[#ECE7E0]">
            Frequently Answered
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#161311] border border-[#2A2420] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-medium text-[#ECE7E0]">
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-[#A8A096]"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-[#A8A096] leading-relaxed border-t border-[#2E2824] pt-3"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL CALL TO ACTION (Bottom Card)                                     */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#1E1815] to-[#141210] border border-[#3D2E26] p-8 sm:p-12 text-center overflow-hidden shadow-organic-lg">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C86D51]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#658B70]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#482E25] bg-[#2A1D19] text-[#DB8165] text-xs font-semibold mb-6">
            <Anchor className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Begin Your Quiet Practice</span>
          </div>

          <h2 className="font-serif-title text-3xl sm:text-5xl text-[#ECE7E0] max-w-xl mx-auto leading-tight">
            Take a deep breath. Start today.
          </h2>

          <p className="text-sm sm:text-base text-[#A8A096] mt-4 max-w-md mx-auto leading-relaxed">
            It takes less than 45 seconds to anchor your day. Create your private account in moments and show up for yourself.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 justify-center">
            <Link
              href="/signup"
              onClick={() => triggerHaptic(12)}
              className="btn-primary btn-lg w-full sm:w-auto shadow-organic-md flex items-center justify-center gap-2"
            >
              <span>Start your daily anchor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              onClick={() => triggerHaptic(8)}
              className="w-full sm:w-auto text-xs sm:text-sm font-medium px-6 py-3.5 rounded-full border border-[#2E2824] bg-[#161311] hover:bg-[#201C19] text-[#ECE7E0] transition-colors text-center"
            >
              <span>Already have an account? Sign in</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MINIMALIST DARK FOOTER                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#201C19] py-10 px-4 sm:px-6 text-xs text-[#786F66]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#2A1D19] text-[#C86D51] flex items-center justify-center">
              <Anchor className="w-3 h-3" />
            </div>
            <span className="font-serif-title text-sm text-[#ECE7E0]">Anchor</span>
            <span className="opacity-60">• A quiet space for daily self-trust</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[#ECE7E0] transition-colors">
              Features
            </a>
            <Link href="/privacy" className="hover:text-[#ECE7E0] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-[#ECE7E0] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
