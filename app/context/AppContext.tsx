"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User, Commitment, CheckIn, JournalEntry } from "@/db/schema";

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  commitments: Commitment[];
  setCommitments: React.Dispatch<React.SetStateAction<Commitment[]>>;
  activeCommitmentId: string;
  setActiveCommitmentId: (id: string) => void;
  activeCommitment: Commitment | undefined;
  checkIns: CheckIn[];
  setCheckIns: React.Dispatch<React.SetStateAction<CheckIn[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  partnerMessages: any[];
  setPartnerMessages: React.Dispatch<React.SetStateAction<any[]>>;
  communityReflections: Record<string, any[]>;
  setCategoryReflections: (category: string, list: any[]) => void;
  isInitialLoading: boolean;
  refreshUser: () => Promise<User | null>;
  refreshCommitments: () => Promise<Commitment[]>;
  refreshCheckIns: (date?: string) => Promise<CheckIn[]>;
  refreshJournals: () => Promise<JournalEntry[]>;
  refreshPartnerMessages: () => Promise<any[]>;
  updateCheckInLocally: (saved: CheckIn) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_ROUTES = ["/today", "/journal", "/progress", "/community", "/settings"];

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [activeCommitmentId, setActiveCommitmentId] = useState<string>("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [partnerMessages, setPartnerMessages] = useState<any[]>([]);
  const [communityReflections, setCommunityReflections] = useState<Record<string, any[]>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Register service worker globally on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration:", err);
      });
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (APP_ROUTES.some((r) => pathname.startsWith(r))) {
          router.push("/login");
        }
        return null;
      }
      const data = await res.json();
      if (!data.user?.isOnboarded && APP_ROUTES.some((r) => pathname.startsWith(r))) {
        router.push("/onboarding");
        return null;
      }
      setUser(data.user);
      const comms: Commitment[] = data.commitments || (data.commitment ? [data.commitment] : []);
      setCommitments(comms);
      if (comms.length > 0) {
        setActiveCommitmentId((prev) => prev || comms[0].id);
      }
      return data.user;
    } catch (e) {
      console.warn("AppContext: failed refreshing user", e);
      return null;
    }
  }, [pathname, router]);

  const refreshCommitments = useCallback(async (): Promise<Commitment[]> => {
    try {
      const res = await fetch("/api/commitments");
      if (res.ok) {
        const data = await res.json();
        const list = data.allCommitments || data.commitments || [];
        setCommitments(list);
        if (list.length > 0) {
          setActiveCommitmentId((prev) => prev || list[0].id);
        }
        return list;
      }
    } catch (e) {
      console.warn("AppContext: failed refreshing commitments", e);
    }
    return [];
  }, []);

  const refreshCheckIns = useCallback(async (date?: string): Promise<CheckIn[]> => {
    try {
      const url = date ? `/api/checkins?date=${date}` : "/api/checkins";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.checkIns || [];
        setCheckIns((prev) => {
          if (date) {
            const filtered = prev.filter((c) => c.date !== date);
            return [...filtered, ...fetched];
          }
          return fetched;
        });
        return fetched;
      }
    } catch (e) {
      console.warn("AppContext: failed refreshing check-ins", e);
    }
    return [];
  }, []);

  const refreshJournals = useCallback(async (): Promise<JournalEntry[]> => {
    try {
      const res = await fetch("/api/journal");
      if (res.ok) {
        const data = await res.json();
        const entries = data.entries || [];
        setJournalEntries(entries);
        return entries;
      }
    } catch (e) {
      console.warn("AppContext: failed refreshing journals", e);
    }
    return [];
  }, []);

  const refreshPartnerMessages = useCallback(async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/sponsor");
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages?.filter((m: any) => !m.read) || [];
        setPartnerMessages(msgs);
        return msgs;
      }
    } catch (e) {
      console.warn("AppContext: failed refreshing partner messages", e);
    }
    return [];
  }, []);

  const setCategoryReflections = useCallback((category: string, list: any[]) => {
    setCommunityReflections((prev) => ({
      ...prev,
      [category]: list,
    }));
  }, []);

  const updateCheckInLocally = useCallback((saved: CheckIn) => {
    setCheckIns((prev) => {
      const filtered = prev.filter((c) => c.id !== saved.id);
      return [...filtered, saved];
    });
  }, []);

  // Initial load when entering any app route
  useEffect(() => {
    const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));
    if (!isAppRoute) {
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true;
    async function init() {
      try {
        await refreshUser();
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, [pathname, refreshUser]);

  const activeCommitment = useMemo(() => {
    return commitments.find((c) => c.id === activeCommitmentId) || commitments[0];
  }, [commitments, activeCommitmentId]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      commitments,
      setCommitments,
      activeCommitmentId,
      setActiveCommitmentId,
      activeCommitment,
      checkIns,
      setCheckIns,
      journalEntries,
      setJournalEntries,
      partnerMessages,
      setPartnerMessages,
      communityReflections,
      setCategoryReflections,
      isInitialLoading,
      refreshUser,
      refreshCommitments,
      refreshCheckIns,
      refreshJournals,
      refreshPartnerMessages,
      updateCheckInLocally,
    }),
    [
      user,
      commitments,
      activeCommitmentId,
      activeCommitment,
      checkIns,
      journalEntries,
      partnerMessages,
      communityReflections,
      setCategoryReflections,
      isInitialLoading,
      refreshUser,
      refreshCommitments,
      refreshCheckIns,
      refreshJournals,
      refreshPartnerMessages,
      updateCheckInLocally,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
