import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Anchor, Sun, Moon, Sparkles, HeartHandshake, BookOpen, BarChart3, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.isOnboarded) {
      redirect("/today");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col justify-between transition-colors duration-200">
      {/* Navigation Header */}
      <header className="border-b border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2]/80 dark:bg-[#1C1917]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center shadow-xs">
              <Anchor className="w-5 h-5" />
            </div>
            <span className="font-serif-title text-xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
              Anchor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] px-4 py-2 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#C86D51] hover:bg-[#B35D43] text-white px-5 py-2.5 rounded-full transition-all duration-200 shadow-xs hover:shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9E6DD] dark:border-[#2C4032] bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A judgment-free daily accountability companion</span>
        </div>

        <h1 className="font-serif-title text-4xl sm:text-6xl font-normal tracking-tight text-[#2C2520] dark:text-[#ECE7E0] leading-[1.18] max-w-2xl">
          Show up for yourself, <br />
          <span className="italic text-[#C86D51] dark:text-[#DB8165]">one day at a time.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#786F66] dark:text-[#A8A096] mt-6 max-w-xl leading-relaxed">
          Morning intentions, evening reflections, and soft landings when days don't go as planned. Designed for recovery and personal growth without streak anxiety.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3.5 w-full max-w-sm sm:max-w-none justify-center">
          <Link
            href="/signup"
            className="py-4 px-7 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <span>Start your daily anchor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="py-4 px-7 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] text-[#2C2520] dark:text-[#ECE7E0] font-medium text-base transition-colors flex items-center justify-center"
          >
            I already have an account
          </Link>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 text-left w-full">
          <div className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center mb-5">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
              Morning Intention
            </h3>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
              Set one or two realistic micro-actions for your commitment without feeling pressured.
            </p>
          </div>

          <div className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center mb-5">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
              Evening Reflection
            </h3>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
              Reflect honestly on how the day went, tag obstacles (fatigue, urges, stress), and capture takeaways.
            </p>
          </div>

          <div className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] flex items-center justify-center mb-5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
              Soft Landings
            </h3>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
              No punitive streak resets or warning colors. Every morning is a fresh opportunity to show up.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE3D7] dark:border-[#38332E] py-8 text-center text-xs text-[#786F66] dark:text-[#A8A096]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-serif-title text-sm font-medium text-[#2C2520] dark:text-[#ECE7E0]">Anchor</span>
          <span>Private, encrypted, and built for mindful recovery.</span>
        </div>
      </footer>
    </div>
  );
}
