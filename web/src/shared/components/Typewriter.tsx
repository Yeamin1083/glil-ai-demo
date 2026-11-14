import { useEffect, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  text: string
  cps?: number // characters per second
  delayMs?: number
}

// types text out like a chat reply; new text remounts it, so it starts over
export function Typewriter(props: Props) {
  return <Typing key={props.text} {...props} />
}

function Typing({ text, cps = 90, delayMs = 0 }: Props) {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0))

  useEffect(() => {
    if (reducedMotion()) return
    let timer: number
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        // a few characters per tick reads smoother than one at a time
        setShown((n) => Math.min(text.length, n + 3))
      }, 3000 / cps)
    }, delayMs)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [text, cps, delayMs])

  const done = shown >= text.length
  return (
    <span aria-label={text}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {!done && <span className="caret" aria-hidden="true" />}
    </span>
  )
}
