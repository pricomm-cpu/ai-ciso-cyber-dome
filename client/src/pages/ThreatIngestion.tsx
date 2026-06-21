import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Zap, AlertOctagon, RefreshCw, CheckCircle2,
  Clock, Globe, MapPin, Radio, ChevronDown, ChevronUp,
  Activity, Target, Database, Play, Eye, EyeOff,
  BookOpen, Cpu, TrendingDown, AlertTriangle, Filter,
  ArrowRight, Hash, FileText
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ThreatScope = "local" | "regional" | "global";
type ThreatCategory = "ransomware" | "data-breach" | "ddos" | "zero-day" | "nation-state" | "insider" | "phishing" | "supply-chain" | "identity" | "vulnerability";
type SeverityLevel = "critical" | "high" | "medium" | "low";

interface PlaybookStep {
  order: number;
  phase: "detection" | "containment" | "eradication" | "recovery" | "lessons-learned";
  action: string;
  owner: string;
  priority: "immediate" | "within-1h" | "within-24h" | "within-7d";
  toolHint?: string;
  automatable: boolean;
}

interface AgentAction {
  agentId: string;
  agentName: string;
  reason: string;
  priority: "immediate" | "within-1h" | "within-24h";
  expectedOutput: string;
}

interface StoredThreat {
  id: string;
  scope: ThreatScope;
  category: ThreatCategory;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  affectedSectors: string[];
  iocs: string[];
  ttps: string[];
  severity: SeverityLevel;
  region: string;
  threatActor?: string;
  cveIds?: string[];
  ingestedAt: string;
}

