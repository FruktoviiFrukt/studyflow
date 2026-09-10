import type { Metadata } from "next";
import Schedule from "@/components/schedule/schedule";
import { universityToday } from "@/lib/schedule";
export const metadata: Metadata = { title: "Расписание | StudyHub" };
// Evaluate today's date per request, rather than freezing it at build time.
export const dynamic = "force-dynamic";
export default function SchedulePage() { return <Schedule initialToday={universityToday()} />; }
