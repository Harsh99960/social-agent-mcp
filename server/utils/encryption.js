import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

/**
 * @name encrypt
 * @description Encrypt sensitive data before storing it
 * @route Utility function
 * @access Internal
 */
export function encrypt(text) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * @name decrypt
 * @description Decrypt stored sensitive data
 * @route Utility function
 * @access Internal
 */
export function decrypt(encryptedText) {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

    const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}