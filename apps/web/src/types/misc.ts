export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}
