"use client";

import React from "react";
import { Logo } from "@/components/logo";
import { FeatureCard } from "@/components/feature-card";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-white font-sans">
      {/* Left Panel: Branding & Features (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-zinc-800 bg-zinc-950 p-12 lg:flex">
        {/* Subtle premium background pattern */}
        <div className="absolute inset-0 z-0">
          {/* Glowing gradient mesh */}
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
          <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-amber-600/3 blur-[120px]" />
          
          {/* Subtle Grid */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Header */}
        <div className="relative z-10">
          <Logo />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center space-y-10 my-auto pl-4">
          <div className="space-y-4 max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl leading-[1.15]"
            >
              Helping Startups <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                Become Investor-Ready
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-xs text-zinc-400 leading-relaxed max-w-lg font-medium"
            >
              NexyriumOS is the premier internal CRM. We help early-stage and growth startups navigate pitch deck design, financial modeling, and investor outreach operations.
            </motion.p>
          </div>

          {/* Feature Cards Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="grid gap-4 max-w-lg"
          >
            <FeatureCard
              icon="🚀"
              title="Investor Pitch Decks"
              description="High-converting storytelling structures and designs designed to close top-tier venture capital firms."
            />
            <FeatureCard
              icon="💰"
              title="Fundraising Operations"
              description="Streamlined pipelines for investor relationship management, contact tracking, and campaign analytics."
            />
            <FeatureCard
              icon="📈"
              title="Startup Growth Support"
              description="End-to-end guidance ranging from clean financial projections to pre-seed, seed, and Series A campaign strategy."
            />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/40 pt-6 font-mono font-bold uppercase tracking-wider">
          <span>&copy; {new Date().getFullYear()} Nexyrium Inc.</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Internal CRM &bull; Secure Access
          </span>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="relative flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        {/* Mobile Header (Hidden on desktop) */}
        <div className="absolute top-6 left-6 z-10 block lg:hidden">
          <Logo />
        </div>

        {/* Background glow in Right Panel */}
        <div className="absolute inset-0 -z-10 bg-zinc-950 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
