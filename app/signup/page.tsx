"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in your email and password");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          timezone: userTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-5 py-12 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-4 shadow-xs">
            <Anchor className="w-7 h-7" />
          </div>
          <h1 className="font-serif-title text-3xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
            Anchor
          </h1>
          <p className="text-sm text-[#786F66] dark:text-[#A8A096] mt-1">
            Show up for yourself, one day at a time.
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-7 sm:p-9 shadow-xs">
          <div className="mb-6">
            <h2 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
              Create your private space
            </h2>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1 leading-relaxed">
              A calm, judgment-free daily accountability companion.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span>Creating your space...</span>
              ) : (
                <>
                  <span>Begin with Anchor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-start gap-3 text-xs text-[#786F66] dark:text-[#A8A096]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#658B70] mt-0.5" />
            <span className="leading-relaxed">
              Your reflections are strictly private. We never share your data or use streak-shame mechanics.
            </span>
          </div>
        </div>

        {/* Existing account link */}
        <p className="text-center text-sm text-[#786F66] dark:text-[#A8A096] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#C86D51] dark:text-[#DB8165] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
