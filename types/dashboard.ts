export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  group: string | null;
};

export type DashboardResponse = {
  user: DashboardUser;
};

export type DashboardErrorResponse = {
  message: string;
};
