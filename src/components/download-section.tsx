'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Download, Lock, FileDown, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { downloadFromIPFS } from '@/lib/ipfs'
import { decryptFile, fromBase64Url } from '@/lib/crypto'

interface DownloadSectionProps {
  cid: string
  encryptionKey: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function DownloadSection({ cid, encryptionKey }: DownloadSectionProps) {
  const [stage, setStage] = useState<'ready' | 'downloading' | 'done'>('ready')
  const [progress, setProgress] = useState(0)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)

  const handleDownload = useCallback(async () => {
    setStage('downloading')
    setProgress(0)

    try {
      const encrypted = await downloadFromIPFS(cid, (pct) =>
        setProgress(Math.floor(pct * 0.5))
      )

      const rawKey = fromBase64Url(encryptionKey)
      const { blob, meta } = await decryptFile(encrypted, rawKey, (pct) =>
        setProgress(50 + Math.floor(pct * 0.5))
      )

      setProgress(100)
      setFileMeta(meta)
      setStage('done')

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = meta.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${meta.name}`)
    } catch (err) {
      toast.error((err as Error).message || 'Download failed')
      setStage('ready')
    }
  }, [cid, encryptionKey])

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {stage === 'ready' && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <FileDown className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Someone sent you a file</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  End-to-end encrypted. The decryption key is embedded in the link — no one else can read it.
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-3 bg-muted rounded-md px-3 py-1.5 inline-block">
                  {cid.slice(0, 16)}...{cid.slice(-8)}
                </p>
              </div>
              <Button size="lg" className="w-full gap-2" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download & Decrypt
              </Button>
            </>
          )}

          {stage === 'downloading' && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent animate-pulse">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-foreground">{progress < 50 ? 'Fetching from IPFS...' : 'Decrypting...'}</span>
                  <span className="font-mono text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </>
          )}

          {stage === 'done' && fileMeta && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-foreground">
                <Check className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{fileMeta.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(fileMeta.size)} — Decrypted successfully
                </p>
              </div>
            </>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-muted-foreground w-full">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Decryption happens entirely in your browser. No server or IPFS node ever sees the plaintext.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
