import TeacherGrades from "@/components/grades/teacher-grades";
import { createSubject } from "@/lib/grades";

export default function GpaPage() {
  // Replace these empty examples with authorized student records from the server.
  const subjects = [createSubject("programming", "Программирование", 1), createSubject("math", "Высшая математика", 2)];
  return <TeacherGrades subjects={subjects} />;
}
