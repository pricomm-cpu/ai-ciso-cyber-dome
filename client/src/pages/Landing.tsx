import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Shield, Zap, CheckCircle2, ArrowRight, ChevronRight,
  Target, ClipboardCheck, Search, AlertOctagon, Wrench,
  BarChart3, ShoppingBag, TrendingUp, Activity,
  Lock, Eye, RefreshCw, Server, Globe, Mail,
  Star, Users, Building2, Play, ShoppingCart, UserCheck, Plug2
} from "lucide-react";

/* ─── tiny hook: count-up on viewport entry ─── */
function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { val, ref };
}

/* ─── animated grid background ─── */
function GridBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="hsl(192 100% 42%)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* radial glow centre */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/3 blur-[100px]" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/4 blur-[80px]" />
    </div>
  );
}

/* ─── floating threat ticker ─── */
const THREATS = [
  { sev: "CRITICAL", text: "CVE-2026-8821 · OpenSSL RCE · Patch available" },
  { sev: "HIGH",     text: "Phishing campaign targeting finance team · 14 recipients" },
  { sev: "HIGH",     text: "Excessive admin privileges · 14 accounts flagged" },
  { sev: "MEDIUM",   text: "Brute-force on VPN portal · 847 attempts in 6 hrs" },
  { sev: "CRITICAL", text: "Public S3 bucket exposing invoices · Auto-remediated" },
];
const SEV_COLOR: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/30",
  HIGH:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  MEDIUM:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};

function ThreatTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % THREATS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const t = THREATS[idx];
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${SEV_COLOR[t.sev]}`}>{t.sev}</span>
      <span className="text-foreground/70 truncate max-w-[320px]">{t.text}</span>
      <span className="text-cyan-400 flex-shrink-0">· AI resolved</span>
    </div>
  );
}

/* ─── stat card ─── */
function Stat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { val, ref } = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {val.toLocaleString()}<span className="text-cyan-400">{suffix}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ─── feature card ─── */
function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="group glow-card rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-all duration-300">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

/* ─── agent pill ─── */
const AGENTS = [
  { icon: Target,       name: "Threat Hunter",      color: "text-red-400 bg-red-400/10 border-red-400/20",    runs: "847/day" },
  { icon: ClipboardCheck,name:"Compliance Auditor", color: "text-green-400 bg-green-400/10 border-green-400/20", runs: "96/day" },
  { icon: Search,       name: "Vuln Manager",        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", runs: "24/day" },
  { icon: AlertOctagon, name: "Incident Responder",  color: "text-orange-400 bg-orange-400/10 border-orange-400/20", runs: "on-demand" },
  { icon: Wrench,       name: "Tech Assessor",       color: "text-purple-400 bg-purple-400/10 border-purple-400/20", runs: "4/day" },
  { icon: BarChart3,    name: "Board Reporter",      color: "text-blue-400 bg-blue-400/10 border-blue-400/20",   runs: "on-demand" },
  { icon: ShoppingBag,  name: "Vendor Scout",        color: "text-pink-400 bg-pink-400/10 border-pink-400/20",   runs: "12/day" },
  { icon: TrendingUp,   name: "Posture Scorer",      color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",   runs: "continuous" },
];

/* ─── connector logo pill ─── */
const CONNECTORS = [
  "CrowdStrike","SentinelOne","Okta","Microsoft Defender","Azure AD","Splunk",
  "Microsoft Sentinel","Tenable","Snyk","Cloudflare","KnowBe4",
  "Vanta","Drata","Wiz","PagerDuty","Jira","ServiceNow","1Password","GitGuardian",
  "Tailscale","Proofpoint","Elastic SIEM","Lacework","HashiCorp","Semgrep","Intruder","AWS GuardDuty","Palo Alto",
  "SAP Ariba","Workday HCM","Workday Financials","LinkedIn Talent","SEEK Talent",
];

/* ─── comparison row ─── */
function CmpRow({ label, us, them }: { label: string; us: string; them: string }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
        <CheckCircle2 size={12} className="flex-shrink-0" />{us}
      </div>
      <div className="text-xs text-muted-foreground/60">{them}</div>
    </div>
  );
}

/* ─── testimonial card ─── */
function Testimonial({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <div className="glow-card rounded-xl p-5 flex flex-col gap-4">
      <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />)}</div>
      <p className="text-sm text-foreground/80 leading-relaxed italic">"{quote}"</p>
      <div>
        <div className="text-xs font-semibold text-foreground">{name}</div>
        <div className="text-[11px] text-muted-foreground">{role} · {company}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (!el) return;
    const handler = () => setNavScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div id="landing-scroll" className="h-screen overflow-y-auto bg-background text-foreground scroll-smooth">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${navScrolled ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-label="Cyber Dome logo">
              <rect width="32" height="32" rx="6" fill="hsl(192 100% 42% / 0.12)" />
              <path d="M16 4 L24 8.5 L24 19 Q24 26 16 29 Q8 26 8 19 L8 8.5 Z" stroke="hsl(192 100% 42%)" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="18" r="3.5" fill="hsl(192 100% 42%)"/>
              <circle cx="16" cy="18" r="1.5" fill="hsl(220 20% 6%)"/>
              <path d="M12.5 9 L16 7 L19.5 9" stroke="hsl(192 100% 42% / 0.5)" strokeWidth="1"/>
            </svg>
            <div>
              <span className="text-sm font-bold text-foreground tracking-tight">AI CISO</span>
              <span className="text-[10px] text-cyan-400 ml-1.5 font-medium">CYBER DOME</span>
            </div>
          </div>
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            {["Features","Agents","Connectors","Talent","Pricing"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </nav>
          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/app">
              <a className="hidden sm:block text-xs text-muted-foreground hover:text-foreground transition-colors">Sign in</a>
            </Link>
            <Link href="/app">
              <a className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-500 text-background hover:bg-cyan-400 transition-colors">
                Launch Platform <ArrowRight size={12} />
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <GridBg />

        {/* Badge */}
        <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-[11px] text-cyan-400 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Autonomous AI · 8 Agents · 34 Connectors · No SI · No MSP · No Agency
        </div>

        {/* Headline */}
        <h1 className="relative max-w-4xl text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground mb-6">
          Your AI CISO.{" "}
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400">
              Always On.
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0" />
          </span>
          {" "}No Consultant Needed.
        </h1>

        {/* Sub */}
        <p className="relative max-w-2xl text-base text-muted-foreground leading-relaxed mb-10">
          Cyber Dome is the operating system for the modern CISO. A direct line between you and every cybersecurity product, platform, and specialist — no MSP, no SI, no consulting firm, no vendor meeting, no recruiting agency. Ever.
        </p>

        {/* CTAs */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-14">
          <Link href="/app">
            <a className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-cyan-500 text-background text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_32px_hsl(192_100%_42%_/_0.25)] hover:shadow-[0_0_48px_hsl(192_100%_42%_/_0.4)]">
              <Play size={14} className="fill-current" />
              Launch Cyber Dome
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Link>
          <a href="#features" className="flex items-center gap-1.5 px-6 py-3.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all">
            See how it works <ChevronRight size={14} />
          </a>
        </div>

        {/* Live threat ticker */}
        <div className="relative w-full max-w-2xl px-4 py-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Live AI Activity</span>
          </div>
          <ThreatTicker />
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/40">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/30" />
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat target={200}  suffix="+"  label="Assessment questions" />
          <Stat target={34}   suffix=""   label="Platform connectors" />
          <Stat target={8}    suffix=""   label="Autonomous AI agents" />
          <Stat target={2427} suffix=""   label="Agent runs per day" />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-4">
            <Shield size={11} className="text-cyan-400" /> Platform Modules
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything a CISO does. Automated.</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Nine integrated modules covering the full cybersecurity lifecycle — from real-time threat detection to board-ready reporting.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: BarChart3,    title: "Command Centre",       color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",    desc: "Real-time security operations dashboard. KPI cards, aggregate risk score, live threat feed, and AI action log — your 24/7 SOC at a glance." },
            { icon: Target,       title: "Threat Monitor",       color: "text-red-400 bg-red-400/10 border-red-400/20",       desc: "AI-powered threat triage. Correlates CVEs against your asset inventory, matches IOCs, and surfaces prioritised AI recommendations — no analyst needed." },
            { icon: ClipboardCheck,title:"Compliance Hub",       color: "text-green-400 bg-green-400/10 border-green-400/20", desc: "Continuous compliance across Essential 8, ISO 27001, SOC 2, and PCI DSS. Auto-collects evidence and flags control gaps before your next audit." },
            { icon: Server,       title: "Tech Stack Audit",     color: "text-purple-400 bg-purple-400/10 border-purple-400/20", desc: "Tracks every asset's EOL date, maps known CVEs to products, and recommends vendor replacements — no consultant required, no sales call needed." },
            { icon: Zap,          title: "Incident Response",    color: "text-orange-400 bg-orange-400/10 border-orange-400/20", desc: "AI-generated playbooks, phase-by-phase tracking, root cause analysis, and stakeholder communication drafts. From detection to closure." },
            { icon: Eye,          title: "Posture Assessment",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", desc: "200-question assessment across 10 domains. Why each question matters, how to fix each gap — with tool recommendations built in." },
            { icon: BarChart3,    title: "Board Report",         color: "text-blue-400 bg-blue-400/10 border-blue-400/20",    desc: "AI-authored executive summaries, risk narratives, and top-5 action items. Board-ready in one click — no vCISO copywriting needed." },
            { icon: Globe,        title: "Connector Marketplace",color: "text-pink-400 bg-pink-400/10 border-pink-400/20",    desc: "34 curated connectors with AI verdicts, SMB fit scores, and one-click connect. The CISO picks the best — no vendor pitch, no SI to configure." },
            { icon: Activity,     title: "Agent Swarm",          color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",    desc: "8 specialised AI agents running continuously. Trigger any agent on demand. Results flow back into every module automatically." },
            { icon: ShoppingCart, title: "Procurement (Ariba)",  color: "text-orange-400 bg-orange-400/10 border-orange-400/20", desc: "AI-evaluated products, direct PO via SAP Ariba. No vendor sales call, no MSP markup, no SI required to configure the integration." },
            { icon: UserCheck,    title: "Talent Marketplace",   color: "text-green-400 bg-green-400/10 border-green-400/20",  desc: "AI-matched cybersecurity specialists, hired directly. No recruiting agency, no consulting firm. Onboarding via Workday — zero intermediary." },
          ].map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── AGENTS ───────────────────────────────────────────────────────── */}
      <section id="agents" className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-5">
                <Activity size={11} className="text-cyan-400" /> Autonomous Agent Swarm
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                8 AI agents working{" "}
                <span className="text-cyan-400">around the clock</span>{" "}
                — no MSP required
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Each agent is a specialised AI that ingests data from your connected tools, cross-references threat intelligence, and pushes findings into every relevant module. 2,427 runs logged daily in the demo environment — all autonomous, all documented.
              </p>
              <div className="flex flex-col gap-2.5">
                {["Zero MSP dependency — agents replace your SOC tier-1", "Every agent can be triggered on-demand by the CISO", "All agents share data — findings flow across modules automatically", "Full audit trail of every decision and recommendation"].map(p => (
                  <div key={p} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
              <Link href="/app#/agents">
                <a className="inline-flex items-center gap-2 mt-8 text-sm text-cyan-400 hover:text-cyan-300 font-medium group">
                  View all agents <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AGENTS.map(({ icon: Icon, name, color, runs }) => (
                <div key={name} className={`glow-card rounded-xl p-3.5 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${color}`}>
                      <Icon size={13} />
                    </div>
                    <span className="text-xs font-semibold text-foreground leading-tight">{name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] text-muted-foreground font-mono">{runs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── NO INTERMEDIARY ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-4">
            <Plug2 size={11} className="text-cyan-400" /> Direct Operating Model
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            The CISO. The platform.{" "}
            <span className="text-cyan-400">Nothing in between.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Traditionally a CISO needs an army — an MSP for ops, an SI to integrate tools, a consulting firm for people, a procurement team for purchasing. Cyber Dome eliminates all four.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Globe,        title: "No MSP needed",   old: "Managed Security Service Provider",    new_: "8 autonomous AI agents running 24/7",      saving: "Save $80–250k/yr" },
            { icon: Server,       title: "No SI needed",    old: "Systems Integrator for tool config",   new_: "One-click connectors, AI-configured",      saving: "Save weeks of project time" },
            { icon: Users,        title: "No agency needed",old: "Recruiting firm for specialists",      new_: "AI-matched talent, hired directly",         saving: "Save 15–25% agency margin" },
            { icon: ShoppingCart, title: "No vendor pitch", old: "Weeks of vendor demos & sales calls",  new_: "AI verdict + direct Ariba PO",              saving: "Save weeks per purchase" },
          ].map(({ icon: Icon, title, old, new_, saving }) => (
            <div key={title} className="glow-card rounded-xl p-5 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center border text-cyan-400 bg-cyan-400/10 border-cyan-400/20">
                <Icon size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">{title}</div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground/50 line-through">
                  <span className="w-1 h-1 rounded-full bg-red-400/50 mt-1.5 flex-shrink-0" />
                  {old}
                </div>
                <div className="flex items-start gap-2 text-xs text-foreground/80">
                  <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                  {new_}
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-border text-[10px] text-cyan-400 font-medium">{saving}</div>
            </div>
          ))}
        </div>

        {/* Direct link visual */}
        <div className="glow-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Traditional vs Cyber Dome</div>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="text-xs font-bold text-red-400 mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Old model — 4+ intermediaries
              </div>
              <div className="flex flex-col items-center gap-2 text-xs text-center">
                {[
                  { label: "CISO", style: "bg-secondary border-border text-foreground" },
                  { label: "↓  Consulting firm (people)", style: "bg-red-500/10 border-red-500/20 text-red-400" },
                  { label: "↓  MSP / MSSP (ops)", style: "bg-red-500/10 border-red-500/20 text-red-400" },
                  { label: "↓  Systems Integrator (tools)", style: "bg-red-500/10 border-red-500/20 text-red-400" },
                  { label: "↓  Vendor sales team (products)", style: "bg-red-500/10 border-red-500/20 text-red-400" },
                  { label: "Security Product / Specialist", style: "bg-secondary border-border text-foreground" },
                ].map(({ label, style }) => (
                  <div key={label} className={`w-full max-w-xs px-4 py-2.5 rounded-lg border ${style}`}>{label}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-green-400 mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Cyber Dome — direct connection
              </div>
              <div className="flex flex-col items-center gap-4 text-xs text-center">
                <div className="w-full max-w-xs px-4 py-2.5 rounded-lg border bg-secondary border-border text-foreground">CISO</div>
                <div className="w-full max-w-xs px-4 py-4 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-semibold">
                  ⬇ Cyber Dome AI Platform
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">8 agents · 34 connectors · AI matching</div>
                </div>
                <div className="w-full max-w-xs px-4 py-2.5 rounded-lg border bg-secondary border-border text-foreground">Security Product / Specialist</div>
                <div className="text-[10px] text-green-400 font-medium">3 layers → 1. No margin, no delay, no intermediary.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONNECTORS ───────────────────────────────────────────────────── */}
      <section id="connectors" className="max-w-6xl mx-auto px-6 py-24 overflow-hidden">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-4">
            <Lock size={11} className="text-cyan-400" /> Connector Marketplace
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            34 connectors. One platform.{" "}
            <span className="text-cyan-400">No sales calls. No middlemen.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            AI analyses your gaps and recommends the best-fit tools with SMB fit scores, pricing, strengths, and weaknesses. Connect with one click — no vendor meeting, no SI required.
          </p>
        </div>

        {/* Scrolling connector ticker — two rows */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="overflow-hidden space-y-3">
            {/* Row 1 — scroll left */}
            <div className="flex gap-3 animate-[scroll-left_30s_linear_infinite]" style={{ width: "max-content" }}>
              {[...CONNECTORS, ...CONNECTORS].map((name, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs text-muted-foreground whitespace-nowrap hover:border-cyan-500/30 hover:text-foreground transition-colors">
                  <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
                  {name}
                </div>
              ))}
            </div>
            {/* Row 2 — scroll right */}
            <div className="flex gap-3 animate-[scroll-right_25s_linear_infinite]" style={{ width: "max-content" }}>
              {[...CONNECTORS.slice(14), ...CONNECTORS, ...CONNECTORS.slice(0, 14)].map((name, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs text-muted-foreground whitespace-nowrap hover:border-cyan-500/30 hover:text-foreground transition-colors">
                  <div className="w-2 h-2 rounded-full bg-purple-500/40" />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "EDR / Endpoint",        count: 3, color: "text-red-400 bg-red-400/10 border-red-400/20" },
            { label: "Identity & Access",      count: 3, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
            { label: "SIEM / Monitoring",      count: 4, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
            { label: "Vulnerability Mgmt",     count: 2, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
            { label: "Application Security",   count: 4, color: "text-green-400 bg-green-400/10 border-green-400/20" },
            { label: "Compliance Automation",  count: 2, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
            { label: "Cloud Security",         count: 2, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
            { label: "Network & Email",        count: 2, color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
            { label: "Procurement & Finance",   count: 2, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
            { label: "Talent & People",         count: 3, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`glow-card rounded-xl p-3 flex items-center justify-between`}>
              <span className="text-xs text-foreground/80">{label}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded border font-bold ${color}`}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ASSESSMENT ───────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Score card mock */}
            <div className="relative">
              <div className="glow-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Security Posture Score</div>
                    <div className="text-4xl font-bold text-foreground">62<span className="text-cyan-400 text-2xl">/100</span></div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-cyan-400">C+</span>
                  </div>
                </div>
                {[
                  { cat: "Identity & Access",     pct: 78, color: "bg-cyan-500" },
                  { cat: "Endpoints",             pct: 55, color: "bg-yellow-500" },
                  { cat: "Data & Cloud",          pct: 62, color: "bg-blue-500" },
                  { cat: "Network & Email",       pct: 48, color: "bg-red-500" },
                  { cat: "Application Security",  pct: 71, color: "bg-green-500" },
                  { cat: "AI Security",           pct: 35, color: "bg-orange-500" },
                ].map(({ cat, pct, color }) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="text-foreground font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw size={10} className="text-cyan-400" />
                  AI updated posture score 4 minutes ago
                </div>
              </div>
              {/* Floating recommendation card */}
              <div className="absolute -right-4 -bottom-4 glow-card rounded-xl p-3 max-w-[200px] bg-card border border-cyan-500/20 shadow-xl">
                <div className="text-[10px] text-cyan-400 font-semibold mb-1">AI Recommendation</div>
                <div className="text-[11px] text-foreground/80 leading-tight">Enable MFA on all admin accounts → +12 pts in Identity score</div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-5">
                <ClipboardCheck size={11} className="text-cyan-400" /> 200-Question Assessment
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                Know your gaps.{" "}
                <span className="text-cyan-400">Fix them</span>{" "}
                without a consultant.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The platform's 200-question security posture assessment spans 10 domains — from identity and endpoints to AI security and ransomware readiness. Every question explains why it matters and exactly how to remediate it, with specific tool recommendations built in.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {["Identity & Access (26Q)","Devices & Endpoints (22Q)","Data & Cloud (26Q)","Network & Email (22Q)","Application Security (20Q)","AI & Emerging Tech (16Q)"].map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
              <Link href="/app#/assessment">
                <a className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium group">
                  Start your assessment <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TALENT MARKETPLACE ───────────────────────────────────────────── */}
      <section id="talent" className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-5">
                <Users size={11} className="text-cyan-400" /> AI-Powered Talent Marketplace
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                Need people? AI finds them.{" "}
                <span className="text-cyan-400">You pick directly.</span>
                {" "}No agency.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Cyber Dome's AI agent analyses your posture gaps and surfaces pre-vetted cybersecurity specialists ranked by match score. The CISO picks directly. Engagement flows into Workday automatically — no recruiting firm, no consulting firm, no SI, no margin.
              </p>
              <div className="flex flex-col gap-2.5 mb-8">
                {[
                  "AI matches specialists to your exact security gaps",
                  "Pre-vetted profiles — certifications, experience, availability",
                  "Engage directly — no recruiter, no agency commission",
                  "Onboarding via Workday — contracts, BGC, tasks automated",
                  "Full specialist marketplace: vCISO, IR, pentest, GRC, cloud",
                ].map(p => (
                  <div key={p} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
              <Link href="/app#/talent">
                <a className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium group">
                  Browse talent marketplace <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Link>
            </div>
            {/* Sample profiles */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { initials: "AO", name: "Alex Okonkwo",    role: "CISO / Virtual CISO",         match: 97, certs: "CISSP · CISM", rate: "$2,200/day",  avail: "Immediate", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                { initials: "YT", name: "Yuki Tanaka",     role: "AI Security Lead",             match: 92, certs: "CISSP · AWS ML", rate: "$2,000/day", avail: "2 weeks",   color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                { initials: "SW", name: "Sarah Willoughby",role: "Incident Response Lead",       match: 89, certs: "GCIH · GCFA",    rate: "$1,600/day", avail: "Immediate", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                { initials: "MT", name: "Marcus Thompson", role: "IAM Lead",                     match: 88, certs: "CISSP · Okta",    rate: "$1,750/day", avail: "1 month",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              ].map(({ initials, name, role, match, certs, rate, avail, color }) => (
                <div key={name} className="glow-card rounded-xl p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{name}</span>
                      <CheckCircle2 size={11} className="text-cyan-400 flex-shrink-0" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{role} · {certs}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-foreground">{match}% <span className="text-[10px] text-muted-foreground font-normal">match</span></div>
                    <div className="text-[10px] text-muted-foreground">{rate}</div>
                    <div className={`text-[10px] mt-0.5 font-medium ${avail === "Immediate" ? "text-green-400" : "text-yellow-400"}`}>{avail}</div>
                  </div>
                </div>
              ))}
              <div className="text-center text-[11px] text-muted-foreground pt-1">
                2,400+ verified specialists · Ranked by AI match score
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VS COMPARISON ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Why Cyber Dome?</h2>
          <p className="text-sm text-muted-foreground">How we compare to the traditional approach.</p>
        </div>
        <div className="glow-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 bg-secondary px-5 py-3">
            <div className="text-xs text-muted-foreground font-medium"></div>
            <div className="text-xs font-bold text-cyan-400">Cyber Dome AI CISO</div>
            <div className="text-xs text-muted-foreground">Traditional (MSSP / vCISO / SI)</div>
          </div>
          <div className="px-5 divide-y divide-border">
            <CmpRow label="Availability"         us="24/7 autonomous"       them="Business hours only" />
            <CmpRow label="Threat response"       us="Seconds"               them="Hours to days" />
            <CmpRow label="Compliance monitoring" us="Continuous, automated" them="Annual or quarterly" />
            <CmpRow label="Board report"          us="1-click, AI-authored"  them="Days of consultant time" />
            <CmpRow label="Vendor selection"      us="AI verdict, no call"   them="Weeks of vendor demos" />
            <CmpRow label="Incident playbook"     us="Generated instantly"   them="Consultant engagement" />
            <CmpRow label="Assessment"            us="200Q self-serve"       them="$10k+ gap assessment" />
            <CmpRow label="Technology refresh"    us="AI-recommended"        them="SI project required" />
            <CmpRow label="Specialist hiring"      us="AI-matched, no agency" them="Consulting firm + 15–25% margin" />
            <CmpRow label="Product procurement"    us="Ariba PO, same day"    them="Weeks of vendor demos" />
            <CmpRow label="Lock-in risk"           us="None"                  them="Multi-year contracts" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-[11px] text-muted-foreground mb-4">
              <Users size={11} className="text-cyan-400" /> Trusted by SMB Security Leaders
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Built for CISOs. Loved by boards.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Testimonial
              quote="We cancelled our MSSP contract 3 months after deploying Cyber Dome. The AI does everything they did — and it never takes a day off."
              name="Sarah Mitchell" role="CISO" company="FinTech startup, 85 staff" />
            <Testimonial
              quote="The board report feature alone saved us 2 days of work per quarter. The AI narrative is better than anything I used to write manually."
              name="James Okafor" role="Head of Security" company="SaaS company, 140 staff" />
            <Testimonial
              quote="We had zero security posture visibility before this. Within 48 hours of onboarding we knew exactly what to fix and in what order."
              name="Priya Sharma" role="CTO / Acting CISO" company="Healthcare provider, 60 staff" />
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ───────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">One platform. Every tool you need.</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A fraction of the cost of a part-time vCISO — with more coverage, faster response, and zero lock-in.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { tier: "Starter", price: "$299", period: "/mo", desc: "For SMBs getting started with security posture.", features: ["200-question assessment", "Threat & compliance dashboard", "3 connector integrations", "Monthly board report", "Email support"], highlight: false },
            { tier: "Professional", price: "$799", period: "/mo", desc: "Full autonomous AI CISO capability.", features: ["Everything in Starter", "All 8 AI agents active", "29 connector marketplace", "Unlimited incidents", "Slack/PagerDuty alerting", "Priority support"], highlight: true },
            { tier: "Enterprise", price: "Custom", period: "", desc: "Multi-tenant, SSO, and white-label options.", features: ["Everything in Professional", "Multi-tenant / MSSP mode", "SSO / SAML", "Custom assessment frameworks", "Dedicated account manager", "SLA guarantee"], highlight: false },
          ].map(({ tier, price, period, desc, features, highlight }) => (
            <div key={tier} className={`glow-card rounded-2xl p-6 flex flex-col gap-5 ${highlight ? "border-cyan-500/40 shadow-[0_0_40px_hsl(192_100%_42%_/_0.08)]" : ""}`}>
              {highlight && (
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2.5 py-0.5 self-start">
                  MOST POPULAR
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-foreground">{tier}</div>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span className="text-3xl font-bold text-foreground">{price}</span>
                  <span className="text-sm text-muted-foreground">{period}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </div>
              <ul className="flex-1 space-y-2">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                    <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app">
                <a className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${highlight ? "bg-cyan-500 text-background hover:bg-cyan-400" : "border border-border text-foreground hover:bg-secondary"}`}>
                  {tier === "Enterprise" ? "Contact Sales" : "Get Started"}
                </a>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border">
        <GridBg />
        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-[11px] text-cyan-400 font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live platform — no sales call required
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            Your AI CISO is<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">ready right now.</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
            Launch Cyber Dome in minutes. No setup wizard, no vendor meeting, no systems integrator required. Your autonomous security operation starts the moment you log in.
          </p>
          <Link href="/app">
            <a className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-cyan-500 text-background text-base font-bold hover:bg-cyan-400 transition-all shadow-[0_0_40px_hsl(192_100%_42%_/_0.3)] hover:shadow-[0_0_60px_hsl(192_100%_42%_/_0.45)] group">
              <Play size={16} className="fill-current" />
              Launch Cyber Dome
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            {["No credit card required","No vendor meeting","Cancel anytime"].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-green-400" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <rect width="32" height="32" rx="6" fill="hsl(192 100% 42% / 0.12)" />
              <path d="M16 4 L24 8.5 L24 19 Q24 26 16 29 Q8 26 8 19 L8 8.5 Z" stroke="hsl(192 100% 42%)" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="18" r="3" fill="hsl(192 100% 42%)"/>
            </svg>
            <span className="text-xs text-muted-foreground">AI CISO Cyber Dome · No MSP · No SI · No Agency · No Vendor Meeting</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            {["Privacy","Terms","Security"].map(l => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
            <Link href="/app"><a className="text-cyan-400 hover:text-cyan-300 font-medium">Launch App →</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
