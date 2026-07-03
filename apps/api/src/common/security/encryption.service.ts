import { createCipheriv, createHash, randomBytes } from "crypto";

import { Injectable } from "@nestjs/common";

import { AppConfigService } from "../../config/app-config.service";

@Injectable()
export class EncryptionService {
  constructor(private readonly appConfigService: AppConfigService) {}

  encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const key = this.getKey();
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
      ":"
    );
  }

  decrypt(cipherText: string): string {
    const [ivBase64, authTagBase64, encryptedBase64] = cipherText.split(":");
    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      throw new Error("Invalid encrypted payload format.");
    }

    const key = this.getKey();
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const encrypted = Buffer.from(encryptedBase64, "base64");

    const decipher = require("crypto").createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }

  private getKey(): Buffer {
    return createHash("sha256").update(this.appConfigService.appEncryptionKey, "utf8").digest();
  }
}
