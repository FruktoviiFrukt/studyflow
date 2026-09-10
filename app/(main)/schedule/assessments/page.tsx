import type { Metadata } from "next";
import Assessments from "@/components/schedule/assessments";
import { universityToday } from "@/lib/schedule";
export const metadata: Metadata = { title: "Аттестации и экзамены | StudyHub" };
export const dynamic = "force-dynamic";
export default function Page() { return <Assessments initialToday={universityToday()} />; }
