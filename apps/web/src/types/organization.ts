import type { Designation, FirmType, PracticeType, States, UserRole } from "@splexa-group/shared/enums";

export interface OrganizationData {
  id:            string;
  name:          string;
  city:          string;
  practiceTypes: PracticeType[];
  firmType:      FirmType;
  state:         States;
}

export interface UpdateOrganizationInput {
  name:          string;
  city:          string;
  practiceTypes: PracticeType[];
}

export interface ProfileData {
  id:          string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phoneNumber: string;
  designation: Designation;
  role:        UserRole;
}

export interface UpdateProfileInput {
  firstName:   string;
  lastName:    string;
  phoneNumber: string;
  designation: Designation;
}
