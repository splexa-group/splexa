import { Errors } from "@/utils/errors";

import type {
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "./schema";
import { clientsRepository } from "./repository";

type Ctx = { orgId: string; userId: string; ipAddress: string };

export const clientsService = {
  async create(input: CreateClientInput, ctx: Ctx) {
    const existing = await clientsRepository.findByPhone(input.phone, ctx.orgId);

    const client = await clientsRepository.create({
      ...input,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    });

    if (existing) {
      return {
        ...client,
        warning: "PHONE_ALREADY_EXISTS" as const,
        existingClientId: existing.id,
        existingClientName: existing.fullName,
      };
    }

    return client;
  },

  async list(orgId: string, query: ListClientsQuery) {
    return clientsRepository.list(orgId, query);
  },

  async findById(id: string, orgId: string) {
    const client = await clientsRepository.findById(id, orgId);
    if (!client) throw Errors.clientNotFound();
    return client;
  },

  async update(id: string, input: UpdateClientInput, ctx: Ctx) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();
    return clientsRepository.update(id, input);
  },

  async delete(id: string, ctx: Ctx) {
    const existing = await clientsRepository.findById(id, ctx.orgId);
    if (!existing) throw Errors.clientNotFound();
    await clientsRepository.softDelete(id, ctx.orgId);
  },
};
