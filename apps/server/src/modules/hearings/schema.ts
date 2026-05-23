import { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createHearingSchema = z
  .object({
    date: z.string().datetime({ offset: true }),
    purpose: z.enum(HearingPurpose).optional(),
    notes: z.string().max(2000).optional(),
    judgePresent: z.string().max(200).optional(),
  })
  .strict();

export const updateHearingSchema = z
  .object({
    status: z.enum(HearingStatus).optional(),
    notes: z.string().max(2000).optional(),
    nextDate: z.string().datetime({ offset: true }).optional(),
    adjournmentReason: z.string().max(500).optional(),
    judgePresent: z.string().max(200).optional(),
    purpose: z.enum(HearingPurpose).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === HearingStatus.Adjourned && !data.nextDate) {
      ctx.addIssue({
        code: "custom",
        message: "nextDate is required when status is Adjourned",
        path: ["nextDate"],
      });
    }
  });

export const caseHearingParamsSchema = z
  .object({
    caseId: z.string().uuid(),
  })
  .strict();

export const hearingParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const listHearingsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    status: z.enum(HearingStatus).optional(),
    caseId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type CreateHearingInput = z.infer<typeof createHearingSchema>;
export type UpdateHearingInput = z.infer<typeof updateHearingSchema>;
export type CaseHearingParams = z.infer<typeof caseHearingParamsSchema>;
export type HearingParams = z.infer<typeof hearingParamsSchema>;
export type ListHearingsQuery = z.infer<typeof listHearingsQuerySchema>;
