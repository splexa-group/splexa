import type { Designation, UserRole } from "../enums";

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
}
