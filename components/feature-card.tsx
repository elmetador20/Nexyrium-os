"use client";

import React from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: "#F59E0B", boxShadow: "0 4px 20px -2px rgba(245, 158, 11, 0.1)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors duration-200 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-base shadow-sm">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white tracking-tight">{title}</h3>
        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
