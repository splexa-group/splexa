export interface StorageProvider {
  upload(key: string, body: Buffer, mimeType: string): Promise<void>;
  presignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
