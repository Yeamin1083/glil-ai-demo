import type {
  ClaimIn,
  Fixtures,
  Intimation,
  OracleRecord,
  Review,
  SettleOut,
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

// forgets the claims saved during the demo, so re-running a claim is not a duplicate
export const resetDemo = () =>
  call<{ ok: boolean }>("/reset", { method: "POST" });

// AI call 1: reads the documents
export function extractClaim(file: File) {
  const form = new FormData();
  form.append("file", file);
  return call<Intimation>("/extract", { method: "POST", body: form });
}

// AI call 2: settles the officer-checked claim and double-checks it; the plan rules run in code
export function settleClaim(file: File, claim: ClaimIn) {
  const form = new FormData();
  form.append("file", file);
  form.append("claim", JSON.stringify(claim));
  return call<SettleOut>("/settle", { method: "POST", body: form });
}

export function approveClaim(
  intimationNumber: string,
  claim: ClaimIn,
  review: Review,
  reviewOfficer: string,
  auditOverrideRemarks: string,
) {
  return call<OracleRecord>("/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intimation_number: intimationNumber,
      claim,
      review,
      review_officer: reviewOfficer,
      audit_override_remarks: auditOverrideRemarks,
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
