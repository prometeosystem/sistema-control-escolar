import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";

type UploadTarget = {
  storagePath: string;
  bucket: string;
  uploadUrl: string;
  expiresAt: string;
  mode: "firebase" | "local-dev";
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private bucketName = "";
  private ready = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bucket: any = null;

  onModuleInit() {
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET ?? "";
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!this.bucketName || !projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        "Firebase Storage no configurado — modo local-dev (sin subida real a cloud)",
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require("firebase-admin") as typeof import("firebase-admin");
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket: this.bucketName,
        });
      }
      this.bucket = admin.storage().bucket(this.bucketName);
      this.ready = true;
      this.logger.log(`Firebase Storage listo: ${this.bucketName}`);
    } catch (error) {
      this.logger.error("No se pudo inicializar Firebase Admin", error as Error);
    }
  }

  isReady() {
    return this.ready;
  }

  getBucketName() {
    return this.bucketName || "local-dev-bucket";
  }

  buildStoragePath(userId: string, originalName: string, purpose: string) {
    const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    return `${purpose}/${userId}/${Date.now()}-${randomUUID()}-${safe}`;
  }

  async createUploadUrl(storagePath: string): Promise<UploadTarget> {
    const bucket = this.getBucketName();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (!this.ready || !this.bucket) {
      return {
        storagePath,
        bucket,
        uploadUrl: `local-dev://upload/${encodeURIComponent(storagePath)}`,
        expiresAt,
        mode: "local-dev",
      };
    }

    const [uploadUrl] = await this.bucket.file(storagePath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: "application/octet-stream",
    });

    return {
      storagePath,
      bucket,
      uploadUrl,
      expiresAt,
      mode: "firebase",
    };
  }

  async getSignedDownloadUrl(storagePath: string): Promise<string> {
    if (!this.ready || !this.bucket) {
      return `local-dev://download/${encodeURIComponent(storagePath)}`;
    }
    const [url] = await this.bucket.file(storagePath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });
    return url;
  }

  async delete(storagePath: string): Promise<void> {
    if (!this.ready || !this.bucket) return;
    await this.bucket.file(storagePath).delete({ ignoreNotFound: true });
  }

  async assertObjectExists(storagePath: string): Promise<boolean> {
    if (!this.ready || !this.bucket) {
      return true;
    }
    const [exists] = await this.bucket.file(storagePath).exists();
    return exists;
  }
}
