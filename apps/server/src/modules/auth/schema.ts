import {
  signupSchema,
  otpRequestSchema,
  otpVerifySchema,
} from "@splexa-group/shared/schemas";
import { z } from "zod";

export const sessionParamsSchema = z.object({
  id: z.uuid(),
});

export type SessionParams = z.infer<typeof sessionParamsSchema>;
export type SignupBody = z.infer<typeof signupSchema>;
export type OtpRequestBody = z.infer<typeof otpRequestSchema>;
export type OtpVerifyBody = z.infer<typeof otpVerifySchema>;
