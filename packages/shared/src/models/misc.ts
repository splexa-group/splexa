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
