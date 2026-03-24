# Self-Hosting DecentraSend

DecentraSend is a fully static web application — just HTML, CSS, and JavaScript. There is no backend, no database, and no server-side processing. This means you can host it on virtually any platform that serves static files.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deploy on Vercel](#deploy-on-vercel)
- [Deploy on Cloudflare Pages](#deploy-on-cloudflare-pages)
- [Deploy on Netlify](#deploy-on-netlify)
- [Deploy on IPFS (Fully Decentralized)](#deploy-on-ipfs-fully-decentralized)
- [Using Your Own Pinata Key](#using-your-own-pinata-key)
- [Running Your Own IPFS Gateway with Kubo](#running-your-own-ipfs-gateway-with-kubo)
- [Docker Setup](#docker-setup)

---

## Prerequisites

Before deploying, make sure you have:

- The DecentraSend source code (clone or download from GitHub)
- Node.js 18+ (optional, only for local development)
- A Pinata account with a JWT API key (free at [app.pinata.cloud](https://app.pinata.cloud/developers/api-keys))

The deployable files are in the `public/` directory:

```
public/
  index.html
  css/style.css
  js/app.js
  js/crypto.js
  js/ipfs.js
```

---

## Deploy on Vercel

Vercel offers free hosting for static sites with a global CDN and automatic HTTPS.

### Option A: Deploy via CLI

1. Install the Vercel CLI:

```bash
npm install -g vercel
```

2. Navigate to the project root:

```bash
cd ipfs-transfer
```

3. Create a `vercel.json` configuration file in the project root:

```json
{
  "outputDirectory": "public",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" }
      ]
    }
  ]
}
```

4. Deploy:

```bash
vercel --prod
```

5. Vercel will provide a URL like `https://your-project.vercel.app`.

### Option B: Deploy via GitHub

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click "New Project".
3. Import the GitHub repository.
4. Set the **Output Directory** to `public`.
5. Click "Deploy".

Vercel will automatically redeploy on every push to the main branch.

---

## Deploy on Cloudflare Pages

Cloudflare Pages provides free static hosting with a fast global network.

### Option A: Direct Upload

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and navigate to **Workers & Pages**.
2. Click **Create application** > **Pages** > **Upload assets**.
3. Name your project (e.g., `decentrasend`).
4. Upload the contents of the `public/` directory (drag and drop the folder).
5. Click **Deploy site**.

### Option B: Connect to Git

1. Push the repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select the repository.
4. Configure the build settings:
   - **Build command**: (leave empty — no build step needed)
   - **Build output directory**: `public`
5. Click **Save and Deploy**.

### Custom Domain

```bash
# In Cloudflare Pages settings, add a custom domain:
# Settings > Custom domains > Add custom domain
# Point your DNS CNAME to your-project.pages.dev
```

### Security Headers

Create a `public/_headers` file:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Deploy on Netlify

Netlify provides free static hosting with continuous deployment from Git.

### Option A: Drag and Drop

1. Go to [app.netlify.com](https://app.netlify.com).
2. Drag and drop the `public/` folder onto the deploy area.
3. Your site will be live at a random `*.netlify.app` URL.

### Option B: Connect to Git

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Netlify, click **Add new site** > **Import an existing project**.
3. Connect your repository.
4. Configure the build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `public`
5. Click **Deploy site**.

### Redirect Rules for SPA

Create a `public/_redirects` file so hash-based routing works correctly:

```
/*    /index.html   200
```

### Security Headers

Create a `public/_headers` file:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
```

### Custom Domain

1. Go to **Site settings** > **Domain management** > **Add custom domain**.
2. Follow the DNS configuration instructions.

---

## Deploy on IPFS (Fully Decentralized)

Host DecentraSend on IPFS itself for a fully decentralized setup where even the app cannot be taken down.

### Using Pinata (Easiest)

1. Install the Pinata CLI or use the web interface.

2. Pin the entire `public/` directory:

```bash
# Using curl with your Pinata JWT
cd public

# Create a CAR file or use the Pinata web upload
# Go to app.pinata.cloud > Files > Upload > Folder
# Select the public/ directory
```

3. Pinata will return a CID for the directory. Access your app at:

```
https://gateway.pinata.cloud/ipfs/<YOUR_CID>/
https://dweb.link/ipfs/<YOUR_CID>/
https://<YOUR_CID>.ipfs.dweb.link/
```

### Using Kubo CLI

1. Install Kubo (go-ipfs):

```bash
# macOS
brew install ipfs

# Linux
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar xvf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo && sudo bash install.sh

# Initialize (first time only)
ipfs init
ipfs daemon &
```

2. Add the `public/` directory to IPFS:

```bash
ipfs add -r public/
```

3. The last line of output will be the root directory CID:

```
added QmXyz... public
```

4. Access via any IPFS gateway:

```
https://ipfs.io/ipfs/QmXyz.../
```

### Using IPNS for Updatable Links

If you want a stable link that you can update when you deploy new versions:

```bash
# Publish to IPNS (links your IPFS node identity to the CID)
ipfs name publish <YOUR_CID>

# Your app is now available at:
# https://ipfs.io/ipns/<YOUR_PEER_ID>/
```

### Using ENS or DNSLink

For a human-readable decentralized domain:

```bash
# DNSLink: Add a TXT record to your domain
# _dnslink.your-domain.com  TXT  "dnslink=/ipfs/<YOUR_CID>"

# Then access via:
# https://your-domain.com (with IPFS-aware browser or gateway)
```

---

## Using Your Own Pinata Key

DecentraSend requires a Pinata JWT (JSON Web Token) to upload files to IPFS. Each user provides their own key, so you control your own IPFS storage.

### Getting a Pinata API Key

1. Sign up at [app.pinata.cloud](https://app.pinata.cloud) (free tier available).
2. Go to **Developers** > **API Keys** > **New Key**.
3. Set permissions:
   - **pinFileToIPFS**: Enabled
   - **pinJSONToIPFS**: Not required
   - **Admin**: Not required (principle of least privilege)
4. Click **Create Key**.
5. Copy the **JWT** token (not the API Key/Secret pair).

### Using the Key in DecentraSend

1. Open DecentraSend in your browser.
2. Paste your JWT into the "Pinata JWT token" field.
3. Click "Save Key".
4. The key is verified against the Pinata API and stored in `localStorage`.

### Key Security

- Your Pinata JWT is stored **only in your browser's localStorage**.
- It is sent directly to the Pinata API over HTTPS when uploading files.
- It is **never** sent to any DecentraSend server (there are no DecentraSend servers).
- If you self-host, you can pre-configure the key in a forked version of `app.js` or set it via environment variables at build time.

### Pre-Configuring a Key (Self-Host Only)

If you want to provide a shared Pinata key for all users of your self-hosted instance, modify `public/js/app.js`:

```javascript
// Replace line:
let pinataApiKey = localStorage.getItem("pinata_api_key") || "";

// With a hardcoded or environment-injected key:
let pinataApiKey = localStorage.getItem("pinata_api_key") || "YOUR_PINATA_JWT";
```

> **Warning**: A hardcoded key means anyone using your instance can upload files to your Pinata account and consume your storage quota.

---

## Running Your Own IPFS Gateway with Kubo

Instead of relying on public IPFS gateways, you can run your own for maximum control and privacy.

### Install Kubo

```bash
# macOS
brew install ipfs

# Ubuntu/Debian
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar xvf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Verify installation
ipfs --version
```

### Initialize and Configure

```bash
# Initialize IPFS (first time only)
ipfs init

# Configure the gateway to listen on all interfaces (for remote access)
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Optional: increase connection limits for better performance
ipfs config --json Swarm.ConnMgr.HighWater 300
ipfs config --json Swarm.ConnMgr.LowWater 100
```

### Start the IPFS Daemon

```bash
ipfs daemon
```

Your gateway is now running at `http://localhost:8080/ipfs/<CID>`.

### Point DecentraSend to Your Gateway

Modify `public/js/ipfs.js` to add your gateway to the `GATEWAYS` array:

```javascript
const GATEWAYS = [
  "http://your-server:8080/ipfs/",  // Your own gateway (first priority)
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];
```

### Run as a Systemd Service (Linux)

Create `/etc/systemd/system/ipfs.service`:

```ini
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
Type=simple
User=ipfs
ExecStart=/usr/local/bin/ipfs daemon
Restart=on-failure
RestartSec=10
Environment=IPFS_PATH=/home/ipfs/.ipfs

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo useradd -m ipfs
sudo -u ipfs ipfs init
sudo systemctl enable ipfs
sudo systemctl start ipfs
```

### Add a Reverse Proxy (Nginx)

For HTTPS support, put Nginx in front of the IPFS gateway:

```nginx
server {
    listen 443 ssl http2;
    server_name ipfs.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/ipfs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ipfs.yourdomain.com/privkey.pem;

    location /ipfs/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_valid 200 1d;
        add_header X-Content-Type-Options nosniff;
    }
}
```

---

## Docker Setup

Run DecentraSend in a Docker container using Nginx to serve the static files.

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy static files
COPY public/ /usr/share/nginx/html/

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

### Nginx Configuration

Create `nginx.conf` in the project root:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip compression
    gzip on;
    gzip_types text/html text/css application/javascript;
    gzip_min_length 256;
}
```

### Build and Run

```bash
# Build the image
docker build -t decentrasend .

# Run the container
docker run -d -p 8080:80 --name decentrasend decentrasend

# Access at http://localhost:8080
```

### Docker Compose

Create `docker-compose.yml` for a more complete setup:

```yaml
version: "3.8"

services:
  decentrasend:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Run with:

```bash
docker compose up -d
```

### Docker with IPFS Sidecar

For a fully self-contained setup with your own IPFS node:

```yaml
version: "3.8"

services:
  decentrasend:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped

  ipfs:
    image: ipfs/kubo:latest
    ports:
      - "4001:4001"     # Swarm
      - "5001:5001"     # API
      - "8081:8080"     # Gateway
    volumes:
      - ipfs_data:/data/ipfs
    restart: unless-stopped

volumes:
  ipfs_data:
```

With this setup:
- DecentraSend is available at `http://localhost:8080`
- Your IPFS gateway is at `http://localhost:8081/ipfs/<CID>`
- Modify `ipfs.js` to point to `http://localhost:8081/ipfs/` as the primary gateway

---

*For questions or issues, open a GitHub issue or see the [FAQ](./FAQ.md).*
