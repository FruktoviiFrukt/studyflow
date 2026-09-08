"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SegmentedControlOption<T extends string | number> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string | number> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  fullWidthOnMobile?: boolean;
};

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  fullWidthOnMobile = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1",
        fullWidthOnMobile && "w-full sm:w-auto",
        className,
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg",
            fullWidthOnMobile && "flex-1 sm:flex-none",
            value === option.value && "bg-blue-50 text-blue-600",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
