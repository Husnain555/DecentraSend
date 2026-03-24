'use client'

import { Shield, Lock, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DecentraSend</h1>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Private file transfer powered by IPFS. End-to-end encrypted in your browser. No accounts. Zero knowledge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge className="gap-1.5 px-3 py-1 bg-accent text-accent-foreground border-border hover:bg-accent/80">
              <Lock className="h-3 w-3" />
              AES-256-GCM
            </Badge>
            <Badge className="gap-1.5 px-3 py-1 bg-accent text-accent-foreground border-border hover:bg-accent/80">
              <Globe className="h-3 w-3" />
              IPFS Pinned
            </Badge>
            <Badge className="gap-1.5 px-3 py-1 bg-accent text-accent-foreground border-border hover:bg-accent/80">
              <Shield className="h-3 w-3" />
              Zero Knowledge
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
