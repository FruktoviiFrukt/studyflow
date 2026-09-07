import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";
import { ProgressBar } from "./progress-bar";
import { cn } from "@/lib/utils";

interface SubjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  code?: string;
  progress: number;
  completedTopics: number;
  totalTopics: number;
  icon?: React.ReactNode;
}

export function SubjectCard({
  title,
  code,
  progress,
  completedTopics,
  totalTopics,
  icon,
  className,
  ...props
}: SubjectCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors",
        className,
      )}
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            {code && (
              <span className="text-xs font-bold text-primary uppercase">
                {code}
              </span>
            )}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              {icon}
            </div>
          )}
        </div>
        <CardDescription>
          {completedTopics} из {totalTopics} тем завершено
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProgressBar value={progress} />
      </CardContent>
    </Card>
  );
}
