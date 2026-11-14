import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  file: File
  title: string
  steps: string[]
}

// ponytail: steps advance on a timer, not real progress; the last one waits for the response
const STEP_MS = 1800

export function ScanOverlay({ file, title, steps }: Props) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((i) => Math.min(i + 1, steps.length - 1)), STEP_MS)
    return () => window.clearInterval(timer)
  }, [steps.length])

  return (
    <Card className="grid items-center gap-8 p-4 md:grid-cols-[1fr_minmax(300px,0.8fr)]" aria-live="polite" aria-busy="true">
      <div className="relative isolate h-[46vh] overflow-hidden rounded-lg border bg-muted md:h-[min(70vh,720px)]">
        {file.type === 'application/pdf' ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            title="Document being read"
            tabIndex={-1}
            className="pointer-events-none size-full grayscale-[40%]"
          />
        ) : (
          <img src={url} alt="Document being read" className="size-full object-contain grayscale-[40%]" />
        )}
        <div className="scan-beam" aria-hidden="true" />
        <div className="scan-grid" aria-hidden="true" />
      </div>

      <div className="pr-4">
        <div className="orb mb-5 size-11 rounded-xl" aria-hidden="true" />
        <h2 className="shimmer-text text-xl font-semibold tracking-tight">{title}</h2>
        <ol className="mt-5 grid gap-3 text-sm">
          {steps.map((step, i) => (
            <li
              key={step}
              className={cn(
                'flex items-center gap-2.5 text-muted-foreground transition-colors',
                i < active && 'text-foreground',
                i === active && 'font-medium text-foreground',
              )}
            >
              <span
                className={cn(
                  'grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px]',
                  i < active && 'border-primary bg-primary text-primary-foreground',
                  i === active && 'animate-spin border-[var(--ai-a)] border-t-transparent',
                )}
                aria-hidden="true"
              >
                {i < active && <Check className="size-3" />}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
