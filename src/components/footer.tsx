import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            A product by{' '}
            <Link href="https://fasttools.store" target="_blank" className="text-secondary-foreground hover:underline">
              fasttools.store
            </Link>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href="https://github.com/Husnain555/DecentraSend"
              target="_blank"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </Link>
            <Separator orientation="vertical" className="h-3" />
            <Link
              href="https://github.com/Husnain555/DecentraSend/blob/main/LICENSE"
              target="_blank"
              className="hover:text-primary transition-colors"
            >
              MIT License
            </Link>
            <Separator orientation="vertical" className="h-3" />
            <Link
              href="https://github.com/Husnain555/DecentraSend/blob/main/SECURITY.md"
              target="_blank"
              className="hover:text-primary transition-colors"
            >
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
