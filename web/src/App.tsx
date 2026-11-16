import {
  Building2,
  Check,
  Database,
  FileText,
  Home,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  approveClaim,
  auditClaim,
  decideClaim,
  extractClaim,
  getFixtures,
} from "./features/claim/api";
import { IntimationStep } from "./features/claim/components/IntimationStep";
import { OracleStep } from "./features/claim/components/OracleStep";
import { ProcessStep } from "./features/claim/components/ProcessStep";
import { ReviewStep } from "./features/claim/components/ReviewStep";
import {
  fromExtraction,
  toClaimIn,
  type ClaimForm,
  type FormField,
} from "./features/claim/form";
import type {
  AuditResult,
  Confidence,
  Extraction,
  Fixtures,
  OracleRecord,
  Review,
  Status,
} from "./features/claim/types";
import { TEST_CLAIMS } from "./features/claim/testClaims";
import {
  HrPendingClaimsPage,
  type HrPendingClaim,
} from "./features/hr/HrPendingClaimsPage";
import { WelcomePage } from "./features/welcome/WelcomePage";
import { ScanOverlay } from "./shared/components/ScanOverlay";
import {
  AUDIT_STEPS,
  ROLE,
  ROLE_LABEL,
  SCAN_STEPS,
  STEP,
  STEP_LABEL,
  type Step,
} from "./shared/constants";

const MIN_SCAN_MS = 2800;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STEP_ICONS = [FileText, UserCheck, ShieldCheck, Database];

interface NavTab {
  id: "welcome" | "claims" | "hr";
  label: string;
  icon: typeof Home;
  badge?: number;
}

const NAV_TABS: NavTab[] = [
  { id: "welcome", label: "Welcome", icon: Home },
  { id: "claims", label: "Claims", icon: FileText },
  { id: "hr", label: "HR Portal", icon: Building2, badge: TEST_CLAIMS.length },
];

