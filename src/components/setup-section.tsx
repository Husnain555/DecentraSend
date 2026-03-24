'use client'

import { useState } from 'react'
import { Key, Lock, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SetupSectionProps {
  onSave: (key: string) => void
}

export function SetupSection({ onSave }: SetupSectionProps) {
  const [key, setKey] = useState('')

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl text-foreground">Get Started</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your{' '}
          <a
            href="https://files.lighthouse.storage/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Lighthouse API key
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          to start sending files. Free 5 GB storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Paste your Lighthouse API token..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave(key)}
            className="font-mono text-sm"
          />
          <Button onClick={() => onSave(key)} disabled={!key.trim()}>
            Save
          </Button>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-accent p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Stored locally in your browser. Never sent to us — only used to pin encrypted files to IPFS.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
