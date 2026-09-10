import type { Metadata } from "next";
import GlobalSchedule from "@/components/schedule/global-schedule";
export const metadata: Metadata = { title: "Глобальное расписание | StudyHub" };
export default function Page() { return <GlobalSchedule />; }
