import { AuthUser } from "./user";

export interface VerifyOtpResponse {
  user: AuthUser;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  orgName: string;
  practiceTypes: string[];
  city: string;
}
