"""Export demo samples from ACPS_T into the demo's gitignored members.local.json.
Read-only; prints no names. Runs with the ACPS venv, from the ACPS repo (VPN needed):

    cd ~/Projects/work/acps
    PYTHONPATH=. .venv/bin/python <demo>/server/scripts/export_acps_t.py \
        <demo>/server/members.local.json GH26-xxxxxxx GH26-yyyyyyy ...
"""

import json
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "glil.settings")
from django.db import connection

OUT = sys.argv[1]
SAMPLES = sys.argv[2:]

connection.ensure_connection()
cur = connection.connection.cursor()
cur.execute("alter session set current_schema = ACPS_T")
cur.execute("select sys_context('USERENV','CURRENT_SCHEMA') from dual")
assert cur.fetchone()[0] == "ACPS_T"


def rows(sql, **kw):
    cur.execute(sql, kw)
    cols = [d[0].lower() for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def d(value):
    return value.strftime("%d-%m-%Y") if value else None


def user(uid):
    if not uid:
        return None
    r = rows(
        "select id, full_name, designation, is_active from x_users where id = :i", i=uid
    )
    return r[0] if r else None


samples, members, users = [], {}, {}
for number in SAMPLES:
    c = rows(
        """select c.id, c.intimation_number, c.member_code, c.member_id, c.plan_id, c.cycle_id,
                  c.claimed_amount, c.payable_amount, c.treatment_date, c.reference_date, c.created_at,
                  c.required_documents, c.assigned_officer_id, c.settled_by, c.regret_by,
                  c.claim_analyst_approved_by, c.doctor_approved_by,
                  s.name status, r.name reason, ct.name_slug ctype
           from x_claims_group_health_v2 c
           join x_claim_statuses s on s.id = c.claim_status_id
           left join x_claim_rejection_reasons r on r.id = c.rejection_reason_id
           left join x_plan_items ct on ct.id = c.claim_type_id
           where c.intimation_number = :n""",
        n=number,
    )[0]

    m = rows(
        """select member_code, name, relation_with_employee relation, is_active, cycle_id
           from x_members_group where id = :i""",
        i=c["member_id"],
    )[0]
    cy = rows(
        """select cycle_start_date, cycle_end_date, opd_max_days_to_claim
           from x_organization_cycles where id = :i""",
        i=c["cycle_id"],
    )[0]
    plan = rows("select name, coinsurance from x_plans where id = :i", i=c["plan_id"])[
        0
    ]

    # plan tree: OPD -> claim type feature (GENERAL, ASO_FUND, ...) -> items
    feats = rows(
        """select f.id, f.parent_id, i.name_slug slug, f.limit lim, f.limit_applicable la, f.is_active act
           from x_plan_features f join x_plan_items i on i.id = f.item_id where f.plan_id = :p""",
        p=c["plan_id"],
    )
    opd = next(f for f in feats if f["parent_id"] is None and f["slug"] == "OPD")
    ctype = next(
        f for f in feats if f["parent_id"] == opd["id"] and f["slug"] == c["ctype"]
    )
    below = [f for f in feats if f["parent_id"] == ctype["id"]]
    below += [f for f in feats if f["parent_id"] in {b["id"] for b in below}]
    ctype_limit = (
        min(x for x in (ctype["lim"], opd["lim"]) if x)
        if (ctype["lim"] or opd["lim"])
        else 0
    )
    item_limits = {
        f["slug"]: int(f["lim"])
        for f in below
        if f["act"] and f["la"] and f["lim"] and f["lim"] < ctype_limit
    }
    counts = {
        r["slug"]: int(r["value"])
        for r in rows(
            """select i.name_slug slug, bc.value from x_plan_controls bc
               join x_plan_items ci on ci.id = bc.control_id
               join x_plan_features f on f.id = bc.benefit_feature_id
               join x_plan_items i on i.id = f.item_id
               where bc.plan_id = :p and ci.control_type = 'EXPENSE_COUNT' and nvl(bc.is_active,1) = 1
                 and f.is_active = 1 and bc.value > 0""",
            p=c["plan_id"],
        )
    }

    # what the member had used in this cycle before this claim was intimated
    used = rows(
        """select i.name_slug slug, sum(e.payable_amount) amount, count(*) n
           from x_claim_expenses_gh e
           join x_claims_group_health_v2 p on p.id = e.claim_id
           join x_claim_statuses s on s.id = p.claim_status_id and s.name = 'SETTLED'
           join x_plan_items i on i.id = e.item_type_id
           where p.member_code = :mc and p.cycle_id = :cy and p.claim_type_id =
                 (select claim_type_id from x_claims_group_health_v2 where id = :cid)
             and p.created_at < :ca and p.id <> :cid and e.payable_amount > 0
           group by i.name_slug""",
        mc=c["member_code"],
        cy=c["cycle_id"],
        cid=c["id"],
        ca=c["created_at"],
    )
    history = rows(
        """select treatment_date, claimed_amount from x_claims_group_health_v2
           where member_code = :mc and created_at < :ca and id <> :cid""",
        mc=c["member_code"],
        ca=c["created_at"],
        cid=c["id"],
    )
    expenses = rows(
        """select i.name_slug category, e.claimed_amount claimed, e.deducted_amount deducted,
                  e.payable_amount payable, e.remarks
           from x_claim_expenses_gh e join x_plan_items i on i.id = e.item_type_id
           where e.claim_id = :cid""",
        cid=c["id"],
    )

    reviewer = user(c["assigned_officer_id"])
    auditor = user(
        c["claim_analyst_approved_by"]
        or c["doctor_approved_by"]
        or c["regret_by"]
        or c["settled_by"]
    )
    for u, role in ((reviewer, "CLAIMS_OFFICER"), (auditor, "POST_AUDITOR")):
        if u and u["is_active"] and u["id"] not in users:
            users[u["id"]] = {
                "id": str(u["id"]),
                "name": u["full_name"],
                "designation": u["designation"],
                "role": role,
            }

    members[m["member_code"]] = {
        "name": m["name"],
        "relation": m["relation"],
        "is_active": bool(m["is_active"]),
        "plan": {
            "plan_id": c["plan_id"],
            "plan_name": plan["name"],
            "claim_type": c["ctype"],
            "cycle_start": d(cy["cycle_start_date"]),
            "cycle_end": d(cy["cycle_end_date"]),
            "opd_limit": int(ctype_limit),
            "coinsurance_pct": plan["coinsurance"] or 0,
            "opd_max_days_to_claim": cy["opd_max_days_to_claim"] or 0,
            "item_limits": item_limits,
            "item_count_limits": counts,
        },
        "consumed": int(sum(u_["amount"] for u_ in used)),
        "items": {
            u_["slug"]: {"amount": int(u_["amount"]), "count": int(u_["n"])}
            for u_ in used
        },
        "history": [
            {
                "treatment_date": d(h["treatment_date"]),
                "claimed_amount": int(h["claimed_amount"]),
            }
            for h in history
        ],
    }
    samples.append(
        {
            "intimation_number": number,
            "member_code": m["member_code"],
            "reference_date": d(c["reference_date"]),
            "officer_decision": {
                "status": c["status"],
                "rejection_reason": c["reason"],
                "required_documents": c["required_documents"],
                "claimed_amount": int(c["claimed_amount"]),
                "payable_amount": int(c["payable_amount"] or 0),
                "expenses": [
                    {
                        "category": e["category"],
                        "claimed": int(e["claimed"]),
                        "deducted": int(e["deducted"] or 0),
                        "payable": int(e["payable"] or 0),
                        "remarks": e["remarks"],
                    }
                    for e in expenses
                ],
                "reviewed_by": reviewer["full_name"] if reviewer else None,
                "decided_by": auditor["full_name"] if auditor else None,
            },
        }
    )
    mem = members[m["member_code"]]
    print(
        number,
        "| member active",
        mem["is_active"],
        "| member cycle == claim cycle",
        str(m["cycle_id"]) == str(c["cycle_id"]),
        "| plan",
        c["plan_id"],
        c["ctype"],
        "limit",
        mem["plan"]["opd_limit"],
        "used",
        mem["consumed"],
        "| items",
        mem["plan"]["item_limits"],
        "counts",
        mem["plan"]["item_count_limits"],
        "| history",
        len(history),
        "| officer",
        c["status"],
        c["payable_amount"],
        "| reviewer active",
        bool(reviewer and reviewer["is_active"]),
        "auditor active",
        bool(auditor and auditor["is_active"]),
    )

if not any(u["role"] == "POST_AUDITOR" for u in users.values()):
    top = rows(
        """select * from (
             select u.id, u.full_name, u.designation, count(*) n from x_claims_group_health_v2 c
             join x_users u on u.id = c.claim_analyst_approved_by and u.is_active = 1
             where c.created_at > date '2026-08-01' group by u.id, u.full_name, u.designation
             order by n desc) where rownum <= 5"""
    )
    pick = next(t for t in top if t["id"] not in users)
    users[pick["id"]] = {
        "id": str(pick["id"]),
        "name": pick["full_name"],
        "designation": pick["designation"],
        "role": "POST_AUDITOR",
    }

with open(OUT, "w") as f:
    json.dump(
        {
            "source": "ACPS_T",
            "samples": samples,
            "members": members,
            "users": list(users.values()),
        },
        f,
        indent=2,
        default=str,
    )
print("users:", [u["role"] for u in users.values()])
