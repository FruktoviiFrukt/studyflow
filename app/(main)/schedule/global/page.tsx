import type { Metadata } from "next";
import GlobalSchedule from "@/components/schedule/global-schedule";
import { universityToday } from "@/lib/schedule";

export const metadata: Metadata = { title: "Глобальное расписание | StudyHub" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <GlobalSchedule initialToday={universityToday()} />;
}
