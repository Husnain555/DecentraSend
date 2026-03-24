import { Lock, Upload, Share2, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    icon: Lock,
    title: 'Encrypt',
    description: 'AES-256-GCM encryption runs in your browser. A unique key is generated per file.',
  },
  {
    icon: Upload,
    title: 'Upload',
    description: 'Only the encrypted ciphertext is pinned to IPFS via Lighthouse.',
  },
  {
    icon: Share2,
    title: 'Share',
    description: 'Get a link with CID + key in the URL fragment. Key never reaches any server.',
  },
  {
    icon: Download,
    title: 'Decrypt',
    description: "Recipient opens the link, fetches from IPFS, decrypts in their browser.",
  },
]

export function HowItWorks() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">How It Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <span className="text-xs font-bold">{i + 1}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
