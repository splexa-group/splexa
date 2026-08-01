import type { FirmType, PracticeType, States } from "../enums";

export interface Organization {
  id: string;
  name: string;
  practiceTypes: PracticeType[];
  firmType: FirmType;
  city: string;
  state: States;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
