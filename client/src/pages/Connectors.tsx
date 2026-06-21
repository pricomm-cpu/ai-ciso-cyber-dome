import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plug, CheckCircle2, Circle, ExternalLink, ChevronDown, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface Connector {
  id: string; name: string; category: string; subcategory: string;
  logo: string; tier: string; smb_fit: string; pricing: string;
  description: string; strengths: string[]; weaknesses: string[];
  integrates_with: string[]; api_docs: string; auth_type: string;
  ai_verdict: string; status: string; connected: boolean; connectedAt: string | null;
}

const SMB_FIT_COLOR: Record<string, string> = {
  High: "badge-low", Medium: "badge-medium", Low: "badge-high",
};
const TIER_COLOR: Record<string, string> = {
  SMB: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Mid-Market": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Enterprise: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function Connectors() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: connectors = [], isLoading } = useQuery<Connector[]>({ queryKey: ["/api/connectors"] });

  const toggleMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/connectors/${id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/connectors"] }),
  });

  const categories = ["all", ...Array.from(new Set(connectors.map(c => c.category)))];
  const filtered = connectors.filter(c => activeCategory === "all" || c.category === activeCategory);
  const grouped = filtered.reduce<Record<string, Connector[]>>((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c); return acc;
  }, {});

  const connectedCount = connectors.filter(c => c.connected).length;
  const highFitCount = connectors.filter(c => c.smb_fit === "High").length;

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Connector Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">
            AI picks the best-fit tool — no vendor sales call needed
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-400">{connectedCount}</div>
            <div className="text-xs text-muted-foreground">Connected</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-400">{highFitCount}</div>
            <div className="text-xs text-muted-foreground">High SMB fit</div>
          </div>
        </div>
      </div>

      {/* AI banner */}
      <Card className="glow-card border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <TrendingUp size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="text-cyan-400 font-semibold">AI CISO Verdict</span> — Based on your security gaps and budget profile, the highest-priority connectors to activate are:{" "}
              <span className="text-foreground">Cloudflare Gateway</span> (free, instant DNS protection),{" "}
              <span className="text-foreground">GitGuardian</span> (free, stops secret leaks), and{" "}
              <span className="text-foreground">Intruder</span> (external attack surface visibility).
              No vendor meeting required — connect directly below.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            data-testid={`cat-${cat}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors truncate max-w-[180px]
              ${activeCategory === cat
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Connector grid */}
      {isLoading
        ? [1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)
        : Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{cat}</div>
              {items.map(connector => (
                <ConnectorCard
                  key={connector.id}
                  connector={connector}
                  expanded={expanded === connector.id}
                  onExpand={() => setExpanded(expanded === connector.id ? null : connector.id)}
                  onToggle={() => toggleMut.mutate(connector.id)}
                  isPending={toggleMut.isPending}
                />
              ))}
            </div>
          ))
      }
    </div>
  );
}

function ConnectorCard({ connector: c, expanded, onExpand, onToggle, isPending }: {
  connector: Connector; expanded: boolean;
  onExpand: () => void; onToggle: () => void; isPending: boolean;
}) {
  return (
    <Card className={`glow-card transition-all ${c.connected ? "border-green-500/30" : ""}`} data-testid={`connector-${c.id}`}>
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3.5">
          {/* Logo */}
          <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-lg flex-shrink-0">
            {c.logo}
          </div>

          {/* Info */}
          <button className="flex-1 min-w-0 text-left" onClick={onExpand}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded border ${TIER_COLOR[c.tier] || ""}`}>{c.tier}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${SMB_FIT_COLOR[c.smb_fit] || ""}`}>
                SMB fit: {c.smb_fit}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.subcategory} · {c.pricing}</div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {c.connected
              ? <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={12} /> Connected</span>
              : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Circle size={12} /> Not connected</span>
            }
            <Button
              size="sm" variant={c.connected ? "outline" : "default"}
              className={`text-xs h-7 ${c.connected ? "" : "bg-cyan-600 hover:bg-cyan-500 text-white border-0"}`}
              data-testid={`btn-connect-${c.id}`}
              disabled={isPending}
              onClick={onToggle}
            >
              {c.connected ? "Disconnect" : "Connect"}
            </Button>
            <ChevronDown size={13} className={`text-muted-foreground transition-transform cursor-pointer ${expanded ? "rotate-180" : ""}`} onClick={onExpand} />
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">{c.description}</p>

            {/* AI verdict */}
            <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3">
              <div className="text-xs font-semibold text-cyan-400 mb-1 ai-pulse">AI CISO Verdict</div>
              <p className="text-xs text-muted-foreground">{c.ai_verdict}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Strengths */}
              <div className="rounded-md bg-green-500/5 border border-green-500/20 p-3">
                <div className="text-xs font-semibold text-green-400 mb-2">Strengths</div>
                <ul className="space-y-1">
                  {c.strengths.map(s => (
                    <li key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle2 size={10} className="text-green-400 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Weaknesses */}
              <div className="rounded-md bg-secondary border border-border p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Watch-outs</div>
                <ul className="space-y-1">
                  {c.weaknesses.map(w => (
                    <li key={w} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">·</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-muted-foreground">
                Auth: <span className="text-foreground">{c.auth_type}</span>
                {c.integrates_with.length > 0 && (
                  <> · Integrates: <span className="text-foreground">{c.integrates_with.slice(0,3).join(", ")}{c.integrates_with.length > 3 ? " +" + (c.integrates_with.length-3) : ""}</span></>
                )}
              </div>
              <a href={c.api_docs} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                API docs <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
