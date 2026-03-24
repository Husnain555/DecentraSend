# DecentraSend vs Other File Transfer Services

A detailed comparison of DecentraSend with popular file transfer and cloud storage services. This guide helps you understand where DecentraSend fits and why decentralized, encrypted file transfer matters.

---

## Feature Matrix

| Feature | DecentraSend | WeTransfer | Google Drive | Firefox Send | OnionShare | Magic Wormhole | Tresorit | Keybase |
|---|---|---|---|---|---|---|---|---|
| **End-to-end encryption** | AES-256-GCM | No | No | AES-128-GCM | Yes | Yes (PAKE) | AES-256 + RSA | Yes (NaCl) |
| **Zero-knowledge** | Yes | No | No | Yes | Yes | Yes | Yes | Yes |
| **Decentralized storage** | Yes (IPFS) | No | No | No | No (direct P2P) | No (direct P2P) | No | No |
| **Open source** | Yes | No | No | Yes (archived) | Yes | Yes | No | Yes |
| **No account needed** | Yes (to receive) | Yes (to receive) | No | Yes | Yes | Yes | No | No |
| **Self-hostable** | Yes | No | No | Yes (archived) | Yes | Yes | No | No |
| **Max file size** | Pinata plan dependent | 2 GB (free) | 15 GB (free) | 2.5 GB | No limit | No limit | 10 GB | 250 MB |
| **Privacy level** | Very High | Low | Low | High | Very High | High | High | High |
| **Cost** | Free / open source | Free + paid tiers | Free + paid tiers | Discontinued | Free | Free | Paid only | Free (discontinued) |
| **Files persist** | Yes (while pinned) | 7 days | Until deleted | 24h or 1 download | During transfer | During transfer | Until deleted | Until deleted |
| **Works in browser** | Yes | Yes | Yes | Yes | No (needs Tor) | No (needs CLI) | Yes | Yes |
| **Censorship resistant** | High (IPFS) | Low | Low | Low | Very High (Tor) | Moderate | Low | Moderate |
| **No metadata logged** | Yes | No | No | Yes | Yes | Yes | No (account) | No (account) |

---

## Detailed Comparisons

### DecentraSend vs WeTransfer

**WeTransfer** is a popular file sharing service known for its simplicity. However, it offers no end-to-end encryption and has full access to your files.

| Aspect | DecentraSend | WeTransfer |
|---|---|---|
| Who can read your files? | Only the link holder | WeTransfer, law enforcement, attackers |
| Encryption | Client-side AES-256-GCM | Server-side TLS only (in transit) |
| Storage location | Decentralized (IPFS network) | WeTransfer's centralized servers |
| File retention | Persistent (while pinned on IPFS) | 7 days (free), 28 days (paid) |
| Tracking & analytics | None | Tracks downloads, IP addresses |
| Account required to send | No (just a Pinata API key) | No (free tier) |
| Password protection | Built-in via encryption | Paid feature only |

**Choose DecentraSend when**: You need privacy, the file must not be readable by any third party, or you want files to persist longer than 7 days.

**Choose WeTransfer when**: You need maximum simplicity for non-sensitive files and the recipient is not technically inclined.

---

### DecentraSend vs Google Drive

**Google Drive** is a cloud storage platform, not a file transfer tool. It provides storage and collaboration features but gives Google full access to your file contents.

| Aspect | DecentraSend | Google Drive |
|---|---|---|
| Who can read your files? | Only the link holder | Google, law enforcement with warrant |
| Encryption | Client-side AES-256-GCM | At-rest encryption (Google holds the key) |
| Data used for advertising | No | Yes (scanned for ad targeting) |
| Storage | Decentralized (IPFS) | Google's data centers |
| Collaboration features | None (transfer only) | Real-time editing, comments, sharing |
| Account required | No (to receive) | Yes (Google account) |
| Storage quota | Pinata plan dependent | 15 GB free |
| Offline access | Via IPFS gateways | Google Drive app |

**Choose DecentraSend when**: Privacy is the priority and you do not want Google scanning your files.

**Choose Google Drive when**: You need collaboration features (editing, commenting, sharing with teams) and privacy is not a concern.

---

### DecentraSend vs Firefox Send (Discontinued)

**Firefox Send** was Mozilla's encrypted file sharing service. It was shut down in September 2020 due to abuse concerns. DecentraSend fills the same niche with a decentralized approach that cannot be shut down.

| Aspect | DecentraSend | Firefox Send |
|---|---|---|
| Status | Active, open source | Discontinued (September 2020) |
| Encryption | AES-256-GCM | AES-128-GCM |
| Storage | Decentralized (IPFS) | Mozilla's servers (centralized) |
| Can be shut down | No (decentralized) | Yes (was shut down) |
| Self-hostable | Yes | Yes (was, code archived) |
| File expiry | No expiry (while pinned) | 24 hours or after N downloads |
| Open source | Yes | Yes (archived) |

