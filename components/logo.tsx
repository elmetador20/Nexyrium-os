import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
        <img
          src="/nexyrium-logo.jpeg"
          alt="Nexyrium"
          className="h-7 w-7 object-contain scale-110"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold tracking-widest text-white uppercase leading-none font-mono">
          Nexyrium
        </span>
        <span className="text-[8px] font-bold text-amber-500/80 tracking-widest uppercase leading-none mt-1">
          Operating System
        </span>
      </div>
    </div>
  );
}
