'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { Clock, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteFile, listUploads } from '@/lib/ipfs'
import type { HistoryEntry } from '@/app/page'

interface HistorySectionProps {
  history: HistoryEntry[]
  apiKey: string
  onDelete: (cid: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistorySection({ history, apiKey, onDelete }: HistorySectionProps) {
  const copyLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Link copied')
  }, [])

  const handleDelete = useCallback(
    async (cid: string) => {
      if (!confirm('Delete this file from Lighthouse? This cannot be undone.')) return

      try {
        const files = await listUploads(apiKey)
        const match = files.find((f: { cid: string }) => f.cid === cid)
        if (match) {
          await deleteFile(apiKey, match.id)
        }
        onDelete(cid)
        toast.success('File deleted')
      } catch {
        onDelete(cid)
        toast.info('Removed from history')
      }
    },
    [apiKey, onDelete]
  )

  if (history.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Your Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Clock className="h-8 w-8 text-border" />
            <p className="text-sm text-muted-foreground">
              No uploads yet. Files you send will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Your Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {history.map((entry) => (
          <div
            key={entry.cid}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted group"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{entry.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(entry.fileSize)} &middot; {formatDate(entry.uploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => copyLink(entry.shareLink)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(entry.cid)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
