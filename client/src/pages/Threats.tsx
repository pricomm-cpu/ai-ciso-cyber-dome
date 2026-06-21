import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, CheckCircle2, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { Threat } from "@shared/schema";

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

export default function Threats() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: threats = [], isLoading } = useQuery<Threat[]>({ queryKey: ["/api/threats"] });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/threats/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/threats"] }),
  });

  const sorted = [...threats]
    .filter(t => filter === "all" || t.status === filter)
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  const counts = {
    all: threats.length,
    open: threats.filter(t => t.status === "open").length,
    investigating: threats.filter(t => t.status === "investigating").length,
    mitigated: threats.filter(t => t.status === "mitigated").length,
    closed: threats.filter(t => t.status === "closed").length,
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Threat Monitor</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI continuously scanning · no analyst needed</p>
        </div>
        <Badge className={counts.open > 0 ? "badge-critical" : "badge-low"}>
          {counts.open} open
        </Badge>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "investigating", "mitigated", "closed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors capitalize
              ${filter === f
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Threat list */}
      <div className="space-y-2">
        {isLoading
          ? [1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)
          : sorted.map(t => (
              <Card key={t.id} className="glow-card" data-testid={`threat-card-${t.id}`}>
                <CardContent className="p-0">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  >
                    <AlertTriangle size={15} className={
                      t.severity === "critical" ? "text-red-400 flex-shrink-0" :
                      t.severity === "high" ? "text-orange-400 flex-shrink-0" :
                      t.severity === "medium" ? "text-yellow-400 flex-shrink-0" : "text-green-400 flex-shrink-0"
                    } />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.category} · {new Date(t.detectedAt).toLocaleDateString("en-AU")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${t.severity}`}>{t.severity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full status-${t.status}`}>{t.status}</span>
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expanded === t.id ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded */}
                  {expanded === t.id && (
                    <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                      {t.aiRecommendation && (
                        <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3">
                          <div className="text-xs font-semibold text-cyan-400 mb-1 ai-pulse">AI CISO Recommendation</div>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{t.aiRecommendation}</p>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {(["open","investigating","mitigated","closed"] as const)
                          .filter(s => s !== t.status)
                          .map(s => (
                            <Button
                              key={s}
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              data-testid={`btn-status-${s}-${t.id}`}
                              disabled={statusMut.isPending}
                              onClick={() => statusMut.mutate({ id: t.id, status: s })}
                            >
                              {s === "mitigated" && <CheckCircle2 size={11} className="mr-1 text-green-400" />}
                              Mark {s}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        }
        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
            No threats in this category
          </div>
        )}
      </div>
    </div>
  );
}
