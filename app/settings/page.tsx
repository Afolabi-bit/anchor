"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import ExportReportModal from "@/app/components/ExportReportModal";
import {
  Anchor,
  Sun,
  Moon,
  Clock,
  LogOut,
  Save,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Download
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [user, setUser] = useState<any>(null);
  const [commitment, setCommitment] = useState<any>(null);

  // Commitment state
  const [commitmentName, setCommitmentName] = useState("");
  const [commitmentWhy, setCommitmentWhy] = useState("");
  const [commitmentActive, setCommitmentActive] = useState(true);

  // Cadence state
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  const [timezone, setTimezone] = useState("UTC");

  // Sponsor Sharing State
  const [shareLink, setShareLink] = useState("");
  const [includeJournalInShare, setIncludeJournalInShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingShare, setGeneratingShare] = useState(false);

  // Export Modal
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setMorningTime(data.user.morningNotificationTime || "08:00");
        setEveningTime(data.user.eveningNotificationTime || "20:00");
        setTimezone(data.user.timezone || "UTC");

        if (data.commitment) {
          setCommitment(data.commitment);
          setCommitmentName(data.commitment.name);
          setCommitmentWhy(data.commitment.why || "");
          setCommitmentActive(data.commitment.active);
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");
      triggerHaptic(15);

      const userRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morningNotificationTime: morningTime,
          eveningNotificationTime: eveningTime,
          timezone,
        }),
      });

      if (commitment?.id) {
        await fetch("/api/commitments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: commitment.id,
            name: commitmentName,
            why: commitmentWhy,
            active: commitmentActive,
          }),
        });
      }

      if (userRes.ok) {
        setSuccessMsg("Your preferences were gently saved.");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      setGeneratingShare(true);
      triggerHaptic(12);
      const res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeJournalNotes: includeJournalInShare }),
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = window.location.origin + data.shareUrl;
        setShareLink(fullUrl);
      }
    } catch {
      setError("Failed to generate share link");
    } finally {
      setGeneratingShare(false);
    }
  };

  const copyShareToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    triggerHaptic(15);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation userEmail={user?.email} />

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold">
              Preferences & Ecosystem
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-1">
              Settings & Partners
            </h1>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C] text-sm flex items-center gap-2.5 shadow-organic-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm font-serif-title text-[#786F66] dark:text-[#A8A096]">
            Loading preferences...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sponsor / Therapist Partner Portal */}
            <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                    Sponsor & Partner Live Sharing
                  </h3>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                    Invite a trusted sponsor or therapist to view your follow-through
                  </p>
                </div>
              </div>

              {!shareLink ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateShareLink}
                    disabled={generatingShare}
                    className="py-3 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-organic-sm"
                  >
                    <span>{generatingShare ? "Generating..." : "Generate Secure Read-Only Link"}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyShareToClipboard}
                      className="px-4 py-2.5 rounded-xl bg-[#658B70] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#786F66]">
                    <ShieldCheck className="w-4 h-4 text-[#658B70]" />
                    <span>Journal reflection text is redacted by default for your privacy.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clinical Report Export Hub */}
            <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#FAF2EA] text-[#B88452] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">
                    Clinical & Therapy Export
                  </h3>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                    Print PDF summaries or download CSV datasets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  setExportOpen(true);
                }}
                className="text-xs px-4 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-[#2C2520] dark:text-[#ECE7E0] hover:bg-[#F3EFE7] font-medium cursor-pointer"
              >
                Export
              </button>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveAll} className="space-y-6">
              {/* Commitment Management */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-[#C86D51]" />
                    Active Commitment
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setCommitmentActive(!commitmentActive);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      commitmentActive
                        ? "bg-[#EEF4F0] border-[#D9E6DD] text-[#658B70]"
                        : "bg-[#F3EFE7] border-[#EAE3D7] text-[#786F66]"
                    }`}
                  >
                    {commitmentActive ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{commitmentActive ? "Active" : "Paused"}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5">
                    Commitment Name
                  </label>
                  <input
                    type="text"
                    required
                    value={commitmentName}
                    onChange={(e) => setCommitmentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5">
                    Your Reason / Why
                  </label>
                  <textarea
                    rows={2}
                    value={commitmentWhy}
                    onChange={(e) => setCommitmentWhy(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51] resize-none"
                  />
                </div>
              </div>

              {/* Cadence Times */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B88452]" />
                  Daily Check-In Times
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Sun className="w-4 h-4 text-[#B88452]" />
                      <div>
                        <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] block">Morning</span>
                        <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">Planning time</span>
                      </div>
                    </div>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-[#C86D51]" />
                      <div>
                        <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] block">Evening</span>
                        <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">Reflection time</span>
                      </div>
                    </div>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51]"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 cursor-pointer shadow-organic-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving preferences..." : "Save Preferences"}</span>
              </button>

              {/* Account Info & Logout */}
              <div className="pt-4 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                <span>Signed in as <strong className="text-[#2C2520] dark:text-[#ECE7E0]">{user?.email}</strong></span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[#C86D51] dark:text-[#DB8165] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Export Report Modal */}
      {exportOpen && (
        <ExportReportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          userEmail={user?.email}
          commitment={commitment}
        />
      )}
    </div>
  );
}