interface StoredStance {
  threatId: string;
  generatedAt: string;
  overallRisk: SeverityLevel;
  summary: string;
  affectedControls: string[];
  playbook: PlaybookStep[];
  mitigations: string[];
  agentActions: AgentAction[];
  postureDelta: number;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

interface PipelineStats {
  total: number;
  local: number;
  regional: number;
  global: number;
  critical: number;
  unacked: number;
  totalPostureDelta: number;
  lastRun: { run_at: string; threats_ingested: number; threats_new: number; duration_ms: number } | null;
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const SCOPE_STYLES: Record<ThreatScope, string> = {
  local:    "bg-red-500/10 text-red-300 border-red-500/25",
  regional: "bg-orange-500/10 text-orange-300 border-orange-500/25",
  global:   "bg-purple-500/10 text-purple-300 border-purple-500/25",
};

const SCOPE_ICONS: Record<ThreatScope, React.ElementType> = {
  local:    MapPin,
  regional: Radio,
  global:   Globe,
};

const PHASE_COLORS: Record<string, string> = {
  detection:       "text-yellow-400 bg-yellow-400/10",
  containment:     "text-orange-400 bg-orange-400/10",
  eradication:     "text-red-400 bg-red-400/10",
  recovery:        "text-green-400 bg-green-400/10",
  "lessons-learned": "text-blue-400 bg-blue-400/10",
};

const PRIORITY_COLORS: Record<string, string> = {
  immediate:    "text-red-400",
  "within-1h":  "text-orange-400",
  "within-24h": "text-yellow-400",
  "within-7d":  "text-blue-400",
};

const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  ransomware:     "Ransomware",
  "data-breach":  "Data Breach",
  ddos:           "DDoS",
  "zero-day":     "Zero-Day",
  "nation-state": "Nation-State",
  insider:        "Insider",
  phishing:       "Phishing",
  "supply-chain": "Supply Chain",
  identity:       "Identity",
  vulnerability:  "Vulnerability",
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

// ── Stance detail panel ───────────────────────────────────────────────────────

function StancePanel({ stance, onAcknowledge }: { stance: StoredStance; onAcknowledge: (id: string) => void }) {
  const [showPlaybook, setShowPlaybook] = useState(false);
  const phaseGroups = stance.playbook.reduce((acc, step) => {
    acc[step.phase] = acc[step.phase] ?? [];
    acc[step.phase].push(step);
    return acc;
  }, {} as Record<string, PlaybookStep[]>);
  const phaseOrder = ["detection", "containment", "eradication", "recovery", "lessons-learned"];

  return (
    <div className="border border-border/60 rounded-xl bg-background/60 mt-2 overflow-hidden">
      {/* Summary */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start gap-2 mb-3">
          <Shield size={13} className="text-cyan-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{stance.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingDown size={11} className="text-red-400" />
            <span>Posture impact: <span className="text-red-400 font-medium">{stance.postureDelta}</span> pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen size={11} className="text-cyan-400" />
            <span>{stance.playbook.length} playbook steps</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu size={11} className="text-purple-400" />
            <span>{stance.agentActions.length} agents triggered</span>
          </div>
        </div>
      </div>

      {/* Affected controls */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Affected Controls</div>
        <div className="flex flex-wrap gap-1.5">
          {stance.affectedControls.map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300">{c}</span>
          ))}
        </div>
      </div>

      {/* Agent actions */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Agent Swarm Actions</div>
        <div className="space-y-2">
          {stance.agentActions.map((action, i) => (
            <div key={i} className="flex items-start gap-2">
              <Cpu size={11} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">{action.agentName}</span>
                <span className={`ml-2 text-[10px] font-medium ${PRIORITY_COLORS[action.priority]}`}>{action.priority}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mitigations */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Immediate Mitigations</div>
        <ul className="space-y-1.5">
          {stance.mitigations.map((m, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
              <ArrowRight size={10} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* Playbook toggle */}
      <div className="px-4 py-3">
        <button
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          onClick={() => setShowPlaybook(!showPlaybook)}
        >
          <FileText size={12} className="text-cyan-400" />
          <span>Full IR Playbook ({stance.playbook.length} steps across {Object.keys(phaseGroups).length} phases)</span>
          {showPlaybook ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
        </button>

        {showPlaybook && (
          <div className="mt-3 space-y-3">
            {phaseOrder.filter(p => phaseGroups[p]).map(phase => (
              <div key={phase}>
                <div className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 ${PHASE_COLORS[phase]}`}>
                  {phase.toUpperCase()}
                </div>
                <div className="space-y-2 ml-2">
                  {phaseGroups[phase].map(step => (
                    <div key={step.order} className="flex items-start gap-2">
                      <span className="text-[10px] text-muted-foreground w-4 flex-shrink-0 mt-0.5">{step.order}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/90">{step.action}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-medium ${PRIORITY_COLORS[step.priority]}`}>{step.priority}</span>
                          <span className="text-[10px] text-muted-foreground">· {step.owner}</span>
                          {step.toolHint && <span className="text-[10px] text-cyan-400/70">· {step.toolHint}</span>}
                          {step.automatable && <span className="text-[10px] text-green-400/70">· automatable</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acknowledge */}
      {!stance.acknowledged && (
        <div className="px-4 pb-4">
          <Button
            size="sm"
            className="w-full h-8 text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30"
            variant="outline"
            onClick={() => onAcknowledge(stance.threatId)}
          >
            <CheckCircle2 size={12} className="mr-1.5" /> Acknowledge Defensive Stance
          </Button>
        </div>
      )}
      {stance.acknowledged && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 text-[10px] text-green-400">
            <CheckCircle2 size={10} />
            <span>Acknowledged by {stance.acknowledgedBy} on {fmt(stance.acknowledgedAt!)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Threat card ───────────────────────────────────────────────────────────────

function ThreatCard({ threat, stance, onAcknowledge }: { threat: StoredThreat; stance: StoredStance | null; onAcknowledge: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const ScopeIcon = SCOPE_ICONS[threat.scope];

  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden transition-all ${
        stance && !stance.acknowledged && (threat.severity === "critical" || threat.severity === "high")
          ? "border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.07)]"
          : "border-border"
      }`}
      data-testid={`threat-card-${threat.id}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${SCOPE_STYLES[threat.scope]}`}>
            <ScopeIcon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground leading-snug">{threat.title}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${SEVERITY_STYLES[threat.severity]}`}>
                  {threat.severity}
                </Badge>
                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${SCOPE_STYLES[threat.scope]}`}>
                  {threat.scope}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{threat.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <MapPin size={10} />
            <span>{threat.region}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Hash size={10} />
            <span>{CATEGORY_LABELS[threat.category]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock size={10} />
            <span>{fmt(threat.publishedAt)}</span>
          </div>
          {threat.threatActor && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-400/80">
              <AlertTriangle size={10} />
              <span>{threat.threatActor}</span>
            </div>
          )}
          {stance && (
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80">
              <Shield size={10} />
              <span>{stance.playbook.length}-step playbook</span>
            </div>
          )}
          {stance && !stance.acknowledged && (
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-yellow-500/40 text-yellow-400 bg-yellow-500/10 animate-pulse ml-auto">
              Stance pending
            </Badge>
          )}
          {stance?.acknowledged && (
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-green-500/40 text-green-400 bg-green-500/10 ml-auto">
              Acknowledged
            </Badge>
          )}

          <button
            className={`flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ${!stance?.acknowledged ? "" : "ml-0"}`}
            onClick={() => setExpanded(!expanded)}
            data-testid={`btn-expand-${threat.id}`}
          >
            {expanded ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Stance</>}
          </button>
        </div>
      </div>

      {expanded && stance && (
        <div className="px-4 pb-4">
          <StancePanel stance={stance} onAcknowledge={onAcknowledge} />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ThreatIngestionPage() {
  const { toast } = useToast();
  const [scopeFilter, setScopeFilter] = useState<ThreatScope | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ThreatCategory | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");
  const [showUnackedOnly, setShowUnackedOnly] = useState(false);

  const { data: stats } = useQuery<PipelineStats>({ queryKey: ["/api/ingestion/stats"] });
  const { data: threats = [], isLoading: threatsLoading } = useQuery<StoredThreat[]>({ queryKey: ["/api/ingestion/threats"] });
  const { data: stances = [] } = useQuery<StoredStance[]>({ queryKey: ["/api/ingestion/stances"] });
  const { data: runs = [] } = useQuery<any[]>({ queryKey: ["/api/ingestion/runs"] });

  const stanceMap = new Map(stances.map(s => [s.threatId, s]));

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ingestion/refresh"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/threats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/stances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/runs"] });
      toast({ title: "Pipeline refreshed", description: `${data.threatsIngested} threats processed, ${data.stancesGenerated} stances updated in ${data.durationMs}ms.` });
    },
  });

  const ackMutation = useMutation({
    mutationFn: (threatId: string) => apiRequest("POST", `/api/ingestion/stances/${threatId}/acknowledge`, { acknowledgedBy: "CISO" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/stances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ingestion/stats"] });
      toast({ title: "Defensive stance acknowledged", description: "Stance logged as reviewed by CISO." });
    },
  });

  // Filter
  const filtered = threats.filter(t => {
    if (scopeFilter !== "all" && t.scope !== scopeFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (severityFilter !== "all" && t.severity !== severityFilter) return false;
    if (showUnackedOnly) {
      const s = stanceMap.get(t.id);
      if (!s || s.acknowledged) return false;
    }
    return true;
  });

  const localCount    = threats.filter(t => t.scope === "local").length;
  const regionalCount = threats.filter(t => t.scope === "regional").length;
  const globalCount   = threats.filter(t => t.scope === "global").length;
  const unackedCount  = stances.filter(s => !s.acknowledged).length;
  const criticalCount = threats.filter(t => t.severity === "critical").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Threat Ingestion Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated local/regional threat intelligence → IR playbook mapping. No MSP, no SI required.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-1.5 h-8 text-xs flex-shrink-0"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="btn-refresh-pipeline"
        >
          {refreshMutation.isPending ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh Pipeline
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Ingested", value: stats?.total ?? threats.length, icon: Database, color: "text-cyan-400" },
          { label: "AU/NZ Local",    value: localCount,    icon: MapPin,       color: "text-red-400" },
          { label: "APAC Regional",  value: regionalCount, icon: Radio,        color: "text-orange-400" },
          { label: "Critical",       value: criticalCount, icon: AlertOctagon, color: "text-red-500" },
          { label: "Stances Pending",value: unackedCount,  icon: Shield,       color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} className={color} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {/* Posture impact banner */}
      {stats && stats.totalPostureDelta < 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <TrendingDown size={16} className="text-red-400 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-400">Active Threat Posture Impact: {stats.totalPostureDelta} pts</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unackedCount} unacknowledged defensive stances are degrading your posture score.
              Acknowledge each stance to confirm your defensive position and restore scoring.
            </p>
          </div>
        </div>
      )}

      {/* Pipeline status */}
      {stats?.lastRun && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-foreground">Pipeline Status</span>
            <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block mr-1" />
              Live
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Last Run</div>
              <div className="text-foreground font-medium">{fmt(stats.lastRun.run_at)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Threats Processed</div>
              <div className="text-foreground font-medium">{stats.lastRun.threats_ingested}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">New Threats</div>
              <div className="text-foreground font-medium">{stats.lastRun.threats_new}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">Duration</div>
              <div className="text-foreground font-medium">{stats.lastRun.duration_ms}ms</div>
            </div>
          </div>

          {/* Coverage bars */}
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {[
              { label: "AU/NZ Local",   count: localCount,    total: threats.length, color: "bg-red-400" },
              { label: "APAC Regional", count: regionalCount, total: threats.length, color: "bg-orange-400" },
              { label: "Global",        count: globalCount,   total: threats.length, color: "bg-purple-400" },
            ].map(({ label, count, total, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-28 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={12} className="text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Filter Threats</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} of {threats.length} shown</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Scope filter */}
          <div className="flex items-center gap-1">
            {(["all", "local", "regional", "global"] as const).map(s => (
              <button
                key={s}
                onClick={() => setScopeFilter(s)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  scopeFilter === s
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-scope-${s}`}
              >
                {s === "all" ? "All Scopes" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1">
            {(["all", "critical", "high", "medium", "low"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  severityFilter === s
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-severity-${s}`}
              >
                {s === "all" ? "All Severity" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Pending only toggle */}
          <button
            onClick={() => setShowUnackedOnly(!showUnackedOnly)}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition-colors ${
              showUnackedOnly
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            data-testid="filter-unacked"
          >
            <Shield size={10} />
            Pending stances only
          </button>
        </div>
      </div>

      {/* Threat list */}
      {threatsLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CheckCircle2 size={24} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm text-foreground">No threats match your current filters.</p>
          <p className="text-xs text-muted-foreground mt-1">Adjust filters or refresh the pipeline to ingest new threat data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground px-1">
            Local/regional threats shown first — highest proximity risk to your organisation
          </div>
          {filtered.map(threat => (
            <ThreatCard
              key={threat.id}
              threat={threat}
              stance={stanceMap.get(threat.id) ?? null}
              onAcknowledge={(id) => ackMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Pipeline run history */}
      {runs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Pipeline Run History</span>
          </div>
          <div className="space-y-2">
            {runs.slice(0, 5).map((run: any, i) => (
              <div key={run.id} className="flex items-center gap-3 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-muted-foreground w-32 flex-shrink-0">{fmt(run.run_at)}</span>
                <span className="text-foreground/80">{run.threats_ingested} threats</span>
                <span className="text-muted-foreground">{run.threats_new} new</span>
                <span className="text-muted-foreground ml-auto">{run.duration_ms}ms</span>
                <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">{run.source}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
