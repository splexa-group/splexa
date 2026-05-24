import type { ImportantDateType } from "../enums";

export interface ImportantDateSummary {
  id: string;
  dateType: ImportantDateType;
  date: string;
  description?: string | null;
  sourceId?: string | null;
  createdAt: string;
}
