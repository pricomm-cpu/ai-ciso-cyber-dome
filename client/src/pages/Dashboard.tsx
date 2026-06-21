import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckSquare, Cpu, TrendingUp, TrendingDown, Minus, Activity, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Threat, ComplianceItem, Incident, TechAsset } from "@shared/schema";

function RiskRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f97316" : "#22c55e";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(220 15% 16%)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="text-2xl font-bold -mt-16 mb-8" style={{ color }}>{score}</div>
      <div className="text-xs text-muted-foreground">Risk Score</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: threats, isLoading: tLoading } = useQuery<Threat[]>({ queryKey: ["/api/threats"] });
  const { data: compliance, isLoading: cLoading } = useQuery<ComplianceItem[]>({ queryKey: ["/api/compliance"] });
  const { data: techAssets, isLoading: aLoading } = useQuery<TechAsset[]>({ queryKey: ["/api/tech-assets"] });
  const { data: incidents, isLoading: iLoading } = useQuery<Incident[]>({ queryKey: ["/api/incidents"] });

  const openThreats = threats?.filter(t => t.status === "open") ?? [];
  const criticalThreats = threats?.filter(t => t.severity === "critical") ?? [];
  const compliantItems = compliance?.filter(c => c.status === "compliant") ?? [];
  const compliancePct = compliance?.length ? Math.round((compliantItems.length / compliance.length) * 100) : 0;
  const refreshAssets = techAssets?.filter(a => a.refreshNeeded) ?? [];
  const activeIncidents = incidents?.filter(i => !i.closedAt) ?? [];

  const riskScore = Math.min(100, Math.round(
    (criticalThreats.length * 20) +
    (openThreats.length * 5) +
    ((100 - compliancePct) * 0.3) +
    (refreshAssets.length * 4)
  ));

  const kpis = [
    {
      title: "Open Threats",
      value: tLoading ? "–" : openThreats.length,
      sub: `${criticalThreats.length} critical`,
      icon: AlertTriangle,
      color: criticalThreats.length > 0 ? "text-red-400" : "text-yellow-400",
      href: "/threats",
      trend: criticalThreats.length > 0 ? "up" : "flat",
    },
    {
      title: "Compliance",
      value: cLoading ? "–" : `${compliancePct}%`,
      sub: `${compliantItems.length}/${compliance?.length ?? 0} controls`,
      icon: CheckSquare,
      color: compliancePct >= 80 ? "text-green-400" : "text-yellow-400",
      href: "/compliance",
      trend: compliancePct >= 80 ? "up" : "down",
    },
    {
      title: "Tech Refresh",
      value: aLoading ? "–" : refreshAssets.length,
      sub: "assets need review",
      icon: Cpu,
      color: refreshAssets.length > 2 ? "text-orange-400" : "text-cyan-400",
      href: "/tech-stack",
      trend: refreshAssets.length > 2 ? "down" : "flat",
    },
    {
      title: "Active Incidents",
      value: iLoading ? "–" : activeIncidents.length,
      sub: activeIncidents.length === 0 ? "All clear" : "In progress",
      icon: Zap,
      color: activeIncidents.length > 0 ? "text-red-400" : "text-green-400",
      href: "/incidents",
      trend: activeIncidents.length > 0 ? "up" : "flat",
    },
  ];

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Command Centre</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI agent monitoring · no integrator required</p>
        </div>
        <Badge className="badge-info text-xs">Live</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ title, value, sub, icon: Icon, color, href, trend }) => (
          <Link key={title} href={href}>
            <a>
              <Card className="glow-card cursor-pointer" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={16} className={color} />
                    {trend === "up" && <TrendingUp size={12} className="text-red-400" />}
                    {trend === "down" && <TrendingDown size={12} className="text-green-400" />}
                    {trend === "flat" && <Minus size={12} className="text-muted-foreground" />}
                  </div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs font-medium text-foreground mt-0.5">{title}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      <Card className="glow-card">
        <CardContent className="p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Framework-aligned posture</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">NIST CSF / ISO 27001</p>
              <p className="mt-1">Aligns your compliance score with both risk management and certifiable ISMS controls.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">SOC 2 / PCI DSS</p>
              <p className="mt-1">Highlights practical controls that matter for SaaS service providers and payment security.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">APRA CPS 234 / NIST SP 800-61</p>
              <p className="mt-1">Connects Australian financial services maturity and incident response evidence for board reporting.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Zero Trust / MITRE ATT&CK</p>
              <p className="mt-1">Supports modern detection and access controls that strengthen your overall cyber posture.</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
            The dashboard translates active threat, compliance and incident data into framework-aware posture signals the CISO can share with audit, risk and executive stakeholders.
          </div>
        </CardContent>
      </Card>

      {/* Risk + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk ring */}
        <Card className="glow-card flex flex-col items-center justify-center py-6">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aggregate Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskRing score={riskScore} />
          </CardContent>
        </Card>

        {/* Recent threats */}
        <Card className="glow-card col-span-1 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Threats</CardTitle>
              <Link href="/threats">
                <a className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">View all <ArrowRight size={10} /></a>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tLoading
              ? [1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)
              : (threats ?? []).slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors" data-testid={`threat-row-${t.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={13} className={
                        t.severity === "critical" ? "text-red-400 flex-shrink-0" :
                        t.severity === "high" ? "text-orange-400 flex-shrink-0" : "text-yellow-400 flex-shrink-0"
                      } />
                      <span className="text-sm text-foreground truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full badge-${t.severity}`}>{t.severity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full status-${t.status}`}>{t.status}</span>
                    </div>
                  </div>
                ))
            }
            {!tLoading && (threats ?? []).length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">No active threats detected</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Actions banner */}
      <Card className="glow-card border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Activity size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-cyan-400">AI CISO Actions — This Week</div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  "Assessed 14 new CVEs against your asset inventory",
                  "Generated compliance evidence for ISO 27001 A.8.2",
                  "Recommended firewall rule changes — no vendor call needed",
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-cyan-400 mt-0.5">✓</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
