import { z } from "zod";

export { signupSchema, otpRequestSchema, otpVerifySchema } from "@splexa-group/shared/schemas";
export type {
  SignupInput,
  OtpRequestInput,
  OtpVerifyInput,
} from "@splexa-group/shared/schemas";

export const sessionParamsSchema = z.object({
  id: z.uuid(),
});

export type SessionParams = z.infer<typeof sessionParamsSchema>;