**DecentraSend is the spiritual successor to Firefox Send**, with stronger encryption (256-bit vs 128-bit) and decentralized storage that prevents a single entity from shutting down the service.

---

### DecentraSend vs OnionShare

**OnionShare** is a privacy-focused file sharing tool that creates a temporary Tor onion service on your computer. It provides extreme privacy but requires the Tor network and a running computer.

| Aspect | DecentraSend | OnionShare |
|---|---|---|
| Network | IPFS (decentralized web) | Tor (anonymous overlay network) |
| Sender must be online | No (file is pinned to IPFS) | Yes (sender's computer hosts the file) |
| Anonymity level | Moderate (IPFS gateways see your IP) | Very high (Tor hides IPs) |
| Ease of use | Web browser only | Requires OnionShare app + Tor |
| Recipient setup | Open a link in any browser | Needs Tor Browser |
| File persistence | Persistent (while pinned) | Only while sender is online |
| Speed | Fast (IPFS CDN gateways) | Slow (Tor network overhead) |

**Choose DecentraSend when**: You want the convenience of a web app, the recipient should not need special software, and files should persist after you close your computer.

**Choose OnionShare when**: Maximum anonymity is required, you do not want any third party to even see the encrypted blob, and both parties can use Tor.

---

### DecentraSend vs Magic Wormhole

**Magic Wormhole** is a command-line tool for direct peer-to-peer file transfer using a short passphrase. It is simple and secure but requires both parties to be online simultaneously.

| Aspect | DecentraSend | Magic Wormhole |
|---|---|---|
| Interface | Web browser | Command line |
| Both parties online? | No (async via IPFS) | Yes (real-time P2P) |
| Key exchange | Key in URL fragment | Short passphrase (PAKE protocol) |
| File persistence | Yes (IPFS pinned) | None (direct transfer) |
| File size limit | Pinata plan dependent | No limit (P2P) |
| Setup required | None (web app) | Install `magic-wormhole` package |
| Relay servers | IPFS gateways | Magic Wormhole relay servers |

**Choose DecentraSend when**: Sender and recipient are in different time zones, the file should be downloadable at any time, or the recipient cannot use CLI tools.

**Choose Magic Wormhole when**: Both parties are online, you want a memorable passphrase instead of a long URL, and you prefer command-line tools.

---

### DecentraSend vs Tresorit

**Tresorit** is a paid, enterprise-focused encrypted cloud storage service based in Switzerland. It offers strong encryption and compliance features but is not open source or free.

| Aspect | DecentraSend | Tresorit |
|---|---|---|
| Cost | Free | Starts at $10/month |
| Open source | Yes | No |
| Encryption | AES-256-GCM (browser) | AES-256 + RSA-4096 (client app) |
| Self-hostable | Yes | No |
| Storage | Decentralized (IPFS) | Tresorit's servers (Switzerland, EU) |
| Compliance (GDPR, HIPAA) | Self-hosted = your compliance | Built-in compliance features |
| Collaboration features | None | Yes (folders, teams, DRM) |
| Account required | No | Yes |

**Choose DecentraSend when**: You want a free, open-source solution, do not need enterprise features, and want to control your own infrastructure.

**Choose Tresorit when**: You need enterprise compliance features (GDPR, HIPAA), team collaboration, and are willing to pay for managed infrastructure.

---

### DecentraSend vs Keybase (Discontinued Core Features)

**Keybase** was an encrypted platform for messaging, file sharing, and identity verification. It was acquired by Zoom in 2020 and has since been in maintenance mode with an uncertain future.

| Aspect | DecentraSend | Keybase |
|---|---|---|
| Status | Active, open source | Maintenance mode (Zoom-owned) |
| Account required | No | Yes (Keybase account) |
| Encryption | AES-256-GCM | NaCl (Curve25519, XSalsa20, Poly1305) |
| File sharing | Link-based (async) | Keybase filesystem (KBFS) |
| Identity verification | None | PGP, social proofs |
| Self-hostable | Yes | No |
| Decentralized | Yes (IPFS) | Partially (Stellar blockchain for IDs) |
| Future-proof | Community-driven open source | Uncertain (corporate ownership) |

**Choose DecentraSend when**: You want a simple, single-purpose file transfer tool that does not require accounts or identity management.

**Choose Keybase when**: You need encrypted messaging, team chat, and cryptographic identity verification in addition to file sharing.

---

## Summary: When to Use DecentraSend

DecentraSend is the best choice when you need:

- **Privacy by default** — Files are encrypted before they leave your browser.
- **No accounts or sign-ups** — Recipients just click a link.
- **Decentralized storage** — No single company controls your files.
- **Censorship resistance** — IPFS makes files hard to take down.
- **Open source transparency** — Anyone can verify the code.
- **Self-hosting capability** — Run it on your own infrastructure.
- **Asynchronous transfers** — Sender and recipient do not need to be online at the same time.

---

*Last updated: 2026-03-24. Corrections or additions welcome via GitHub issues.*
