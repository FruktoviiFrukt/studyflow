"use client";

import { useState } from "react";
import { Loader2, TriangleAlert, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type GenerateButtonProps = {
  canGenerate: boolean;
  hint: string | null;
  onGenerate: () => Promise<void> | void;
};

export default function GenerateButton({
  canGenerate,
  hint,
  onGenerate,
}: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button
        type="button"
        size="lg"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        aria-busy={isGenerating}
        className="w-full sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Генерируем вопросы…
          </>
        ) : (
          <>
            <Wand2 aria-hidden="true" />
            Сгенерировать вопросы
          </>
        )}
      </Button>

      {!canGenerate && hint && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}
