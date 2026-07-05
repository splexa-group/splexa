import { GET } from "@/api/http";
import type { DashboardResponse } from "@/types/dashboard";

export const dashboardApi = {
  get: () => GET<DashboardResponse>("/dashboard"),
};
