import { STATUS_TONE } from '../../../shared/constants'
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

export function ProcessStep(props: Props) {
  const { review, officerDecision, reviewedBy, canSignOff, busy, onBack, onSignOff } = props
  const failed = review.checks.filter((c) => !c.passed).length

  return (
    <div className="stack">
      <section className={`card verdict tone-${STATUS_TONE[review.status]}`}>
        <div>
          <span className="eyebrow">AI recommendation</span>
          <h2>{review.status}</h2>
          {review.rejection_reason && <p className="reason">{review.rejection_reason}</p>}
          {review.required_documents && <p className="reason">Ask for: {review.required_documents}</p>}
          <p>{review.summary}</p>
        </div>
        <dl className="totals">
          <div><dt>Claimed</dt><dd>{bdt(review.total_claimed)}</dd></div>
          <div><dt>Payable</dt><dd>{bdt(review.total_payable)}</dd></div>
          <div><dt>OPD limit left</dt><dd>{bdt(review.limit_before)} → {bdt(review.limit_after)}</dd></div>
        </dl>
      </section>

      {officerDecision && <OfficerComparison officer={officerDecision} review={review} />}

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
            <tbody>
              {review.expenses.map((e) => (
                <tr key={e.category}>
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
            Audit <span className="muted small">{failed ? `${failed} issue${failed > 1 ? 's' : ''}` : 'all clear'}</span>
          </h3>
          <ul className="checks">
            {review.checks.map((c) => (
              <li key={c.check} className={c.passed ? 'pass' : 'fail'}>
                <span className="mark">{c.passed ? '✓' : '✕'}</span>
                <div>
                  <strong>{c.check}</strong>
                  <div className="muted small">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card row-between">
        <div>
          <span className="eyebrow">Post-audit</span>
          <p className="muted small">
            Reviewed by {reviewedBy}.{' '}
            {review.single_step_approval
              ? `OPD payable ≤ ${bdt(3000)}: approved in one step.`
              : review.status === 'SETTLED'
                ? 'Goes on to doctor approval after sign-off.'
                : ''}
          </p>
          {!canSignOff && <p className="muted small">Switch to a Post-audit user to sign off.</p>}
        </div>
        <div className="actions">
          <button onClick={onBack} disabled={busy}>Send back to review</button>
          <button className="primary" disabled={!canSignOff || busy} onClick={onSignOff}>
            {busy ? 'Posting…' : 'Sign off & post to Oracle'}
          </button>
        </div>
      </section>
    </div>
  )
}
