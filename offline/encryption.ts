/**
 * Offline Exam System - Encryption Utility
 *
 * Handles encryption and decryption of sensitive data stored offline.
 * Uses Web Crypto API for secure client-side encryption.
 */

import { OFFLINE_CONFIG } from "./config";

/**
 * Generate a secure encryption key for AES-GCM encryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Export encryption key to store in IndexedDB
 */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey("jwk", key);
}

/**
 * Import encryption key from IndexedDB
 */
export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a Blob using AES-GCM encryption
 */
export async function encryptBlob(blob: Blob, key: CryptoKey): Promise<Blob> {
  if (!OFFLINE_CONFIG.encryptionEnabled) {
    return blob;
  }

  try {
    // Convert blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      arrayBuffer,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return as Blob
    return new Blob([combined], { type: "application/octet-stream" });
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a Blob using AES-GCM encryption
 */
export async function decryptBlob(
  encryptedBlob: Blob,
  key: CryptoKey,
  originalType: string = "image/jpeg",
): Promise<Blob> {
  if (!OFFLINE_CONFIG.encryptionEnabled) {
    return encryptedBlob;
  }

  try {
    // Convert blob to ArrayBuffer
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Extract IV (first 12 bytes)
    const iv = data.slice(0, 12);

    // Extract encrypted data (remaining bytes)
    const encryptedData = data.slice(12);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData,
    );

    // Return as Blob with original type
    return new Blob([decryptedData], { type: originalType });
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt a string using AES-GCM encryption
 */
export async function encryptString(text: string, key: CryptoKey): Promise<string> {
  if (!OFFLINE_CONFIG.encryptionEnabled) {
    return text;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data,
    );

    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("❌ String encryption failed:", error);
    throw new Error("Failed to encrypt string");
  }
}

/**
 * Decrypt a string using AES-GCM encryption
 */
export async function decryptString(encryptedText: string, key: CryptoKey): Promise<string> {
  if (!OFFLINE_CONFIG.encryptionEnabled) {
    return encryptedText;
  }

  try {
    // Base64 decode
    const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("❌ String decryption failed:", error);
    throw new Error("Failed to decrypt string");
  }
}
