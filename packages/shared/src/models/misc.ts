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

export interface FormatIndianDateOptions {
  includeWeekday?: boolean;
  includeYear?: boolean;
}

export type RelativeDateLabel = "Overdue" | "Today" | "Tomorrow";
