/**
 * DecentraSend — Client-side encryption module
 * AES-256-GCM via Web Crypto API
 * Zero-knowledge: keys never leave the browser
 */

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return new Uint8Array(raw)
}

export async function importKey(rawBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

export async function encryptFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ encrypted: Uint8Array; key: CryptoKey }> {
  const key = await generateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const meta = JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
  })
  const metaBytes = new TextEncoder().encode(meta)
  const metaLen = new Uint8Array(4)
  new DataView(metaLen.buffer).setUint32(0, metaBytes.length, false)

  const fileBytes = new Uint8Array(await file.arrayBuffer())

  const plaintext = new Uint8Array(4 + metaBytes.length + fileBytes.length)
  plaintext.set(metaLen, 0)
  plaintext.set(metaBytes, 4)
  plaintext.set(fileBytes, 4 + metaBytes.length)

  onProgress?.(30)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )

  onProgress?.(60)

  const encrypted = new Uint8Array(12 + ciphertext.byteLength)
  encrypted.set(iv, 0)
  encrypted.set(new Uint8Array(ciphertext), 12)

  onProgress?.(80)

  return { encrypted, key }
}

export async function decryptFile(
  encryptedBytes: Uint8Array,
  rawKeyBytes: Uint8Array,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; meta: { name: string; type: string; size: number } }> {
  const key = await importKey(rawKeyBytes)

  onProgress?.(20)

  const iv = encryptedBytes.slice(0, 12)
  const ciphertext = encryptedBytes.slice(12)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  onProgress?.(60)

  const plain = new Uint8Array(plaintext)
  const metaLen = new DataView(plain.buffer, plain.byteOffset).getUint32(0, false)
  const metaJson = new TextDecoder().decode(plain.slice(4, 4 + metaLen))
  const meta = JSON.parse(metaJson)
  const fileBytes = plain.slice(4 + metaLen)

  onProgress?.(90)

  return {
    blob: new Blob([fileBytes], { type: meta.type }),
    meta,
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function fromBase64Url(b64: string): Uint8Array {
  const str = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i)
  }
  return bytes
}
