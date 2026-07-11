import { ImportantDateType } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType),
    date: z.iso.datetime({ offset: true }),
    description: z.string().max(500).optional(),
  })
  .strict();

export const updateImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType).optional(),
    date: z.iso.datetime({ offset: true }).optional(),
    description: z.string().max(500).optional(),
  })
  .strict();

export const importantDateParamsSchema = z
  .object({
    caseId: z.uuid(),
    dateId: z.uuid(),
  })
  .strict();

export const caseParamsSchema = z
  .object({
    caseId: z.uuid(),
  })
  .strict();

export type CreateImportantDateInput = z.infer<typeof createImportantDateSchema>;
export type UpdateImportantDateInput = z.infer<typeof updateImportantDateSchema>;
export type ImportantDateParams = z.infer<typeof importantDateParamsSchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;

export const listImportantDatesQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
  })
  .strict();

export type ListImportantDatesQuery = z.infer<typeof listImportantDatesQuerySchema>;
