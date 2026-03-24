# DecentraSend Architecture

## Table of Contents

- [System Overview](#system-overview)
- [Module Breakdown](#module-breakdown)
- [Upload Flow](#upload-flow)
- [Download Flow](#download-flow)
- [Encryption Scheme Details](#encryption-scheme-details)
- [IPFS Integration](#ipfs-integration)
- [URL Scheme](#url-scheme)
- [Design Decisions and Tradeoffs](#design-decisions-and-tradeoffs)
- [Future Architecture Considerations](#future-architecture-considerations)

---

## System Overview

DecentraSend is a client-heavy web application. The browser performs all cryptographic operations, constructs the encrypted payload, and communicates directly with IPFS infrastructure. The static app server is a dumb file host with no application logic.

```
                         DecentraSend Architecture
                         =========================

  SENDER BROWSER                                      RECIPIENT BROWSER
 +-------------------+                               +-------------------+
 |                   |                               |                   |
 | 1. Select file    |                               | 6. Open link      |
 | 2. Generate key   |                               | 7. Parse fragment  |
 | 3. Encrypt file   |                               |    (CID + key)    |
 | 4. Upload to IPFS |                               | 8. Fetch from IPFS|
 |                   |                               | 9. Decrypt file   |
 +--------+----------+                               | 10. Download file |
          |                                          +--------+----------+
          |                                                   ^
          v                                                   |
 +--------+--------------------------------------------------+----------+
 |                        IPFS NETWORK                                   |
 |                                                                       |
 |  +-------------+    +-----------+    +-----------+    +------------+  |
 |  | Pinata API  |    | Pinata    |    | ipfs.io   |    | dweb.link  |  |
 |  | (upload)    |    | Gateway   |    | Gateway   |    | Gateway    |  |
 |  +-------------+    +-----------+    +-----------+    +------------+  |
 |                                                                       |
 +-----------------------------------------------------------------------+
          ^                                                   ^
          |              ONLY CIPHERTEXT                      |
          |              PASSES THROUGH                       |
          |              THIS BOUNDARY                        |
          |                                                   |
 +--------+---------------------------------------------------+----------+
 |                     SHAREABLE LINK                                     |
 |          https://decentrasend.app/#/d/{CID}/{base64url-key}          |
 |                                                                       |
 |          Fragment (after #) NEVER sent to any server                  |
 +-----------------------------------------------------------------------+
```

### Key Properties

- **Serverless application logic.** The app server serves only static HTML, CSS, and JS. It has no API endpoints, no database, and no server-side processing.
- **End-to-end encryption.** Plaintext never leaves the browser. The IPFS network stores only ciphertext.
- **Content-addressed storage.** Files are identified by the SHA-256 hash of their ciphertext (the IPFS CID), not by any server-assigned identifier.

---

## Module Breakdown

The application is organized into three core modules, each with a single responsibility.

### `crypto.js` -- Encryption and Decryption

| Responsibility | Details |
|---|---|
| Key generation | Generates a 256-bit random key using `crypto.getRandomValues()` |
| IV generation | Generates a 96-bit random IV using `crypto.getRandomValues()` |
| Payload construction | Assembles the plaintext payload: `[meta-length][meta-json][file-bytes]` |
| Encryption | Encrypts the payload using AES-256-GCM via `crypto.subtle.encrypt()` |
| Blob assembly | Prepends the IV to the ciphertext: `[IV][ciphertext]` |
| Decryption | Splits blob into IV and ciphertext, decrypts via `crypto.subtle.decrypt()` |
| Metadata extraction | Parses the decrypted payload to recover filename, MIME type, and file bytes |
| Key encoding | Converts raw key bytes to/from base64url for embedding in URLs |

**External dependencies:** None. Uses only the Web Crypto API.

### `ipfs.js` -- IPFS Communication

| Responsibility | Details |
|---|---|
| Upload | Sends the encrypted blob to Pinata's pinning API via HTTP POST (multipart/form-data) |
| Download | Fetches the encrypted blob from IPFS gateways via HTTP GET |
| Gateway fallback | Attempts multiple gateways in sequence if the primary fails |
| CID handling | Receives and returns the CID string from Pinata's API response |

**External dependencies:** Pinata API (JWT-authenticated), public IPFS gateways.

### `app.js` -- UI and Orchestration

| Responsibility | Details |
|---|---|
| File input handling | Reads the selected file as an `ArrayBuffer` via the FileReader API |
| Upload orchestration | Calls `crypto.js` to encrypt, then `ipfs.js` to upload, then constructs the shareable link |
| Download orchestration | Parses the URL fragment, calls `ipfs.js` to fetch, then `crypto.js` to decrypt |
| URL routing | Reads `window.location.hash` to detect download mode (`#/d/...`) vs. upload mode |
| Progress feedback | Updates the UI with status messages during upload/download |
| Link presentation | Displays the shareable link and provides copy-to-clipboard functionality |

**External dependencies:** DOM APIs.

### Module Dependency Graph

```
+----------+       +----------+
|  app.js  | ----> | crypto.js|
|          | ----> | ipfs.js  |
+----------+       +----------+
                   (crypto.js and ipfs.js are independent of each other)
```

`app.js` is the only module that depends on the other two. `crypto.js` and `ipfs.js` have no knowledge of each other and can be tested or replaced independently.

---

## Upload Flow

The following describes the complete upload flow, step by step, with the data transformations at each stage.

### Step 1: File Selection

```
User selects file via <input type="file">
  -> File object { name: "report.pdf", type: "application/pdf", size: 1048576 }
```

The file is read into an `ArrayBuffer` using `FileReader.readAsArrayBuffer()`.

### Step 2: Metadata Construction

```
meta = JSON.stringify({ name: "report.pdf", type: "application/pdf" })
  -> '{"name":"report.pdf","type":"application/pdf"}'
  -> UTF-8 encode -> Uint8Array (47 bytes)

metaLength = new Uint32Array([47])
  -> 4 bytes, little-endian
```

### Step 3: Plaintext Payload Assembly

```
plaintext = [metaLength (4 bytes)][metaBytes (47 bytes)][fileBytes (1048576 bytes)]
  -> Total: 1,048,627 bytes
```

This concatenation ensures the filename and MIME type are encrypted alongside the file contents, inside a single atomic encryption operation.

### Step 4: Key and IV Generation

```
key = crypto.getRandomValues(new Uint8Array(32))   // 256 bits
iv  = crypto.getRandomValues(new Uint8Array(12))    // 96 bits
```

### Step 5: AES-256-GCM Encryption

```
cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"])
ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext)
  -> Uint8Array (1,048,627 + 16 bytes GCM tag = 1,048,643 bytes)
```

### Step 6: Encrypted Blob Assembly

```
blob = [iv (12 bytes)][ciphertext (1,048,643 bytes)]
  -> Total: 1,048,655 bytes
```

The IV is prepended in the clear. This is safe because the IV is not secret -- it only needs to be unique (which is guaranteed by random generation with a fresh key).

### Step 7: Upload to IPFS via Pinata

```
POST https://api.pinata.cloud/pinning/pinFileToIPFS
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
Body: blob (as unnamed file)

Response: { IpfsHash: "QmXyz..." }
  -> CID = "QmXyz..."
```

### Step 8: Shareable Link Construction

```
base64urlKey = base64url(key)   // 43 characters (256 bits -> base64url)
link = `${window.location.origin}/#/d/${CID}/${base64urlKey}`
  -> "https://decentrasend.app/#/d/QmXyz.../abc123...def"
```

### Step 9: Link Presentation

The link is displayed to the user and a copy-to-clipboard button is provided. At this point, the plaintext file, the key, and the IV exist only in browser memory.

---

## Download Flow

### Step 1: URL Fragment Parsing

```
hash = window.location.hash
  -> "#/d/QmXyz.../abc123...def"

parts = hash.split("/")
  -> ["#", "d", "QmXyz...", "abc123...def"]

CID = parts[2]
base64urlKey = parts[3]
key = base64urlDecode(base64urlKey)   // -> Uint8Array (32 bytes)
```

### Step 2: Fetch Encrypted Blob from IPFS

The application attempts to fetch the ciphertext from multiple gateways in order:

```
Gateway 1: https://gateway.pinata.cloud/ipfs/QmXyz...
Gateway 2: https://ipfs.io/ipfs/QmXyz...
Gateway 3: https://dweb.link/ipfs/QmXyz...

Response: ArrayBuffer (1,048,655 bytes)
```

If the first gateway fails (timeout, HTTP error, network error), the next gateway is tried. This provides resilience against gateway downtime.

### Step 3: Blob Splitting

```
iv         = blob.slice(0, 12)          // First 12 bytes
ciphertext = blob.slice(12)             // Remaining bytes
```

### Step 4: AES-256-GCM Decryption

```
cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"])
plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext)
  -> Uint8Array (1,048,627 bytes)
```

If the key is incorrect or the ciphertext has been tampered with, `decrypt()` throws a `DOMException` with the message "The operation failed for an operation-specific reason." This is the GCM authentication tag verification failing.

### Step 5: Metadata Extraction

```
metaLength = new DataView(plaintext.buffer).getUint32(0, true)   // little-endian
  -> 47

metaBytes  = plaintext.slice(4, 4 + 47)
meta       = JSON.parse(new TextDecoder().decode(metaBytes))
  -> { name: "report.pdf", type: "application/pdf" }

fileBytes  = plaintext.slice(4 + 47)
  -> Uint8Array (1,048,576 bytes)
```

### Step 6: File Download

```
blob = new Blob([fileBytes], { type: meta.type })
url  = URL.createObjectURL(blob)

<a href="{url}" download="{meta.name}">   // Programmatically clicked
  -> Browser downloads "report.pdf"

URL.revokeObjectURL(url)   // Clean up
```

---

## Encryption Scheme Details

### Payload Format

The encrypted blob stored on IPFS has the following binary layout:

```
+--------+---------------------------------------------------------------+
| Offset | Field                                                         |
+--------+---------------------------------------------------------------+
| 0      | IV (12 bytes) -- plaintext, used as nonce for AES-GCM        |
+--------+---------------------------------------------------------------+
| 12     | Ciphertext (variable length) -- AES-256-GCM encrypted payload |
|        |   +--------------------------------------------------------+ |
|        |   | Plaintext payload (before encryption):                  | |
|        |   | +----------------------------------------------------+ | |
|        |   | | meta-length (4 bytes, uint32 LE)                    | | |
|        |   | +----------------------------------------------------+ | |
|        |   | | meta-json (meta-length bytes, UTF-8)                | | |
|        |   | | e.g. {"name":"file.txt","type":"text/plain"}        | | |
|        |   | +----------------------------------------------------+ | |
|        |   | | file-bytes (remaining bytes)                        | | |
|        |   | +----------------------------------------------------+ | |
|        |   +--------------------------------------------------------+ |
+--------+---------------------------------------------------------------+
| Last   | GCM Authentication Tag (16 bytes) -- appended by Web Crypto   |
| 16 B   | API as part of the ciphertext output                          |
+--------+---------------------------------------------------------------+
```

### Size Overhead

For a file of size `F` bytes with metadata JSON of size `M` bytes:

```
Total blob size = 12 (IV) + 4 (meta-length) + M (meta-json) + F (file) + 16 (GCM tag)
                = F + M + 32 bytes
```

The overhead is negligible for any reasonably sized file.

### Why a Single Encryption Operation?

The metadata and file bytes are encrypted in a single `crypto.subtle.encrypt()` call rather than separately. This design choice provides:

1. **Atomicity.** Either all data (filename + contents) decrypts correctly, or none of it does. There is no state where the filename decrypts but the file does not.
2. **Simplicity.** One key, one IV, one ciphertext blob. No need for key derivation, nonce counters, or multi-part encryption coordination.
3. **Authentication coverage.** The GCM tag covers the entire payload, so tampering with either the metadata or the file bytes will cause authentication failure.

---

## IPFS Integration

### Upload: Pinata Pinning API

DecentraSend uses [Pinata](https://www.pinata.cloud/) as its IPFS pinning service. Pinata provides:

- **Persistent pinning.** Uploaded content is guaranteed to remain available as long as the pin is active.
- **HTTP API.** Simple REST API for uploading files, no need to run a local IPFS node.
- **CID generation.** Pinata returns the CID (Content Identifier) after upload.

**API call:**

```
POST https://api.pinata.cloud/pinning/pinFileToIPFS
Headers:
  Authorization: Bearer <PINATA_JWT>
  Content-Type: multipart/form-data
Body:
  file: <encrypted blob>
```

The JWT is stored in the client-side configuration. Note that this JWT is visible to anyone who inspects the JavaScript source -- this is an accepted tradeoff for a client-side application. The JWT should be scoped to pinning-only permissions.

### Download: Multi-Gateway Fallback

IPFS content is accessible through any gateway that can resolve the CID. DecentraSend queries multiple gateways to maximize availability:

```
Gateway Priority:
  1. gateway.pinata.cloud  -- Pinata's own gateway (fastest for Pinata-pinned content)
  2. ipfs.io               -- Protocol Labs' public gateway
  3. dweb.link             -- Cloudflare's IPFS gateway
```

**Fallback logic:**

```
for (const gateway of gateways) {
    try {
        const response = await fetch(`${gateway}/ipfs/${cid}`, { signal: AbortSignal.timeout(30000) });
        if (response.ok) return await response.arrayBuffer();
    } catch (err) {
        continue;  // Try next gateway
    }
}
throw new Error("All gateways failed");
```

Each gateway request has a 30-second timeout. If a gateway returns a non-200 status or times out, the next gateway is tried.

### CID Versioning

Pinata returns CIDv0 by default (base58-encoded, starting with `Qm`). The application treats the CID as an opaque string and does not depend on a specific CID version.

---

## URL Scheme

### Format

```
{origin}/#/d/{CID}/{base64url-key}
```

### Components

| Component | Example | Purpose |
|---|---|---|
| `{origin}` | `https://decentrasend.app` | The application's origin |
| `#` | `#` | Fragment delimiter -- everything after this is never sent to the server |
| `/d/` | `/d/` | Route identifier indicating download mode |
| `{CID}` | `QmXyz...` | IPFS Content Identifier for the encrypted blob |
| `{base64url-key}` | `abc123...def` | 256-bit encryption key, base64url-encoded (43 chars) |

### Base64url Encoding

The encryption key is encoded using **base64url** (RFC 4648, Section 5), which replaces `+` with `-` and `/` with `_`, and omits padding `=`. This ensures the key is safe to embed in a URL without percent-encoding.

### Example

```
https://decentrasend.app/#/d/QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX/dGhpcyBpcyBhIHRlc3Qga2V5IGZvciBkZW1v
                          ^  ^                                                  ^
                          |  |                                                  |
                       fragment  CID (46 chars, CIDv0)                    base64url key
                       delimiter                                          (43 chars)
```

---

## Design Decisions and Tradeoffs

### 1. Client-Side Encryption vs. Server-Side Encryption

**Decision:** All encryption happens in the browser.

**Rationale:** This eliminates the server as a trust requirement. Users do not need to trust the server operator with their plaintext data. The server is a static file host with no ability to access file contents.

**Tradeoff:** The application cannot enforce server-side policies (rate limiting encrypted content, scanning for malicious files, etc.). The application is also vulnerable to a compromised server serving malicious JavaScript.

### 2. Single Blob Encryption vs. Chunked Encryption

**Decision:** The entire file (plus metadata) is encrypted as a single blob.

**Rationale:** Simplicity and correctness. A single AES-GCM operation with one key and one IV is trivial to implement correctly. Chunked encryption requires nonce management, ordering guarantees, and careful handling of partial decryption.

**Tradeoff:** The entire file must fit in browser memory twice (plaintext + ciphertext). This limits practical file size to roughly half the available memory (typically 1-2 GB on desktop browsers, less on mobile).

### 3. Pinata Pinning vs. Running an IPFS Node

**Decision:** Use Pinata's HTTP API rather than running a full IPFS node in the browser.

**Rationale:** Running a full IPFS node (e.g., via js-ipfs/Helia) requires WebRTC/WebSocket transports, DHT participation, and significant bandwidth and CPU overhead. Pinata provides a reliable, low-latency pinning service accessible via a simple HTTP API.

**Tradeoff:** Dependency on a centralized service (Pinata) for uploads. If Pinata goes down or changes its API, uploads will fail. Downloads are resilient due to multi-gateway fallback.

### 4. Key in URL Fragment vs. Separate Key Exchange

**Decision:** Embed the encryption key directly in the URL fragment.

**Rationale:** Maximum simplicity. Users share a single link that contains everything needed to access the file. No secondary key exchange channel is required.

**Tradeoff:** The link is the single point of failure for security. Anyone who obtains the link can decrypt the file. There is no additional authentication layer.

### 5. No Authentication / No User Accounts

**Decision:** The application has no user accounts, sessions, or authentication.

**Rationale:** Aligns with the privacy-first mission. No user data is collected, no profiles are created, and no tracking is possible. The application is fully stateless.

**Tradeoff:** No access control beyond "knowing the link." No ability to revoke access, audit downloads, or enforce per-user policies.

### 6. GCM Tag Size: 128-bit

**Decision:** Use the default 128-bit GCM authentication tag (the Web Crypto API default).

**Rationale:** 128-bit tags provide the maximum forgery resistance that GCM offers. Shorter tags (96, 64, 32 bits) are allowed by the spec but reduce security.

**Tradeoff:** None significant. The 16-byte overhead per file is negligible.

---

## Future Architecture Considerations

### WebRTC Peer-to-Peer Transfer

**Concept:** Use WebRTC data channels to transfer the encrypted file directly from the sender's browser to the recipient's browser, bypassing IPFS entirely for real-time transfers.

```
Sender Browser <--- WebRTC DataChannel ---> Recipient Browser
     |                                            |
     +--- Encrypt locally                         +--- Decrypt locally
     +--- No IPFS upload needed                   +--- No IPFS download needed
```

**Benefits:**
- Zero server-side storage.
- Transfer speed limited only by the peers' bandwidth.
- True peer-to-peer with no intermediary.

**Challenges:**
- Requires both parties to be online simultaneously.
- WebRTC NAT traversal requires a STUN/TURN server.
- Falls back to IPFS for asynchronous transfers (sender goes offline before recipient downloads).

**Hybrid approach:** Use WebRTC when both parties are online, fall back to IPFS pinning for asynchronous transfers.

### Streaming Encryption for Large Files

**Concept:** Replace the single-blob AES-GCM encryption with a streaming/chunked approach to support files larger than available memory.

**Approach:**

```
File (10 GB)
  -> Split into 1 MB chunks
  -> Each chunk encrypted with AES-GCM using:
       Key:   same key for all chunks
       Nonce: base_iv + chunk_index (counter-based nonce derivation)
  -> Chunks uploaded individually to IPFS
  -> A manifest (encrypted) lists all chunk CIDs in order
  -> Shareable link points to the manifest CID
```

**Benefits:**
- Support for arbitrarily large files.
- Memory usage bounded by chunk size, not file size.
- Individual chunks can be downloaded and decrypted in parallel.

**Challenges:**
- Nonce management must be rigorous to prevent nonce reuse.
- The manifest introduces ordering dependencies.
- Partial downloads become possible (is this a feature or a risk?).
- More complex implementation increases the attack surface.

**Reference:** See the STREAM construction (as used in age encryption, libsodium secretstream) for a well-analyzed chunked AEAD scheme.

### Helia In-Browser IPFS Node

**Concept:** Replace the Pinata HTTP API with [Helia](https://github.com/ipfs/helia), the modern modular IPFS implementation for JavaScript, running directly in the browser.

```
Sender Browser (Helia node)
  -> Encrypted blob added to local Helia blockstore
  -> Helia announces CID to DHT via WebRTC/WebSocket
  -> Other IPFS nodes can discover and fetch the content

Recipient Browser (Helia node)
  -> Resolves CID via DHT
  -> Fetches blocks from peers (including sender if still online)
  -> Decrypts locally
```

**Benefits:**
- Fully decentralized -- no dependency on Pinata or any centralized pinning service.
- Content can be served directly from the sender's browser to the recipient's browser via IPFS bitswap.
- True censorship resistance.

**Challenges:**
- Browser IPFS nodes cannot use TCP -- limited to WebRTC and WebSocket transports.
- DHT participation requires persistent connectivity; content may become unavailable if the sender closes their browser and no other node has pinned it.
- Significant JavaScript bundle size increase.
- Higher battery and bandwidth consumption on mobile devices.

**Hybrid approach:** Use Helia for peer discovery and direct transfer when possible, with Pinata as a reliable fallback pinning service for availability guarantees.

### Additional Future Considerations

- **Optional passphrase protection.** Wrap the encryption key with a passphrase-derived key (Argon2id + AES-KW). The link would contain only the CID, and the recipient would need to enter the passphrase to derive the unwrapping key.
- **File expiration and auto-unpin.** Integrate with Pinata's unpin API to automatically remove content after a configurable TTL.
- **Multi-file archives.** Encrypt and upload multiple files as a single payload with a directory manifest, enabling folder sharing.
- **Progress indicators for large files.** Use `ReadableStream` and `TransformStream` to provide real-time progress during encryption, upload, download, and decryption.
- **Service Worker caching.** Cache the application shell in a Service Worker for offline access and faster subsequent loads.
- **End-to-end integrity verification.** Provide a separate hash of the plaintext that the recipient can verify after decryption, independent of GCM authentication.

---

*This document was last updated on 2026-03-24. For questions or suggestions, open an issue or contact the maintainers.*
