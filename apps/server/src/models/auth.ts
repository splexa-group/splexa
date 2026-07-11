export interface RawJwtPayload {
  userId: string;
  orgId: string;
  role: string;
  iat?: number;
  exp?: number;
}
