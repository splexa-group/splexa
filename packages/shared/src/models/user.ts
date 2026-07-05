import type { Designation, UserRole } from "../enums";
import type { Organization } from "./organization";

export interface AuthUser {
  userId: string;
  orgId: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: Designation;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  org: Pick<Organization, "id" | "name" | "practiceTypes" | "city">;
}

// Minimal user returned at OTP verification — narrower than UserProfile,
// which is only available after a full GET /auth/me fetch.
export interface LoginUser {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}
