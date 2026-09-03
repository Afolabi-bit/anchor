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
  UserX,
  ShieldAlert,
  ExternalLink,
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

  // Sponsor / Partner Granular Sharing State
  const [partnerShares, setPartnerShares] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newExpiresInDays, setNewExpiresInDays] = useState(60);
  const [newPermissions, setNewPermissions] = useState({
    shareConsistency: false,
    shareMilestones: false,
    shareMoodTrends: false,
    shareBlockers: false,
    shareJournalNotes: false, // ALL DEFAULT FALSE
  });

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

        // Load partner shares
        const sponsorRes = await fetch("/api/sponsor");
        if (sponsorRes.ok) {
          const sponsorData = await sponsorRes.json();
          setPartnerShares(sponsorData.shares || []);
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

  const handleCreatePartnerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingShare(true);
      setError("");
      triggerHaptic(12);

      const res = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerEmail: newInviteEmail.trim() || undefined,
          expiresInDays: newExpiresInDays,
          ...newPermissions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPartnerShares((prev) => [data.share, ...prev]);
        setShowInviteForm(false);
        setNewInviteEmail("");
        setNewPermissions({
          shareConsistency: false,
          shareMilestones: false,
          shareMoodTrends: false,
          shareBlockers: false,
          shareJournalNotes: false,
        });
        setSuccessMsg("Partner link created with zero-sharing default permissions.");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        setError(data.error || "Failed to create partner link.");
      }
    } catch {
      setError("Network error generating partner link.");
    } finally {
      setCreatingShare(false);
    }
  };

  const handleTogglePartnerPermission = async (
    token: string,
    field: string,
    currentValue: boolean
  ) => {
    try {
      triggerHaptic(8);
      const nextVal = !currentValue;
      // Optimistic update
      setPartnerShares((prev) =>
        prev.map((s) => (s.token === token ? { ...s, [field]: nextVal } : s))
      );

      const res = await fetch("/api/sponsor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          permissions: { [field]: nextVal },
        }),
      });

      if (!res.ok) {
        // Rollback
        setPartnerShares((prev) =>
          prev.map((s) => (s.token === token ? { ...s, [field]: currentValue } : s))
        );
        setError("Failed to update partner permission.");
      }
    } catch {
      setError("Failed to update partner permission.");
    }
  };

  const handleDisconnectPartner = async (token: string) => {
    if (
      !confirm(
        "Are you sure you want to disconnect this partner? Their access token will be revoked immediately."
      )
    ) {
      return;
    }

    try {
      triggerHaptic(15);
      const res = await fetch(`/api/sponsor?token=${token}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPartnerShares((prev) => prev.filter((s) => s.token !== token));
        setSuccessMsg("Partner connection revoked immediately.");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        setError("Failed to disconnect partner.");
      }
    } catch {
      setError("Network error disconnecting partner.");
    }
  };

  const handleCopyPartnerLink = (token: string) => {
    triggerHaptic(8);
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
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



  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={user?.firstName ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}` : undefined}
      />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-5 py-5 sm:py-8 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Preferences & Sanctuary
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5 truncate">
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

              {/* Sponsor & Partner Granular Sharing Permissions */}
              <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 clay-card shadow-organic-md space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                        Accountability Partner & Sponsor Sharing
                      </h3>
                      <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                        Granular, opt-in companion sharing. Nothing is shared with a partner by default.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer shadow-organic-sm bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51] flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C86D51]" />
                    <span>{showInviteForm ? "Close" : "New Invite"}</span>
                  </motion.button>
                </div>

                {/* New Partner Invite Form */}
                <AnimatePresence>
                  {showInviteForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreatePartnerInvite}
                      className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                          Configure Partner Invite
                        </span>
                        <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">
                          Defaults to zero sharing
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-[#786F66] dark:text-[#A8A096] block mb-1">
                            Partner Email or Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={newInviteEmail}
                            onChange={(e) => setNewInviteEmail(e.target.value)}
                            placeholder="e.g. sarah@partner.org or Sponsor Mark"
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-[#786F66] dark:text-[#A8A096] block mb-1">
                            Link Expiration
                          </label>
                          <select
                            value={newExpiresInDays}
                            onChange={(e) => setNewExpiresInDays(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                          >
                            <option value={30}>Expires in 30 days</option>
                            <option value={60}>Expires in 60 days (Recommended)</option>
                            <option value={90}>Expires in 90 days</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#EAE3D7] dark:border-[#38332E]">
                        <span className="text-[11px] font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                          Initial Sharing Permissions (All Off by Default):
                        </span>

                        {[
                          {
                            key: "shareConsistency",
                            label: "Daily Consistency Rhythm",
                            desc: "7-day check-in follow through marks and completion percentage",
                          },
                          {
                            key: "shareMilestones",
                            label: "Milestone Tracking",
                            desc: "Total anchored days and reflections count",
                          },
                          {
                            key: "shareMoodTrends",
                            label: "Mood & Valence Trends",
                            desc: "High-level emotional valence scores without notes",
                          },
                          {
                            key: "shareBlockers",
                            label: "Obstacle / Blocker Categories",
                            desc: "High-level blocker tags (stress, time, triggers)",
                          },
                          {
                            key: "shareJournalNotes",
                            label: "Written Reflections & Journal Notes",
                            desc: "Personal journal text (protected by field-level encryption)",
                            badge: "Confidential",
                          },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-start gap-3 p-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] cursor-pointer hover:border-[#C86D51]/50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={(newPermissions as any)[item.key]}
                              onChange={(e) =>
                                setNewPermissions((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.checked,
                                }))
                              }
                              className="mt-0.5 rounded text-[#C86D51] focus:ring-[#C86D51]"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                                {item.desc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowInviteForm(false)}
                          className="px-4 py-2 rounded-xl text-xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingShare}
                          className="px-5 py-2 rounded-xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-xs font-semibold shadow-organic-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {creatingShare ? "Creating..." : "Generate Secure Partner Link"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* List of Connected Partners */}
                <div className="space-y-4">
                  {partnerShares.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-center space-y-1">
                      <ShieldCheck className="w-5 h-5 text-[#658B70] mx-auto mb-1" />
                      <p className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                        No active partner connections
                      </p>
                      <p className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                        Your journal entries, check-ins, and mood logs are 100% private to you.
                      </p>
                    </div>
                  ) : (
                    partnerShares.map((share) => {
                      const isExpired =
                        share.expiresAt && new Date(share.expiresAt).getTime() < Date.now();

                      return (
                        <div
                          key={share.token}
                          className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-4"
                        >
                          {/* Partner Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3D7] dark:border-[#38332E] pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif-title text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                                  {share.partnerEmail || "Companion Access Link"}
                                </span>
                                {isExpired ? (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] text-[10px] font-semibold">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] text-[10px] font-semibold">
                                    Active • Expires{" "}
                                    {share.expiresAt
                                      ? new Date(share.expiresAt).toLocaleDateString()
                                      : "Never"}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">
                                Created {new Date(share.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyPartnerLink(share.token)}
                                className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] hover:border-[#C86D51] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                              >
                                {copiedToken === share.token ? (
                                  <Check className="w-3.5 h-3.5 text-[#658B70]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-[#786F66]" />
                                )}
                                <span>{copiedToken === share.token ? "Copied" : "Copy Link"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Granular Permission Toggles */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                              Active Permissions for this Partner:
                            </span>

                            {[
                              {
                                key: "shareConsistency",
                                label: "Daily Consistency Rhythm",
                                desc: "Follow-through marks and completion rate",
                              },
                              {
                                key: "shareMilestones",
                                label: "Milestone Tracking",
                                desc: "Total reflections and anchored days",
                              },
                              {
                                key: "shareMoodTrends",
                                label: "Mood Trends",
                                desc: "General valence overview",
                              },
                              {
                                key: "shareBlockers",
                                label: "Obstacle / Blocker Tags",
                                desc: "Categories like stress, time, triggers",
                              },
                              {
                                key: "shareJournalNotes",
                                label: "Written Journal Notes",
                                desc: "Confidential free-text entries (encrypted)",
                                badge: "Confidential",
                              },
                            ].map((perm) => {
                              const active = Boolean(share[perm.key]);

                              return (
                                <div
                                  key={perm.key}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E]"
                                >
                                  <div className="pr-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                                        {perm.label}
                                      </span>
                                      {perm.badge && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51]">
                                          {perm.badge}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">
                                      {perm.desc}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleTogglePartnerPermission(share.token, perm.key, active)
                                    }
                                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                                      active
                                        ? "bg-[#658B70] justify-end"
                                        : "bg-[#D5CFC7] dark:bg-[#38332E] justify-start"
                                    }`}
                                  >
                                    <motion.div
                                      layout
                                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Revoke Partner Action */}
                          <div className="pt-2 flex items-center justify-between border-t border-[#EAE3D7] dark:border-[#38332E]">
                            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                              Revoking terminates link immediately server-side.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDisconnectPartner(share.token)}
                              className="text-xs font-medium text-[#C86D51] hover:text-[#B35D43] flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-[#F9EBE7] dark:hover:bg-[#38251F] transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Disconnect partner immediately</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Privacy Policy Link Callout */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#658B70]" />
                    <span>Want to review how your data is protected?</span>
                  </div>
                  <a
                    href="/privacy"
                    className="text-[#C86D51] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Privacy Policy</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
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
                  <span>
                    Signed in as{" "}
                    <strong className="text-[#2C2520] dark:text-[#ECE7E0]">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email}
                    </strong>
                    {user?.firstName && (
                      <span className="text-[#9E948A] text-[11px] ml-1">({user.email})</span>
                    )}
                  </span>
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
