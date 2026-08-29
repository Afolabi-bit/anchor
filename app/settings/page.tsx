"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import ExportReportModal from "@/app/components/ExportReportModal";
import ClinicalExportModal from "@/app/components/ClinicalExportModal";
import NewCommitmentModal from "@/app/components/NewCommitmentModal";
import PageTransition from "@/app/components/PageTransition";
import { generateClinicalSummary, ClinicalSummaryData } from "@/lib/clinical-report";
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
  Download,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  BellRing,
  Users,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [user, setUser] = useState<any>(null);
  const [allCommitments, setAllCommitments] = useState<any[]>([]);

  // Cadence state
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  const [timezone, setTimezone] = useState("UTC");

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Sponsor Sharing State
  const [shareLink, setShareLink] = useState("");
  const [includeJournalInShare, setIncludeJournalInShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingShare, setGeneratingShare] = useState(false);

  // Modals
  const [exportOpen, setExportOpen] = useState(false);
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<ClinicalSummaryData | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);

  const handleOpenClinicalReport = async () => {
    try {
      triggerHaptic(12);
      const checkInsRes = await fetch("/api/checkins");
      const checkInsData = checkInsRes.ok ? await checkInsRes.json() : { checkIns: [] };
      const activeComm = allCommitments.find((c) => c.active) || allCommitments[0];
      const report = generateClinicalSummary(
        user,
        activeComm,
        checkInsData.checkIns || []
      );
      setClinicalReport(report);
      setClinicalModalOpen(true);
    } catch (err) {
      console.error("Failed to generate clinical summary:", err);
    }
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWhy, setEditWhy] = useState("");

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

        const commsRes = await fetch("/api/commitments");
        if (commsRes.ok) {
          const commsData = await commsRes.json();
          setAllCommitments(commsData.allCommitments || commsData.commitments || []);
        }

        // Check push subscription state
        registerServiceWorker();
        const pushRes = await fetch("/api/push/subscribe");
        if (pushRes.ok) {
          const pushData = await pushRes.json();
          setPushEnabled(Boolean(pushData.isSubscribed));
        }
      } catch (err) {
        console.error("Settings load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleTogglePush = async () => {
    try {
      setPushLoading(true);
      setError("");
      triggerHaptic(12);

      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        setSuccessMsg("Push reminders disabled.");
      } else {
        const result = await subscribeToPush();
        if (!result.success) {
          setError(result.error || "Failed to enable notifications.");
          return;
        }
        setPushEnabled(true);
        setSuccessMsg("Browser push reminders activated.");
      }
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch {
      setError("An error occurred toggling notifications.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setTestingPush(true);
      triggerHaptic(12);
      const res = await fetch("/api/push/send-test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Test notification dispatched to your browser.");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        setError(data.error || "Failed to send test push.");
      }
    } catch {
      setError("Network error sending test push.");
    } finally {
      setTestingPush(false);
    }
  };

  const handleSaveCadence = async (e: React.FormEvent) => {
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

      if (userRes.ok) {
        setSuccessMsg("Your preferences were gently saved.");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCommitmentActive = async (comm: any) => {
    try {
      triggerHaptic(12);
      const newActive = !comm.active;
      const res = await fetch("/api/commitments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: comm.id,
          active: newActive,
        }),
      });

      if (res.ok) {
        setAllCommitments((prev) =>
          prev.map((c) => (c.id === comm.id ? { ...c, active: newActive } : c))
        );
        setSuccessMsg(newActive ? "Anchor reactivated." : "Anchor paused.");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      triggerHaptic(12);
      const res = await fetch("/api/commitments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          why: editWhy,
        }),
      });

      if (res.ok) {
        setAllCommitments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: editName, why: editWhy } : c))
        );
        setEditingId(null);
        setSuccessMsg("Anchor updated.");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch {
      setError("Failed to update commitment.");
    }
  };

  const handleDeleteCommitment = async (id: string) => {
    if (!confirm("Are you sure you want to remove this anchor? Past reflections will remain in your archive.")) {
      return;
    }
    try {
      triggerHaptic(15);
      const res = await fetch(`/api/commitments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAllCommitments((prev) => prev.filter((c) => c.id !== id));
        setSuccessMsg("Anchor removed.");
        setTimeout(() => setSuccessMsg(""), 2500);
      }
    } catch {
      setError("Failed to delete commitment.");
    }
  };

  const handleCommitmentCreated = (newComm: any) => {
    setAllCommitments((prev) => [...prev, newComm]);
    setSuccessMsg("New anchor created.");
    setTimeout(() => setSuccessMsg(""), 2500);
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

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-5 py-8 sm:py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold">
                Preferences & Sanctuary
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-1">
                Settings & Anchors
              </h1>
            </div>
          </div>

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C] text-sm flex items-center gap-2.5 shadow-organic-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
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
              {/* Featured Community Sanctuary Card */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-base sm:text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                      Community Moments Wall
                    </h3>
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                      Anonymous, gentle reflections from travelers on the path
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => router.push("/community")}
                  className="px-4 py-2 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C] hover:border-[#658B70] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Multi-Commitment Manager Card */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
                      <Anchor className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                        Your Anchor Goals
                      </h3>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        {allCommitments.filter((c) => c.active).length} of 5 active anchors
                      </p>
                    </div>
                  </div>

                  {allCommitments.length < 5 && (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        triggerHaptic(10);
                        setNewModalOpen(true);
                      }}
                      className="text-xs px-3.5 py-1.5 rounded-full bg-[#C86D51] text-white font-medium flex items-center gap-1 shadow-organic-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Anchor</span>
                    </motion.button>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  {allCommitments.map((comm) => {
                    const isEditing = editingId === comm.id;
                    const commColor = PALETTE_HEX[comm.colorIndex ?? 0] || "#C86D51";

                    return (
                      <div
                        key={comm.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          comm.active
                            ? "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E]"
                            : "bg-[#F3EFE7]/50 dark:bg-[#25221F]/40 border-dashed border-[#EAE3D7] dark:border-[#38332E] opacity-70"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0]"
                            />
                            <textarea
                              rows={2}
                              value={editWhy}
                              onChange={(e) => setEditWhy(e.target.value)}
                              placeholder="Grounding reason / why..."
                              className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-xs px-3 py-1.5 rounded-xl border border-[#EAE3D7] text-[#786F66]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(comm.id)}
                                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#658B70] text-white font-medium"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: commColor }} />
                                <span className="font-semibold text-sm text-[#2C2520] dark:text-[#ECE7E0]">
                                  {comm.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCommitmentActive(comm)}
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer ${
                                    comm.active
                                      ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#D9E6DD] text-[#658B70]"
                                      : "bg-[#F3EFE7] dark:bg-[#2B2824] border-[#EAE3D7] text-[#786F66]"
                                  }`}
                                >
                                  {comm.active ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                                  <span>{comm.active ? "Active" : "Paused"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(comm.id);
                                    setEditName(comm.name);
                                    setEditWhy(comm.why || "");
                                  }}
                                  className="p-1.5 text-[#9E948A] hover:text-[#2C2520] cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {allCommitments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCommitment(comm.id)}
                                    className="p-1.5 text-[#9E948A] hover:text-[#C86D51] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {comm.why && (
                              <p className="text-xs text-[#786F66] dark:text-[#A8A096] italic mt-1 font-serif">
                                "{comm.why}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Push & In-App Reminder Notifications Card */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-2xs">
                      {pushEnabled ? <BellRing className="w-4 h-4 text-[#B88452]" /> : <BellOff className="w-4 h-4 text-[#786F66]" />}
                    </div>
                    <div>
                      <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                        Daily Browser Push Reminders
                      </h3>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        {pushEnabled ? "Active � Sending quiet notifications at your check-in times" : "Disabled � Enable to receive gentle reminders"}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className={`text-xs px-4 py-2 rounded-full font-medium transition-all cursor-pointer shadow-organic-sm ${
                      pushEnabled
                        ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] border border-[#D9E6DD] dark:border-[#2C4032]"
                        : "bg-[#C86D51] text-white"
                    }`}
                  >
                    {pushLoading ? "Updating..." : pushEnabled ? "Enabled" : "Enable Reminders"}
                  </motion.button>
                </div>

                {pushEnabled && (
                  <div className="pt-2 flex items-center justify-between border-t border-[#EAE3D7] dark:border-[#38332E]">
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                      Want to verify push notifications on this device?
                    </span>
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={testingPush}
                      className="text-xs px-3.5 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] hover:bg-[#F3EFE7] cursor-pointer font-medium"
                    >
                      {testingPush ? "Sending..." : "Send Test Alert"}
                    </button>
                  </div>
                )}
              </div>

              {/* Sponsor / Partner Live Sharing Portal */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                      Sponsor & Partner Live Sharing
                    </h3>
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                      Share a secure, read-only link with a sponsor, partner, or therapist.
                    </p>
                  </div>
                </div>

                {!shareLink ? (
                  <div className="pt-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={handleGenerateShareLink}
                      disabled={generatingShare}
                      className="py-3 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-organic-sm"
                    >
                      <span>{generatingShare ? "Generating..." : "Generate Secure Read-Only Link"}</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareLink}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none select-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={copyShareToClipboard}
                        className="px-4 py-2.5 rounded-xl bg-[#658B70] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#786F66] dark:text-[#A8A096]">
                      <ShieldCheck className="w-4 h-4 text-[#658B70] shrink-0" />
                      <span>Journal reflection text is private & redacted by default.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Report & Data Export Hub */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">
                        Clinical & Therapy Summary Export
                      </h3>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        Print structured intake summaries for therapists or download raw datasets
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={handleOpenClinicalReport}
                    className="p-3.5 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C] hover:border-[#658B70] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Clinical Intake Summary (PDF)</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setExportOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Raw Dataset (CSV)</span>
                  </motion.button>
                </div>
              </div>

              {/* Cadence Times Form */}
              <form onSubmit={handleSaveCadence} className="space-y-6">
                <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-4">
                  <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#B88452]" />
                    Daily Check-In Times
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <Sun className="w-4 h-4 text-[#B88452]" />
                        <div>
                          <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">Morning</span>
                          <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">Planning time</span>
                        </div>
                      </div>
                      <input
                        type="time"
                        value={morningTime}
                        onChange={(e) => setMorningTime(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <Moon className="w-4 h-4 text-[#C86D51]" />
                        <div>
                          <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">Evening</span>
                          <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">Reflection time</span>
                        </div>
                      </div>
                      <input
                        type="time"
                        value={eveningTime}
                        onChange={(e) => setEveningTime(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51] shadow-2xs font-mono"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 cursor-pointer shadow-organic-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving preferences..." : "Save Preferences"}</span>
                </motion.button>

                {/* Account Info & Logout */}
                <div className="pt-4 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                  <span>Signed in as <strong className="text-[#2C2520] dark:text-[#ECE7E0]">{user?.email}</strong></span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[#C86D51] dark:text-[#DB8165] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </PageTransition>

      {/* Export Report Modal */}
      {exportOpen && (
        <ExportReportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          userEmail={user?.email}
          commitment={allCommitments[0]}
        />
      )}

      {/* Clinical & Therapy Intake Report Modal */}
      {clinicalModalOpen && clinicalReport && (
        <ClinicalExportModal
          isOpen={clinicalModalOpen}
          onClose={() => setClinicalModalOpen(false)}
          report={clinicalReport}
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
