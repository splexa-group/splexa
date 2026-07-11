import { FastifyRequest } from "fastify";

import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getData(req: FastifyRequest) {
    return dashboardService.getData(req.user.orgId);
  },
};
