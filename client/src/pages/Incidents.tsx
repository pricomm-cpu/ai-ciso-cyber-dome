import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { Incident } from "@shared/schema";

const PHASES = ["detection", "containment", "eradication", "recovery", "lessons-learned"];

const PHASE_COLOR: Record<string, string> = {
  detection: "badge-critical",
  containment: "badge-high",
  eradication: "badge-medium",
  recovery: "badge-info",
  "lessons-learned": "badge-low",
};

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

export default function Incidents() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({ queryKey: ["/api/incidents"] });

  const phaseMut = useMutation({
    mutationFn: ({ id, phase, closedAt }: { id: number; phase: string; closedAt?: string }) =>
      apiRequest("PATCH", `/api/incidents/${id}/phase`, { phase, closedAt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/incidents"] }),
  });

  const active = incidents.filter(i => !i.closedAt);
  const closed = incidents.filter(i => i.closedAt);

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Incident Response</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI-generated playbooks · immediate guidance</p>
        </div>
        <Badge className={active.length > 0 ? "badge-critical" : "badge-low"}>
          {active.length} active
        </Badge>
      </div>

      {isLoading && [1, 2].map(i => <Skeleton key={i} className="h-28 w-full" />)}

      {/* Active */}
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

      {/* Closed */}
      {closed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Closed</div>
          {closed.map(inc => <IncidentCard key={inc.id} inc={inc} expanded={expanded} setExpanded={setExpanded} phaseMut={phaseMut} />)}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ inc, expanded, setExpanded, phaseMut }: any) {
  const playbook: string[] = inc.aiPlaybook ? JSON.parse(inc.aiPlaybook) : [];
  const isOpen = !inc.closedAt;

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
              <div className="flex gap-2 flex-wrap">
                {PHASES.filter(p => p !== inc.phase).map(p => (
                  <Button
                    key={p}
                    size="sm" variant="outline" className="text-xs h-7 capitalize"
                    data-testid={`btn-phase-${p}-${inc.id}`}
                    disabled={phaseMut.isPending}
                    onClick={() => phaseMut.mutate({
                      id: inc.id, phase: p,
                      closedAt: p === "lessons-learned" ? new Date().toISOString() : undefined,
                    })}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
