# DecentraSend API Reference

Developer documentation for DecentraSend's three JavaScript modules. All modules use ES module syntax (`import`/`export`) and run entirely in the browser.

---

## Table of Contents

- [crypto.js — Client-Side Encryption](#cryptojs--client-side-encryption)
  - [generateKey()](#generatekey)
  - [exportKey(key)](#exportkeykey)
  - [importKey(rawBytes)](#importkeyrawbytes)
  - [encryptFile(file, onProgress)](#encryptfilefile-onprogress)
  - [decryptFile(encryptedBytes, rawKeyBytes, onProgress)](#decryptfileencryptedbytes-rawkeybytes-onprogress)
  - [toBase64Url(bytes)](#tobase64urlbytes)
  - [fromBase64Url(b64)](#frombase64urlb64)
- [ipfs.js — IPFS Upload and Download](#ipfsjs--ipfs-upload-and-download)
  - [uploadToIPFS(encryptedBytes, apiKey, onProgress)](#uploadtoipfsencryptedbytes-apikey-onprogress)
  - [downloadFromIPFS(cid, onProgress)](#downloadfromipfscid-onprogress)
  - [testPinataKey(apiKey)](#testpinatakeyapikey)
- [app.js — Main Application Flow](#appjs--main-application-flow)

---

## crypto.js -- Client-Side Encryption

**Path**: `public/js/crypto.js`

Handles all cryptographic operations using the browser's native Web Crypto API. Implements AES-256-GCM encryption with zero-knowledge design — keys never leave the browser.

### Constants

```javascript
const CHUNK_SIZE = 1024 * 1024; // 1 MB — reserved for future chunked encryption
```

---

### generateKey()

Generates a random AES-256-GCM encryption key.

**Signature**:

```javascript
async function generateKey(): Promise<CryptoKey>
```

**Parameters**: None

**Returns**: `Promise<CryptoKey>` — An extractable AES-256-GCM key with `encrypt` and `decrypt` usages.

**Example**:

```javascript
import { generateKey } from "./crypto.js";

const key = await generateKey();
// key is a CryptoKey object usable with Web Crypto API
```

**Details**:
- Uses `crypto.subtle.generateKey()` with `{ name: "AES-GCM", length: 256 }`.
- The key is **extractable** (`true`) so it can be exported and embedded in the share URL.
- A new key is generated for every file — keys are never reused.

---

### exportKey(key)

Exports a CryptoKey to raw bytes for URL embedding.

**Signature**:

```javascript
async function exportKey(key: CryptoKey): Promise<Uint8Array>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `key` | `CryptoKey` | An AES-256-GCM key (must be extractable) |

**Returns**: `Promise<Uint8Array>` — 32 bytes (256 bits) of raw key material.

**Example**:

```javascript
import { generateKey, exportKey, toBase64Url } from "./crypto.js";

const key = await generateKey();
const rawBytes = await exportKey(key);
const keyString = toBase64Url(rawBytes);
// keyString can be embedded in a URL fragment
```

**Details**:
- Uses `crypto.subtle.exportKey("raw", key)`.
- Output is always exactly 32 bytes for AES-256.

---

### importKey(rawBytes)

Imports raw key bytes back into a CryptoKey for decryption.

**Signature**:

```javascript
async function importKey(rawBytes: Uint8Array): Promise<CryptoKey>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `rawBytes` | `Uint8Array` | 32 bytes of raw AES-256 key material |

**Returns**: `Promise<CryptoKey>` — A non-extractable AES-256-GCM key with `decrypt` usage only.

**Example**:

```javascript
import { importKey, fromBase64Url } from "./crypto.js";

const rawBytes = fromBase64Url(keyStringFromUrl);
const key = await importKey(rawBytes);
// key can now be used for decryption
```

**Details**:
- Uses `crypto.subtle.importKey("raw", ...)`.
- The imported key is **non-extractable** (`false`) — it can only be used for decryption, adding an extra layer of safety on the recipient side.
- Only `["decrypt"]` usage is permitted.

---

### encryptFile(file, onProgress)

Encrypts a file with AES-256-GCM. Bundles file metadata (name, type, size) into the encrypted payload so even filenames are hidden.

**Signature**:

```javascript
async function encryptFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ encrypted: Uint8Array, key: CryptoKey }>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `file` | `File` | A browser File object (from `<input type="file">` or drag-and-drop) |
| `onProgress` | `(percent: number) => void` | Optional callback receiving progress percentage (0-100). Called at ~30% (encoding done), ~60% (encryption done), ~80% (packaging done). |

**Returns**: `Promise<{ encrypted: Uint8Array, key: CryptoKey }>` — The encrypted payload and the AES key used.

**Example**:

```javascript
import { encryptFile, exportKey, toBase64Url } from "./crypto.js";

const fileInput = document.querySelector("#file-input");
const file = fileInput.files[0];

const { encrypted, key } = await encryptFile(file, (pct) => {
  console.log(`Encrypting: ${pct}%`);
});

const rawKey = await exportKey(key);
const keyB64 = toBase64Url(rawKey);
// encrypted is ready for IPFS upload
// keyB64 goes in the share URL
```

**Encrypted Payload Format**:

```
[12-byte IV][AES-256-GCM ciphertext]
```

Where the plaintext before encryption is structured as:

```
[4-byte metadata length (big-endian uint32)][JSON metadata][file bytes]
```

The metadata JSON contains:

```json
{
  "name": "document.pdf",
  "type": "application/pdf",
  "size": 1048576
}
```

**Details**:
- Generates a new random key via `generateKey()`.
- Generates a random 12-byte IV via `crypto.getRandomValues()`.
- File metadata is encrypted along with the content — IPFS nodes cannot see filenames or MIME types.
- The IV is prepended to the ciphertext (not encrypted, as required by AES-GCM).

---

### decryptFile(encryptedBytes, rawKeyBytes, onProgress)

Decrypts an encrypted payload back into the original file with its metadata.

**Signature**:

```javascript
async function decryptFile(
  encryptedBytes: Uint8Array,
  rawKeyBytes: Uint8Array,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob, meta: { name: string, type: string, size: number } }>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `encryptedBytes` | `Uint8Array` | The encrypted payload (as downloaded from IPFS) |
| `rawKeyBytes` | `Uint8Array` | 32 bytes of raw AES-256 key material (decoded from the URL) |
| `onProgress` | `(percent: number) => void` | Optional callback receiving progress percentage. Called at ~20% (key imported), ~60% (decrypted), ~90% (parsed). |

**Returns**: `Promise<{ blob: Blob, meta: object }>` where:
- `blob` — A `Blob` containing the decrypted file content with the correct MIME type.
- `meta` — An object with `name` (string), `type` (string), and `size` (number) from the original file.

**Example**:

```javascript
import { decryptFile, fromBase64Url } from "./crypto.js";
import { downloadFromIPFS } from "./ipfs.js";

const encrypted = await downloadFromIPFS(cid);
const rawKey = fromBase64Url(keyB64FromUrl);

const { blob, meta } = await decryptFile(encrypted, rawKey, (pct) => {
  console.log(`Decrypting: ${pct}%`);
});

// Trigger browser download
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = meta.name;
a.click();
URL.revokeObjectURL(url);
```

**Throws**: `DOMException` if the key is incorrect or the data is corrupted (AES-GCM authentication fails).

---

### toBase64Url(bytes)

Encodes a `Uint8Array` to a URL-safe Base64 string (no padding).

**Signature**:

```javascript
function toBase64Url(bytes: Uint8Array): string
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `bytes` | `Uint8Array` | The bytes to encode |

**Returns**: `string` — Base64URL-encoded string (uses `-` and `_` instead of `+` and `/`, no `=` padding).

**Example**:

```javascript
import { toBase64Url } from "./crypto.js";

const bytes = new Uint8Array([72, 101, 108, 108, 111]);
const encoded = toBase64Url(bytes);
// encoded === "SGVsbG8"
```

**Details**:
- Standard Base64 with `+` replaced by `-`, `/` replaced by `_`, and trailing `=` removed.
- Safe for use in URL fragments, query parameters, and filenames.
- This is a synchronous function (not async).

---

### fromBase64Url(b64)

Decodes a Base64URL string back to a `Uint8Array`.

**Signature**:

```javascript
function fromBase64Url(b64: string): Uint8Array
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `b64` | `string` | A Base64URL-encoded string |

**Returns**: `Uint8Array` — The decoded bytes.

**Example**:

```javascript
import { fromBase64Url } from "./crypto.js";

const bytes = fromBase64Url("SGVsbG8");
// bytes === Uint8Array([72, 101, 108, 108, 111])
```

**Details**:
- Reverses `toBase64Url()` by replacing `-` with `+` and `_` with `/` before decoding.
- This is a synchronous function (not async).

---

## ipfs.js -- IPFS Upload and Download

**Path**: `public/js/ipfs.js`

Handles uploading encrypted files to IPFS via the Pinata pinning API, and downloading them with multi-gateway fallback for reliability.

### Constants

```javascript
const PINATA_API_URL = "https://api.pinata.cloud";

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];
```

---

### uploadToIPFS(encryptedBytes, apiKey, onProgress)

Uploads encrypted bytes to IPFS by pinning them via the Pinata API.

**Signature**:

```javascript
async function uploadToIPFS(
  encryptedBytes: Uint8Array,
  apiKey: string,
  onProgress?: (percent: number) => void
): Promise<string>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `encryptedBytes` | `Uint8Array` | The encrypted file payload from `encryptFile()` |
| `apiKey` | `string` | A Pinata JWT (JSON Web Token) for authentication |
| `onProgress` | `(percent: number) => void` | Optional callback. Called at ~10% (upload started) and 100% (complete). |

**Returns**: `Promise<string>` — The IPFS CID (Content Identifier) string for the pinned file.

**Example**:

```javascript
import { uploadToIPFS } from "./ipfs.js";

const cid = await uploadToIPFS(encryptedBytes, pinataJwt, (pct) => {
  console.log(`Uploading: ${pct}%`);
});
// cid === "bafybeig..." (CIDv1 string)
```

**Throws**: `Error` with message `Pinata upload failed (STATUS): BODY` if the Pinata API returns a non-OK response.

**Details**:
- Uploads as `application/octet-stream` with filename `encrypted.bin`.
- Sets Pinata metadata name to `decentrasend-{timestamp}`.
- Uses CID version 1 (`cidVersion: 1`) for modern, self-describing content identifiers.
- Authentication is via the `Authorization: Bearer <JWT>` header.

---

### downloadFromIPFS(cid, onProgress)

Downloads a file from IPFS using multi-gateway fallback. Tries each gateway in order, with a 30-second timeout per gateway.

**Signature**:

```javascript
async function downloadFromIPFS(
  cid: string,
  onProgress?: (percent: number) => void
): Promise<Uint8Array>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `cid` | `string` | The IPFS Content Identifier (CID) of the file |
| `onProgress` | `(percent: number) => void` | Optional callback. Reports 5% (started), 10-30% (trying gateways), 20-95% (download progress), 100% (complete). |

**Returns**: `Promise<Uint8Array>` — The raw encrypted bytes from IPFS.

**Example**:

```javascript
import { downloadFromIPFS } from "./ipfs.js";

const encryptedBytes = await downloadFromIPFS(cid, (pct) => {
  console.log(`Downloading: ${pct}%`);
});
// encryptedBytes is ready for decryptFile()
```

**Throws**: `Error` with message `All IPFS gateways failed. The file may not be pinned or gateways are down.` if every gateway fails.

**Details**:
- Tries gateways in order: Pinata, dweb.link, Cloudflare IPFS, ipfs.io.
- Each gateway has a 30-second timeout via `AbortController`.
- If the response supports streaming (`response.body`), progress is tracked based on `Content-Length`.
- Falls back to `response.arrayBuffer()` if streaming is not available.
- Failed gateways log a warning to the console and the next gateway is tried automatically.

---

### testPinataKey(apiKey)

Validates a Pinata API key by calling the Pinata authentication test endpoint.

**Signature**:

```javascript
async function testPinataKey(apiKey: string): Promise<boolean>
```

**Parameters**:

| Name | Type | Description |
|---|---|---|
| `apiKey` | `string` | A Pinata JWT to validate |

**Returns**: `Promise<boolean>` — `true` if the key is valid, `false` otherwise.

**Example**:

```javascript
import { testPinataKey } from "./ipfs.js";

const isValid = await testPinataKey(userInputJwt);
if (!isValid) {
  alert("Invalid API key. Check your Pinata JWT.");
}
```

**Details**:
- Calls `GET https://api.pinata.cloud/data/testAuthentication` with the JWT in the `Authorization` header.
- Returns `response.ok` (true for 200 status, false otherwise).
- Does not throw on invalid keys — returns `false` instead.

---

## app.js -- Main Application Flow

**Path**: `public/js/app.js`

The main application module that wires together `crypto.js` and `ipfs.js` with the DOM. This module is not designed as a reusable library — it is the glue layer for the DecentraSend UI.

### Overview

The app has two main flows:

#### Upload Flow

```
User drops file
  → encryptFile(file)          // crypto.js
  → uploadToIPFS(encrypted)    // ipfs.js
  → exportKey(key)             // crypto.js
  → toBase64Url(rawKey)        // crypto.js
  → Build share link: {origin}#/d/{cid}/{keyB64}
  → Display link to user
```

#### Download Flow

```
User visits #/d/{cid}/{keyB64}
  → Parse CID and key from URL hash
  → downloadFromIPFS(cid)      // ipfs.js
  → fromBase64Url(keyB64)      // crypto.js
  → decryptFile(encrypted, rawKey) // crypto.js
  → Trigger browser download with original filename
```

### URL Format

Share links follow this format:

```
https://your-domain.com/#/d/{cid}/{base64url-encoded-key}
```

- `#/d/` — Route prefix indicating a download link.
- `{cid}` — IPFS Content Identifier (CIDv1).
- `{base64url-encoded-key}` — The 256-bit AES key encoded as Base64URL.

The `#` fragment is critical: browsers **never** send the fragment to the server in HTTP requests. This is what makes the architecture zero-knowledge.

### State Management

The app stores exactly one piece of state persistently:

```javascript
let pinataApiKey = localStorage.getItem("pinata_api_key") || "";
```

The Pinata JWT is saved to `localStorage` on successful validation and restored on page load.

### Internal Functions

These functions are not exported and are internal to the app module:

| Function | Purpose |
|---|---|
| `saveApiKey()` | Validates and saves the Pinata JWT to localStorage |
| `showUploadArea()` | Transitions UI from setup to upload view |
| `setupDropZone()` | Initializes drag-and-drop event handlers |
| `handleFileSelect(e)` | Handles file selection from the input element |
| `processFile(file)` | Orchestrates the full encrypt-upload-share flow |
| `updateProgress(step, pct, label)` | Updates upload progress bars in the UI |
| `resetUpload()` | Resets the upload UI to initial state |
| `checkForDownloadLink()` | Parses the URL hash for a download link on page load |
| `handleDownload()` | Orchestrates the full download-decrypt-save flow |
| `updateDlProgress(pct, label)` | Updates download progress bar in the UI |
| `copyShareLink()` | Copies the share link to clipboard |
| `formatFileSize(bytes)` | Formats bytes to human-readable string (e.g., "4.2 MB") |
| `showToast(message, type)` | Displays a temporary notification toast |

### Integration Example

If you want to build a custom UI on top of DecentraSend's modules, you can import `crypto.js` and `ipfs.js` directly:

```javascript
import { encryptFile, exportKey, toBase64Url, fromBase64Url, decryptFile } from "./crypto.js";
import { uploadToIPFS, downloadFromIPFS, testPinataKey } from "./ipfs.js";

// Upload flow
async function sendFile(file, pinataJwt) {
  const { encrypted, key } = await encryptFile(file);
  const cid = await uploadToIPFS(encrypted, pinataJwt);
  const rawKey = await exportKey(key);
  const keyB64 = toBase64Url(rawKey);
  return { cid, keyB64 };
}

// Download flow
async function receiveFile(cid, keyB64) {
  const encrypted = await downloadFromIPFS(cid);
  const rawKey = fromBase64Url(keyB64);
  const { blob, meta } = await decryptFile(encrypted, rawKey);
  return { blob, meta };
}
```

---

*Last updated: 2026-03-24. For questions, open a GitHub issue.*
