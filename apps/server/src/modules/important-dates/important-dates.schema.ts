import { ImportantDateType } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createImportantDateSchema = z
  .object({
    dateType: z
      .enum(ImportantDateType)
      .exclude([ImportantDateType.HEARING_DATE]),
    date: z.iso.datetime({ offset: true }).transform((val) => new Date(val)),
    description: z.string().max(500).optional(),
  })
  .strict();

export const updateImportantDateSchema = z
  .object({
    dateType: z
      .enum(ImportantDateType)
      .exclude([ImportantDateType.HEARING_DATE])
      .optional(),
    date: z.iso
      .datetime({ offset: true })
      .transform((val) => new Date(val))
      .optional(),
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

export type CreateImportantDateInput = z.infer<
  typeof createImportantDateSchema
>;
export type UpdateImportantDateInput = z.infer<
  typeof updateImportantDateSchema
>;
export type ImportantDateParams = z.infer<typeof importantDateParamsSchema>;
export type CaseParams = z.infer<typeof caseParamsSchema>;
