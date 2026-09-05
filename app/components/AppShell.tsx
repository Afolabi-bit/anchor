"use client";

import React, { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import { useAppContext } from "@/app/context/AppContext";
import { motion } from "framer-motion";

const TAB_INDEX_MAP: Record<string, number> = {
  "/today": 0,
  "/journal": 1,
  "/progress": 2,
  "/community": 3,
  "/settings": 4,
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAppContext();

  const isAppRoute = Object.keys(TAB_INDEX_MAP).some((r) => pathname.startsWith(r));

  const prevPathRef = useRef(pathname);
  const directionRef = useRef<number>(1);
  const isFirstRender = useRef(true);

  if (prevPathRef.current !== pathname) {
    const prevIdx = TAB_INDEX_MAP[prevPathRef.current] ?? 0;
    const currIdx = TAB_INDEX_MAP[pathname] ?? 0;
    if (currIdx !== prevIdx) {
      directionRef.current = currIdx > prevIdx ? 1 : -1;
    }
    prevPathRef.current = pathname;
    isFirstRender.current = false;
  }

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  if (!isAppRoute) {
    return <>{children}</>;
  }

  const userName = user?.firstName
    ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}`
    : undefined;

  const direction = directionRef.current;

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Navigation
        userEmail={user?.email}
        userName={userName}
        firstName={user?.firstName}
        lastName={user?.lastName}
      />
      <OfflineSyncBadge />
      <div className="flex-1 flex flex-col pb-24 sm:pb-16 relative w-full overflow-x-hidden">
        <motion.div
          key={pathname}
          initial={isFirstRender.current ? false : { x: direction * 36, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: 0.18,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
