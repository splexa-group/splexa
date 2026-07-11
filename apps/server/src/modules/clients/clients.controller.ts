import { FastifyReply, FastifyRequest } from "fastify";

import {
  ClientParams,
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "./clients.schema";
import { clientsService } from "./clients.service";

export const clientsController = {
  async create(req: FastifyRequest<{ Body: CreateClientInput }>, reply: FastifyReply) {
    const { data, warnings } = await clientsService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(201);
    return warnings ? { ...data, warnings } : data;
  },

  async list(req: FastifyRequest<{ Querystring: ListClientsQuery }>) {
    const { data, total } = await clientsService.list(
      req.user.orgId,
      req.query,
    );
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async getById(req: FastifyRequest<{ Params: ClientParams }>) {
    return clientsService.findById(req.params.id, req.user.orgId);
  },

  async update(
    req: FastifyRequest<{ Params: ClientParams; Body: UpdateClientInput }>,
  ) {
    return clientsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
  },

  async delete(
    req: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply,
  ) {
    await clientsService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },
};
