import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, XCircle, MinusCircle, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { ComplianceItem } from "@shared/schema";

const STATUS_ICON: Record<string, React.ReactNode> = {
  compliant: <CheckSquare size={14} className="text-green-400" />,
  partial: <MinusCircle size={14} className="text-yellow-400" />,
  "non-compliant": <XCircle size={14} className="text-red-400" />,
  "not-assessed": <HelpCircle size={14} className="text-muted-foreground" />,
};
const STATUS_CLASS: Record<string, string> = {
  compliant: "badge-low",
  partial: "badge-medium",
  "non-compliant": "badge-critical",
  "not-assessed": "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

export default function Compliance() {
  const qc = useQueryClient();
  const [framework, setFramework] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<ComplianceItem[]>({ queryKey: ["/api/compliance"] });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<ComplianceItem> }) =>
      apiRequest("PATCH", `/api/compliance/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/compliance"] }),
  });

  const frameworks = ["all", ...Array.from(new Set(items.map(i => i.framework)))];
  const filtered = items.filter(i => framework === "all" || i.framework === framework);

  const grouped = filtered.reduce<Record<string, ComplianceItem[]>>((acc, item) => {
    (acc[item.framework] = acc[item.framework] || []).push(item);
    return acc;
  }, {});

  const compliantCount = items.filter(i => i.status === "compliant").length;
  const pct = items.length ? Math.round((compliantCount / items.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI-mapped controls · no consultant required</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">{pct}%</div>
          <div className="text-xs text-muted-foreground">{compliantCount}/{items.length} controls</div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Framework tabs */}
      <div className="flex gap-2 flex-wrap">
        {frameworks.map(f => (
          <button
            key={f}
            onClick={() => setFramework(f)}
            data-testid={`fw-${f}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors
              ${framework === f
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Controls */}
      {isLoading
        ? [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)
        : Object.entries(grouped).map(([fw, controls]) => (
            <div key={fw} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{fw}</div>
              {controls.map(item => (
                <Card key={item.id} className="glow-card" data-testid={`compliance-${item.id}`}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {STATUS_ICON[item.status]}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          <span className="text-muted-foreground text-xs mr-2 mono">{item.controlId}</span>
                          {item.control}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[item.status]} flex-shrink-0`}>
                        {item.status}
                      </span>
                      <ChevronDown size={13} className={`text-muted-foreground transition-transform flex-shrink-0 ${expanded === item.id ? "rotate-180" : ""}`} />
                    </button>

                    {expanded === item.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {item.aiGuidance && (
                          <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3">
                            <div className="text-xs font-semibold text-cyan-400 mb-1 ai-pulse">AI Guidance</div>
                            <p className="text-xs text-muted-foreground">{item.aiGuidance}</p>
                          </div>
                        )}
                        {item.dueDate && (
                          <div className="text-xs text-muted-foreground">Due: {item.dueDate}</div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {(["compliant","partial","non-compliant","not-assessed"] as const)
                            .filter(s => s !== item.status)
                            .map(s => (
                              <Button
                                key={s}
                                size="sm" variant="outline" className="text-xs h-7 capitalize"
                                data-testid={`btn-compliance-${s}-${item.id}`}
                                disabled={updateMut.isPending}
                                onClick={() => updateMut.mutate({ id: item.id, patch: { status: s } })}
                              >
                                {s}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
      }
    </div>
  );
}
