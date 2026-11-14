import { useState } from 'react'
import { bdt } from '../../../shared/format'
import type { Member, Sample } from '../types'

interface Props {
  members: Member[]
  samples: Sample[]
  busy: boolean
  onSubmit: (file: File, memberCode: string, sample: Sample | null) => void
}

export function IntimationStep({ members, samples, busy, onSubmit }: Props) {
  // with ACPS samples loaded, the officer picks the claim; otherwise just a member
  const [sampleNo, setSampleNo] = useState(samples[0]?.intimation_number ?? '')
  const [memberCode, setMemberCode] = useState(members[0]?.code ?? '')
  const [file, setFile] = useState<File | null>(null)

  const sample = samples.find((s) => s.intimation_number === sampleNo) ?? null
  const code = sample ? sample.member_code : memberCode
  const member = members.find((m) => m.code === code)

  return (
    <section className="card narrow">
      <h2>Claim intimation</h2>
      <p className="muted">
        Pick the claim and upload its documents (bills, money receipts, prescription) as one PDF or
        image. Agent 1 reads them and pre-fills the intimation.
      </p>

      {samples.length > 0 ? (
        <label className="field">
          <span>Claim (ACPS_T)</span>
          <select value={sampleNo} onChange={(e) => setSampleNo(e.target.value)}>
            {samples.map((s) => (
              <option key={s.intimation_number} value={s.intimation_number}>
                {s.intimation_number}, submitted {s.reference_date}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field">
          <span>Member</span>
          <select value={memberCode} onChange={(e) => setMemberCode(e.target.value)}>
            {members.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name} ({m.relation.toLowerCase()}), {m.code}
              </option>
            ))}
          </select>
        </label>
      )}

      {member && (
        <dl className="member-card">
          <div><dt>Member</dt><dd>{member.name}</dd></div>
          <div><dt>Member code</dt><dd>{member.code} ({member.relation.toLowerCase()})</dd></div>
          <div><dt>Status</dt><dd className={member.is_active ? '' : 'bad'}>{member.is_active ? 'Active' : 'Inactive'}</dd></div>
          <div><dt>Plan</dt><dd>Plan {member.plan.plan_name}, OPD {member.plan.claim_type.toLowerCase()} {bdt(member.plan.opd_limit)}</dd></div>
          <div><dt>Cycle</dt><dd>{member.plan.cycle_start} to {member.plan.cycle_end}</dd></div>
          <div><dt>OPD limit left</dt><dd>{bdt(member.limit_remaining)}</dd></div>
        </dl>
      )}

      <label className={`dropzone${file ? ' has-file' : ''}`}>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <strong>{file ? file.name : 'Choose claim documents'}</strong>
        <span className="muted">
          {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF or image of printed documents'}
        </span>
      </label>

      <div className="actions">
        <button
          className="primary"
          disabled={!file || !code || busy}
          onClick={() => file && onSubmit(file, code, sample)}
        >
          {busy ? 'Reading…' : 'Intimate and read documents'}
        </button>
      </div>
    </section>
  )
}
