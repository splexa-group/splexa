import type { LoginUser } from "@splexa-group/shared/models";

export interface VerifyOtpResponse {
  user: LoginUser;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  orgName: string;
  practiceTypes: string[];
  firmType: string;
  city: string;
  state: string;
}
