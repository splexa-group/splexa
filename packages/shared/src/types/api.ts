import type { Designation, PracticeType, UserRole } from "../enums";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface WithWarnings<T> {
  data: T;
  warnings?: string[];
}

export interface AuthTokenResponse {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    orgId: string;
  };
}

export interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  designation: Designation;
  emailVerified: boolean;
  org: {
    id: string;
    name: string;
    practiceType: PracticeType;
    city: string;
  };
}

export interface SessionResponse {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
}
