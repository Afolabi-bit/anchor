"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import { useAppContext } from "@/app/context/AppContext";

const APP_ROUTES = ["/today", "/journal", "/progress", "/community", "/settings"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAppContext();

  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));

  if (!isAppRoute) {
    return <>{children}</>;
  }

  const userName = user?.firstName
    ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}`
    : undefined;

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={userName}
        firstName={user?.firstName}
        lastName={user?.lastName}
      />
      <OfflineSyncBadge />
      <div className="flex-1 flex flex-col pb-24 sm:pb-16">
        {children}
      </div>
    </div>
  );
}
