"use client";

import {
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Presentation,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TYPE_META,
  formatDate,
  formatFileSize,
  type Material,
  type MaterialType,
} from "./types";

const ICONS: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  png: ImageIcon,
  jpg: ImageIcon,
};

type MaterialCardProps = {
  material: Material;
  onOpen: (material: Material) => void;
  onDownload: (material: Material) => void;
  onPrepare: (material: Material) => void;
  onDelete: (material: Material) => void;
};

export default function MaterialCard({
  material,
  onOpen,
  onDownload,
  onPrepare,
  onDelete,
}: MaterialCardProps) {
  const meta = TYPE_META[material.type];
  const Icon = ICONS[material.type];

  return (
    <Card className="flex min-w-0 flex-col rounded-2xl border-gray-200 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.iconClassName}`}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-gray-900">
            {material.title}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
            {material.subject}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <Badge variant="secondary" className={`rounded-md ${meta.className}`}>
          {meta.label}
        </Badge>
        <span>{formatFileSize(material.size)}</span>
        <span className="text-gray-300">·</span>
        <span>{formatDate(material.uploadedAt)}</span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={() => onOpen(material)}
        >
          Открыть
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={() => onDownload(material)}
        >
          <Download />
          Скачать
        </Button>
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => onPrepare(material)}
        >
          <Sparkles />
          Подготовить с ИИ
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
          aria-label={`Удалить ${material.title}`}
          onClick={() => onDelete(material)}
        >
          <Trash2 />
        </Button>
      </div>
    </Card>
  );
}
