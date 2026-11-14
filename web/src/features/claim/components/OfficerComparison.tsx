import { STATUS_TONE } from '../../../shared/constants'
import { bdt, humanize } from '../../../shared/format'
import type { OfficerDecision, Review } from '../types'

// what the officer actually decided in ACPS, beside the AI's recommendation
export function OfficerComparison({ officer, review }: { officer: OfficerDecision; review: Review }) {
  const sameStatus = officer.status === review.status
  const payableGap = review.total_payable - officer.payable_amount

  return (
    <section className="card">
      <div className="row-between">
        <div>
          <span className="eyebrow">What actually happened</span>
          <h3>The officer's decision in ACPS</h3>
        </div>
        <span className={`pill ${sameStatus && payableGap === 0 ? 'pill-good' : 'pill-warn'}`}>
          {sameStatus ? (payableGap === 0 ? 'AI matches the officer' : 'Same decision, different payable') : 'AI decided differently'}
        </span>
      </div>

      <div className="compare">
        <div>
          <span className="muted small">Officer</span>
          <p className={`compare-status tone-text-${STATUS_TONE[officer.status]}`}>{humanize(officer.status)}</p>
          {officer.rejection_reason && <p className="reason">{humanize(officer.rejection_reason)}</p>}
          {officer.required_documents && <p className="small">Asked for: {officer.required_documents}</p>}
          <p className="small">Payable {bdt(officer.payable_amount)} of {bdt(officer.claimed_amount)}</p>
        </div>
        <div className="ai-side">
          <span className="muted small">AI</span>
          <p className={`compare-status tone-text-${STATUS_TONE[review.status]}`}>{humanize(review.status)}</p>
          {review.rejection_reason && <p className="reason">{humanize(review.rejection_reason)}</p>}
          {review.required_documents && <p className="small">Asks for: {review.required_documents}</p>}
          <p className="small">Payable {bdt(review.total_payable)} of {bdt(review.total_claimed)}</p>
        </div>
      </div>

      {officer.expenses.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Officer's expenses</th>
              <th className="num">Claimed</th>
              <th className="num">Deducted</th>
              <th className="num">Payable</th>
            </tr>
          </thead>
          <tbody>
            {officer.expenses.map((e) => (
              <tr key={e.category}>
                <td>
                  {humanize(e.category)}
                  {e.remarks && <div className="remark">{e.remarks}</div>}
                </td>
                <td className="num">{bdt(e.claimed)}</td>
                <td className={`num${e.deducted ? ' bad' : ''}`}>{e.deducted ? `−${bdt(e.deducted)}` : '—'}</td>
                <td className="num">{bdt(e.payable)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {(officer.reviewed_by || officer.decided_by) && (
        <p className="muted small">
          {officer.reviewed_by && `Assigned officer: ${officer.reviewed_by}. `}
          {officer.decided_by && `Decided by: ${officer.decided_by}.`}
        </p>
      )}
    </section>
  )
}
