import type { ImportantDateType } from "@splexa-group/shared/enums";

export interface ImportantDate {
  id: string;
  caseId: string;
  dateType: ImportantDateType;
  date: string;
  description: string | null;
  createdAt: string;
}

export interface CreateImportantDateInput {
  dateType: ImportantDateType;
  date: string;
  description?: string;
}

export interface UpdateImportantDateInput {
  dateType?: ImportantDateType;
  date?: string;
  description?: string;
}
