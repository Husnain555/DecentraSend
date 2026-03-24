# DecentraSend FAQ — Frequently Asked Questions

> DecentraSend is a free, open-source, decentralized file transfer tool that uses IPFS and client-side AES-256-GCM encryption. No accounts, no servers, zero knowledge.

---

## 1. What is DecentraSend?

DecentraSend is an open-source web application for private, decentralized file transfer. It encrypts your files in the browser using AES-256-GCM before uploading them to IPFS (InterPlanetary File System). The decryption key is embedded in the shareable link's URL fragment, which never leaves your browser or reaches any server. This means no one — not the developers, not IPFS nodes, not your ISP — can read your files.

---

## 2. How does decentralized file transfer work?

Traditional file sharing relies on a central server (like Google Drive or WeTransfer) that stores and serves your files. DecentraSend works differently:

1. Your file is **encrypted entirely in your browser** using AES-256-GCM.
2. The encrypted blob is uploaded to **IPFS**, a peer-to-peer network where files are addressed by their content hash (CID).
3. The file is **pinned** via Pinata so it stays available on the IPFS network.
4. You share a link containing the CID and the decryption key (in the URL fragment).
5. The recipient's browser **fetches the encrypted file from IPFS** and decrypts it locally.

No single company controls the file. It is distributed across the IPFS network.

---

## 3. Is DecentraSend safe and private?

Yes. DecentraSend is designed with privacy as the default:

- **Client-side encryption**: Files are encrypted with AES-256-GCM before they leave your browser. Only ciphertext is uploaded.
- **Zero-knowledge architecture**: The decryption key is placed in the URL fragment (`#`), which browsers never send to servers.
- **No accounts**: There is no registration, no email, no tracking.
- **No server-side processing**: DecentraSend is a fully static web app. There is no backend that sees your data.
- **Open source**: The full source code is publicly auditable on GitHub.

---

## 4. How is encryption handled in DecentraSend?

DecentraSend uses the **Web Crypto API** built into modern browsers to perform AES-256-GCM encryption. Here is the process:

1. A **random 256-bit AES key** is generated for each file using `crypto.subtle.generateKey()`.
2. A **random 12-byte initialization vector (IV)** is generated using `crypto.getRandomValues()`.
3. The file's metadata (filename, type, size) is bundled with the file content and encrypted together, so even the filename is hidden.
4. The encrypted output is formatted as `[12-byte IV][ciphertext]`.
5. The AES key is exported, encoded as Base64URL, and placed in the shareable link's URL fragment.

All cryptographic operations happen in the browser. The key is never transmitted to any server.

---

## 5. What is IPFS and how does it work for file sharing?

**IPFS (InterPlanetary File System)** is a decentralized, peer-to-peer protocol for storing and sharing files. Instead of using a URL that points to a specific server, IPFS uses **content-addressed storage** — each file gets a unique **CID (Content Identifier)** based on its cryptographic hash.

When you upload a file to IPFS through DecentraSend:

- The encrypted file is pinned to IPFS via the Pinata pinning service.
- The file becomes available through any IPFS gateway worldwide.
- DecentraSend uses multiple gateways (Pinata, dweb.link, Cloudflare IPFS, ipfs.io) for redundant retrieval.
- Because files are addressed by content hash, the data is tamper-proof — if even one bit changes, the CID changes.

---

## 6. Can anyone see my files on IPFS?

**No one can read your files**, even though the encrypted blob is publicly accessible on IPFS. Here is why:

- What gets uploaded to IPFS is **AES-256-GCM encrypted ciphertext**. Without the decryption key, it is indistinguishable from random data.
- The decryption key is only in the share link you generate. It is never uploaded, never stored on a server, and never included in the CID.
- IPFS nodes and gateways can see that an encrypted blob exists, but they cannot decrypt it.

Think of it like putting a locked safe in a public park — anyone can see the safe, but only the person with the key can open it.

