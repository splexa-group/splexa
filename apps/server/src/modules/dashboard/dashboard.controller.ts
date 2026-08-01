import { FastifyRequest } from "fastify";

import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getData(req: FastifyRequest) {
    const dashboard = await dashboardService.getData(req.user.orgId);
    return { dashboard };
  },
};
