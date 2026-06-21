import { useQuery } from "@tanstack/react-query";
import { Cpu, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TechAsset } from "@shared/schema";

const CATEGORY_LABELS: Record<string, string> = {
  firewall: "Firewall",
  edr: "Endpoint Detection",
  iam: "Identity & Access",
  backup: "Backup",
  "email-security": "Email Security",
  siem: "SIEM",
  "vulnerability-scanner": "Vulnerability Scanner",
};

const RISK_CLASSES: Record<string, string> = {
  high: "badge-critical",
  medium: "badge-medium",
  low: "badge-low",
  unknown: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

export default function TechStack() {
  const { data: assets = [], isLoading } = useQuery<TechAsset[]>({ queryKey: ["/api/tech-assets"] });

  const refreshCount = assets.filter(a => a.refreshNeeded).length;
  const eolCount = assets.filter(a => a.eolDate && new Date(a.eolDate) < new Date()).length;
  const healthyCount = assets.filter(a => !a.refreshNeeded && a.riskLevel === "low").length;

  const grouped = assets.reduce<Record<string, TechAsset[]>>((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tech Stack Review</h1>
        <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI assesses refresh needs · vendor recommendations included</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Need Refresh", value: refreshCount, color: "text-red-400", icon: RefreshCw },
          { label: "EOL / Unsupported", value: eolCount, color: "text-orange-400", icon: Clock },
          { label: "Healthy", value: healthyCount, color: "text-green-400", icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="glow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon size={18} className={color} />
              <div>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset cards */}
      {isLoading
        ? [1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)
        : Object.entries(grouped).map(([cat, catAssets]) => (
            <div key={cat} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {CATEGORY_LABELS[cat] || cat}
              </div>
              {catAssets.map(asset => {
                const eol = asset.eolDate ? new Date(asset.eolDate) < new Date() : false;
                const vendors: string[] = asset.recommendedVendors ? JSON.parse(asset.recommendedVendors) : [];
                return (
                  <Card key={asset.id} className={`glow-card ${asset.refreshNeeded ? "border-orange-500/30" : ""}`} data-testid={`asset-${asset.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Cpu size={14} className="text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{asset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {asset.vendor} {asset.version && `· v${asset.version}`}
                              {asset.eolDate && ` · EOL ${new Date(asset.eolDate).getFullYear()}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {eol && <span className="text-xs px-2 py-0.5 rounded-full badge-critical">EOL</span>}
                          {asset.refreshNeeded && <span className="text-xs px-2 py-0.5 rounded-full badge-high">Refresh needed</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_CLASSES[asset.riskLevel ?? "unknown"]}`}>
                            {asset.riskLevel}
                          </span>
                        </div>
                      </div>

                      {asset.aiRecommendation && (
                        <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3">
                          <div className="text-xs font-semibold text-cyan-400 mb-1 ai-pulse">AI CISO Assessment</div>
                          <p className="text-xs text-muted-foreground">{asset.aiRecommendation}</p>
                        </div>
                      )}

                      {vendors.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Recommended replacements:</span>
                          {vendors.map(v => (
                            <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))
      }

      {/* No-SI callout */}
      <Card className="glow-card border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="text-cyan-400 font-semibold">No vendor meetings needed.</span>{" "}
              AI CISO has assessed your stack against current EOL databases and threat intelligence. Vendor recommendations above are pre-vetted for SMBs — contact vendors directly using the guidance provided.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
