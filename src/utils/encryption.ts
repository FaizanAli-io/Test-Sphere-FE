const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generates a deterministic encryption key based on submission ID
 * This ensures the same key is used for a specific test session
 */
async function getEncryptionKey(submissionId: number): Promise<{
  key: CryptoKey;
  salt: Uint8Array;
}> {
  // Use submission ID as part of the password for deterministic key generation
  const password = `proctoring-${submissionId}-${process.env.NEXT_PUBLIC_ENCRYPTION_SALT || "default-salt"}`;

  // Generate a deterministic salt based on submission ID
  const encoder = new TextEncoder();
  const saltSource = encoder.encode(`salt-${submissionId}`);
  const saltHash = await crypto.subtle.digest("SHA-256", saltSource);
  const salt = new Uint8Array(saltHash).slice(0, 16);

  const key = await deriveKey(password, salt);
  return { key, salt };
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: unknown, submissionId: number): Promise<string> {
  try {
    const { key } = await getEncryptionKey(submissionId);

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Convert data to string and encode
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const encodedData = encoder.encode(dataString);

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
      },
      key,
      encodedData,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts data encrypted with encryptData
 */
export async function decryptData<T = unknown>(
  encryptedString: string,
  submissionId: number,
): Promise<T> {
  try {
    const { key } = await getEncryptionKey(submissionId);

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedString), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
      },
      key,
      encryptedData,
    );

    // Decode and parse
    const decoder = new TextDecoder();
    const dataString = decoder.decode(decryptedData);
    return JSON.parse(dataString) as T;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypts a batch of logs
 */
export async function encryptLogs(logs: unknown[], submissionId: number): Promise<string[]> {
  return Promise.all(logs.map((log) => encryptData(log, submissionId)));
}

/**
 * Decrypts a batch of logs
 */
export async function decryptLogs<T = unknown>(
  encryptedLogs: string[],
  submissionId: number,
): Promise<T[]> {
  return Promise.all(encryptedLogs.map((log) => decryptData<T>(log, submissionId)));
}
