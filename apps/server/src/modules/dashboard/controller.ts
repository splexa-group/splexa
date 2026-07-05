import type { FastifyRequest } from "fastify";

import { dashboardService } from "./service";

export const dashboardController = {
  async getData(req: FastifyRequest) {
    const data = await dashboardService.getData(req.user.orgId);
    return { data };
  },
};
