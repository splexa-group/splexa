import { env } from "@/config/env";

import { R2Adapter } from "./r2-adapter";
import type { StorageProvider } from "./storage-interface";

function createStorageProvider(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "r2":
    default:
      return new R2Adapter();
  }
}

export const storageProvider = createStorageProvider();
