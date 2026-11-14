import type { OracleRecord } from '../types'

export function OracleStep({ record, onNext }: { record: OracleRecord; onNext: () => void }) {
  return (
    <section className="card narrow">
      <span className="eyebrow">System of record</span>
      <h2>Posted {String(record.intimation_number)}</h2>
      <p className="muted">
        What would be written to Oracle. Settled amounts now count against the member's limits, and
        submitting the same claim again is caught as a duplicate.
      </p>
      <pre className="record">{JSON.stringify(record, null, 2)}</pre>
      <div className="actions">
        <button className="primary" onClick={onNext}>Next claim</button>
      </div>
    </section>
  )
}
