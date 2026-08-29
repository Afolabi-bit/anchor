"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1] as const,
      }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
