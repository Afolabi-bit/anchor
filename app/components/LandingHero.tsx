"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Compass,
  HelpCircle,
  Wind,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  Share2,
  HeartHandshake,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, playGentleChime } from "@/lib/sensory";
import { initializeGuestCommitment } from "@/lib/guest-service";

export default function LandingHero() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"morning" | "circadian" | "evening">("morning");
  const [showSealedTooltip, setShowSealedTooltip] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Somatic Breathing Simulator in Feature Bento
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale (4s)" | "Hold (7s)" | "Exhale (8s)">("Inhale (4s)");

  const handleStartGuestMode = () => {
    triggerHaptic(12);
    playGentleChime(432);
    initializeGuestCommitment({
      name: "Stay sober & grounded",
      why: "To show up clear-headed and calm for myself and the people I love.",
      frequency: "daily",
      morningTime: "08:00",
      eveningTime: "20:00",
    });
    router.push("/today");
  };

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
      q: "How does Anchor prevent shame spirals when I miss a day?",
      a: "Anchor explicitly eliminates streak counters, punitive reset badges, and flashing red warning banners. If you miss a morning check-in or have a tough day, your evening is treated as a fresh clean slate. Progress is measured by cumulative days of self-honesty, not unbroken perfection.",
    },
    {
      q: "Who can read my reflections and journal entries?",
      a: "Only you. All personal reflection text and journal notes are encrypted client-side in your browser using AES-256-GCM before ever touching our database. Even if someone intercepts the database, they only see randomized ciphertext. We run zero third-party analytics pixels or data brokers.",
    },
    {
      q: "Can I try Anchor without creating an account?",
      a: "Yes! Anchor includes a complete, local-first Guest Mode. You can set your daily anchor, complete check-ins, track mood, and write journals directly on your device. When you're ready, you can create a private account in one click to sync across devices.",
    },
    {
      q: "How does partner or sponsor sharing work?",
      a: "Anchor provides an optional accountability partner portal governed by strict, default-zero permissions. All metric sharing flags default to OFF. Your sponsor can see your check-in consistency and cheer you on, while your journal reflections stay strictly private.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#0D0B0A] text-[#ECE7E0] selection:bg-[#C86D51]/30 selection:text-[#ECE7E0] overflow-x-hidden relative">
      {/* Ambient background glow points */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(101,139,112,0.12),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(200,109,81,0.08),transparent_65%)] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. FLOATING PILL NAVIGATION BAR (Inspired by Reference Design)             */}
      {/* ========================================================================= */}
      <nav className="sticky top-4 sm:top-6 z-50 w-full px-4 sm:px-6">
        <div className="max-w-2xl mx-auto rounded-full bg-[#161311]/85 border border-[#2E2824] backdrop-blur-xl px-4 sm:px-5 py-2.5 flex items-center justify-between shadow-2xl transition-all">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#2A1D19] border border-[#482E25] text-[#C86D51] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="font-serif-title text-base font-normal tracking-tight text-[#ECE7E0]">
              Anchor
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs text-[#A8A096]">
            <a href="#features" className="hover:text-[#ECE7E0] transition-colors">
              Features
            </a>
            <a href="#mood" className="hover:text-[#ECE7E0] transition-colors">
              Mood Canvas
            </a>
            <a href="#privacy" className="hover:text-[#ECE7E0] transition-colors">
              Zero-Knowledge
            </a>
            <a href="#faq" className="hover:text-[#ECE7E0] transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center gap-2.5">
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
              className="text-xs font-semibold bg-[#C86D51] hover:bg-[#B35D43] text-white px-4 py-1.5 rounded-full transition-all duration-200 shadow-organic-sm hover:scale-105"
            >
              Get started
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-[#A8A096] hover:text-[#ECE7E0] cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden max-w-sm mx-auto mt-2 rounded-2xl bg-[#161311] border border-[#2E2824] p-4 text-xs space-y-3 shadow-2xl"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#A8A096] hover:text-[#ECE7E0] py-1"
              >
                Features
              </a>
              <a
                href="#mood"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#A8A096] hover:text-[#ECE7E0] py-1"
              >
                Mood Canvas
              </a>
              <a
                href="#privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#A8A096] hover:text-[#ECE7E0] py-1"
              >
                Zero-Knowledge Privacy
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#A8A096] hover:text-[#ECE7E0] py-1"
              >
                FAQ & Philosophy
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Directly Inspired by Top Half of Reference Image)        */}
      {/* ========================================================================= */}
      <header className="pt-16 sm:pt-24 pb-10 px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Top Floating Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2C4032] bg-[#18231B]/80 text-[#82A78C] text-xs font-medium mb-6 shadow-2xs backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#658B70]" />
          <span>A judgment-free space for daily accountability</span>
        </motion.div>

        {/* Large Commanding Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-serif-title text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#ECE7E0] leading-[1.12] max-w-3xl"
        >
          Unlock Your Daily Rhythm <br />
          <span className="text-[#658B70] italic">With Anchor</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base sm:text-lg text-[#A8A096] mt-6 max-w-xl leading-relaxed"
        >
          We empower you to achieve mindful accountability and emotional steadiness with quiet self-honesty. Built for recovery, habit change, and nervous system regulation without streak anxiety.
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
            <span>Explore Features</span>
          </a>
        </motion.div>
      </header>

      {/* ========================================================================= */}
      {/* 3. ORGANIC FLOWING SILK WAVE (Visual Centerpiece from Reference Image)    */}
      {/* ========================================================================= */}
      <section className="relative w-full max-w-5xl mx-auto px-4 my-4 sm:my-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full aspect-16/9 rounded-3xl overflow-hidden border border-[#2A2420] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          {/* Photorealistic 3D flowing emerald silk ribbon graphic */}
          <Image
            src="/hero-wave.jpg"
            alt="Flowing organic silk wave representing calm rhythm and nervous system regulation"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />

          {/* Vertical fade masks on top and bottom for seamless blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B0A] via-transparent to-[#0D0B0A]/40 pointer-events-none" />

          {/* Floating Live Badges over the Silk Ribbon */}
          <div className="absolute bottom-6 sm:bottom-8 inset-x-4 sm:inset-x-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-[#0D0B0A]/80 border border-[#2E2824] backdrop-blur-md text-[11px] font-medium text-[#ECE7E0] flex items-center gap-1.5 shadow-lg">
              <Lock className="w-3.5 h-3.5 text-[#658B70]" />
              <span>AES-256-GCM Client Encrypted</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#0D0B0A]/80 border border-[#2E2824] backdrop-blur-md text-[11px] font-medium text-[#ECE7E0] flex items-center gap-1.5 shadow-lg">
              <Sun className="w-3.5 h-3.5 text-[#B88452]" />
              <span>Circadian-Aligned Rhythm</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#0D0B0A]/80 border border-[#2E2824] backdrop-blur-md text-[11px] font-medium text-[#ECE7E0] flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70]" />
              <span>Zero Streak Penalties</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OUR FEATURES / BENTO GRID (Inspired by Lower Half of Reference Image)   */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2C4032] bg-[#18231B] text-[#82A78C] text-[11px] font-semibold uppercase tracking-wider mb-3">
            <span>Our Features</span>
          </div>
          <h2 className="font-serif-title text-3xl sm:text-5xl font-normal text-[#ECE7E0] tracking-tight">
            Designed for Calm, Honest Reflection
          </h2>
          <p className="text-sm sm:text-base text-[#A8A096] mt-3 max-w-2xl leading-relaxed">
            Every interaction in Anchor is built to reduce cognitive friction, honor nervous system regulation, and protect your deepest personal thoughts.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ===================================================================== */}
          {/* BENTO CARD 1 (Spans 2 cols): Interactive Check-in Mockup              */}
          {/* ===================================================================== */}
          <div className="md:col-span-2 rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              {/* Feature Tag */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B88452]">
                  Daily Core
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#201C19] border border-[#38302A] text-[#A8A096]">
                  Interactive Preview
                </span>
              </div>

              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Time-Aware Circadian Check-ins
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Set 1–2 micro-actions in the morning. Close your day with compassion in the evening. Automatically switches to whichever phase is relevant.
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
                  <span>24h Arc</span>
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
                      <span className="text-[11px] font-semibold text-[#D4A373]">
                        Focus: Stay Sober & Grounded
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A2218] text-[#D4A373] border border-[#483A2A]">
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
                    <div className="flex justify-between text-[10px] text-[#A8A096]">
                      <span>06:00 Morning Rise</span>
                      <span className="font-semibold text-[#C86D51]">Current Position (Midday)</span>
                      <span>22:00 Rest</span>
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
                      <span className="text-[10px] text-[#A8A096]">No shame • Clean slate</span>
                    </div>
                    <p className="font-serif text-xs italic text-[#ECE7E0]">
                      "Stressful afternoon meeting, but took 5 deep breaths and stayed steady. Proud of showing up."
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161311] border border-[#2E2824] text-[#A8A096]">
                        #stress
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161311] border border-[#2E2824] text-[#A8A096]">
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
          {/* BENTO CARD 2: 2D Circumplex Mood Tracking                             */}
          {/* ===================================================================== */}
          <div id="mood" className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#658B70] block mb-4">
                Emotional Canvas
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                2D Mood Tracking
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Decouples how pleasant you feel (-5 to +5) from somatic energy (1 to 5) so low energy is never misclassified as depression.
              </p>

              {/* 2D Mood SVG Visualizer */}
              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] relative overflow-hidden">
                <div className="flex justify-between text-[10px] text-[#A8A096] mb-2 font-mono">
                  <span>Valence: +3 (Calm)</span>
                  <span className="text-[#658B70]">Energy: 2</span>
                </div>
                <svg viewBox="0 0 240 70" className="w-full h-16">
                  {/* Grid Lines */}
                  <line x1="0" y1="35" x2="240" y2="35" stroke="#2E2824" strokeWidth="1" />
                  <line x1="120" y1="0" x2="120" y2="70" stroke="#2E2824" strokeWidth="1" />

                  {/* Dual Curve */}
                  <path
                    d="M 10 50 Q 70 20, 120 30 T 230 20"
                    fill="none"
                    stroke="#658B70"
                    strokeWidth="2.5"
                  />
                  <circle cx="160" cy="24" r="5" fill="#658B70" />
                  <circle cx="160" cy="24" r="10" fill="#658B70" opacity="0.2" />
                </svg>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Russell's Circumplex Model</span>
              <span className="text-[#82A78C] font-medium">Non-diagnostic</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 3: Cryptographic Zero-Knowledge Privacy                   */}
          {/* ===================================================================== */}
          <div id="privacy" className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C86D51] block mb-4">
                Zero-Knowledge
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                AES-256-GCM Encryption
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Reflections, notes, and journal entries are encrypted client-side. Complete storage purge on logout ensures nothing lingers on shared computers.
              </p>

              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2 text-xs font-mono text-[#A8A096]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#C86D51] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Protected Payload</span>
                  </span>
                  <span className="text-[10px] text-[#658B70]">256-Bit</span>
                </div>
                <p className="text-[10px] break-all opacity-70">
                  iv: 07bab9e1... | tag: a493a8e2... | data: 9f8a3c...
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Zero third-party trackers</span>
              <span className="text-[#C86D51] font-medium">100% Private</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 4: Somatic Breathing & Grounding Drawer                   */}
          {/* ===================================================================== */}
          <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B88452] block mb-4">
                Somatic Regulation
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                "Pause & Breathe" Drawer
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Instant grounding whenever stress or urge windows strike. Interactive 4-7-8 breathing simulator with gentle audio chime feedback.
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
              <span>Web Audio Chimes</span>
              <span className="text-[#B88452] font-medium">Vagus nerve calm</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BENTO CARD 5: Explainable Statistical Pattern Engine                 */}
          {/* ===================================================================== */}
          <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-[#3D352F] transition-all">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#658B70] block mb-4">
                Pattern Recognition
              </span>
              <h3 className="font-serif-title text-xl sm:text-2xl text-[#ECE7E0] mb-2">
                Explainable Insights
              </h3>
              <p className="text-xs sm:text-sm text-[#A8A096] mb-6 leading-relaxed">
                Self-reported obstacle tags (stress, time strain, fatigue) surface patterns only after 3+ occurrences. Transparent and non-diagnostic.
              </p>

              {/* Sample Insight Pill */}
              <div className="p-4 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#82A78C] font-medium">
                  <Activity className="w-3.5 h-3.5 text-[#658B70]" />
                  <span>Pattern Insight (3 Tuesdays)</span>
                </div>
                <p className="text-xs text-[#ECE7E0] leading-relaxed">
                  "You've logged stress as an obstacle on 3 Tuesday evenings."
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2E2824] flex items-center justify-between text-xs text-[#A8A096]">
              <span>Threshold: 3+ events</span>
              <span className="text-[#82A78C] font-medium">No black-box AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ETHOS COMPARISON (Why Anchor Is Different)                             */}
      {/* ========================================================================= */}
      <section id="ethos" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-[#161311] border border-[#2A2420] p-6 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C86D51] block mb-2">
              Our Core Ethos
            </span>
            <h2 className="font-serif-title text-2xl sm:text-4xl text-[#ECE7E0]">
              Built for Humans, Not Algorithms
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Traditional Trackers */}
            <div className="p-5 rounded-2xl bg-[#1E1B18] border border-[#2E2824] space-y-3 opacity-80">
              <span className="font-semibold text-[#C86D51] block uppercase tracking-wider text-[10px]">
                Typical Habit Trackers
              </span>
              <ul className="space-y-2 text-[#A8A096]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Harsh streak resets triggering shame and relapse spirals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Plaintext database storage vulnerable to leaks and snooping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C86D51]">✕</span>
                  <span>Guilt-inducing push notifications and pushy checklists.</span>
                </li>
              </ul>
            </div>

            {/* Anchor's Approach */}
            <div className="p-5 rounded-2xl bg-[#18231B] border border-[#2C4032] space-y-3">
              <span className="font-semibold text-[#658B70] block uppercase tracking-wider text-[10px]">
                The Anchor Way
              </span>
              <ul className="space-y-2 text-[#ECE7E0]">
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>Soft landings guaranteed. Cumulative experience, never resets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>Client-side AES-256-GCM encryption with complete logout purge.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#658B70]">✓</span>
                  <span>Quiet cadence with 1 primary anchor habit per circadian cycle.</span>
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B88452] block mb-2">
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
        <div className="relative rounded-3xl bg-gradient-to-b from-[#1E1815] to-[#141210] border border-[#3D2E26] p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C86D51]/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#658B70]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#482E25] bg-[#2A1D19] text-[#DB8165] text-xs font-semibold mb-6">
            <Anchor className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Begin Your Quiet Practice</span>
          </div>

          <h2 className="font-serif-title text-3xl sm:text-5xl text-[#ECE7E0] max-w-xl mx-auto leading-tight">
            Ready to show up for yourself today?
          </h2>

          <p className="text-sm sm:text-base text-[#A8A096] mt-4 max-w-md mx-auto leading-relaxed">
            Takes under 45 seconds. Try in local guest mode right now without creating an account, or sign up to sync.
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

            <button
              type="button"
              onClick={handleStartGuestMode}
              className="w-full sm:w-auto text-xs sm:text-sm font-medium px-6 py-3.5 rounded-full border border-[#2E2824] bg-[#161311] hover:bg-[#201C19] text-[#ECE7E0] transition-colors cursor-pointer"
            >
              <span>Explore in Guest Mode (No Account)</span>
            </button>
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
            <span className="opacity-60">• Private & Encrypted Accountability</span>
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
