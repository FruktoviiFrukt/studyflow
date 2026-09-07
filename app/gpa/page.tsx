import TeacherGrades from "@/components/grades/teacher-grades";
import { createSubject } from "@/lib/grades";

export default function GpaPage() {
  // Replace these empty examples with authorized student records from the server.
  const subjects = [createSubject("programming", "Программирование"), createSubject("math", "Высшая математика")];
  return <TeacherGrades subjects={subjects} />;
}
