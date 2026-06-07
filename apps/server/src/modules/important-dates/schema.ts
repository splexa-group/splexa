import { ImportantDateType } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType),
    date: z.string().datetime({ offset: true }),
    description: z.string().max(500).optional(),
  })
  .strict();

export const updateImportantDateSchema = z
  .object({
    dateType: z.enum(ImportantDateType).optional(),
    date: z.string().datetime({ offset: true }).optional(),
    description: z.string().max(500).optional(),
  })
  .strict();

export const importantDateParamsSchema = z
  .object({
    caseId: z.string().uuid(),
    dateId: z.string().uuid(),
  })
  .strict();

export const caseParamsSchema = z
  .object({
    caseId: z.string().uuid(),
  })
  .strict();

export type CreateImportantDateInput = z.infer<typeof createImportantDateSchema>;
export type UpdateImportantDateInput = z.infer<typeof updateImportantDateSchema>;
export type ImportantDateParams = z.infer<typeof importantDateParamsSchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;
