import { Buffer } from "node:buffer";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/config/env";

import type { StorageProvider } from "./storage-interface";

export class R2Adapter implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    // Guard is enforced by the factory in storage/index.ts before R2Adapter is instantiated
    this.bucket = env.R2_BUCKET as string;
    this.client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT as string,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async upload(key: string, body: Uint8Array, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(body),
        ContentType: mimeType,
      }),
    );
  }

  async presignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
