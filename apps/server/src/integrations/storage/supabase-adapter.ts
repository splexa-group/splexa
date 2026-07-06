import { createClient } from "@supabase/supabase-js";

import type { StorageProvider } from "./storage-interface";

export class SupabaseStorageAdapter implements StorageProvider {
  private storage;
  private bucket: string;

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    const client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
    this.storage = client.storage;
    this.bucket = bucket;
  }

  async upload(key: string, body: Uint8Array, mimeType: string): Promise<void> {
    const { error } = await this.storage.from(this.bucket).upload(key, body, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) throw error;
  }

  async presignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresInSeconds);
    if (error || !data) throw error ?? new Error("Failed to create signed URL");
    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.storage.from(this.bucket).remove([key]);
    if (error) throw error;
  }
}
