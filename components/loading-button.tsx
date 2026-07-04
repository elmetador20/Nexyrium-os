"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
}

export function LoadingButton({ children, loading, className, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button
      className={`relative h-11 w-full rounded-xl bg-amber-500 text-black hover:bg-amber-450 font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-amber-500 disabled:opacity-50 cursor-pointer ${className || ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
