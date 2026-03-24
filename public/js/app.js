/**
 * DecentraSend — Main app logic
 * Wires together crypto + IPFS + UI + history management
 */

import {
  encryptFile,
  decryptFile,
  exportKey,
  toBase64Url,
  fromBase64Url,
} from "./crypto.js";
import {
  uploadToIPFS,
  downloadFromIPFS,
  testApiKey,
  listUploads,
  deleteFile,
} from "./ipfs.js";

// ─── State ───
let apiKey = localStorage.getItem("lighthouse_api_key") || "";

// ─── DOM refs ───
const $ = (sel) => document.querySelector(sel);

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  // Restore API key
  if (apiKey) {
    $("#api-key-input").value = apiKey;
    showUploadArea();
  }

  // Check if we're on a download link
  checkForDownloadLink();

  // Wire events
  $("#save-key-btn").addEventListener("click", saveApiKey);
  $("#api-key-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveApiKey();
  });

  setupDropZone();
  $("#file-input").addEventListener("change", handleFileSelect);
  $("#copy-link-btn").addEventListener("click", copyShareLink);
  $("#new-upload-btn").addEventListener("click", resetUpload);
  $("#download-btn").addEventListener("click", handleDownload);
  $("#refresh-history-btn").addEventListener("click", loadHistory);
});

// ─── API Key ───
async function saveApiKey() {
  const key = $("#api-key-input").value.trim();
  if (!key) {
    showToast("Please enter your Lighthouse API key", "error");
    return;
  }

  $("#save-key-btn").disabled = true;
  $("#save-key-btn").textContent = "Verifying...";

  try {
    const valid = await testApiKey(key);
    if (!valid) {
      showToast("Invalid API key. Check your Lighthouse token.", "error");
      return;
    }
    apiKey = key;
    localStorage.setItem("lighthouse_api_key", key);
    showToast("API key saved!", "success");
    showUploadArea();
  } catch (err) {
    showToast("Could not verify key: " + err.message, "error");
  } finally {
    $("#save-key-btn").disabled = false;
    $("#save-key-btn").textContent = "Save Key";
  }
}

function showUploadArea() {
  $("#setup-section").classList.add("hidden");
  $("#upload-section").classList.remove("hidden");
  $("#history-section").classList.remove("hidden");
  loadHistory();
}

// ─── Drag & Drop ───
function setupDropZone() {
  const zone = $("#drop-zone");

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  });

  zone.addEventListener("click", () => {
    $("#file-input").click();
  });
}

function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    processFile(e.target.files[0]);
  }
}

// ─── Upload Flow ───
async function processFile(file) {
  if (!apiKey) {
    showToast("Please set your Lighthouse API key first", "error");
    return;
  }

  // Show progress
  $("#drop-zone").classList.add("hidden");
  $("#upload-progress").classList.remove("hidden");

  const sizeStr = formatFileSize(file.size);
  $("#progress-filename").textContent = `${file.name} (${sizeStr})`;

  try {
    // Step 1: Encrypt
    updateProgress("encrypt", 0, "Encrypting...");
    const { encrypted, key } = await encryptFile(file, (pct) => {
      updateProgress("encrypt", pct, "Encrypting...");
    });
    updateProgress("encrypt", 100, "Encrypted!");

    // Step 2: Upload to IPFS
    updateProgress("upload", 0, "Uploading to IPFS...");
    const cid = await uploadToIPFS(encrypted, apiKey, (pct) => {
      updateProgress("upload", pct, "Uploading to IPFS...");
    });
    updateProgress("upload", 100, "Pinned to IPFS!");

    // Step 3: Build share link
    const rawKey = await exportKey(key);
    const keyB64 = toBase64Url(rawKey);
    const shareLink = `${window.location.origin}${window.location.pathname}#/d/${cid}/${keyB64}`;

    // Step 4: Save to local history
    saveToHistory({
      cid,
      fileName: file.name,
      fileSize: file.size,
      encryptedSize: encrypted.length,
      shareLink,
      uploadedAt: new Date().toISOString(),
    });

    // Show result
    $("#upload-progress").classList.add("hidden");
    $("#upload-result").classList.remove("hidden");
    $("#share-link").value = shareLink;
    $("#result-cid").textContent = cid;
    $("#result-size").textContent = formatFileSize(encrypted.length);

    // Refresh history
    loadHistory();
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Upload failed: " + err.message, "error");
    updateProgress("upload", 0, "Failed — click 'Change API Key' or try again");
    setTimeout(() => resetUpload(), 4000);
  }
}

function updateProgress(step, pct, label) {
  const bar = $(`#${step}-bar`);
  const text = $(`#${step}-text`);
  if (bar) bar.style.width = `${pct}%`;
  if (text) text.textContent = label;
}

function resetUpload() {
  $("#upload-result").classList.add("hidden");
  $("#upload-progress").classList.add("hidden");
  $("#drop-zone").classList.remove("hidden");
  $("#file-input").value = "";
}

