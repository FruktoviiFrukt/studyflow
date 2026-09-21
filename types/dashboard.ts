export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  group: string | null;
};

export type DashboardSubjectProgress = {
  id: string;
  name: string;
  semester: 1 | 2;
  grade: number | null;
  progress: number;
};

export type DashboardDeadline = {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
};

export type DashboardTaskSummary = {
  upcomingCount: number;
  completedCount: number;
  deadlines: DashboardDeadline[];
};

export type DashboardResponse = {
  user: DashboardUser;
  subjectProgress: DashboardSubjectProgress[];
  tasks: DashboardTaskSummary;
};

export type DashboardErrorResponse = {
  message: string;
};
