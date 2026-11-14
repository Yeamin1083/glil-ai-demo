import type { ClaimIn, Extraction, Fixtures, OracleRecord, Review } from './types'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body?.detail
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status})`)
  }
  return body as T
}

export const getFixtures = () => call<Fixtures>('/fixtures')

export function extractClaim(file: File) {
  const form = new FormData()
  form.append('file', file)
  return call<Extraction>('/extract', { method: 'POST', body: form })
}

export function reviewClaim(file: File, claim: ClaimIn) {
  const form = new FormData()
  form.append('file', file)
  form.append('claim', JSON.stringify(claim))
  return call<Review>('/review', { method: 'POST', body: form })
}

export function approveClaim(claim: ClaimIn, review: Review, reviewOfficer: string, postAuditor: string) {
  return call<OracleRecord>('/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim, review, review_officer: reviewOfficer, post_auditor: postAuditor }),
  })
}
