import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function LoadingIndicator({
  text = "Загрузка...",
  className,
  ...props
}: LoadingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 space-y-2 text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
}
