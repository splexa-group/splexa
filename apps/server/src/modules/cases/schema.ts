import {
  CaseStage,
  CaseStatus,
  CaseType,
  ClientType,
  CourtType,
  PartyRole,
  Priority,
} from "@splexa-group/shared/enums";
import { z } from "zod";

const oppositePartySchema = z
  .object({
    name: z.string().min(1).max(200),
    role: z.enum(PartyRole),
    advocateName: z.string().max(200).optional(),
    advocatePhone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
  })
  .strict();

const newClientSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().min(7).max(20),
    type: z.enum(ClientType),
  })
  .strict();

export const createCaseSchema = z
  .object({
    title: z.string().min(1).max(300),
    clientRole: z.enum(PartyRole),
    clientId: z.string().uuid().optional(),
    newClient: newClientSchema.optional(),
    caseNumber: z.string().max(100).optional(),
    caseType: z.enum(CaseType).optional(),
    filingDate: z.string().datetime({ offset: true }).optional(),
    courtName: z.string().max(200).optional(),
    courtType: z.enum(CourtType).optional(),
    courtState: z.string().max(100).optional(),
    courtCity: z.string().max(100).optional(),
    benchNumber: z.string().max(50).optional(),
    judgeName: z.string().max(200).optional(),
    judgeDesignation: z.string().max(200).optional(),
    status: z.enum(CaseStatus).default(CaseStatus.Active),
    stage: z.enum(CaseStage).optional(),
    priority: z.enum(Priority).optional(),
    oppositeParties: z.array(oppositePartySchema).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    assignedTo: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasClientId = !!data.clientId;
    const hasNewClient = !!data.newClient;
    if (hasClientId && hasNewClient) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either clientId or newClient, not both",
        path: ["clientId"],
      });
    }
    if (!hasClientId && !hasNewClient) {
      ctx.addIssue({
        code: "custom",
        message: "Either clientId or newClient is required",
        path: ["clientId"],
      });
    }
  });

export const updateCaseSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    clientRole: z.enum(PartyRole).optional(),
    caseNumber: z.string().max(100).optional(),
    caseType: z.enum(CaseType).optional(),
    filingDate: z.string().datetime({ offset: true }).optional(),
    courtName: z.string().max(200).optional(),
    courtType: z.enum(CourtType).optional(),
    courtState: z.string().max(100).optional(),
    courtCity: z.string().max(100).optional(),
    benchNumber: z.string().max(50).optional(),
    judgeName: z.string().max(200).optional(),
    judgeDesignation: z.string().max(200).optional(),
    status: z.enum(CaseStatus).optional(),
    stage: z.enum(CaseStage).optional(),
    priority: z.enum(Priority).optional(),
    oppositeParties: z.array(oppositePartySchema).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  })
  .strict();

export const listCasesQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(CaseStatus).optional(),
    caseType: z.enum(CaseType).optional(),
    priority: z.enum(Priority).optional(),
    courtType: z.enum(CourtType).optional(),
    clientId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const caseParamsSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type ListCasesQuery = z.infer<typeof listCasesQuerySchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;
