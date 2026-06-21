import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play, Zap, Target, ClipboardCheck, Search,
  AlertOctagon, Wrench, BarChart3, ShoppingBag,
  TrendingUp, Activity, CheckCircle2, Clock, RefreshCw,
  Cpu, ChevronDown, ChevronUp
} from "lucide-react";

const AGENT_ICONS: Record<string, React.ElementType> = {
  "threat-hunter":      Target,
  "compliance-auditor": ClipboardCheck,
  "vuln-scanner":       Search,
  "incident-responder": AlertOctagon,
  "tech-assessor":      Wrench,
  "board-reporter":     BarChart3,
  "vendor-scout":       ShoppingBag,
  "posture-scorer":     TrendingUp,
};

const AGENT_COLORS: Record<string, string> = {
  "threat-hunter":      "text-red-400 bg-red-400/10 border-red-400/20",
  "compliance-auditor": "text-green-400 bg-green-400/10 border-green-400/20",
  "vuln-scanner":       "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "incident-responder": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "tech-assessor":      "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "board-reporter":     "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "vendor-scout":       "text-pink-400 bg-pink-400/10 border-pink-400/20",
  "posture-scorer":     "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
  capabilities: string[];
  triggers: string[];
  outputs: string[];
  status: string;
  last_run: string;
  runs_today: number;
}

function AgentCard({ agent }: { agent: Agent }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);

  const runMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/agents/${agent.id}/run`),
    onSuccess: () => {
      setRunning(false);
      toast({
        title: `${agent.name} triggered`,
        description: "Agent is running autonomously — results will appear in relevant modules.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
    onError: () => {
      setRunning(false);
      toast({ title: "Agent run failed", variant: "destructive" });
    },
  });

  const Icon = AGENT_ICONS[agent.id] || Cpu;
  const colorClass = AGENT_COLORS[agent.id] || "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
  const isRunning = runMutation.isPending || running;

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-border/80 transition-all"
      data-testid={`agent-card-${agent.id}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-500/40 text-green-400 bg-green-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block mr-1" />
                  {agent.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{agent.role}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => { setRunning(true); runMutation.mutate(); }}
            disabled={isRunning}
            data-testid={`button-run-${agent.id}`}
          >
            {isRunning ? (
              <><RefreshCw size={11} className="animate-spin" /> Running</>
            ) : (
              <><Play size={11} /> Run</>
            )}
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={11} />
            <span>{agent.last_run}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity size={11} />
            <span>{agent.runs_today.toLocaleString()} runs today</span>
          </div>
          <button
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${agent.id}`}
          >
            {expanded ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> Details</>}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border bg-background/40 px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Capabilities</div>
            <ul className="space-y-1">
              {agent.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-1.5 text-foreground/80">
                  <CheckCircle2 size={10} className="text-green-400 mt-0.5 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Triggers</div>
            <ul className="space-y-1">
              {agent.triggers.map((t) => (
                <li key={t} className="flex items-start gap-1.5 text-foreground/80">
                  <Zap size={10} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Outputs</div>
            <ul className="space-y-1">
              {agent.outputs.map((o) => (
                <li key={o} className="flex items-start gap-1.5 text-foreground/80">
                  <BarChart3 size={10} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const totalRunsToday = agents.reduce((sum, a) => sum + a.runs_today, 0);
  const activeAgents = agents.filter(a => a.status === "active").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-secondary rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Agent Swarm</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeAgents} autonomous AI agents running 24/7 — no MSP, no consultant, no vendor meeting needed
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Agents", value: activeAgents, icon: Cpu, color: "text-cyan-400" },
          { label: "Total Runs Today", value: totalRunsToday.toLocaleString(), icon: Activity, color: "text-green-400" },
          { label: "Zero SI Required", value: "100%", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Domains Covered", value: "8", icon: Target, color: "text-purple-400" },
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

      {/* Architecture diagram banner */}
      <div className="bg-card border border-cyan-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-foreground">Swarm Architecture</span>
          <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 ml-auto">Agentic AI</Badge>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {agents.map((agent, i) => {
            const Icon = AGENT_ICONS[agent.id] || Cpu;
            const colorClass = AGENT_COLORS[agent.id] || "text-cyan-400";
            return (
              <div key={agent.id} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center ${colorClass}`}>
                    <Icon size={13} />
                  </div>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap max-w-[64px] text-center leading-tight">{agent.name.replace(" ", "\n")}</span>
                </div>
                {i < agents.length - 1 && (
                  <div className="w-4 h-[1px] bg-border flex-shrink-0 mt-[-12px]" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {["Threat Feeds", "CVE Databases", "SIEM/EDR APIs", "Compliance Frameworks", "Asset Inventory"].map(src => (
              <span key={src} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                {src}
              </span>
            ))}
            <span className="text-[9px] text-muted-foreground">→ All agents share data automatically</span>
          </div>
        </div>
      </div>

      {/* Activity summary */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-foreground">Today's Activity</span>
        </div>
        <div className="space-y-2">
          {agents.map((agent) => {
            const maxRuns = Math.max(...agents.map(a => a.runs_today));
            const pct = Math.round((agent.runs_today / maxRuns) * 100);
            const Icon = AGENT_ICONS[agent.id] || Cpu;
            const colorClass = AGENT_COLORS[agent.id] || "text-cyan-400";
            return (
              <div key={agent.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={11} />
                </div>
                <span className="text-xs text-muted-foreground w-32 truncate flex-shrink-0">{agent.name}</span>
                <div className="flex-1">
                  <Progress value={pct} className="h-1.5" />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-right flex-shrink-0">{agent.runs_today.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent cards */}
      <div>
        <div className="text-xs text-muted-foreground mb-3">
          Click <strong className="text-foreground">Run</strong> to trigger any agent on demand — results feed back into the platform automatically
        </div>
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