export default function App() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null);
  const [officerId, setOfficerId] = useState("");
  // Step 1: Initial page is the Welcome Page
  const [view, setView] = useState<"welcome" | "claims" | "hr">("welcome");
  const [step, setStep] = useState<Step>(STEP.INTIMATION);
  const [busy, setBusy] = useState(false);
  const [aiMs, setAiMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hrApproved, setHrApproved] = useState(false);
  const [scanning, setScanning] = useState<{
    file: File;
    agent: "both" | "audit";
  } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [intimationNumber, setIntimationNumber] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [form, setForm] = useState<ClaimForm | null>(null);
  const [confidence, setConfidence] = useState<
    Partial<Record<FormField, Confidence>>
  >({});
  const [review, setReview] = useState<Review | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [reviewedFor, setReviewedFor] = useState(""); // the claim data the AI last checked
  const [reviewVersion, setReviewVersion] = useState(0);
  const [record, setRecord] = useState<OracleRecord | null>(null);

  // the claim officer does everything, so there is no separate final approver
  const users = (
    fixtures?.users ?? [
      {
        id: "hr1",
        name: "Sadia Rahman",
        designation: "HR Manager",
        role: "HR_ADMIN",
      },
      {
        id: "o1",
        name: "Farhana Islam",
        designation: "Claim Officer",
        role: "CLAIMS_OFFICER",
      },
      {
        id: "o2",
        name: "Arif Hossain",
        designation: "Claim Officer",
        role: "CLAIMS_OFFICER",
      },
    ]
  ).filter((u) => u.role !== ROLE.POST_AUDITOR);
  const officer = users.find((u) => u.id === officerId) ?? users[1]; // default to Claim Officer Farhana
  const member = fixtures?.members.find((m) => m.code === form?.member_code);
  const stale =
    !!review && !!form && JSON.stringify(toClaimIn(form)) !== reviewedFor;
  const sample =
    fixtures?.samples.find((s) => s.member_code === form?.member_code) ?? null;

  const loadFixtures = () =>
    getFixtures()
      .then(setFixtures)
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    loadFixtures();
  }, []);

  // real time the AI spent, not counting the pause that keeps the scan screen readable
  const timed = async <T,>(p: Promise<T>) => {
    const t = performance.now();
    const r = await p;
    setAiMs((ms) => ms + performance.now() - t);
    return r;
  };

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
      setScanning(null);
    }
  }

  // AI call 1: one scan reads the documents and proposes the settlement
  const intimate = (doc: File, memberCode: string, hrNumber?: string) =>
    run(async () => {
      setScanning({ file: doc, agent: "both" });
      setAiMs(0);
      const known = fixtures?.samples.find((s) => s.member_code === memberCode);
      const [result] = await Promise.all([
        timed(extractClaim(doc, memberCode)),
        pause(MIN_SCAN_MS),
      ]);
      const prefilled = fromExtraction(
        result.extraction,
        memberCode,
        known?.reference_date,
      );
      const claim = toClaimIn(prefilled.form);
      // the plan rules run in code on the AI's settlement, so there is no second AI call here
      const settled = await decideClaim(claim, result.judgement, null, "");
      setFile(doc);
      setIntimationNumber(hrNumber ?? result.intimation_number);
      setHrApproved(!!hrNumber);
      setExtraction(result.extraction);
      setForm(prefilled.form);
      setConfidence(prefilled.confidence);
      setReview(settled);
      setReviewedFor(JSON.stringify(claim));
      setReviewVersion((v) => v + 1);
      setStep(STEP.REVIEW);
    });

  // HR approval sends the claim's real document straight to the Claim Officer
  const handleHrApprove = async (claim: HrPendingClaim, claimFile: File) => {
    if (officer.role === "HR_ADMIN") {
      const claimOfficer = users.find((u) => u.role === "CLAIMS_OFFICER");
      if (claimOfficer) setOfficerId(claimOfficer.id);
    }
    setStep(STEP.REVIEW);
    setView("claims");
    // ponytail: if reading fails, go back to the HR list instead of dropping the user on the upload form
    if (!(await intimate(claimFile, claim.memberCode, claim.number))) {
      setStep(STEP.INTIMATION);
      setView("hr");
    }
  };

  // the officer changed the details, so the plan rules run again on the same settlement (no AI call)
  const updateDecision = () =>
    run(async () => {
      const claim = toClaimIn(form!);
      setReview(await decideClaim(claim, review!.judgement, null, ""));
      setReviewedFor(JSON.stringify(claim));
      setReviewVersion((v) => v + 1);
    });

  // the officer's own decision and remarks; no new model call
  const decide = (status: Status, remarks: string) =>
    run(async () => {
      setReview(
        await decideClaim(toClaimIn(form!), review!.judgement, status, remarks),
      );
    });

  // AI call 2: double-checks the officer's final decision before it is saved
  const finalCheck = () =>
    run(async () => {
      setScanning({ file: file!, agent: "audit" });
      const [result] = await Promise.all([
        timed(auditClaim(file!, toClaimIn(form!), review!)),
        pause(MIN_SCAN_MS),
      ]);
      setAudit(result);
      setStep(STEP.PROCESS);
    });

  const signOff = () =>
    run(async () => {
      setRecord(
        await approveClaim(
          intimationNumber,
          toClaimIn(form!),
          review!,
          officer.name,
          officer.name,
        ),
      );
      setStep(STEP.ORACLE);
    });

  const reset = () => {
    setFile(null);
    setIntimationNumber("");
    setExtraction(null);
    setForm(null);
    setReview(null);
    setReviewedFor("");
    setAudit(null);
    setRecord(null);
    setHrApproved(false);
    setStep(STEP.INTIMATION);
    loadFixtures();
  };

  return (
    <div className="min-h-svh bg-slate-50/70 text-slate-900">
      {/* Top Corporate Bar */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur shadow-2xs">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-6">
          {/* Logo & Brand Identity */}
          <button
            type="button"
            onClick={() => setView("welcome")}
            className="flex items-center gap-3 shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
            title="Back to home"
          >
            <img
              src="/guardian.svg"
              alt="Guardian Life Insurance"
              className="h-9 w-auto shrink-0"
            />
            <div className="border-l pl-3 leading-tight hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  Guardian Life Insurance
                </span>
                <Badge className="bg-[var(--glil-orange)] text-white text-[10px] h-4 px-1.5 hover:bg-[var(--glil-orange)]">
                  ACPS
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">
                AI Claim Processing System · OPD Group Health
              </div>
            </div>
          </button>

          {/* Apple-Style Sliding Segmented View Switcher */}
          <nav
            className="relative flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-2xs backdrop-blur w-full max-w-[390px]"
            aria-label="Main Navigation"
          >
            {/* Smooth Gliding Apple Indicator Pill */}
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: `calc(${(NAV_TABS.findIndex((t) => t.id === view) * 100) / 3}% + 2px)`,
                width: "calc(33.333% - 4px)",
              }}
            />

            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none",
                    isActive
                      ? "text-slate-900 font-bold"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0 transition-colors",
                      isActive ? "text-[var(--glil-orange)]" : "text-slate-400",
                    )}
                  />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        "ml-0.5 inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 h-4 transition-colors",
                        isActive
                          ? "bg-[var(--glil-orange)] text-white"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Persona Switcher ("Acting as") */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Signed in as
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {ROLE_LABEL[officer?.role || "CLAIMS_OFFICER"]}
              </span>
            </div>

            <Select value={officer?.id ?? ""} onValueChange={setOfficerId}>
              <SelectTrigger className="w-52 h-9 text-xs font-medium bg-slate-50 border-slate-300">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium capitalize">
                        {u.name.toLowerCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({ROLE_LABEL[u.role] || u.designation})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1360px] px-6 pt-6 pb-16">
        {error && (
          <Alert
            variant="destructive"
            role="alert"
            className="fixed left-1/2 top-20 z-50 w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 bg-white shadow-lg"
          >
            <AlertDescription className="flex items-center justify-between gap-3 text-xs">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Claims Flow Step Progress Header (Apple Style) */}
        {view === "claims" && (
          <div className="sticky top-20 z-20 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                  New Claim
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] border-orange-200 bg-orange-50 text-[var(--glil-orange)] font-mono"
                >
                  Step {step + 1} of 4
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload, check the details, decide, and finish.
              </p>
            </div>

            <ol
              className="flex flex-wrap items-center gap-2"
              aria-label="Claim steps"
            >
              {Object.entries(STEP_LABEL).map(([key, label]) => {
                const n = Number(key);
                const Icon = STEP_ICONS[n] || FileText;
                const isCurrent = n === step;
                const isPast = n < step;

                return (
                  <li
                    key={key}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-all",
                      isCurrent &&
                        "bg-[var(--glil-orange)] text-white shadow-xs",
                      isPast &&
                        "text-slate-700 bg-emerald-50 border border-emerald-200/70",
                      !isCurrent && !isPast && "text-slate-400 bg-slate-100/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full text-[10px] font-bold",
                        isCurrent && "bg-white text-[var(--glil-orange)]",
                        isPast && "bg-emerald-600 text-white",
                        !isCurrent && !isPast && "bg-slate-200 text-slate-500",
                      )}
                    >
                      {isPast ? (
                        <Check className="size-2.5 stroke-[3]" />
                      ) : (
                        <Icon className="size-2.5" />
                      )}
                    </span>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div key={view} className="animate-in fade-in duration-300 ease-out">
          {view === "welcome" ? (
            /* Step 1: Apple-style Welcome Page */
            <WelcomePage
              onStartClaimsFlow={() => setView("claims")}
              onOpenHrPortal={() => setView("hr")}
            />
          ) : view === "hr" ? (
            /* Step 2: HR Pending Claims Page */
            <HrPendingClaimsPage
              members={fixtures?.members || []}
              onApproveAndProceed={handleHrApprove}
              onBackToClaims={() => setView("claims")}
            />
          ) : !fixtures ? (
            <div className="flex items-center justify-center p-16 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-2 border-[var(--glil-orange)] border-t-transparent animate-spin" />
                <span>Loading…</span>
              </div>
            </div>
          ) : scanning ? (
            <ScanOverlay
              file={scanning.file}
              title={
                scanning.agent === "audit"
                  ? "Double-checking the decision..."
                  : "Reading your documents and working out the payout..."
              }
              steps={scanning.agent === "audit" ? AUDIT_STEPS : SCAN_STEPS}
            />
          ) : step === STEP.INTIMATION ? (
            <IntimationStep
              members={fixtures.members}
              busy={busy}
              onSubmit={intimate}
            />
          ) : step === STEP.REVIEW &&
            file &&
            extraction &&
            form &&
            member &&
            review ? (
            <ReviewStep
              file={file}
              intimationNumber={intimationNumber}
              hrApproved={hrApproved}
              extraction={extraction}
              member={member}
              form={form}
              confidence={confidence}
              canSubmit={
                officer?.role === ROLE.CLAIMS_OFFICER ||
                officer?.role === ROLE.HR_ADMIN
              }
              busy={busy}
              review={review}
              reviewVersion={reviewVersion}
              stale={stale}
              onChange={setForm}
              onRecheck={updateDecision}
              onDecide={decide}
              onSubmit={finalCheck}
            />
          ) : step === STEP.PROCESS && review && audit ? (
            <ProcessStep
              review={review}
              audit={audit}
              officerDecision={sample?.officer_decision ?? null}
              reviewedBy={officer.name}
              busy={busy}
              onBack={() => setStep(STEP.REVIEW)}
              onSignOff={signOff}
            />
          ) : step === STEP.ORACLE && record ? (
            <OracleStep
              record={record}
              aiSeconds={aiMs / 1000}
              onNext={reset}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
