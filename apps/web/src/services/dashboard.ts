import { GET } from "@/api/http";
import type { DashboardData } from "@/types/dashboard";

export const dashboardApi = {
  get: () => GET<DashboardData>("/dashboard"),
};
