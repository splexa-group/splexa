import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { settingsApi } from "@/services/settings";
import type { UpdateOrganizationInput, UpdateProfileInput } from "@/types/settings";

export const settingsKeys = {
  profile:      () => ["settings", "profile"]      as const,
  organization: () => ["settings", "organization"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn:  () => settingsApi.getProfile(),
    select:   (res) => res.data,
  });
}

export function useOrganization() {
  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn:  () => settingsApi.getOrganization(),
    select:   (res) => res.data,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => settingsApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.profile() });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile"),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationInput) => settingsApi.updateOrganization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.organization() });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update firm details"),
  });
}
