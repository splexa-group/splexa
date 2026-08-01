import { Designation, PracticeType } from "@splexa-group/shared/enums";
import { z } from "zod";

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    practiceTypes: z.array(z.enum(PracticeType)).min(1),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phoneNumber: z.string().min(1).max(20),
    designation: z.enum(Designation),
  })
  .strict();

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
