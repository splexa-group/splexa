import type { FastifyRequest } from "fastify";

import { dashboardService } from "./service";

export const dashboardController = {
  async getData(req: FastifyRequest) {
    return dashboardService.getData(req.user.orgId);
  },
};
