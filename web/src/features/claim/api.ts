import type {
  AuditResult,
  ClaimIn,
  Fixtures,
  Intimation,
  OracleRecord,
  Review,
  Status,
} from "./types";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export const getFixtures = () => call<Fixtures>("/fixtures");

// AI call 1: reads the documents and proposes the settlement in the same call
export function extractClaim(file: File, memberCode: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("member_code", memberCode);
  return call<Intimation>("/extract", { method: "POST", body: form });
}

export function approveClaim(
  intimationNumber: string,
  claim: ClaimIn,
  review: Review,
  reviewOfficer: string,
  postAuditor: string,
) {
  return call<OracleRecord>("/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intimation_number: intimationNumber,
      claim,
      review,
      review_officer: reviewOfficer,
      post_auditor: postAuditor,
    }),
  });
}

// applies the plan rules to the settlement, with the officer's own decision if they changed it; no AI call
export function decideClaim(
  claim: ClaimIn,
  judgement: Review["judgement"],
  status: Status | null,
  remarks: string,
) {
  return call<Review>("/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claim, judgement, status, remarks }),
  });
}

// AI call 2: double-checks the officer's final decision against the documents
export function auditClaim(file: File, claim: ClaimIn, review: Review) {
  const form = new FormData();
  form.append("file", file);
  form.append("claim", JSON.stringify(claim));
  form.append("review", JSON.stringify({ ...review, judgement: null }));
  return call<AuditResult>("/audit", { method: "POST", body: form });
}
