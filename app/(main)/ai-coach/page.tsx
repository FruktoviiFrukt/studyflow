import type { Metadata } from "next";
import AiCoach from "@/components/ai-coach/ai-coach";

export const metadata: Metadata = { title: "AI Exam Coach | StudyHub" };

export default function AiCoachPage() {
  return <AiCoach />;
}
