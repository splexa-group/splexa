import type { ImportantDateType } from "../enums";

export interface ImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  createdAt: string;
}
