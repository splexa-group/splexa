import type { ImportantDateType } from "@splexa-group/shared/enums";
import type { ImportantDate } from "@splexa-group/shared/models";

export type { ImportantDate };

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
