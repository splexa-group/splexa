import { FastifyReply, FastifyRequest } from "fastify";

import {
  ClientParams,
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "./clients.schema";
import { clientsService } from "./clients.service";

export const clientsController = {
  async create(
    req: FastifyRequest<{ Body: CreateClientInput }>,
    reply: FastifyReply,
  ) {
    const client = await clientsService.create(req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { client };
  },

  async list(req: FastifyRequest<{ Querystring: ListClientsQuery }>) {
    const { data, total } = await clientsService.list(
      req.user.orgId,
      req.query,
    );
    return {
      clients: data,
      total,
      page: req.query.page,
      limit: req.query.limit,
    };
  },

  async getById(req: FastifyRequest<{ Params: ClientParams }>) {
    const client = await clientsService.findById(req.params.id, req.user.orgId);
    return { client };
  },

  async update(
    req: FastifyRequest<{ Params: ClientParams; Body: UpdateClientInput }>,
  ) {
    const client = await clientsService.update(req.params.id, req.body, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    return { client };
  },

  async delete(
    req: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply,
  ) {
    await clientsService.delete(req.params.id, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(204);
  },
};
