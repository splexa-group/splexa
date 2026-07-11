import { dashboardRepository } from "./dashboard.repository";

export const dashboardService = {
  async getData(orgId: string) {
    return dashboardRepository.getData(orgId);
  },
};
