# DecentraSend Security Documentation

## Table of Contents

- [Security Model Overview](#security-model-overview)
- [Threat Model](#threat-model)
- [Encryption Details](#encryption-details)
- [URL Fragment Security](#url-fragment-security)
- [Metadata Privacy](#metadata-privacy)
- [What Is NOT Protected](#what-is-not-protected)
- [Responsible Disclosure Policy](#responsible-disclosure-policy)
- [Known Limitations](#known-limitations)

---

## Security Model Overview

DecentraSend is built on a **zero-knowledge architecture**. The server (and all intermediary infrastructure) never has access to plaintext file contents, filenames, or encryption keys. The entire encryption and decryption lifecycle happens exclusively in the user's browser using the Web Crypto API.

### Core Principles

1. **Client-side encryption only.** Files are encrypted before they leave the browser. The server receives only opaque ciphertext.
2. **Key never touches the network.** The encryption key is encoded into the URL fragment (`#`), which is never transmitted to any server per RFC 3986.
3. **No accounts, no sessions, no tracking.** There is no user identity layer. The application is stateless from the server's perspective.
4. **Content-addressed storage.** Files are stored on IPFS, identified by their CID (Content Identifier). The CID is derived from the ciphertext, not the plaintext, so it reveals nothing about the original file.

### Trust Boundaries

```
+---------------------+       +---------------------+       +------------------+
|   User's Browser    | ----> |   Pinata / IPFS     | ----> |   Recipient's    |
| (encryption happens |       |   (stores only      |       |   Browser        |
|  here, key stays    |       |    ciphertext)       |       | (decryption      |
|  here)              |       |                     |       |  happens here)   |
+---------------------+       +---------------------+       +------------------+
         |                                                           ^
         |              Shareable Link                               |
         +------- origin/#/d/{CID}/{base64url-key} ----------------+
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                  Fragment never sent to any server
```

The only component that ever sees plaintext is the browser of the sender and the browser of the recipient. Every other participant in the system -- the app server, IPFS pinning services, IPFS gateways, network intermediaries -- sees only ciphertext.

---

## Threat Model

The following table enumerates attacker types, what they can observe, and what DecentraSend's design protects against.

| Attacker Type | What They Can Observe | What They CANNOT Access | Residual Risk |
|---|---|---|---|
| **Network Observer** (ISP, Wi-Fi sniffer, corporate proxy) | TLS-encrypted traffic to/from the app server and IPFS gateways. Timing and size of uploads/downloads. | Plaintext file contents, filename, encryption key (key is in URL fragment, never sent over the wire). | Traffic analysis can reveal that a transfer occurred and approximate file size. |
| **IPFS Node Operator** (any node pinning or caching the CID) | The raw ciphertext blob. The CID of the ciphertext. | Plaintext file contents, filename, encryption key. The CID is derived from ciphertext, so it cannot be correlated to original file content. | If the same plaintext is encrypted twice, different keys produce different ciphertext and different CIDs, preventing deduplication attacks. |
| **Gateway Operator** (e.g., Pinata gateway, ipfs.io, dweb.link) | The ciphertext being served. HTTP request metadata (IP, User-Agent, timing). The CID being requested. | Plaintext file contents, filename, encryption key (fragment is not included in HTTP requests). | Gateway operator knows which CIDs are popular and can correlate IP addresses to CID requests. |
| **App Server Compromise** (attacker gains full control of the web server) | Can serve malicious JavaScript to future visitors. Can observe access logs (but fragments are not logged). Static assets only. | Encryption keys for previously shared links (keys were never sent to the server). Plaintext of previously uploaded files. | **Critical risk:** A compromised server can serve modified JS that exfiltrates keys. This is the most significant threat. See [Known Limitations](#known-limitations). |
| **Link Interceptor** (attacker who obtains the full shareable link) | The CID and the encryption key (both are in the URL). Can download and decrypt the file. | Nothing -- they have full access to that specific file. | This is by design. The link IS the access credential. Protecting the link is the user's responsibility. |

---

## Encryption Details

### Algorithm: AES-256-GCM

DecentraSend uses **AES-256-GCM** (Galois/Counter Mode), a symmetric authenticated encryption algorithm.

| Parameter | Value | Purpose |
|---|---|---|
| Algorithm | AES-GCM | Authenticated encryption with associated data (AEAD) |
| Key size | 256 bits (32 bytes) | Encryption key, generated per file |
| IV (Initialization Vector) | 96 bits (12 bytes) | Nonce for GCM mode, generated randomly per encryption |
| Authentication tag | 128 bits (16 bytes) | Integrity tag, appended to ciphertext by Web Crypto API |

### Why AES-256-GCM?

- **Authenticated encryption.** GCM provides both confidentiality and integrity. Any tampering with the ciphertext will cause decryption to fail with an authentication error, preventing bit-flipping and oracle attacks.
- **Browser-native performance.** AES-GCM is hardware-accelerated via AES-NI on most modern CPUs and is a first-class citizen of the Web Crypto API.
- **Industry standard.** AES-256-GCM is used in TLS 1.3, SSH, and is approved by NIST (SP 800-38D) for classified data.

### Key Generation

```
Key = crypto.getRandomValues(new Uint8Array(32))   // 256 bits of CSPRNG output
IV  = crypto.getRandomValues(new Uint8Array(12))    // 96 bits of CSPRNG output
```

Keys are generated using the browser's **cryptographically secure pseudorandom number generator** (CSPRNG) via `crypto.getRandomValues()`. This sources entropy from the operating system's entropy pool (`/dev/urandom` on Linux/macOS, `BCryptGenRandom` on Windows).

### Web Crypto API

All cryptographic operations use the [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/), a W3C standard implemented natively in all modern browsers. This provides several advantages:

- **No JavaScript crypto libraries.** Avoids the well-documented pitfalls of implementing cryptography in JavaScript (timing side-channels, garbage collector exposing key material, etc.).
- **Native code execution.** Crypto operations run in the browser's native (C/C++/Rust) crypto stack, not in the JS engine.
- **Non-extractable keys (optional).** The Web Crypto API supports marking keys as non-extractable, preventing accidental exposure through the JS console.

### IV Uniqueness Guarantee

AES-GCM requires that an IV is **never reused** with the same key. Since DecentraSend generates a fresh random key for every file, IV reuse across files is cryptographically irrelevant. Even within a single key, the probability of a 96-bit IV collision is negligible (birthday bound: ~2^48 encryptions before concern).

---

## URL Fragment Security

### How It Works

DecentraSend encodes the CID and encryption key into the URL **fragment** (the portion after the `#` character):

```
https://decentrasend.app/#/d/QmXyz.../base64url-encoded-key
```

### Why Fragments Are Safe: RFC 3986

Per [RFC 3986, Section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5):

> The fragment identifier component of a URI allows indirect identification of a secondary resource... **the fragment identifier is not used in the scheme-specific processing of a URI; instead, the fragment identifier is separated from the rest of the URI prior to a dereference.**

In practical terms, this means:

1. **Browsers never send the fragment to the server.** When the browser requests `https://example.com/path#fragment`, the HTTP request contains only `GET /path`. The `#fragment` portion is stripped before the request is sent.
2. **Fragments do not appear in server logs.** Since they are never transmitted, they cannot be logged by web servers, reverse proxies, CDNs, or load balancers.
3. **Fragments do not appear in the `Referer` header.** Per the HTTP specification, the fragment is excluded from the `Referer` (sic) header sent to third-party resources.
4. **Fragments are processed client-side only.** The browser's JavaScript can read `window.location.hash`, but no network request ever includes it.

### Verification

You can verify this behavior by inspecting network traffic in the browser's DevTools Network tab. The fragment will not appear in any outgoing HTTP request.

### Caveat

Browser extensions, malware, or compromised JavaScript can read `window.location.hash`. See [What Is NOT Protected](#what-is-not-protected).

---

## Metadata Privacy

### Filename Encryption

DecentraSend encrypts the filename **inside** the encrypted payload, not as a separate field. The payload format is:

```
[IV (12 bytes)][Ciphertext of: [meta-length (4 bytes)][meta-json][file-bytes]]
```

The `meta-json` object contains the filename and MIME type. Because this metadata is part of the encrypted payload, it is invisible to anyone who does not possess the decryption key.

### No UnixFS Path Exposure

When files are added to IPFS normally, the filename becomes part of the UnixFS directory structure and is visible to anyone who retrieves the CID. DecentraSend avoids this by uploading the encrypted blob as a single unnamed block, ensuring no filename or directory structure is exposed in the IPFS DAG.

### What Metadata IS Visible

Even with encryption, certain metadata is inherently visible:

- **Ciphertext size.** An observer can infer the approximate original file size (ciphertext size = plaintext size + small constant overhead for IV, metadata, and GCM tag).
- **Upload/download timestamps.** Network observers and IPFS gateway operators can see when a CID is uploaded or requested.
- **CID.** The content identifier is public. Anyone who knows the CID can retrieve the ciphertext (but not decrypt it).

---

## What Is NOT Protected

DecentraSend's security model has explicit boundaries. The following scenarios are **outside** the protection scope:

### 1. Link Sharing Channel

The shareable link contains the encryption key. If the link is shared over an insecure channel (e.g., unencrypted email, SMS, a public chat room), anyone who intercepts the link can decrypt the file. **DecentraSend does not protect the link itself -- that is the user's responsibility.**

Recommendation: Share links over end-to-end encrypted channels (Signal, WhatsApp, encrypted email).

### 2. Browser Compromise

If the user's browser is compromised (malware, malicious extensions, XSS on the page), the attacker can:

- Read `window.location.hash` to obtain the encryption key.
- Intercept plaintext before encryption or after decryption.
- Exfiltrate key material to an external server.

### 3. Compromised Application Server

If an attacker gains control of the server hosting DecentraSend's static files, they can serve modified JavaScript that exfiltrates encryption keys. This is the most fundamental limitation of any browser-based zero-knowledge system.

Mitigations (partial):
- Subresource Integrity (SRI) hashes can pin known-good script versions.
- Users can self-host or audit the open-source code.
- Future: reproducible builds and signed releases.

### 4. Recipient Behavior

Once the recipient decrypts and downloads a file, DecentraSend has no control over what they do with it. There is no DRM, no expiration enforcement client-side, and no revocation mechanism for files already downloaded.

### 5. IPFS Content Persistence

Files pinned on IPFS may persist indefinitely across the network. Even if a pin is removed from the original pinning service, other nodes may have cached or re-pinned the content. The ciphertext remains opaque without the key, but it cannot be guaranteed to be deleted from all IPFS nodes.

### 6. Side-Channel Attacks

- **Timing attacks** on the Web Crypto API are mitigated by the browser's native implementation but cannot be fully ruled out in all environments.
- **Memory forensics:** After decryption, plaintext may remain in browser memory until garbage collected. Closing the tab does not guarantee immediate memory clearing.

---

## Responsible Disclosure Policy

We take security seriously. If you discover a vulnerability in DecentraSend, please report it responsibly.

### How to Report

1. **Email:** Send a detailed report to **security@decentrasend.app** (or open a private security advisory on GitHub if email is not available).
2. **Include:**
   - A description of the vulnerability.
   - Steps to reproduce.
   - Potential impact assessment.
   - Suggested fix (if you have one).
3. **Do NOT** open a public GitHub issue for security vulnerabilities.

### Our Commitment

- We will acknowledge your report within **48 hours**.
- We will provide an initial assessment within **7 days**.
- We will work with you to understand and resolve the issue.
- We will credit you in the security advisory (unless you prefer to remain anonymous).
- We will not take legal action against researchers who act in good faith.

### Scope

The following are in scope for responsible disclosure:

- Encryption key leakage (to server, third parties, or logs).
- Bypasses of the zero-knowledge architecture.
- Cross-site scripting (XSS) that could exfiltrate keys.
- Vulnerabilities in the cryptographic implementation.
- IPFS-related privacy leaks (e.g., filename exposure).

The following are **out of scope**:

- Social engineering attacks.
- Denial-of-service attacks against IPFS infrastructure.
- Issues in third-party dependencies (report these upstream, but do let us know).
- Physical access attacks on the user's device.

---

## Known Limitations

| Limitation | Description | Potential Mitigation |
|---|---|---|
| **Single-key link sharing** | The encryption key is embedded in the URL. Anyone with the link has full access. | Future: add optional passphrase layer (PBKDF2/Argon2 derived key wrapping the file key). |
| **No forward secrecy** | If a key is compromised, all copies of the ciphertext (on any IPFS node) can be decrypted. | Key wrapping with ephemeral keys; time-limited pinning. |
| **No file expiration** | Files on IPFS may persist beyond the intended sharing period. | Implement unpinning API; note that unpinning only removes the pin from the pinning service, not from all IPFS caches. |
| **Trust-on-first-use for JS** | Users must trust that the served JavaScript has not been tampered with on every page load. | SRI tags, reproducible builds, browser extension for hash verification, self-hosting. |
| **Large file memory pressure** | The entire file must be read into memory for encryption/decryption (no streaming). | Future: streaming encryption with chunked AES-GCM (requires careful nonce management). |
| **No access revocation** | Once a link is shared, access cannot be revoked (the CID and key are immutable). | Introduce an access-control proxy layer (at the cost of adding a trusted intermediary). |
| **Browser entropy quality** | Key security depends on the browser's CSPRNG quality. On exotic or outdated platforms, entropy may be weak. | Warn users on browsers that do not support `crypto.getRandomValues()`. |

---

*This document was last updated on 2026-03-24. For questions or concerns, open an issue or contact the maintainers.*
