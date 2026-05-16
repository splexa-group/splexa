import { AuthUser } from "./user";

export interface VerifyOtpResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  orgName: string;
  practiceType: string;
  city: string;
}
