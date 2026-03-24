<div align="center">

# DecentraSend

### Zero-Knowledge Encrypted File Transfer Over IPFS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Stars](https://img.shields.io/github/stars/Husnain555/DecentraSend?style=social)](https://github.com/Husnain555/DecentraSend)
[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-f472b6.svg)](https://bun.sh)
[![IPFS](https://img.shields.io/badge/IPFS-powered-65c2cb.svg)](https://ipfs.io)

**A fully decentralized, privacy-first file sharing app. Files are encrypted in your browser, stored on IPFS, and only the recipient can decrypt them. No servers. No accounts. No tracking. Just private, peer-to-peer file transfer.**

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

<br/>

<img src="public/screenshot-placeholder.png" alt="DecentraSend Screenshot" width="700">

*Drop a file. Share a link. That's it.*

</div>

---

## Why DecentraSend?

Every day, billions of files are shared through services that can read, scan, and store your data indefinitely. **DecentraSend** is an open-source, decentralized file transfer tool that treats your privacy as non-negotiable. Files are encrypted with **AES-256-GCM** entirely in your browser before they ever leave your device. The decryption key lives only in the URL fragment (`#`), which by design is **never sent to any server**. The result? True zero-knowledge, end-to-end encrypted file sharing over the IPFS network — no backend, no accounts, no metadata leaks.

Whether you're a journalist protecting sources, a developer sharing sensitive configs, or anyone who believes file sharing shouldn't require surrendering your privacy — DecentraSend is built for you.

---

## Key Features

- **End-to-End Encrypted File Sharing** — AES-256-GCM encryption happens entirely client-side using the Web Crypto API. No plaintext ever leaves your browser.
- **True Zero-Knowledge Architecture** — The server never sees your files or encryption keys. The decryption key is stored in the URL fragment (`#`), which browsers never transmit to servers.
- **Decentralized Storage via IPFS** — Files are pinned to IPFS through Pinata, making them censorship-resistant and globally available through multiple gateways.
- **Multi-Gateway Fallback** — Automatic failover across multiple IPFS gateways ensures reliable downloads even if one gateway is slow or down.
- **No Accounts, No Tracking** — No sign-ups. No cookies. No analytics. Just encrypted file transfer.
- **Fully Static — No Backend** — The entire app is a static site. Deploy it anywhere: GitHub Pages, Netlify, Vercel, or your own server.
- **One-Click Sharing** — Drop a file, get a link. The recipient clicks the link and the file downloads and decrypts automatically.
- **Open Source & Auditable** — Every line of code is open for inspection. Trust is earned through transparency.

---

## How It Works

DecentraSend uses a simple but powerful workflow to deliver private, decentralized file transfer:

> **1. Drop Your File**
> Drag and drop (or select) any file into the browser. Everything happens locally on your device.

> **2. Client-Side Encryption**
> The app generates a random AES-256-GCM key using the Web Crypto API and encrypts your file entirely in the browser. The plaintext never leaves your machine.

> **3. Upload Ciphertext to IPFS**
> Only the encrypted ciphertext is uploaded to IPFS via Pinata pinning. The content is now decentralized and addressable by its CID (Content Identifier).

> **4. Generate a Shareable Link**
> A unique link is generated in the format: `https://app.example.com/#CID:ENCRYPTION_KEY`. The key is in the URL fragment — it is **never** sent to any server by the browser.

> **5. Recipient Opens the Link**
> The recipient's browser parses the CID and key from the URL fragment, fetches the ciphertext from IPFS gateways, decrypts it locally, and triggers a file download.

> **6. Zero Knowledge Maintained**
> At no point does any server, gateway, or third party have access to both the ciphertext and the decryption key. Privacy is guaranteed by design, not by policy.

---

## Security Model

Understanding exactly what each party in the system can and cannot access:

| Party | Sees Plaintext? | Sees Encryption Key? | Sees Ciphertext? | Sees Metadata? |
|---|---|---|---|---|
| **Your Browser** | Yes | Yes | Yes | Yes |
| **Recipient's Browser** | Yes | Yes | Yes | Yes |
| **Pinata (IPFS Pinning)** | No | No | Yes | CID only |
| **IPFS Gateways** | No | No | Yes | CID only |
| **Network Observers** | No | No | In transit | URL path only |
| **DecentraSend Server** | No | No | No | None |
| **DNS Provider** | No | No | No | Domain only |

> **Why is this secure?**
> The URL fragment (everything after `#`) is defined by [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) as client-only — browsers **never** include it in HTTP requests. This means the encryption key physically cannot reach any server, even by accident.

### Cryptographic Details

| Parameter | Value |
|---|---|
| Algorithm | AES-256-GCM |
| Key Size | 256 bits |
| IV / Nonce | 96-bit random (per encryption) |
| Auth Tag | 128 bits |
| Key Derivation | `crypto.getRandomValues()` via Web Crypto API |
| Key Transport | URL fragment (never sent to server) |

---

## Architecture

```
                          DecentraSend — Data Flow

  SENDER                                              RECIPIENT
  ══════                                              ═════════

  ┌─────────┐     AES-256-GCM      ┌──────────────┐
  │  File    │ ──── Encrypt ──────► │  Ciphertext   │
  │ (plain)  │    (in browser)      │  (encrypted)  │
  └─────────┘                       └──────┬───────┘
       │                                    │
       │ Key generated                      │ Upload via API
       │ (Web Crypto API)                   │
       ▼                                    ▼
  ┌─────────────┐                  ┌────────────────┐
  │ AES-256-GCM │                  │    Pinata       │
  │    Key       │                  │  IPFS Pinning   │
  └──────┬──────┘                  └───────┬────────┘
         │                                  │
         │ Stored in URL fragment (#)       │ Returns CID
         │ NEVER sent to any server         │
         ▼                                  ▼
  ┌──────────────────────────────────────────────────┐
  │                                                    │
  │   Shareable Link                                   │
  │   https://example.com/#<CID>:<AES-KEY>            │
  │                                                    │
  └────────────────────────┬─────────────────────────┘
                           │
                    Shared via any channel
                    (chat, email, QR, etc.)
                           │
                           ▼
                  ┌──────────────────┐
                  │ Recipient opens  │
                  │ link in browser  │
                  └────────┬─────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     ┌────────────────┐       ┌──────────────┐
     │ Parse CID from │       │ Parse KEY    │
     │ URL fragment   │       │ from fragment │
     └───────┬────────┘       └──────┬───────┘
             │                        │
             ▼                        │
     ┌────────────────────┐          │
     │ Fetch ciphertext   │          │
     │ from IPFS gateways │          │
     │ (multi-fallback)   │          │
     └───────┬────────────┘          │
             │                        │
             ▼                        ▼
     ┌──────────────────────────────────┐
     │  Decrypt in browser              │
     │  AES-256-GCM (Web Crypto API)   │
     └───────────────┬─────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Download     │
              │  original file│
              └──────────────┘
```

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) (v1.0+) or Node.js (v18+)
- A [Pinata](https://pinata.cloud) account (free tier works) for IPFS pinning

### Installation

```bash
# Clone the repository
git clone https://github.com/Husnain555/DecentraSend.git
cd decentrasend

# Install dependencies
bun install

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Configuration

Create a `.env` file or configure your Pinata API credentials in the app:

```bash
# .env (if applicable)
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

> **Note:** Pinata credentials are used only for uploading (pinning) encrypted files to IPFS. They never interact with your plaintext data or encryption keys.

### Deploy Anywhere

Since DecentraSend is a fully static site, deploy the `public/` directory to any static hosting provider:

```bash
# Netlify
netlify deploy --dir=public --prod

# Vercel
vercel --cwd public

# GitHub Pages
# Push the public/ folder to gh-pages branch

# Or just serve it yourself
npx serve public -s
```

---

## Comparison: DecentraSend vs Other File Sharing Tools

| Feature | DecentraSend | WeTransfer | Google Drive | Firefox Send | Magic Wormhole |
|---|---|---|---|---|---|
| **End-to-End Encryption** | AES-256-GCM | No | No | Yes | Yes |
| **Zero-Knowledge** | Yes | No | No | Yes | Yes |
| **Decentralized Storage** | Yes (IPFS) | No | No | No | No (direct) |
| **No Account Required** | Yes | Partial | No | Yes | Yes |
| **Open Source** | Yes | No | No | Discontinued | Yes |
| **No Server/Backend** | Yes | No | No | No | No |
| **Censorship Resistant** | Yes | No | No | No | Partial |
| **Works Offline (receive)** | Via IPFS cache | No | No | No | No |
| **File Size Limit** | Gateway dependent | 2 GB free | 15 GB free | 2.5 GB | Unlimited |
| **Privacy by Design** | Yes | No | No | Yes | Yes |
| **Self-Hostable** | Yes (static) | No | No | Yes (archived) | Yes |
| **Active Development** | Yes | N/A | N/A | Discontinued | Yes |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Vanilla JavaScript (ES Modules)** | Zero-dependency frontend for maximum auditability |
| **Web Crypto API** | Browser-native AES-256-GCM encryption and key generation |
| **IPFS + Pinata** | Decentralized, content-addressed file storage and pinning |
| **Bun** | Fast JavaScript runtime and package manager |
| **serve** | Lightweight static file server for development |
| **HTML5 + CSS3** | Dark-themed, responsive UI with drag-and-drop support |

### Why No Framework?

DecentraSend intentionally uses zero frontend frameworks. This is a deliberate architectural choice:

1. **Auditability** — Anyone can read and verify the entire codebase in minutes
2. **Security** — No dependency supply chain attacks. No `node_modules` bloat hiding malicious code
3. **Performance** — Instant load times. No virtual DOM overhead for a single-page tool
4. **Longevity** — Vanilla JS never goes out of style. No framework migrations needed

---

## Project Structure

```
ipfs-transfer/
├── package.json              # Project metadata and scripts
├── public/                   # Static site root (deploy this)
│   ├── index.html            # Main page — upload + download views
│   ├── css/
│   │   └── style.css         # Dark theme responsive UI
│   └── js/
│       ├── crypto.js          # AES-256-GCM encrypt/decrypt (Web Crypto API)
│       ├── ipfs.js            # Pinata upload + multi-gateway IPFS download
│       └── app.js             # Main application logic wiring everything together
```

---

## Roadmap

Planned features and improvements for future releases:

- [ ] **Drag-and-drop folder support** — Upload entire directories as zip archives
- [ ] **Password-protected links** — Optional additional passphrase layer on top of the AES key
- [ ] **Expiring links** — Set TTL for shared files by unpinning from IPFS after a duration
- [ ] **File size chunking** — Support for large files via chunked encryption and upload
- [ ] **QR code generation** — Generate scannable QR codes for share links on mobile
- [ ] **Progressive Web App (PWA)** — Installable app with offline support
- [ ] **WebRTC direct transfer mode** — Optional real-time peer-to-peer file transfer without IPFS
- [ ] **Self-hosted Pinata alternative** — Support for IPFS Kubo node as a self-hosted pinning backend
- [ ] **CLI tool** — Terminal-based interface for scripted and headless file transfers
- [ ] **Tor-friendly mode** — Optimized for .onion access and Tor Browser compatibility
- [ ] **Multiple file support** — Batch encrypt and upload multiple files in one session
- [ ] **File preview** — In-browser preview for images and documents before download

---

## Contributing

Contributions are what make the open-source community an incredible place to learn, create, and collaborate. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas

- Improve encryption performance for large files
- Add support for additional IPFS pinning providers
- Enhance the UI/UX for mobile devices
- Write unit tests for the crypto module
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Translate the UI into other languages

### Development

```bash
# Install dependencies
bun install

# Start dev server with hot reload
bun run dev

# The app serves from http://localhost:3000
```

### Code Style

- Vanilla JavaScript with ES modules — no transpilation needed
- Use `const` and `let`, never `var`
- Prefer `async/await` over raw Promises
- Keep functions small and single-purpose

---

## Frequently Asked Questions

### Is DecentraSend really zero-knowledge?

**Yes.** The encryption key exists only in the URL fragment (`#`), which browsers are required by specification (RFC 3986) to never send in HTTP requests. The static site has no server-side code, no analytics, and no telemetry. No party other than the sender and recipient ever has access to the decryption key.

### What encryption does DecentraSend use?

DecentraSend uses **AES-256-GCM** (Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode). This is the same encryption standard used by governments and financial institutions worldwide. Key generation and encryption are performed using the browser-native **Web Crypto API**, which provides cryptographically secure random number generation and hardware-accelerated encryption.

### Where are files stored?

Encrypted files are stored on the **IPFS (InterPlanetary File System)** network via Pinata pinning. IPFS is a decentralized, content-addressed storage protocol. Files are identified by their cryptographic hash (CID), not by location, making them censorship-resistant and verifiable.

### Can anyone on IPFS read my files?

**No.** Only the encrypted ciphertext is uploaded to IPFS. Without the decryption key (which is only in your share link's URL fragment), the data on IPFS is indistinguishable from random bytes. Even if someone finds the CID, they cannot decrypt the file.

### How is this different from other encrypted file transfer tools?

DecentraSend combines **client-side encryption** with **decentralized storage** and a **zero-backend architecture**. Most alternatives either require a server (which could be compromised), store files centrally (which can be censored), or require both parties to be online simultaneously (like Magic Wormhole). DecentraSend requires none of these.

### Is there a file size limit?

There is no hard limit imposed by DecentraSend itself. Practical limits are determined by the IPFS gateway configuration and Pinata plan limits. The free Pinata tier supports files up to **100 MB**. For larger files, consider a paid Pinata plan or self-hosted IPFS node.

### Do I need an account to use DecentraSend?

**No.** Recipients never need an account. Senders need Pinata API credentials for uploading to IPFS, but the app itself requires no sign-up, no email, and no personal information.

### Can I self-host DecentraSend?

**Absolutely.** DecentraSend is a fully static site. Clone the repo, drop the `public/` folder on any web server, CDN, or static hosting platform, and you're running your own instance. You can even serve it from `file://` for maximum privacy.

### What happens if an IPFS gateway goes down?

DecentraSend implements **multi-gateway fallback**. When fetching a file, the app tries multiple IPFS gateways in sequence. If one is slow or unavailable, it automatically falls back to the next gateway, ensuring reliable downloads.

### Is DecentraSend suitable for sensitive or classified data?

DecentraSend provides strong encryption (AES-256-GCM) and a zero-knowledge architecture. However, for classified or high-stakes data, you should also consider your operational security: use a trusted device, share links over encrypted channels (Signal, etc.), and consider self-hosting both the app and an IPFS node.

### How do I share files using decentralized file transfer?

Simply drop your file into the DecentraSend interface, wait for encryption and IPFS upload to complete, then copy the generated link and send it to your recipient through any communication channel. The link contains everything needed to fetch and decrypt the file.

### Can the government or ISP see what I'm sharing?

Your ISP can see that you're connecting to an IPFS gateway, but they **cannot** see the encryption key (it's in the URL fragment, which is never transmitted) or the decrypted contents of the file. For additional privacy, use DecentraSend over a VPN or Tor.

---

## Privacy Commitment

DecentraSend is built on a fundamental principle: **your data is yours**. We will never:

- Add analytics, tracking, or telemetry
- Introduce server-side processing of files
- Collect, store, or transmit encryption keys
- Require accounts or personal information
- Compromise on encryption standards

This is enforced by architecture, not policy. The app is a static site with no backend. There is literally no server to collect your data.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## Acknowledgments

- [IPFS](https://ipfs.io) — The InterPlanetary File System for decentralized storage
- [Pinata](https://pinata.cloud) — Reliable IPFS pinning service
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — Browser-native cryptography
- [Bun](https://bun.sh) — Fast all-in-one JavaScript runtime

---

<div align="center">

**If DecentraSend helps you, consider giving it a star!**

[![Star this repo](https://img.shields.io/github/stars/Husnain555/DecentraSend?style=social)](https://github.com/Husnain555/DecentraSend/stargazers)

Built with privacy in mind. Open source forever.

[Back to Top](#decentrasend)

</div>
