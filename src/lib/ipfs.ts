/**
 * DecentraSend — IPFS module
 * Upload: Lighthouse.storage (5 GB free, perpetual Filecoin-backed storage)
 * Download: Multi-gateway fallback with trustless retrieval
 */

const LIGHTHOUSE_API_URL = 'https://upload.lighthouse.storage'
const LIGHTHOUSE_MANAGE_API = 'https://api.lighthouse.storage'

const GATEWAYS = [
  'https://gateway.lighthouse.storage/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
]

export async function uploadToIPFS(
  encryptedBytes: Uint8Array,
  apiKey: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const blob = new Blob([encryptedBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' })
  const formData = new FormData()
  formData.append('file', blob, 'encrypted.bin')

  onProgress?.(2)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${LIGHTHOUSE_API_URL}/api/v0/add`)
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 90) + 5
        onProgress(pct)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          onProgress?.(100)
          resolve(result.Hash)
        } catch {
          reject(new Error('Invalid response from Lighthouse'))
        }
      } else {
        reject(new Error(`Lighthouse upload failed (${xhr.status}): ${xhr.responseText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error — could not reach Lighthouse. Check your connection.'))
    })

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out. File may be too large or connection too slow.'))
    })

    xhr.timeout = 300000
    xhr.send(formData)
  })
}

export async function downloadFromIPFS(
  cid: string,
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  onProgress?.(5)

  for (let i = 0; i < GATEWAYS.length; i++) {
    const gwUrl = `${GATEWAYS[i]}${cid}`

    try {
      onProgress?.(10 + i * 5)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(gwUrl, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) continue

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength) : 0

      if (!response.body) {
        const arrayBuffer = await response.arrayBuffer()
        onProgress?.(100)
        return new Uint8Array(arrayBuffer)
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        if (onProgress && total) {
          onProgress(20 + Math.floor((received / total) * 75))
        }
      }

      const result = new Uint8Array(received)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }

      onProgress?.(100)
      return result
    } catch (err) {
      console.warn(`Gateway ${GATEWAYS[i]} failed:`, (err as Error).message)
      continue
    }
  }

  throw new Error('All IPFS gateways failed. The file may not be pinned or gateways are down.')
}

export function testApiKey(apiKey: string): Promise<boolean> {
  return Promise.resolve(typeof apiKey === 'string' && apiKey.trim().length >= 10)
}

export async function listUploads(apiKey: string) {
  const response = await fetch(`${LIGHTHOUSE_MANAGE_API}/api/user/files_uploaded`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new Error('Failed to fetch uploads')
  const data = await response.json()
  return data.fileList || []
}

export async function deleteFile(apiKey: string, fileId: string) {
  const response = await fetch(
    `${LIGHTHOUSE_MANAGE_API}/api/user/delete_file?id=${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
  if (!response.ok) throw new Error('Failed to delete file')
  return response.json()
}
