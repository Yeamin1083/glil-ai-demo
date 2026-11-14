import { useState } from 'react'
import { bdt } from '../../../shared/format'
import type { Member } from '../types'

interface Props {
  members: Member[]
  busy: boolean
  onSubmit: (file: File, memberCode: string) => void
}

export function IntimationStep({ members, busy, onSubmit }: Props) {
  const [memberCode, setMemberCode] = useState(members[0]?.code ?? '')
  const [file, setFile] = useState<File | null>(null)

  return (
    <section className="card narrow">
      <h2>Claim intimation</h2>
      <p className="muted">
        Pick the member and upload the claim documents (bills, money receipts, prescription) as one
        PDF or image. Agent 1 reads them and pre-fills the intimation.
      </p>

      <label className="field">
        <span>Member</span>
        <select value={memberCode} onChange={(e) => setMemberCode(e.target.value)}>
          {members.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name} · {m.relation} · {m.code} · {bdt(m.limit_remaining)} OPD limit left
            </option>
          ))}
        </select>
      </label>

      <label className={`dropzone${file ? ' has-file' : ''}`}>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <strong>{file ? file.name : 'Choose claim documents'}</strong>
        <span className="muted">
          {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF, JPEG, PNG or WebP · printed documents only'}
        </span>
      </label>

      <div className="actions">
        <button
          className="primary"
          disabled={!file || !memberCode || busy}
          onClick={() => file && onSubmit(file, memberCode)}
        >
          {busy ? 'Agent 1 is reading the documents…' : 'Intimate & extract'}
        </button>
      </div>
    </section>
  )
}
