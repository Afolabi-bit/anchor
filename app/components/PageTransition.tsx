"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="w-full flex-1 flex flex-col">{children}</div>;
}
