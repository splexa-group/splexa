import { HearingPurpose, HearingStatus } from "@splexa-group/shared/enums";
import { z } from "zod";

export const createHearingSchema = z
  .object({
    date: z.iso.datetime({ offset: true }),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
      .optional(),
    purpose: z.enum(HearingPurpose).optional(),
    status: z.enum(HearingStatus).optional(),
    notes: z.string().max(2000).optional(),
    judgePresent: z.string().max(200).optional(),
  })
  .strict();

export const updateHearingSchema = z
  .object({
    date: z.iso.datetime({ offset: true }).optional(),
    // "" is accepted deliberately — the repository treats it as "clear the time"
    time: z
      .string()
      .refine(
        (val) => val === "" || /^\d{2}:\d{2}$/.test(val),
        "Time must be HH:MM",
      )
      .optional(),
    status: z.enum(HearingStatus).optional(),
    notes: z.string().max(2000).optional(),
    nextDate: z.iso.datetime({ offset: true }).optional(),
    adjournmentReason: z.string().max(500).optional(),
    judgePresent: z.string().max(200).optional(),
    purpose: z.enum(HearingPurpose).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === HearingStatus.ADJOURNED && !data.nextDate) {
      ctx.addIssue({
        code: "custom",
        message: "nextDate is required when status is Adjourned",
        path: ["nextDate"],
      });
    }
  });

export const caseHearingParamsSchema = z
  .object({
    caseId: z.uuid(),
  })
  .strict();

export const hearingParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export type CreateHearingInput = z.infer<typeof createHearingSchema>;
export type UpdateHearingInput = z.infer<typeof updateHearingSchema>;
export type CaseHearingParams = z.infer<typeof caseHearingParamsSchema>;
export type HearingParams = z.infer<typeof hearingParamsSchema>;
