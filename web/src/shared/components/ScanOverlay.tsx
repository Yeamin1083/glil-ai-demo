import { useEffect, useMemo, useState } from 'react'

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
    const timer = window.setInterval(
      () => setActive((i) => Math.min(i + 1, steps.length - 1)),
      STEP_MS,
    )
    return () => window.clearInterval(timer)
  }, [steps.length])

  return (
    <section className="scan card" aria-live="polite" aria-busy="true">
      <div className="scan-doc">
        {file.type === 'application/pdf' ? (
          <iframe src={`${url}#toolbar=0&navpanes=0`} title="Document being read" tabIndex={-1} />
        ) : (
          <img src={url} alt="Document being read" />
        )}
        <div className="scan-beam" aria-hidden="true" />
        <div className="scan-grid" aria-hidden="true" />
      </div>

      <div className="scan-side">
        <div className="orb" aria-hidden="true" />
        <h2 className="shimmer-text">{title}</h2>
        <ol className="scan-steps">
          {steps.map((step, i) => (
            <li key={step} className={i < active ? 'done' : i === active ? 'active' : ''}>
              <span className="scan-dot" aria-hidden="true">{i < active ? '✓' : ''}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
