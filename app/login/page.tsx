"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in your email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (data.user && !data.user.isOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/today");
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-5 py-8 sm:py-12 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-3.5 shadow-xs">
            <Anchor className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
            Return to your daily rhythm
          </h1>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1">
            Sign in to check in with yourself today.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-5 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-11 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Create account link */}
        <p className="text-center text-sm text-[#786F66] dark:text-[#A8A096] mt-6">
          New to Anchor?{" "}
          <Link href="/signup" className="font-medium text-[#C86D51] dark:text-[#DB8165] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
