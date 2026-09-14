import type { Metadata } from "next";
import ScheduleManager from "@/components/admin/schedule-manager";

export const metadata: Metadata = {
  title: "Расписание студентов — Администрирование",
};

export default function AdminSchedulePage() {
  return <ScheduleManager />;
}