---

## 7. What happens if I lose the share link?

**The file becomes permanently inaccessible.** The decryption key is embedded solely in the share link's URL fragment. DecentraSend does not store keys anywhere — not on a server, not in a database, not in cookies. If you lose the link:

- The encrypted blob will still exist on IPFS (as long as it is pinned), but it cannot be decrypted.
- There is no "forgot password" or recovery mechanism. This is by design for maximum privacy.

**Recommendation**: Save important share links in a password manager or secure notes app.

---

## 8. How big can files be on DecentraSend?

The file size limit depends on your Pinata plan:

| Pinata Plan | Max Upload Size | Storage |
|---|---|---|
| Free | 25 MB per file | 500 MB total |
| Picnic (paid) | 25 MB per file | 1 GB total |
| Submarine (paid) | 25 MB per file | Varies |
| Dedicated Gateways | Up to 5 GB | Custom |

Since encryption happens in the browser, very large files may also be limited by available browser memory. Files up to several hundred megabytes work well in modern browsers.

---

## 9. Do I need an account to use DecentraSend?

**No account is needed to receive and decrypt files.** Anyone with a share link can download and decrypt in their browser instantly.

**To upload files**, you need a free Pinata API key (JWT). Pinata is the IPFS pinning service that keeps your files available on the network. You can get a free API key at [app.pinata.cloud](https://app.pinata.cloud/developers/api-keys). Your API key is stored only in your browser's localStorage and is never sent to DecentraSend's servers (there are none).

---

## 10. Is DecentraSend really zero-knowledge?

Yes. Zero-knowledge in this context means **the service has no ability to access your file contents**:

- Encryption and decryption happen entirely in the browser using the Web Crypto API.
- The decryption key lives only in the URL fragment (`#`), which browsers do not send in HTTP requests.
- DecentraSend is a static web app with no backend server, no database, and no analytics.
- The Pinata API only receives encrypted ciphertext — it never sees the plaintext or the key.
- Even if someone subpoenaed every server involved, they would only find encrypted blobs.

---

## 11. How is DecentraSend different from WeTransfer or Google Drive?

| Feature | DecentraSend | WeTransfer | Google Drive |
|---|---|---|---|
| End-to-end encrypted | Yes (AES-256-GCM) | No | No (encrypted at rest only) |
| Zero-knowledge | Yes | No | No |
| Decentralized storage | Yes (IPFS) | No | No |
| Account required | No (to receive) | No (to receive) | Yes |
| Open source | Yes | No | No |
| Self-hostable | Yes | No | No |
| File size tracking | None | Yes | Yes |
| Server can read files | No | Yes | Yes |

WeTransfer and Google Drive can read your files because they control the encryption keys. DecentraSend cannot read your files because the key only exists in the share link.

---

## 12. What is end-to-end encryption in file sharing?

End-to-end encryption (E2EE) means the file is **encrypted on the sender's device** and can only be **decrypted on the recipient's device**. No intermediary — not the network, not the hosting provider, not the app developer — can access the plaintext.

In DecentraSend, E2EE works as follows:

- **Sender's browser** encrypts the file with a random AES-256-GCM key.
- The encrypted blob travels through IPFS.
- **Recipient's browser** decrypts the file using the key from the share link.
- The key is in the URL fragment (`#/d/CID/KEY`), which is processed client-side only.

---

## 13. Can the government or my ISP see my files?

**They cannot see the file contents.** Here is what different parties can and cannot see:

| Party | Can See | Cannot See |
|---|---|---|
| Your ISP | That you visited the DecentraSend site; that you made requests to IPFS gateways | File contents, filenames, decryption keys |
| IPFS gateway operators | That an encrypted blob was requested by CID | File contents, filenames, decryption keys |
| Pinata | That an encrypted blob was pinned | File contents, filenames, decryption keys |
| Government (with warrant) | Encrypted blobs on IPFS; metadata from ISP | File contents without the share link |
| Someone with the share link | Everything (they can decrypt the file) | Nothing — they have full access |

The decryption key is in the URL fragment, which is never sent over the network. Even with full network surveillance, the file contents remain encrypted.

---

## 14. Is the DecentraSend code audited?

DecentraSend is **open source** and available for public review on GitHub. The cryptographic implementation relies on the **Web Crypto API**, which is a browser-native, audited, and standards-compliant cryptography library — not a custom implementation.

Key security properties:

- No custom cryptography — uses the browser's built-in AES-256-GCM implementation.
- Minimal codebase — the entire app is three small JavaScript modules (`crypto.js`, `ipfs.js`, `app.js`) plus a static HTML file.
- No dependencies for crypto — zero npm packages are used for encryption.
- Community auditable — anyone can review the source code.

If you are a security researcher, we welcome audits and responsible disclosure.

---

## 15. How do I self-host DecentraSend?

DecentraSend is a fully static web app (HTML + CSS + JS) with no server-side components. You can host it anywhere that serves static files:

- **Vercel**: `vercel --prod` from the `public/` directory.
- **Netlify**: Drag and drop the `public/` folder into Netlify.
- **Cloudflare Pages**: Connect your GitHub repo and set `public` as the build output directory.
- **IPFS itself**: Pin the `public/` directory to IPFS for fully decentralized hosting.
- **Docker**: Serve with any static file server (nginx, caddy, etc.).

See the full [Self-Hosting Guide](./SELF_HOSTING.md) for detailed instructions.

---

## 16. What browsers are supported?

DecentraSend works in any modern browser that supports the **Web Crypto API** and **ES Modules**:

- Google Chrome 60+
- Mozilla Firefox 57+
- Microsoft Edge 79+
- Safari 11+
- Opera 47+
- Brave (all versions)

Internet Explorer is not supported. Mobile browsers (Chrome for Android, Safari for iOS) are fully supported.

---

## 17. Can I use DecentraSend without Pinata?

Currently, DecentraSend uses Pinata as the IPFS pinning service for uploads. However, because the app is open source, you can modify `ipfs.js` to use any IPFS pinning service or your own IPFS node:

- **Infura IPFS** (alternative pinning service)
- **Web3.Storage** (free IPFS + Filecoin pinning)
- **Local Kubo node** (run your own IPFS node)
- **NFT.Storage** (free, backed by Filecoin)

The download side already supports multiple gateways (Pinata, dweb.link, Cloudflare IPFS, ipfs.io) for redundancy.

---

## 18. Does DecentraSend store any data or cookies?

DecentraSend stores exactly one item in your browser's `localStorage`: your Pinata API key (if you entered one). This is purely for convenience so you do not have to re-enter it each visit.

- No cookies are set.
- No analytics or tracking scripts are loaded.
- No data is sent to any DecentraSend server (there are no DecentraSend servers).
- No IP addresses are logged.
- Files and encryption keys are never stored locally.

---

## 19. What happens to my file after I share it?

Once uploaded, the encrypted file is **pinned on IPFS** via Pinata. It will remain available as long as:

- It stays pinned in your Pinata account.
- At least one IPFS node has a copy.

If you unpin the file from Pinata and no other IPFS node has cached it, the file will eventually become unavailable through IPFS garbage collection. The encrypted blob cannot be decrypted without the share link regardless.

---

## 20. Is DecentraSend free?

**Yes, DecentraSend is completely free and open source** (MIT license). There are no premium tiers, no ads, and no paid features.

The only cost you might encounter is if you exceed Pinata's free tier limits (500 MB storage, 100 pins). Pinata's free plan is sufficient for most personal use. You can also self-host the app and use your own IPFS infrastructure at no cost beyond hosting.

---

*Last updated: 2026-03-24. Have a question not listed here? Open an issue on GitHub.*
