"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
}

export function LoadingButton({ 
  children, 
  loading, 
  className, 
  disabled, 
  variant = "default",
  size = "default",
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "relative transition-all duration-150 active:scale-[0.98] cursor-pointer font-semibold", 
        loading && "opacity-85 pointer-events-none",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
