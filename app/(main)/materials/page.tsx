import type { Metadata } from "next";
import Materials from "@/components/materials/materials";

export const metadata: Metadata = { title: "Материалы | StudyHub" };

export default function MaterialsPage() {
  return <Materials />;
}