// ─── History Management ───

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("upload_history") || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift(entry); // newest first
  // Keep max 50 entries
  if (history.length > 50) history.pop();
  localStorage.setItem("upload_history", JSON.stringify(history));
}

function removeFromHistory(cid) {
  const history = getHistory().filter((h) => h.cid !== cid);
  localStorage.setItem("upload_history", JSON.stringify(history));
}

async function loadHistory() {
  const historyList = $("#history-list");
  const emptyState = $("#history-empty");
  const localHistory = getHistory();

  if (localHistory.length === 0) {
    historyList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  // Try to get Lighthouse file list for IDs (needed for deletion)
  let lighthouseFiles = [];
  try {
    lighthouseFiles = await listUploads(apiKey);
  } catch {
    // Offline or API issue — still show local history without delete
  }

  // Build a CID → fileId map
  const cidToId = {};
  for (const f of lighthouseFiles) {
    cidToId[f.cid] = f.id;
  }

  historyList.innerHTML = localHistory
    .map((entry) => {
      const fileId = cidToId[entry.cid] || "";
      const date = new Date(entry.uploadedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
      <div class="history-item" data-cid="${entry.cid}" data-fileid="${fileId}">
        <div class="history-item-info">
          <div class="history-item-name">${escapeHtml(entry.fileName)}</div>
          <div class="history-item-meta">${formatFileSize(entry.fileSize)} &middot; ${date}</div>
        </div>
        <div class="history-item-actions">
          <button class="btn-icon" title="Copy share link" onclick="window.__copyHistoryLink('${escapeAttr(entry.shareLink)}')">&#128203;</button>
          <button class="btn-icon btn-icon-danger" title="Delete from IPFS" onclick="window.__deleteHistoryFile('${entry.cid}', '${fileId}')">&#128465;</button>
        </div>
      </div>`;
    })
    .join("");
}

// Expose to onclick handlers
window.__copyHistoryLink = function (link) {
  navigator.clipboard.writeText(link).then(() => {
    showToast("Link copied!", "success");
  });
};

window.__deleteHistoryFile = async function (cid, fileId) {
  if (!confirm("Delete this file from IPFS? This cannot be undone.")) return;

  try {
    if (fileId) {
      await deleteFile(apiKey, fileId);
      showToast("File deleted from IPFS", "success");
    } else {
      showToast("File removed from history (could not find on Lighthouse)", "info");
    }
    removeFromHistory(cid);
    loadHistory();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
};

// ─── Download Flow ───
function checkForDownloadLink() {
  const hash = window.location.hash;
  if (!hash.startsWith("#/d/")) return;

  const parts = hash.slice(4).split("/");
  if (parts.length < 2) return;

  const [cid, keyB64] = parts;

  // Show download section, hide everything else
  $("#upload-section").classList.add("hidden");
  $("#setup-section").classList.add("hidden");
  $("#history-section").classList.add("hidden");
  $("#download-section").classList.remove("hidden");
  $("#dl-cid").textContent = cid;

  // Store for download handler
  $("#download-btn").dataset.cid = cid;
  $("#download-btn").dataset.key = keyB64;
}

async function handleDownload() {
  const btn = $("#download-btn");
  const cid = btn.dataset.cid;
  const keyB64 = btn.dataset.key;

  btn.disabled = true;
  btn.textContent = "Downloading...";
  $("#dl-progress").classList.remove("hidden");

  try {
    // Step 1: Download from IPFS
    updateDlProgress(0, "Fetching from IPFS...");
    const encrypted = await downloadFromIPFS(cid, (pct) => {
      updateDlProgress(pct * 0.5, "Fetching from IPFS...");
    });

    // Step 2: Decrypt
    updateDlProgress(50, "Decrypting...");
    const rawKey = fromBase64Url(keyB64);
    const { blob, meta } = await decryptFile(encrypted, rawKey, (pct) => {
      updateDlProgress(50 + pct * 0.5, "Decrypting...");
    });

    updateDlProgress(100, "Done!");

    // Step 3: Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.name || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    btn.textContent = "Downloaded!";
    $("#dl-filename").textContent = `${meta.name} (${formatFileSize(meta.size)})`;
    $("#dl-filename").classList.remove("hidden");
  } catch (err) {
    showToast("Download failed: " + err.message, "error");
    btn.disabled = false;
    btn.textContent = "Download & Decrypt";
  }
}

function updateDlProgress(pct, label) {
  const bar = $("#dl-bar");
  const text = $("#dl-text");
  if (bar) bar.style.width = `${pct}%`;
  if (text) text.textContent = label;
}

// ─── Helpers ───
function copyShareLink() {
  const link = $("#share-link").value;
  navigator.clipboard.writeText(link).then(() => {
    showToast("Link copied!", "success");
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function showToast(message, type = "info") {
  const container = $("#toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fade");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
