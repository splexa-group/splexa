import { GET, PATCH } from "@/api/http";
import type {
  OrganizationResponse,
  ProfileResponse,
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "@/types/settings";

export const settingsApi = {
  getProfile:         () => GET<ProfileResponse>("/settings/profile"),
  updateProfile:      (data: UpdateProfileInput) => PATCH<ProfileResponse>("/settings/profile", data),
  getOrganization:    () => GET<OrganizationResponse>("/settings/organization"),
  updateOrganization: (data: UpdateOrganizationInput) => PATCH<OrganizationResponse>("/settings/organization", data),
};
