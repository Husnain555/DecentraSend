'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  FileUp,
  Lock,
  Check,
  Copy,
  RotateCcw,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { encryptFile, exportKey, toBase64Url } from '@/lib/crypto'
import { uploadToIPFS } from '@/lib/ipfs'
import type { HistoryEntry } from '@/app/page'

interface UploadSectionProps {
  apiKey: string
  onUpload: (entry: HistoryEntry) => void
  onChangeKey: () => void
}

type Stage = 'idle' | 'encrypting' | 'uploading' | 'done'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function UploadSection({ apiKey, onUpload, onChangeKey }: UploadSectionProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const [encryptProgress, setEncryptProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<{
    cid: string
    shareLink: string
    encryptedSize: number
    fileSize: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name)
      setStage('encrypting')
      setEncryptProgress(0)
      setUploadProgress(0)
      setResult(null)

      try {
        const { encrypted, key } = await encryptFile(file, (pct) =>
          setEncryptProgress(pct)
        )
        setEncryptProgress(100)
        setStage('uploading')

        const cid = await uploadToIPFS(encrypted, apiKey, (pct) =>
          setUploadProgress(pct)
        )
        setUploadProgress(100)

        const rawKey = await exportKey(key)
        const keyB64 = toBase64Url(rawKey)
        const shareLink = `${window.location.origin}${window.location.pathname}#/d/${cid}/${keyB64}`

        const resultData = {
          cid,
          shareLink,
          encryptedSize: encrypted.length,
          fileSize: file.size,
        }
        setResult(resultData)
        setStage('done')

        onUpload({
          cid,
          fileName: file.name,
          fileSize: file.size,
          encryptedSize: encrypted.length,
          shareLink,
          uploadedAt: new Date().toISOString(),
        })

        toast.success('File encrypted and uploaded')
      } catch (err) {
        toast.error((err as Error).message || 'Upload failed')
        setStage('idle')
      }
    },
    [apiKey, onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const copyLink = useCallback(() => {
    if (result?.shareLink) {
      navigator.clipboard.writeText(result.shareLink)
      toast.success('Link copied to clipboard')
    }
  }, [result])

  const reset = useCallback(() => {
    setStage('idle')
    setResult(null)
    setEncryptProgress(0)
    setUploadProgress(0)
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-foreground">Send a File</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={onChangeKey}
        >
          <Settings className="mr-1.5 h-3 w-3" />
          Change Key
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        {stage === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10
              transition-all duration-200
              ${
                isDragging
                  ? 'border-primary bg-accent scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-muted'
              }
            `}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-secondary-foreground">Drop a file here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Encrypted locally before upload
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Progress */}
        {(stage === 'encrypting' || stage === 'uploading') && (
          <div className="space-y-5 rounded-xl bg-muted p-5">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-secondary-foreground">
                  <Lock className="h-3 w-3" />
                  {encryptProgress < 100 ? 'Encrypting...' : 'Encrypted'}
                </span>
                <span className="font-mono text-muted-foreground">{encryptProgress}%</span>
              </div>
              <Progress value={encryptProgress} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-secondary-foreground">
                  <Upload className="h-3 w-3" />
                  {uploadProgress < 100 ? 'Uploading to IPFS...' : 'Uploaded'}
                </span>
                <span className="font-mono text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          </div>
        )}

        {/* Result */}
        {stage === 'done' && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-foreground">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground">File ready to share</p>
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  CID: {result.cid.slice(0, 12)}...{result.cid.slice(-6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {formatSize(result.encryptedSize)}
                </p>
              </div>
            </div>

            <Textarea
              readOnly
              value={result.shareLink}
              className="font-mono text-xs resize-none h-20 bg-muted"
            />

            <div className="flex gap-2 justify-center">
              <Button onClick={copyLink} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={reset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                New Upload
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                The decryption key is in the link fragment (#) — never sent to any server. Only this exact link can decrypt the file.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
