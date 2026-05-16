import type { PracticeType } from "../enums";

export interface Organization {
  id: string;
  name: string;
  practiceType: PracticeType;
  city: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
