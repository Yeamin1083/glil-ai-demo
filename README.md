# glil-ai-demo

Demo of the ACPS claims flow with AI agents, for OPD group health claims up to 5,000 BDT. No database: the plan, members and claim history are hardcoded and reset when the server restarts.

```
Intimation ─► Agent 1 extract ─► Human review ─► Agents 2+3 review ─► Post-audit ─► "Oracle"
             (ocr-extract)      (Claims Officer)   (1 Gemini call       (Post-audit
                                                    + code rules)        user)
```

- **Agent 1** is the real `ocr-extract` service, called over HTTP.
- **Agents 2 and 3** share one Gemini call that judges the documents: deductions, audit checks and a suggested status. Code then applies plan limits, the 60-day submission window, cycle dates and duplicates (`server/app/rules.py`).
- **Plan** values are from ACPS_T plan_id 59 (org 7049, plan B), with the cycle shifted to Dec 2025–Nov 2026. The members and officers are fictional.

## Who decides the status

| Outcome | Decided by |
|---|---|
| REGRETTED: duplicate, late submission, outside the policy cycle, no limit left | Code. Always overrides the model. |
| SETTLED, DOCUMENTS REQUIRED, or REGRETTED with a listed reason | Model, judging the documents. |
| Model rejection without a listed reason | Code changes it to DOCUMENTS REQUIRED. |
| Final status | Post-audit user, who signs off or sends the claim back. |

The model chooses DOCUMENTS REQUIRED when a document is missing or there's a discrepancy the member could fix, such as dates, names or totals. It writes the request to the member into `required_documents`, which ACPS requires for that status.

Deductions use a fixed remark list cleaned from ACPS `x_expense_remarks`. A bill-level discount is deducted with "Discount amount is not payable", because the amounts stay gross.

## Demo-only shortcuts

- **Patient name:** the members are fictional, so the patient name comes from the documents and is editable. Change it to show the name-mismatch check.
- **Reference Date:** the submission date defaults to the stamped Dispatch Date, otherwise today. Old test documents fail the 60-day check against today.
- **Data:** state lives in memory and resets when the server restarts.

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

- **Normal claim:** pick Rahim Uddin, a member with plenty of OPD limit left.
- **Limit runs out:** pick Nasrin Akter, who has 1,100 BDT left. Payable is capped at "As per remaining limit".
- **Spectacles already used:** pick Tanvir Hasan, who has had spectacles 4 times this cycle, the plan maximum.
- **Duplicate:** sign a claim off, then submit the same document again. It is rejected as DOUBLE/WRONGLY CLAIM, and the member's remaining limit has dropped.
- **Roles:** switch "Acting as" in the header. Only a Claims Officer can confirm the review, and only a Post-audit user can sign off.

## Checks

```
cd server && uv run pytest && uv run ruff check .
cd web && npm run build && npm run lint
```
