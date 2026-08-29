import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Anchor } from "lucide-react";
import LandingHero from "@/app/components/LandingHero";

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
              className="text-sm font-medium bg-[#C86D51] hover:bg-[#B35D43] text-white px-5 py-2.5 rounded-full transition-all duration-200 shadow-organic-sm hover:scale-105"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Pillars */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-4xl mx-auto w-full">
        <LandingHero />
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
