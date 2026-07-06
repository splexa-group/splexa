import type { ServiceContext } from "@/types/service-context";
import { Errors } from "@/utils/errors";

import { clientsRepository } from "./repository";
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from "./schema";

export const clientsService = {
  async create(input: CreateClientInput, ctx: ServiceContext) {
    const existing = await clientsRepository.findByPhone(input.phone, ctx.orgId);

    const client = await clientsRepository.create({
      ...input,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    });

    if (existing) {
      return {
        data: client,
        warnings: [`${existing.fullName} already has this phone number`],
      };
    }

    return { data: client };
  },

  async list(orgId: string, query: ListClientsQuery) {
    return clientsRepository.list(orgId, query);
  },

  async findById(id: string, orgId: string) {
    const client = await clientsRepository.findById(id, orgId);
    if (!client) throw Errors.clientNotFound();
    return client;
  },

  async update(id: string, input: UpdateClientInput, ctx: ServiceContext) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();
    const updated = await clientsRepository.update(id, ctx.orgId, input);
    if (!updated) throw Errors.clientNotFound();
    return updated;
  },

  async delete(id: string, ctx: ServiceContext) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();
    const { count } = await clientsRepository.softDelete(id, ctx.orgId);
    if (count === 0) throw Errors.clientNotFound();
  },
};
