import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, ChevronDown, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { Incident } from "@shared/schema";

const PHASES = ["detection", "containment", "eradication", "recovery", "lessons-learned"];

const WORKFLOW_STEPS = [
  { phase: "detection", label: "Detection", detail: "Capture suspicious activity, validate alerts and start the response process." },
  { phase: "containment", label: "Containment", detail: "Limit impact by isolating affected systems and blocking attack paths." },
  { phase: "eradication", label: "Eradication", detail: "Remove threat artifacts, close vulnerabilities and eliminate attacker access." },
  { phase: "recovery", label: "Recovery", detail: "Restore services safely, validate systems and return to normal operations." },
  { phase: "lessons-learned", label: "Lessons learned", detail: "Review root cause, update controls, and improve future response." },
];

const PHASE_COLOR: Record<string, string> = {
  detection: "badge-critical",
  containment: "badge-high",
  eradication: "badge-medium",
  recovery: "badge-info",
  "lessons-learned": "badge-low",
};

const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"];

function PhaseTimeline({ current }: { current: string }) {
  const idx = PHASES.indexOf(current);
  return (
    <div className="flex items-center gap-1 mt-2">
      {PHASES.map((p, i) => (
        <div key={p} className="flex items-center gap-1">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${i <= idx ? "bg-cyan-400" : "bg-border"}`} />
          {i < PHASES.length - 1 && <div className={`w-1 h-1 rounded-full ${i < idx ? "bg-cyan-400" : "bg-border"}`} />}
        </div>
      ))}
      <span className="text-xs text-cyan-400 ml-2 capitalize">{current}</span>
    </div>
  );
}

function generatePlaybook(severity: string) {
  const base = [
    "Validate the alert and scope the affected systems.",
    "Capture forensic evidence while preserving system integrity.",
    "Contain the compromise and block attacker access.",
    "Eradicate threat artifacts and rebuild impacted systems.",
    "Document findings and update response controls.",
  ];

  if (severity === "critical") {
    return [
      "Activate the incident response team and senior stakeholders.",
      ...base,
    ];
  }

  if (severity === "high") {
    return [
      "Escalate to IT security and isolate impacted assets.",
      ...base,
    ];
  }

  return [
    "Review the event and validate whether this is a true incident.",
    ...base,
  ];
}

export default function Incidents() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("high");
  const [summary, setSummary] = useState("");

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({ queryKey: ["/api/incidents"] });

  const createMut = useMutation({
    mutationFn: async (data: { title: string; severity: string; summary: string }) => {
      const response = await apiRequest("POST", "/api/incidents", {
        title: data.title,
        severity: data.severity,
        summary: data.summary,
        phase: "detection",
        reportedAt: new Date().toISOString(),
        aiPlaybook: JSON.stringify(generatePlaybook(data.severity)),
      });
      return await response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/incidents"] });
      setDialogOpen(false);
      setTitle("");
      setSeverity("high");
      setSummary("");
    },
  });

  const phaseMut = useMutation({
    mutationFn: ({ id, phase, closedAt }: { id: number; phase: string; closedAt?: string }) =>
      apiRequest("PATCH", `/api/incidents/${id}/phase`, { phase, closedAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/incidents"] }),
  });

  const active = incidents.filter(i => !i.closedAt);
  const closed = incidents.filter(i => i.closedAt);

  const phaseCounts = PHASES.reduce((acc, phase) => ({ ...acc, [phase]: incidents.filter(i => i.phase === phase && !i.closedAt).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Incident Response</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI-managed incident workflow from detection through lessons learned.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> Report Incident
          </Button>
          <Badge className={active.length > 0 ? "badge-critical" : "badge-low"}>
            {active.length} active
          </Badge>
        </div>
      </div>

      <Card className="glow-card border border-cyan-500/20 bg-cyan-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Incident response alignment</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div>NIST SP 800-61 and SANS incident response lifecycle alignment supports evidence-based response and board-level reporting.</div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="font-semibold text-foreground">NIST SP 800-61</div>
                <div className="mt-1">Preparation → Detection → Containment → Eradication → Recovery → Lessons learned</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="font-semibold text-foreground">SANS IR process</div>
                <div className="mt-1">Identification → Containment → Eradication → Recovery → Lessons learned</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card className="glow-card">
          <CardHeader>
            <CardTitle className="text-sm">Incident Management Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {WORKFLOW_STEPS.map(step => (
                <div key={step.phase} className="rounded-xl border border-border p-3 bg-background/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{step.label}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${PHASE_COLOR[step.phase]}`}>{step.phase}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PHASES.map(phase => (
                <div key={phase} className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{phase}</div>
                  <div className="text-lg font-semibold text-foreground mt-2">{phaseCounts[phase] || 0}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-muted-foreground">
              Use the incident workflow to move each event through a repeatable response process. The platform tracks progress and keeps key stakeholders aligned with AI playbook guidance.
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-sm">Workflow snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="text-sm font-semibold text-foreground">Open incident count</div>
              <div className="text-3xl font-bold text-cyan-400">{active.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{closed.length} incidents closed recently</div>
            </div>
            <div className="space-y-2">
              {Object.entries(phaseCounts).map(([phase, count]) => (
                <div key={phase} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                  <span className="capitalize text-foreground">{phase}</span>
                  <Badge className={PHASE_COLOR[phase]}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && [1, 2].map(i => <Skeleton key={i} className="h-28 w-full" />)}

      {active.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Active Incidents</div>
          {active.map(inc => <IncidentCard key={inc.id} inc={inc} expanded={expanded} setExpanded={setExpanded} phaseMut={phaseMut} />)}
        </div>
      )}

      {active.length === 0 && !isLoading && (
        <Card className="glow-card border-green-500/20 bg-green-500/5">
          <CardContent className="p-6 text-center">
            <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-400">No Active Incidents</div>
            <div className="text-xs text-muted-foreground mt-1">AI agent monitoring 24/7</div>
          </CardContent>
        </Card>
      )}

      {closed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Closed</div>
          {closed.map(inc => <IncidentCard key={inc.id} inc={inc} expanded={expanded} setExpanded={setExpanded} phaseMut={phaseMut} />)}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a new incident</DialogTitle>
            <DialogDescription>Start the incident workflow by capturing the initial details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-foreground">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Suspicious credential exfiltration detected" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-foreground">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SEVERITY_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-foreground">Summary</label>
              <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summarize the incident details, affected assets, and observed behaviour." rows={5} />
            </div>
            <div className="text-xs text-muted-foreground">An AI playbook will be generated automatically once the incident is reported.</div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !title || !summary}>Create incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IncidentCard({ inc, expanded, setExpanded, phaseMut }: any) {
  const playbook: string[] = inc.aiPlaybook ? JSON.parse(inc.aiPlaybook) : [];
  const isOpen = !inc.closedAt;
  const currentIndex = PHASES.indexOf(inc.phase);
  const nextPhase = currentIndex < PHASES.length - 1 ? PHASES[currentIndex + 1] : null;

  return (
    <Card className={`glow-card ${!isOpen ? "opacity-70" : ""}`} data-testid={`incident-${inc.id}`}>
      <CardContent className="p-0">
        <button
          className="w-full flex items-start gap-3 p-4 text-left"
          onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
        >
          <Zap size={14} className={`mt-0.5 flex-shrink-0 ${inc.severity === "critical" ? "text-red-400" : "text-orange-400"}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">{inc.title}</div>
            <PhaseTimeline current={inc.phase} />
            <div className="text-xs text-muted-foreground mt-1">{new Date(inc.reportedAt).toLocaleDateString("en-AU")}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full badge-${inc.severity}`}>{inc.severity}</span>
            {!isOpen && <span className="text-xs px-2 py-0.5 rounded-full status-closed">closed</span>}
            <ChevronDown size={13} className={`text-muted-foreground transition-transform ${expanded === inc.id ? "rotate-180" : ""}`} />
          </div>
        </button>

        {expanded === inc.id && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">{inc.summary}</p>

            {playbook.length > 0 && (
              <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3 space-y-2">
                <div className="text-xs font-semibold text-cyan-400 ai-pulse">AI-Generated Playbook</div>
                {playbook.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-cyan-400 font-mono flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {isOpen && (
              <div className="space-y-3">
                {nextPhase && (
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-8 w-full"
                    disabled={phaseMut.isPending}
                    onClick={() => phaseMut.mutate({
                      id: inc.id,
                      phase: nextPhase,
                      closedAt: nextPhase === "lessons-learned" ? new Date().toISOString() : undefined,
                    })}
                  >
                    Advance to {nextPhase}
                  </Button>
                )}
                <div className="flex gap-2 flex-wrap">
                  {PHASES.filter(p => p !== inc.phase).map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 capitalize"
                      data-testid={`btn-phase-${p}-${inc.id}`}
                      disabled={phaseMut.isPending}
                      onClick={() => phaseMut.mutate({
                        id: inc.id,
                        phase: p,
                        closedAt: p === "lessons-learned" ? new Date().toISOString() : undefined,
                      })}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
