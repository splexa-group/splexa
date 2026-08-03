export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export type DeadlineUrgency = "overdue" | "soon" | null;
