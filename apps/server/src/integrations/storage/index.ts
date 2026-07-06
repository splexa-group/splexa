import { env } from "@/config/env";

import { R2Adapter } from "./r2-adapter";
import type { StorageProvider } from "./storage-interface";
import { SupabaseStorageAdapter } from "./supabase-adapter";

function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "supabase": {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
        throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET are required when STORAGE_PROVIDER=supabase");
      }
      return new SupabaseStorageAdapter(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        env.SUPABASE_STORAGE_BUCKET,
      );
    }
    case "r2":
    default: {
      if (!env.R2_BUCKET || !env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
        throw new Error("R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=r2");
      }
      return new R2Adapter();
    }
  }
}

export const storageProvider = createStorageProvider();
