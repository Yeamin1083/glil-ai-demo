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
