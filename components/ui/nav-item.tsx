"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  isActive?: boolean;
  badgeText?: string;
}

export function NavItem({
  icon,
  label,
  isActive = false,
  badgeText,
  className,
  ...props
}: NavItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      {badgeText && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            isActive
              ? "bg-primary-foreground text-primary"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {badgeText}
        </span>
      )}
    </button>
  );
}
