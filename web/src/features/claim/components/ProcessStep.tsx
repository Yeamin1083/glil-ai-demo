import type { CSSProperties } from 'react'
import { Typewriter } from '../../../shared/components/Typewriter'
import { STATUS_LABEL, STATUS_TONE } from '../../../shared/constants'
import { bdt, humanize } from '../../../shared/format'
import type { OfficerDecision, Review } from '../types'
import { OfficerComparison } from './OfficerComparison'

interface Props {
  review: Review
  officerDecision: OfficerDecision | null
  reviewedBy: string
  canSignOff: boolean
  busy: boolean
  onBack: () => void
  onSignOff: () => void
}

const order = (i: number) => ({ '--i': i }) as CSSProperties

export function ProcessStep(props: Props) {
  const { review, officerDecision, reviewedBy, canSignOff, busy, onBack, onSignOff } = props
  const failed = review.checks.filter((c) => !c.passed).length

  return (
    <div className="stack">
      <section className={`card verdict tone-${STATUS_TONE[review.status]}`} aria-live="polite">
        <div>
          <span className="eyebrow">The AI recommends</span>
          <p className="verdict-status">{STATUS_LABEL[review.status]}</p>
          {review.rejection_reason && <p className="reason">{humanize(review.rejection_reason)}</p>}
          {review.required_documents && <p className="reason">Ask the member for: {review.required_documents}</p>}
          <p className="ai-voice">
            <Typewriter text={review.summary} delayMs={450} />
          </p>
        </div>
        <dl className="totals">
          <div><dt>Payable</dt><dd className="big">{bdt(review.total_payable)}</dd></div>
          <div><dt>Claimed</dt><dd>{bdt(review.total_claimed)}</dd></div>
          <div><dt>OPD limit left after this claim</dt><dd>{bdt(review.limit_after)}</dd></div>
        </dl>
      </section>

      <div className="two-col">
        <section className="card">
          <span className="eyebrow">Agent 2</span>
          <h3>Processing</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Expense</th>
                <th className="num">Claimed</th>
                <th className="num">Deducted</th>
                <th className="num">Payable</th>
              </tr>
            </thead>
            <tbody className="stagger">
              {review.expenses.map((e, i) => (
                <tr key={e.category} style={order(i)}>
                  <td>
                    {humanize(e.category)}
                    {e.remarks.map((r) => (
                      <div key={r} className="remark">{r}</div>
                    ))}
                  </td>
                  <td className="num">{bdt(e.claimed)}</td>
                  <td className={`num${e.deducted ? ' bad' : ''}`}>{e.deducted ? `−${bdt(e.deducted)}` : '—'}</td>
                  <td className="num"><strong>{bdt(e.payable)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <span className="eyebrow">Agent 3</span>
          <h3>
            Audit{' '}
            <span className={`small ${failed ? 'bad' : 'muted'}`}>
              {failed ? `${failed} issue${failed > 1 ? 's' : ''} found` : 'nothing found'}
            </span>
          </h3>
          <ul className="checks stagger">
            {review.checks.map((c, i) => (
              <li key={c.check} className={c.passed ? 'pass' : 'fail'} style={order(i)}>
                <span className="mark" aria-label={c.passed ? 'Passed' : 'Failed'}>{c.passed ? '✓' : '✕'}</span>
                <div>
                  <strong>{c.check}</strong>
                  <div className="muted small">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {officerDecision && <OfficerComparison officer={officerDecision} review={review} />}

      <section className="card row-between">
        <div>
          <span className="eyebrow">Post-audit</span>
          <p className="small">
            Reviewed by {reviewedBy}.{' '}
            {review.single_step_approval
              ? `Payable is ${bdt(3000)} or less, so sign-off approves it in one step.`
              : review.status === 'SETTLED'
                ? 'After sign-off it goes to doctor approval.'
                : ''}
          </p>
          {!canSignOff && <p className="muted small">Switch "Acting as" to the post-audit user to sign off.</p>}
        </div>
        <div className="actions">
          <button onClick={onBack} disabled={busy}>Send back to review</button>
          <button className="primary" disabled={!canSignOff || busy} onClick={onSignOff}>
            {busy ? 'Posting to Oracle…' : 'Sign off and post to Oracle'}
          </button>
        </div>
      </section>
    </div>
  )
}
