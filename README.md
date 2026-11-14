# glil-ai-demo

Demo of the ACPS claims flow with AI agents, for OPD group health claims up to 5,000 BDT. It runs on real ACPS_T claims, but it has no database connection: the data is exported once to a local file, and the demo's changes live in memory and reset when the server restarts.

```
Intimation ─► Intake agent ─► Human review ─► Adjudication + Audit agents ─► Post-audit ─► "Oracle"
              (ocr-extract)   (Claims Officer)   (1 Gemini call + code rules)    (Post-audit user)
```

- **Intake agent** (agent 1 in the flow) is the real `ocr-extract` service, called over HTTP.
- **Adjudication and audit agents** (agents 2 and 3) share one Gemini call that judges the documents: deductions, audit checks and a suggested status. Code then applies the member's plan limits, submission window, cycle dates, member status, name match and duplicates (`server/app/rules.py`).
- **The officer's actual decision** from ACPS is shown beside the AI's when the uploaded documents are a claim ACPS already processed.

## Data

`server/members.local.json` is exported read-only from ACPS_T by `server/scripts/export_acps_t.py`. It holds, for each sample claim:

- **The member:** name, relation, active status, plan limits, cycle, submission window, the limit already used before this claim, and earlier claims for the duplicate check.
- **The officer's decision:** status, reason, documents asked for, and expenses with remarks.
- **Users from `x_users`:** the claims officers assigned to the samples, plus an active claim analyst as post-auditor.

The file holds real member and staff names, so it is **gitignored and must never be committed**. Without it, the server falls back to three fictional members on ACPS_T plan_id 59.

To regenerate it (VPN needed, run from the ACPS repo with its venv):

```
cd ~/Projects/work/acps
PYTHONPATH=. .venv/bin/python ~/Projects/personal/glil-ai-demo/server/scripts/export_acps_t.py \
    ~/Projects/personal/glil-ai-demo/server/members.local.json <intimation numbers…>
```

Samples are chosen as OPD claims up to 5,000 BDT whose member is active and enrolled for the claim's cycle, and whose assigned officer is active in `x_users`. Each needs its documents as one PDF (the "all documents" PDF from ACPS), with printed documents, not handwritten.

## Who decides the status

| Outcome | Decided by |
|---|---|
| REGRETTED: inactive member, duplicate, late submission, outside the cycle, name mismatch, no limit left | Code. Always overrides the model. |
| SETTLED, DOCUMENTS REQUIRED, or REGRETTED with a listed reason | Model, judging the documents. |
| Model rejection without a listed reason | Code changes it to DOCUMENTS REQUIRED. |
| Final status | Post-audit user, who signs off or sends the claim back. |

The model chooses DOCUMENTS REQUIRED when a document is missing or there's a discrepancy the member could fix, such as dates or totals. It writes the request to the member into `required_documents`, which ACPS requires for that status.

The name check compares the patient on the documents with the member's name, ignoring titles, initials and punctuation ("Mr. A.K.M. Nurul Huda" matches "Nurul Huda"). Another person's documents are rejected as NAME MISMATCH.

Deductions use a fixed remark list cleaned from ACPS `x_expense_remarks`. A bill-level discount is deducted with "Discount amount is not payable", because the amounts stay gross.

## Run

1. Start ocr-extract on port 8000 (`uv run uvicorn app.main:app --port 8000` in that repo).
2. Start the server:
   ```
   cd server
   cp .env.example .env   # fill in the keys
   uv run uvicorn app.main:app --port 8001
   ```
3. Start the web app:
   ```
   cd web
   npm install
   npm run dev
   ```

## Demo script

1. **Intimation:** search for the member, upload their claim documents and press "Intimate claim". This creates the claim and its intimation number, and the intake agent reads the documents.
2. **Review:** acting as a Claims Officer, check the pre-filled form against the document and confirm.
3. **Processing and audit:** read the AI's decision. If ACPS also processed this claim by hand (same member, same patient and amount), the officer's real decision is shown beside it.
4. **Post-audit:** switch "Acting as" to the Post-audit user and sign off.

To show the other checks:
- **Name mismatch:** pick a member and upload another member's documents.
- **Duplicate:** sign a claim off, then submit the same documents again.

## Checks

```
cd server && uv run pytest && uv run ruff check .
cd web && npm run build && npm run lint
```
