/**
 * DecentraSend — Client-side encryption module
 * AES-256-GCM via Web Crypto API
 * Zero-knowledge: keys never leave the browser
 */

const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks for large files

/**
 * Generate a random AES-256-GCM key
 */
export async function generateKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can embed in URL
    ["encrypt", "decrypt"]
  );
}

/**
 * Export key to raw bytes
 */
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(raw);
}

/**
 * Import key from raw bytes
 */
export async function importKey(rawBytes) {
  return crypto.subtle.importKey(
    "raw",
    rawBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

/**
 * Encrypt a file. Returns { encrypted: Uint8Array, iv: Uint8Array, key: CryptoKey }
 * Embeds original filename + type in the encrypted payload for metadata privacy.
 */
export async function encryptFile(file, onProgress) {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Build payload: [4-byte meta length][meta JSON][file bytes]
  const meta = JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  const metaBytes = new TextEncoder().encode(meta);
  const metaLen = new Uint8Array(4);
  new DataView(metaLen.buffer).setUint32(0, metaBytes.length, false);

  const fileBytes = new Uint8Array(await file.arrayBuffer());

  // Combine: metaLen + meta + fileBytes
  const plaintext = new Uint8Array(4 + metaBytes.length + fileBytes.length);
  plaintext.set(metaLen, 0);
  plaintext.set(metaBytes, 4);
  plaintext.set(fileBytes, 4 + metaBytes.length);

  if (onProgress) onProgress(30); // encoding done

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  if (onProgress) onProgress(60); // encryption done

  // Final blob: [12-byte IV][ciphertext]
  const encrypted = new Uint8Array(12 + ciphertext.byteLength);
  encrypted.set(iv, 0);
  encrypted.set(new Uint8Array(ciphertext), 12);

  if (onProgress) onProgress(80);

  return { encrypted, key };
}

/**
 * Decrypt encrypted bytes. Returns { blob: Blob, meta: { name, type, size } }
 */
export async function decryptFile(encryptedBytes, rawKeyBytes, onProgress) {
  const key = await importKey(rawKeyBytes);

  if (onProgress) onProgress(20);

  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  if (onProgress) onProgress(60);

  const plain = new Uint8Array(plaintext);

  // Parse metadata
  const metaLen = new DataView(plain.buffer, plain.byteOffset).getUint32(0, false);
  const metaJson = new TextDecoder().decode(plain.slice(4, 4 + metaLen));
  const meta = JSON.parse(metaJson);

  // Extract file bytes
  const fileBytes = plain.slice(4 + metaLen);

  if (onProgress) onProgress(90);

  return {
    blob: new Blob([fileBytes], { type: meta.type }),
    meta,
  };
}

/**
 * Encode bytes to Base64URL (URL-safe, no padding)
 */
export function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode Base64URL to Uint8Array
 */
export function fromBase64Url(b64) {
  const str = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
