import { z } from "zod";

import { Designation, PracticeType } from "../enums";

export const signupSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.email(),
    phoneNumber: z.string().min(7).max(20),
    designation: z.enum(Designation),
    orgName: z.string().min(1).max(200),
    practiceType: z.enum(PracticeType),
    city: z.string().min(1).max(100),
  })
  .strict();

export const otpRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export const otpVerifySchema = z
  .object({
    email: z.string().email(),
    otp: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  })
  .strict();

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
