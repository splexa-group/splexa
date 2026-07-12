import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  PartyRole,
  Priority,
  RelationType,
} from "@splexa-group/shared/enums";
import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

const oppositePartySchema = z
  .object({
    name: z.string().min(1).max(200),
    role: z.enum(PartyRole),
    advocateName: z.string().max(200).optional(),
    advocatePhone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
  })
  .strict();

export const createClientSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(20),
    type: z.enum(ClientType),
    email: emptyToUndefined(z.email().optional()),
    address: z.string().max(500).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    relationType: z.enum(RelationType).optional(),
    relationName: z.string().max(200).optional(),
    dateOfBirth: emptyToUndefined(
      z.iso
        .date("Must be YYYY-MM-DD")
        .transform((val) => new Date(val))
        .optional(),
    ),
    occupation: z.string().max(200).optional(),
  })
  .strict();

export const createCaseSchema = z
  .object({
    title: z.string().min(1).max(300),
    caseNumber: z.string().max(100).optional(),
    caseType: z.enum(CaseType).optional(),
  })
  .strict();

export const updateCaseSchema = z
  .object({
    title: emptyToUndefined(z.string().min(1).max(300).optional()),
    clientId: z.uuid().optional(),
    clientRole: z.enum(PartyRole).optional(),
    caseNumber: emptyToUndefined(z.string().max(100).optional()),
    caseType: z.enum(CaseType).optional(),
    filingDate: emptyToUndefined(
      z.iso
        .date("Must be YYYY-MM-DD")
        .transform((val) => new Date(val))
        .optional(),
    ),
    courtName: emptyToUndefined(z.string().max(200).optional()),
    courtType: z.enum(CourtType).optional(),
    courtState: emptyToUndefined(z.string().max(100).optional()),
    courtCity: emptyToUndefined(z.string().max(100).optional()),
    benchNumber: emptyToUndefined(z.string().max(50).optional()),
    judgeName: emptyToUndefined(z.string().max(200).optional()),
    judgeDesignation: emptyToUndefined(z.string().max(200).optional()),
    status: z.enum(CaseStatus).optional(),
    stage: z.enum(CaseStage).optional(),
    description: emptyToUndefined(z.string().optional()),
    priority: z.enum(Priority).optional(),
    oppositeParties: z.array(oppositePartySchema).optional(),
    tags: z.array(z.string().max(50)).optional(),
    assignedTo: z.uuid().nullable().optional(),
  })
  .strict();

export const listCasesQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(CaseStatus).optional(),
    caseType: z.enum(CaseType).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const caseParamsSchema = z.object({ id: z.uuid() }).strict();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;
