"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressSummaryExportModal from "@/app/components/ProgressSummaryExportModal";
import NewCommitmentModal from "@/app/components/NewCommitmentModal";
import { SettingsSkeleton } from "@/app/components/Skeletons";
import {
  generateProgressSummary,
  ProgressSummaryData,
} from "@/lib/progress-summary-service";
import {
  Anchor,
  Sun,
  Moon,
  Clock,
  SignOut as LogOut,
  FloppyDisk as Save,
  CheckCircle as CheckCircle2,
  PauseCircle,
  PlayCircle,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  DownloadSimple as Download,
  Plus,
  Trash as Trash2,
  PencilSimple as Edit2,
  BellSlash as BellOff,
  BellRinging as BellRing,
  Users,
  UserMinus as UserX,
  ArrowRight,
  CaretRight,
  Lock,
} from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";
import { performClientLogout } from "@/lib/client-storage";
import { useAppContext } from "@/app/context/AppContext";
import type { Commitment, PartnerPermission } from "@/db/schema";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    setUser,
    commitments,
    setCommitments,
    isInitialLoading,
    refreshUser,
  } = useAppContext();

  const [loading, setLoading] = useState(() => !user);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [allCommitments, setAllCommitments] = useState<Commitment[]>(() => commitments);

  // Cadence state
  const [morningTime, setMorningTime] = useState(() => user?.morningNotificationTime || "08:00");
  const [eveningTime, setEveningTime] = useState(() => user?.eveningNotificationTime || "20:00");
  const [timezone, setTimezone] = useState(() => user?.timezone || "UTC");

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Discretion & Privacy State
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("anchor_privacy_mode") === "true";
      setPrivacyMode(saved);
    } catch {}
  }, []);

  const togglePrivacyMode = () => {
    triggerHaptic(12);
    const next = !privacyMode;
    setPrivacyMode(next);
    try {
      localStorage.setItem("anchor_privacy_mode", String(next));
    } catch {}
    if (next) {
      document.body.classList.add("privacy-active");
    } else {
      document.body.classList.remove("privacy-active");
    }
  };

  // Sponsor / Partner Granular Sharing State
  const [partnerShares, setPartnerShares] = useState<PartnerPermission[]>([]);
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
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryReport, setSummaryReport] =
    useState<ProgressSummaryData | null>(null);
  const [includeJournalInSummary, setIncludeJournalInSummary] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);

  const handleOpenSummaryReport = async () => {
    try {
      triggerHaptic(12);
      const [checkInsRes, journalRes] = await Promise.all([
        fetch("/api/checkins"),
        fetch("/api/journal"),
      ]);
      const checkInsData = checkInsRes.ok
        ? await checkInsRes.json()
        : { checkIns: [] };
      const journalData = journalRes.ok
        ? await journalRes.json()
        : { entries: [] };
      const activeComm =
        allCommitments.find((c) => c.active) || allCommitments[0];
      const report = generateProgressSummary(
        user,
        activeComm,
        checkInsData.checkIns || [],
        journalData.entries || [],
        { includeJournalNotes: includeJournalInSummary },
      );
      setSummaryReport(report);
      setSummaryModalOpen(true);
    } catch (err) {
      console.error("Failed to generate summary:", err);
    }
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWhy, setEditWhy] = useState("");

  useEffect(() => {
    if (user) {
      setMorningTime(user.morningNotificationTime || "08:00");
      setEveningTime(user.eveningNotificationTime || "20:00");
      setTimezone(user.timezone || "UTC");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    async function loadData() {
      try {
        if (!user) {
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
        }

        const commsRes = await fetch("/api/commitments");
        if (commsRes.ok) {
          const commsData = await commsRes.json();
          const list = commsData.allCommitments || commsData.commitments || [];
          setAllCommitments(list);
          setCommitments(list);
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
  }, [router, user, setUser, setCommitments]);

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

  const handleSaveCadence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setSuccessMsg(
          "Partner link created with zero-sharing default permissions.",
        );
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
    currentValue: boolean,
  ) => {
    try {
      triggerHaptic(8);
      const nextVal = !currentValue;
      // Optimistic update
      setPartnerShares((prev) =>
        prev.map((s) => (s.token === token ? { ...s, [field]: nextVal } : s)),
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
          prev.map((s) =>
            s.token === token ? { ...s, [field]: currentValue } : s,
          ),
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
        "Are you sure you want to disconnect this partner? Their access token will be revoked immediately.",
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
          prev.map((c) => (c.id === comm.id ? { ...c, active: newActive } : c)),
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
          prev.map((c) =>
            c.id === id ? { ...c, name: editName, why: editWhy } : c,
          ),
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
    if (
      !confirm(
        "Are you sure you want to remove this anchor? Past reflections will remain in your archive.",
      )
    ) {
      return;
    }
    try {
      triggerHaptic(15);
      const res = await fetch(`/api/commitments?id=${id}`, {
        method: "DELETE",
      });
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
    triggerHaptic(10);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    await performClientLogout();
    router.push("/login");
    router.refresh();
  };

  if ((loading || isInitialLoading) && !user) {
    return <SettingsSkeleton />;
  }

  const userInitial = (user?.firstName?.trim() || user?.email?.trim() || "A")
    .charAt(0)
    .toUpperCase();
  const hasCadenceChanged =
    user &&
    (morningTime !== (user.morningNotificationTime || "08:00") ||
      eveningTime !== (user.eveningNotificationTime || "20:00") ||
      timezone !== (user.timezone || "UTC"));

  return (
    <div className="w-full flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8 pb-28 sm:pb-20">
          {/* Header Title */}
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
              Preferences & Controls
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-medium text-[#2C2520] dark:text-[#ECE7E0] tracking-tight">
              Settings & Anchors
            </h1>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
              Tailor your daily check-in cadence, active anchors, data privacy,
              and partner connections.
            </p>
          </div>

          {/* Feedback alerts */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C] text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-organic-xs"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#658B70]" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-4 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] text-[#B88452] dark:text-[#E2A365] text-xs sm:text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. HERO ACCOUNT CARD (Apple ID / Linear Caliber) */}
          <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] p-5 sm:p-6 shadow-organic-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] font-serif-title text-2xl font-bold flex items-center justify-center shrink-0 border border-[#C86D51]/20 shadow-organic-xs">
                  {userInitial}
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base sm:text-lg font-semibold text-[#2C2520] dark:text-[#ECE7E0] tracking-tight truncate">
                    {user?.firstName
                      ? `${user.firstName} ${user.lastName || ""}`
                      : "My Account"}
                  </h2>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] truncate font-normal">
                    {user?.email || "Signed in"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] border border-[#658B70]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#658B70] animate-pulse" />
                      Encrypted Vault
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF7F2] dark:bg-[#1C1917] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E]">
                      Zero Trackers
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0 flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EAE3D7]/60 dark:border-[#38332E]/60">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs px-3.5 py-1.5 rounded-full font-medium text-[#C86D51] dark:text-[#DB8165] border border-[#C86D51]/25 hover:bg-[#F9EBE7] dark:hover:bg-[#38251F] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. RITUAL & CADENCE GROUP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                Daily Ritual & Cadence
              </span>
              {hasCadenceChanged && (
                <span className="text-[11px] text-[#C86D51] dark:text-[#DB8165] font-medium animate-pulse">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              {/* Morning Time Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shrink-0 shadow-2xs">
                    <Sun className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Morning Intention
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                      Quiet check-in to set your day's grounding
                    </span>
                  </div>
                </div>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51] transition-colors shrink-0"
                />
              </div>

              {/* Evening Time Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shrink-0 shadow-2xs">
                    <Moon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Evening Reflection
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                      Honest 30-second daily review & ledger
                    </span>
                  </div>
                </div>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51] transition-colors shrink-0"
                />
              </div>

              {/* Timezone Row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F3EFE7] dark:bg-[#2A2622] text-[#786F66] dark:text-[#A8A096] flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Local Timezone
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block">
                      Calculates local reminder timing and daily streaks
                    </span>
                  </div>
                </div>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full sm:w-52 px-3.5 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51] font-mono transition-colors shrink-0"
                  placeholder="e.g. America/New_York"
                />
              </div>

              {/* Push Notifications Row */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shrink-0 shadow-2xs">
                      {pushEnabled ? (
                        <BellRing className="w-4.5 h-4.5" />
                      ) : (
                        <BellOff className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                        Browser Push Reminders
                      </span>
                      <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                        {pushEnabled
                          ? "Active on this device"
                          : "Receive quiet reminders at your cadence"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushEnabled}
                    disabled={pushLoading}
                    onClick={handleTogglePush}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      pushEnabled
                        ? "bg-[#C86D51]"
                        : "bg-[#DCD5CB] dark:bg-[#3D3730]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                        pushEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {pushEnabled && (
                  <div className="pt-2 flex items-center justify-between border-t border-[#EAE3D7]/40 dark:border-[#38332E]/40 text-xs">
                    <span className="text-[#786F66] dark:text-[#A8A096]">
                      Verify push alerts on this device
                    </span>
                    <button
                      type="button"
                      onClick={handleSendTestPush}
                      disabled={testingPush}
                      className="px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F] font-medium transition-colors cursor-pointer text-xs"
                    >
                      {testingPush ? "Sending..." : "Send Test Alert"}
                    </button>
                  </div>
                )}
              </div>

              {/* Contextual Save Row */}
              <div className="p-4 sm:p-5 bg-[#FAF7F2]/60 dark:bg-[#1E1B18]/60 flex items-center justify-between">
                <span className="text-xs text-[#786F66] dark:text-[#A8A096]">
                  {hasCadenceChanged
                    ? "Modifications ready to apply"
                    : "Cadence is synchronized"}
                </span>
                <button
                  type="button"
                  disabled={saving || !hasCadenceChanged}
                  onClick={() => handleSaveCadence()}
                  className={`text-xs px-4 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-organic-xs disabled:opacity-40 disabled:cursor-default ${
                    hasCadenceChanged
                      ? "bg-[#C86D51] hover:bg-[#B35D43] text-white shadow-organic-sm"
                      : "bg-[#EAE3D7] dark:bg-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                  }`}
                >
                  {saving ? (
                    <>
                      <Spinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Cadence</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 3. YOUR ANCHORS GROUP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                  Your Anchors
                </span>
                <span className="text-xs text-[#786F66] dark:text-[#A8A096] ml-2">
                  ({allCommitments.filter((c) => c.active).length} of 5 active)
                </span>
              </div>

              {allCommitments.length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setNewModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium flex items-center gap-1 shadow-organic-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Anchor</span>
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              {allCommitments.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center mx-auto shadow-2xs">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096]">
                    You haven't configured an active anchor yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewModalOpen(true)}
                    className="text-xs px-4 py-2 rounded-full bg-[#C86D51] text-white font-medium inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your Anchor</span>
                  </button>
                </div>
              ) : (
                allCommitments.map((comm) => {
                  const isEditing = editingId === comm.id;
                  const commColor =
                    PALETTE_HEX[comm.colorIndex ?? 0] || "#C86D51";

                  return (
                    <div key={comm.id} className="p-4 sm:p-5 transition-colors">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Anchor Habit Name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs sm:text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                          />
                          <textarea
                            rows={2}
                            value={editWhy}
                            onChange={(e) => setEditWhy(e.target.value)}
                            placeholder="Grounding reason / your why..."
                            className="w-full px-3.5 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-xs text-[#2C2520] dark:text-[#ECE7E0] resize-none focus:outline-none focus:border-[#C86D51]"
                          />
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-xs px-3.5 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comm.id)}
                              className="text-xs px-4 py-1.5 rounded-xl bg-[#658B70] hover:bg-[#52705A] text-white font-medium"
                            >
                              Save Anchor
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: commColor }}
                              />
                              <span className="font-semibold text-sm text-[#2C2520] dark:text-[#ECE7E0] truncate">
                                {comm.name}
                              </span>
                            </div>
                            {comm.why && (
                              <p className="text-xs text-[#786F66] dark:text-[#A8A096] italic font-serif leading-relaxed pl-4.5 line-clamp-2">
                                "{comm.why}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleCommitmentActive(comm)}
                              className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 cursor-pointer transition-colors ${
                                comm.active
                                  ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#D9E6DD] dark:border-[#2C4032] text-[#658B70] dark:text-[#82A78C]"
                                  : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                              }`}
                            >
                              {comm.active ? (
                                <PlayCircle className="w-3.5 h-3.5 text-[#658B70]" />
                              ) : (
                                <PauseCircle className="w-3.5 h-3.5 text-[#786F66]" />
                              )}
                              <span>{comm.active ? "Active" : "Paused"}</span>
                            </button>

                            <button
                              type="button"
                              title="Edit anchor"
                              onClick={() => {
                                setEditingId(comm.id);
                                setEditName(comm.name);
                                setEditWhy(comm.why || "");
                              }}
                              className="p-1.5 rounded-lg text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {allCommitments.length > 1 && (
                              <button
                                type="button"
                                title="Remove anchor"
                                onClick={() => handleDeleteCommitment(comm.id)}
                                className="p-1.5 rounded-lg text-[#9E948A] hover:text-[#C86D51] hover:bg-[#F9EBE7] dark:hover:bg-[#38251F] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. PRIVACY & SECURITY GROUP */}
          <div className="space-y-3">
            <div className="px-1">
              <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                Privacy & Data Discretion
              </span>
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              {/* Blur Mode */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F3EFE7] dark:bg-[#2A2622] text-[#786F66] dark:text-[#A8A096] flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Discreet Blur Mode
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                      Obscures private reflection notes in public transit or
                      shared spaces
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={privacyMode}
                  onClick={togglePrivacyMode}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    privacyMode
                      ? "bg-[#C86D51]"
                      : "bg-[#DCD5CB] dark:bg-[#3D3730]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      privacyMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Encryption Status */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shrink-0 shadow-2xs">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Vault Encryption
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block">
                      Reflections and notes are encrypted with server-managed
                      AES-256-GCM
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] border border-[#658B70]/20 shrink-0">
                  AES-256 Active
                </span>
              </div>

              {/* Privacy Policy Link */}
              <a
                href="/privacy"
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18] transition-colors group cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                    Zero-Tracker Privacy Policy
                  </span>
                  <span className="text-xs text-[#786F66] dark:text-[#A8A096] block">
                    Read our commitment to zero advertising, zero brokers, and
                    opt-in sharing
                  </span>
                </div>
                <CaretRight className="w-4 h-4 text-[#9E948A] group-hover:text-[#C86D51] transition-colors shrink-0" />
              </a>
            </div>
          </div>

          {/* 5. ACCOUNTABILITY & SPONSOR SHARING GROUP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                  Partner & Sponsor Sharing
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer shadow-organic-xs bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51] flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-[#C86D51]" />
                <span>{showInviteForm ? "Close Invite" : "New Invite"}</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              <div className="p-4 sm:p-5 bg-[#FAF7F2]/40 dark:bg-[#1E1B18]/40 text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                Granular, opt-in companion sharing. Nothing is shared with a
                sponsor or partner by default. You control every data category
                individually.
              </div>

              {/* New Partner Invite Accordion */}
              <AnimatePresence>
                {showInviteForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreatePartnerInvite}
                    className="p-5 sm:p-6 bg-[#FAF7F2] dark:bg-[#1E1B18] space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#C86D51] dark:text-[#DB8165]">
                        Create Secure Companion Link
                      </span>
                      <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                        Defaults to zero data sharing
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#786F66] dark:text-[#A8A096] block mb-1">
                          Partner Identifier (Optional)
                        </label>
                        <input
                          type="text"
                          value={newInviteEmail}
                          onChange={(e) => setNewInviteEmail(e.target.value)}
                          placeholder="e.g. Sponsor Mark"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#786F66] dark:text-[#A8A096] block mb-1">
                          Link Expiration
                        </label>
                        <select
                          value={newExpiresInDays}
                          onChange={(e) =>
                            setNewExpiresInDays(Number(e.target.value))
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-white dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] focus:outline-none focus:border-[#C86D51]"
                        >
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                        Permitted Data Points
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          {
                            key: "shareConsistency",
                            label: "Consistency Rate",
                          },
                          { key: "shareMilestones", label: "Milestone Totals" },
                          { key: "shareMoodTrends", label: "Mood Trends" },
                          { key: "shareBlockers", label: "Blocker Categories" },
                          {
                            key: "shareJournalNotes",
                            label: "Written Journal Notes",
                            confidential: true,
                          },
                        ].map((p) => {
                          const isChecked =
                            newPermissions[
                              p.key as keyof typeof newPermissions
                            ];
                          return (
                            <label
                              key={p.key}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#658B70]/40 text-[#658B70] dark:text-[#82A78C]"
                                  : "bg-white dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                              }`}
                            >
                              <span className="font-medium">{p.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setNewPermissions((prev) => ({
                                    ...prev,
                                    [p.key]: e.target.checked,
                                  }))
                                }
                                className="rounded text-[#658B70] focus:ring-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="text-xs px-3.5 py-1.5 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingShare}
                        className="text-xs px-4 py-1.5 rounded-xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium disabled:opacity-50"
                      >
                        {creatingShare
                          ? "Generating Link..."
                          : "Create Companion Link"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Partner Connections List */}
              {partnerShares.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-[#658B70] dark:text-[#82A78C] font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No Active Partner Links</span>
                  </div>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096] max-w-sm mx-auto">
                    Your journal reflections, streaks, and check-ins are
                    currently 100% private to you.
                  </p>
                </div>
              ) : (
                partnerShares.map((share) => (
                  <div key={share.id} className="p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                          {share.partnerEmail || "Partner Companion"}
                        </span>
                        <span className="text-[11px] text-[#786F66] dark:text-[#A8A096] block">
                          Created{" "}
                          {new Date(share.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPartnerLink(share.token)}
                          className="text-xs px-3 py-1 rounded-xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] hover:border-[#C86D51] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedToken === share.token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#658B70]" />
                              <span className="text-[#658B70]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDisconnectPartner(share.token)}
                          className="text-xs px-3 py-1 rounded-xl border border-[#F2D7CE] dark:border-[#4D332B] text-[#C86D51] hover:bg-[#F9EBE7] dark:hover:bg-[#38251F] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </div>

                    {/* Permission toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      {[
                        { key: "shareConsistency", label: "Consistency" },
                        { key: "shareMilestones", label: "Milestones" },
                        { key: "shareMoodTrends", label: "Mood Trends" },
                        { key: "shareBlockers", label: "Blockers" },
                        { key: "shareJournalNotes", label: "Journal Notes" },
                      ].map((perm) => {
                        const active = Boolean(
                          share[perm.key as keyof typeof share],
                        );
                        return (
                          <button
                            key={perm.key}
                            type="button"
                            onClick={() =>
                              handleTogglePartnerPermission(
                                share.token,
                                perm.key,
                                active,
                              )
                            }
                            className={`p-2 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                              active
                                ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#658B70]/30 text-[#658B70] dark:text-[#82A78C]"
                                : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
                            }`}
                          >
                            <span className="truncate">{perm.label}</span>
                            <span className="font-semibold text-[10px] uppercase ml-1">
                              {active ? "On" : "Off"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 6. REPORTS & DATA EXPORT GROUP */}
          <div className="space-y-3">
            <div className="px-1">
              <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                Reports & Data Export
              </span>
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              {/* PDF Summary Report */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Progress Summary (PDF)
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                      Evidence-informed summary report formatted for therapist
                      or sponsor review
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenSummaryReport}
                  className="text-xs px-4 py-2 rounded-full font-medium bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] border border-[#D9E6DD] dark:border-[#2C4032] hover:border-[#658B70] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate PDF</span>
                </button>
              </div>

              {/* Raw CSV Dataset */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] flex items-center justify-center shrink-0 shadow-2xs">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                      Raw Portable Dataset (CSV)
                    </span>
                    <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                      Complete uncompressed data archive of all your check-ins
                      and habits
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    window.location.href = "/api/export";
                  }}
                  className="text-xs px-4 py-2 rounded-full font-medium bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* 7. ACCOUNT & SESSION (FAANG / Apple Settings Pattern) */}
          <div className="space-y-3 pt-2">
            <div className="px-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                Account & Session
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#658B70] dark:text-[#82A78C] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#658B70] animate-pulse" />
                <span>Protected Vault</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#25221F] rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm overflow-hidden divide-y divide-[#EAE3D7]/60 dark:divide-[#38332E]/60">
              {/* Identity Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#C86D51] to-[#B88452] text-white font-serif-title text-base font-bold flex items-center justify-center shrink-0 shadow-organic-xs">
                    {userInitial}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] truncate">
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName || ""}`.trim()
                          : "Anchor Member"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] border border-[#658B70]/20 shrink-0">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-[#786F66] dark:text-[#A8A096] truncate font-mono">
                      {user?.email || "Encrypted Session"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Encryption & Device Session Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 text-xs text-[#786F66] dark:text-[#A8A096]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#658B70] flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0] block truncate">
                      Zero-Knowledge Device Storage
                    </span>
                    <span className="text-[11px] block truncate">
                      AES-256-GCM client token vault
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] shrink-0">
                  Hardware Protected
                </span>
              </div>

              {/* Sign Out Action Row */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-[#FAF7F2]/40 dark:bg-[#1E1B18]/40">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                    Session Security
                  </span>
                  <span className="text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                    Sign out and revoke cached local session credentials
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C86D51] dark:text-[#DB8165] bg-[#F9EBE7] dark:bg-[#38251F] border border-[#C86D51]/30 hover:bg-[#C86D51] hover:text-white dark:hover:bg-[#C86D51] dark:hover:text-white transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* 8. PRIMARY SAVE PREFERENCES / STATUS BAR */}
          <div className="pt-2">
            <AnimatePresence mode="wait">
              {hasCadenceChanged ? (
                <motion.button
                  key="save-active"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleSaveCadence()}
                  disabled={saving}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 cursor-pointer shadow-organic-md hover:shadow-lg flex items-center justify-center gap-2.5"
                >
                  {saving ? (
                    <>
                      <Spinner />
                      <span>Saving preferences...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="saved-synced"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full py-3 px-5 rounded-2xl bg-white dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] text-xs font-medium flex items-center justify-center gap-2 shadow-organic-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#658B70] shrink-0" />
                  <span>All preferences & cadence timings are saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAANG Brand Footer */}
          <footer className="pt-6 pb-2 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[#786F66] dark:text-[#A8A096]">
              <Anchor className="w-4 h-4 text-[#C86D51]" />
              <span className="font-serif-title text-xs tracking-wider uppercase font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                Anchor
              </span>
            </div>
            <p className="text-[11px] text-[#A8A096] dark:text-[#6E665D]">
              Version 1.2.0 • Zero-knowledge accountability & quiet daily
              progress
            </p>
            <div className="flex items-center justify-center gap-3 text-[10px] text-[#786F66] dark:text-[#A8A096] font-mono">
              <span>Encrypted Vault</span>
              <span>•</span>
              <span>PWA Offline-Ready</span>
              <span>•</span>
              <span>Zero Trackers</span>
            </div>
          </footer>
        </main>

      {/* Floating Glassmorphic Save Dock (Appears smoothly when cadence changes) */}
      <AnimatePresence>
        {hasCadenceChanged && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-40 max-w-md mx-auto px-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-[#2C2520]/95 dark:bg-[#1E1B18]/95 backdrop-blur-xl text-white rounded-2xl p-2.5 pl-4 shadow-2xl border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#C86D51] animate-pulse shrink-0" />
                <span className="text-xs font-medium text-[#ECE7E0] truncate">
                  Unsaved changes
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    if (user) {
                      setMorningTime(user.morningNotificationTime || "08:00");
                      setEveningTime(user.eveningNotificationTime || "20:00");
                      setTimezone(user.timezone || "UTC");
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#A8A096] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCadence()}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#C86D51] hover:bg-[#B35D43] text-white flex items-center gap-1.5 transition-all shadow-organic-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Spinner /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Summary Export Modal */}
      {summaryModalOpen && summaryReport && (
        <ProgressSummaryExportModal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
          report={summaryReport}
          includeJournalNotes={includeJournalInSummary}
          onToggleIncludeJournalNotes={async (include) => {
            setIncludeJournalInSummary(include);
            const [checkInsRes, journalRes] = await Promise.all([
              fetch("/api/checkins"),
              fetch("/api/journal"),
            ]);
            const checkInsData = checkInsRes.ok
              ? await checkInsRes.json()
              : { checkIns: [] };
            const journalData = journalRes.ok
              ? await journalRes.json()
              : { entries: [] };
            const activeComm =
              allCommitments.find((c) => c.active) || allCommitments[0];
            const updated = generateProgressSummary(
              user,
              activeComm,
              checkInsData.checkIns || [],
              journalData.entries || [],
              { includeJournalNotes: include },
            );
            setSummaryReport(updated);
          }}
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
