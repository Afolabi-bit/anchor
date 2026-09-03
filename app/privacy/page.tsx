"use client";

import Link from "next/link";
import {
  Anchor,
  ShieldCheck,
  Lock,
  Database,
  Users,
  Scale,
  Trash2,
  ArrowLeft,
  EyeOff,
  CheckCircle2,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] text-[#2C2520] dark:text-[#ECE7E0] transition-colors duration-200">
      {/* Header Bar */}
      <header className="border-b border-[#EAE3D7] dark:border-[#38332E] bg-white/70 dark:bg-[#25221F]/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/today"
            className="flex items-center gap-2 text-xs font-medium text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Anchor</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="font-serif-title text-sm font-semibold tracking-wide">
              Anchor Privacy
            </span>
          </div>

          <Link
            href="/settings"
            className="text-xs text-[#C86D51] hover:underline font-medium"
          >
            Manage Settings
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        {/* Title Hero */}
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[11px] font-semibold text-[#658B70] dark:text-[#82A78C]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transparent Data Protection Policy • Last Updated September 2026</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-[#2C2520] dark:text-[#ECE7E0] tracking-tight">
            How Anchor Protects Your Sensitive Health & Recovery Data
          </h1>
          <p className="text-sm sm:text-base text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Recovery and mental wellness require genuine vulnerability. You cannot be honest in your
            daily reflections if you fear your data is being monetized, exposed to employers, shared
            without your consent, or subpoenaed without your knowledge. Here is an honest, plain-language
            breakdown of what we protect, how we protect it, and what our architecture actually does.
          </p>
        </section>

        {/* Section 1: Field-Level Encryption */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                1. Field-Level Encryption (AES-256-GCM)
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Server-managed protection for your deeply personal free-text reflections
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Your most sensitive words are never stored as readable plaintext in our database. We apply
            industry-standard <strong>AES-256-GCM authenticated encryption</strong> at the field level to
            the following columns:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <li className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs">
              <strong className="block text-[#2C2520] dark:text-[#ECE7E0] mb-0.5">Journal Entries</strong>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                The complete body of your daily freeform journal writings
              </span>
            </li>
            <li className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs">
              <strong className="block text-[#2C2520] dark:text-[#ECE7E0] mb-0.5">Evening Reflections</strong>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                Your personal notes on setbacks, gratitude, and evening check-ins
              </span>
            </li>
            <li className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs">
              <strong className="block text-[#2C2520] dark:text-[#ECE7E0] mb-0.5">Morning Intentions</strong>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                Sensitive intention notes written during your morning grounding
              </span>
            </li>
          </ul>

          <div className="p-4 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#EAE3D7] dark:border-[#42372E] text-xs text-[#786F66] dark:text-[#D5CFC7] leading-relaxed space-y-1.5">
            <strong className="text-[#B88452] dark:text-[#E2A365] block font-semibold">
              An Important Clarification on Architecture:
            </strong>
            <p>
              This is <strong>server-managed encryption</strong>, not a client-side zero-knowledge scheme.
              Encryption keys are managed securely on our infrastructure (KMS) so that you never risk
              permanently losing your multi-year recovery history if you misplace a recovery passphrase.
              We do not make misleading claims like "zero-knowledge" or "mathematically impossible to read"
              because those terms overstate what a server-managed key model provides.
            </p>
          </div>
        </section>

        {/* Section 2: Structured / System-Readable Data */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                2. Structured Data We Store (And Why)
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Categorical data needed to power self-reflection insights
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            To provide pattern insights (e.g. noticing that stress or poor sleep frequently precedes a
            craving spike) without reading your private writing, our application stores certain structured
            metadata:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block">
                Mood Scores & Energy Levels
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                Valence (-5 to +5) and energy arousal ratings (1 to 5), used to render your weekly emotional
                rhythm charts.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block">
                Obstacle & Blocker Tags
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                Predefined tags like <em>stress</em>, <em>time</em>, <em>urges</em>, or <em>fatigue</em>,
                used to calculate which obstacles drive setbacks.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block">
                Check-in Completion Status
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                Whether you checked in (yes, partial, no) and whether the check-in was on time, used to
                support your consistency tracking.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block">
                Journal Tags & Starred Status
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                Organizational tags you assign to your reflections to filter and search your entries.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Granular Partner Sharing */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                3. Granular, Opt-In Companion Sharing
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Nothing is shared by default — you control every individual field
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            If you choose to invite an accountability partner, therapist, or sponsor:
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-[#786F66] dark:text-[#A8A096]">
              <CheckCircle2 className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Sharing Default:</strong> When you generate a partner link, all 5 data
                categories are turned OFF by default. Your partner sees nothing until you explicitly toggle
                it on.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#786F66] dark:text-[#A8A096]">
              <CheckCircle2 className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
              <span>
                <strong>Journal Protection:</strong> Written journal notes and reflection text are strictly
                quarantined. Even if your partner has access to your consistency marks, your written words
                remain private unless you intentionally toggle "Written Journal Notes" on.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#786F66] dark:text-[#A8A096]">
              <CheckCircle2 className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
              <span>
                <strong>Automatic Expiration & Immediate Revocation:</strong> Partner links expire automatically
                (typically after 30 to 90 days). You can also click <em>"Disconnect partner immediately"</em> in
                your settings at any moment to invalidate the link server-side instantly.
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Advertising, Trackers, Data Brokers */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                4. Zero Ad Trackers & No Data Broker Monetization
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Our business model will never involve selling your vulnerability
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Many mental health and habit apps quietly embed advertising SDKs (such as Facebook App Events
            or data broker trackers) that map health conditions to advertising identifiers.
          </p>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            <strong>Anchor does not contain any third-party ad trackers, retargeting pixels, or data broker integrations.</strong> We do not sell, rent, or trade your personal information, substance-use logs, or recovery milestones to insurers, employers, or advertisers under any circumstances.
          </p>
        </section>

        {/* Section 5: Legal Compulsion & Honest Disclosure */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                5. Legal Compulsion & Honest Disclosure
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                What could happen under a court order or subpoena
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Some privacy policies dishonestly claim, <em>"We have zero-knowledge of your data and have nothing to produce."</em> In a server-managed encryption architecture, that statement is factually untrue, and we refuse to mislead people in recovery.
          </p>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs text-[#786F66] dark:text-[#A8A096] space-y-2 leading-relaxed">
            <p>
              <strong>The Reality:</strong> Because Anchor maintains server-side KMS encryption keys to
              enable features like device synchronization and prevent permanent data loss, if Anchor were
              served with a valid, legally enforceable subpoena or court order from a court of competent
              jurisdiction, we could technically be compelled to decrypt and produce records.
            </p>
            <p>
              <strong>Our Stance:</strong> We will challenge any overbroad, unparticularized, or fishing-expedition
              demands for recovery data to the fullest extent of the law. Where legally permissible, we will
              promptly notify you of any request so you can seek protective relief.
            </p>
          </div>
        </section>

        {/* Section 6: Data Export & Account Deletion */}
        <section className="p-6 rounded-3xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                6. Export Your Data & Total Deletion
              </h2>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                You own your data completely
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1.5">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#658B70]" />
                Complete Data Portability
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                You can export your complete raw dataset (CSV) or formatted therapy intake summary (PDF)
                at any time directly from the settings menu.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-1.5">
              <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-[#C86D51]" />
                Permanent Cascade Deletion
              </span>
              <p className="text-[11px] text-[#786F66] dark:text-[#A8A096] leading-snug">
                Deleting your account immediately cascades and permanently destroys your user profile,
                commitments, check-ins, journal entries, and partner tokens. No lingering backups retained.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="pt-6 border-t border-[#EAE3D7] dark:border-[#38332E] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#786F66] dark:text-[#A8A096]">
          <span>© 2026 Anchor • Compassionate Accountability & Recovery</span>
          <div className="flex items-center gap-4">
            <Link href="/today" className="hover:text-[#2C2520] dark:hover:text-[#ECE7E0] font-medium">
              Today
            </Link>
            <Link href="/journal" className="hover:text-[#2C2520] dark:hover:text-[#ECE7E0] font-medium">
              Journal
            </Link>
            <Link href="/settings" className="hover:text-[#2C2520] dark:hover:text-[#ECE7E0] font-medium">
              Settings & Partners
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
