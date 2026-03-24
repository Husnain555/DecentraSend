'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { SetupSection } from '@/components/setup-section'
import { UploadSection } from '@/components/upload-section'
import { HistorySection } from '@/components/history-section'
import { DownloadSection } from '@/components/download-section'
import { HowItWorks } from '@/components/how-it-works'
import { Footer } from '@/components/footer'

export interface HistoryEntry {
  cid: string
  fileName: string
  fileSize: number
  encryptedSize: number
  shareLink: string
  uploadedAt: string
}

const MAX_HISTORY = 50
const STORAGE_KEY = 'upload_history'
const API_KEY_STORAGE = 'lighthouse_api_key'

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [downloadInfo, setDownloadInfo] = useState<{ cid: string; key: string } | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const stored = localStorage.getItem(API_KEY_STORAGE)
    if (stored) setApiKey(stored)

    const hist = localStorage.getItem(STORAGE_KEY)
    if (hist) {
      try { setHistory(JSON.parse(hist)) } catch { /* ignore */ }
    }

    const hash = window.location.hash
    const match = hash.match(/^#\/d\/([^/]+)\/(.+)$/)
    if (match) {
      setDownloadInfo({ cid: match[1], key: match[2] })
    }
  }, [])

  const handleSaveKey = useCallback((key: string) => {
    if (key.trim().length < 10) {
      toast.error('API key looks too short. Please check your Lighthouse token.')
      return
    }
    localStorage.setItem(API_KEY_STORAGE, key.trim())
    setApiKey(key.trim())
    toast.success('API key saved')
  }, [])

  const handleChangeKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE)
    setApiKey(null)
  }, [])

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeFromHistory = useCallback((cid: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.cid !== cid)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  if (downloadInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <DownloadSection cid={downloadInfo.cid} encryptionKey={downloadInfo.key} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {!apiKey ? (
            <SetupSection onSave={handleSaveKey} />
          ) : (
            <>
              <UploadSection apiKey={apiKey} onUpload={addToHistory} onChangeKey={handleChangeKey} />
              <HistorySection
                history={history}
                apiKey={apiKey}
                onDelete={removeFromHistory}
              />
            </>
          )}
          <HowItWorks />
        </div>
      </main>
      <Footer />
    </div>
  )
}
