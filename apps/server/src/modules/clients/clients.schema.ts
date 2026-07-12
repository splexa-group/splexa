import {
  ClientType,
  PreferredLanguage,
  RelationType,
} from "@splexa-group/shared/enums";
import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

const dateOfBirthSchema = emptyToUndefined(
  z.iso
    .date("Must be YYYY-MM-DD")
    .transform((val) => new Date(val))
    .optional(),
);

export const createClientSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(20),
    type: z.enum(ClientType),
    email: z.email().optional(),
    address: z.string().max(500).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    preferredLanguage: z.enum(PreferredLanguage).optional(),
    relationType: z.enum(RelationType).optional(),
    relationName: z.string().max(200).optional(),
    dateOfBirth: dateOfBirthSchema,
    occupation: z.string().max(200).optional(),
  })
  .strict();

export const updateClientSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().min(7).max(20).optional(),
    type: z.enum(ClientType).optional(),
    email: z.email().optional(),
    address: z.string().max(500).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    preferredLanguage: z.enum(PreferredLanguage).optional(),
    relationType: z.enum(RelationType).optional(),
    relationName: z.string().max(200).optional(),
    dateOfBirth: dateOfBirthSchema,
    occupation: z.string().max(200).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const clientParamsSchema = z.object({ id: z.uuid() });

export const listClientsQuerySchema = z
  .object({
    search: z.string().optional(),
    type: z.enum(ClientType).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientParams = z.infer<typeof clientParamsSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
