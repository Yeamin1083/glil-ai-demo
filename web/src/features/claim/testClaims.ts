// real ACPS_T claims, one per outcome; their documents are fetched into public/samples/claims/ (gitignored)
export interface TestClaim {
  number: string
  memberCode: string
  label: string
  claimed: number
  paid: number
  result: string
}

// members come from server/members.local.json, made with scripts/export_acps_t.py from these same claim numbers
export const TEST_CLAIMS: TestClaim[] = [
  { number: 'GH26-854843', memberCode: '7523000054-9', label: 'Paid in full (medicine)', claimed: 2645, paid: 2645, result: 'Settled' },
  { number: 'GH26-100050', memberCode: '7049000352-0', label: 'Paid in full (medicine and doctor)', claimed: 6225, paid: 6225, result: 'Settled' },
  { number: 'GH26-854849', memberCode: '7570BA2088-1', label: 'Part paid (3 bills)', claimed: 6166, paid: 5866, result: 'Settled' },
  { number: 'GH26-854278', memberCode: '7287005323-2', label: 'Part paid (big cut)', claimed: 4290, paid: 1400, result: 'Settled' },
  { number: 'GH26-992276', memberCode: '7193APS097-2', label: 'No limit left', claimed: 3470, paid: 0, result: 'Regretted' },
  { number: 'GH26-991131', memberCode: '7678000163-1', label: 'Sent too late', claimed: 2264, paid: 0, result: 'Regretted' },
  { number: 'GH26-990863', memberCode: '7570BA2296-0', label: 'Dental or optical, not covered', claimed: 1999, paid: 0, result: 'Regretted' },
  { number: 'GH26-988860', memberCode: '7633LB1080-1', label: 'Doctor not registered', claimed: 1067, paid: 0, result: 'Regretted' },
  { number: 'GH26-993474', memberCode: '7666RA5696-8', label: 'Duplicate claim', claimed: 1900, paid: 0, result: 'Regretted' },
  { number: 'GH26-985321', memberCode: '75950C3817-0', label: 'Could not provide documents', claimed: 350, paid: 0, result: 'Regretted' },
  { number: 'GH26-997402', memberCode: '7666AT0178-2', label: 'More documents needed', claimed: 3242, paid: 0, result: 'Documents required' },
]

export async function loadTestClaimFile(claim: TestClaim): Promise<File> {
  const res = await fetch(`/samples/claims/${claim.number}.pdf`)
  // ponytail: Vite answers missing files with index.html (200), so check the type too
  if (!res.ok || !res.headers.get('content-type')?.includes('pdf')) throw new Error(`Document for ${claim.number} is missing. Fetch the claim documents first.`)
  return new File([await res.blob()], `${claim.number}.pdf`, { type: 'application/pdf' })
}
