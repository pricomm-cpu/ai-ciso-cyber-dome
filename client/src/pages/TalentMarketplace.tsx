import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Search, Filter, Star, MapPin, Clock, Briefcase,
  CheckCircle2, Zap, Award, ChevronRight, Bot, TrendingUp,
  Shield, Target, Globe, RefreshCw, XCircle, DollarSign,
  ArrowRight, Sparkles, Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─── types ─── */
interface TalentProfile {
  id: number;
  name: string;
  role: string;
  location: string;
  availability: "Immediate" | "2 weeks" | "1 month";
  engagementType: "Contract" | "Full-time" | "Part-time";
  rate: string;
  rateType: "day" | "year" | "hour";
  matchScore: number;
  yearsExp: number;
  certifications: string[];
  skills: string[];
  industries: string[];
  summary: string;
  aiMatch: string;
  verified: boolean;
}

/* ─── static talent pool ─── */
const TALENT_POOL: TalentProfile[] = [
  {
    id: 1,
    name: "Alex Okonkwo",
    role: "CISO / Virtual CISO",
    location: "Sydney, AU",
    availability: "Immediate",
    engagementType: "Contract",
    rate: "$2,200",
    rateType: "day",
    matchScore: 97,
    yearsExp: 18,
    certifications: ["CISSP", "CISM", "ISO 27001 LA"],
    skills: ["GRC", "Threat Management", "Board Reporting", "Zero Trust", "Cloud Security"],
    industries: ["FinTech", "Healthcare", "Government"],
    summary: "Former Big-4 CISO with 18 years driving security transformation. Deep expertise in ISO 27001 certification, APRA CPS 234, and building security teams from scratch.",
    aiMatch: "Matches your compliance gaps (ISO 27001 not certified) and board reporting needs. Has delivered 3 similar engagements in FinTech.",
    verified: true,
  },
  {
    id: 2,
    name: "Mei Lin Zhang",
    role: "Cloud Security Architect",
    location: "Melbourne, AU (Remote)",
    availability: "2 weeks",
    engagementType: "Contract",
    rate: "$1,800",
    rateType: "day",
    matchScore: 94,
    yearsExp: 12,
    certifications: ["AWS Security Specialty", "CCSP", "CISSP"],
    skills: ["AWS Security", "Azure Sentinel", "Wiz", "IaC Security", "DevSecOps"],
    industries: ["SaaS", "FinTech", "E-Commerce"],
    summary: "Cloud-native security expert specialising in AWS and Azure security architecture, Wiz onboarding, and DevSecOps pipeline hardening.",
    aiMatch: "Your Wiz connector is disconnected and cloud security scores at 62%. Mei has onboarded Wiz in 5 SMB environments.",
    verified: true,
  },
  {
    id: 3,
    name: "Rajan Mehta",
    role: "GRC Lead / Compliance Manager",
    location: "Singapore (Remote)",
    availability: "Immediate",
    engagementType: "Part-time",
    rate: "$950",
    rateType: "day",
    matchScore: 91,
    yearsExp: 10,
    certifications: ["CISA", "ISO 27001 LA", "SOC 2 Practitioner"],
    skills: ["ISO 27001", "SOC 2", "Essential 8", "PCI DSS", "Vanta", "Drata"],
    industries: ["Healthcare", "SaaS", "Retail"],
    summary: "GRC specialist with deep hands-on experience in Vanta and Drata automation. Has achieved SOC 2 Type II for 8 organisations.",
    aiMatch: "Your Compliance Hub shows 3 failing controls in SOC 2. Rajan has closed identical gaps for similar-sized organisations.",
    verified: true,
  },
  {
    id: 4,
    name: "Sarah Willoughby",
    role: "Incident Response Lead",
    location: "London, UK (Remote)",
    availability: "Immediate",
    engagementType: "Contract",
    rate: "$1,600",
    rateType: "day",
    matchScore: 89,
    yearsExp: 14,
    certifications: ["GCIH", "GCFA", "CISSP"],
    skills: ["IR Playbooks", "Forensics", "Ransomware Response", "CrowdStrike", "Splunk"],
    industries: ["Banking", "Insurance", "Legal"],
    summary: "Ex-CERT/CC incident responder. Led breach response for 3 ASX-listed companies. Specialises in ransomware containment and post-incident hardening.",
    aiMatch: "You have 2 open HIGH incidents with no assigned responder. Sarah is available immediately and has ransomware playbook experience.",
    verified: true,
  },
  {
    id: 5,
    name: "David Kowalski",
    role: "Penetration Tester / Red Team Lead",
    location: "Warsaw, PL (Remote)",
    availability: "2 weeks",
    engagementType: "Contract",
    rate: "$1,400",
    rateType: "day",
    matchScore: 86,
    yearsExp: 9,
    certifications: ["OSCP", "GPEN", "CEH"],
    skills: ["Red Team Ops", "Web AppSec", "Network Pentesting", "Burp Suite", "Active Directory"],
    industries: ["SaaS", "Government", "Telco"],
    summary: "OSCP-certified red teamer with 200+ engagements. Specialises in web application penetration and Active Directory attack paths.",
    aiMatch: "Your Application Security score is 71% — a red team exercise would surface remaining gaps before your next compliance audit.",
    verified: true,
  },
  {
    id: 6,
    name: "Priya Nair",
    role: "Security Awareness & Training Lead",
    location: "Bangalore, IN (Remote)",
    availability: "Immediate",
    engagementType: "Part-time",
    rate: "$650",
    rateType: "day",
    matchScore: 83,
    yearsExp: 8,
    certifications: ["Security+", "KnowBe4 Certified Trainer"],
    skills: ["KnowBe4", "Phishing Simulations", "Security Policy Writing", "Training Design"],
    industries: ["Education", "Healthcare", "Retail"],
    summary: "KnowBe4-certified training specialist. Has reduced phishing click rates by an average of 68% across 12 organisations.",
    aiMatch: "Your threat feed shows an active phishing campaign. Priya can deploy a targeted simulation and training programme in under a week.",
    verified: false,
  },
  {
    id: 7,
    name: "Marcus Thompson",
    role: "Identity & Access Management Lead",
    location: "Toronto, CA (Remote)",
    availability: "1 month",
    engagementType: "Contract",
    rate: "$1,750",
    rateType: "day",
    matchScore: 88,
    yearsExp: 11,
    certifications: ["CISSP", "Okta Certified Professional", "Microsoft IAM"],
    skills: ["Okta", "Azure AD", "PAM", "Zero Trust", "MFA Rollout"],
    industries: ["FinTech", "Legal", "SaaS"],
    summary: "IAM specialist with deep Okta and Azure AD experience. Has led zero-trust identity programmes for 25+ organisations.",
    aiMatch: "Your Identity & Access score is 78% — MFA gaps remain on 14 admin accounts. Marcus has closed identical gaps in similar orgs.",
    verified: true,
  },
  {
    id: 8,
    name: "Yuki Tanaka",
    role: "AI Security & MLSecOps Lead",
    location: "Tokyo, JP (Remote)",
    availability: "2 weeks",
    engagementType: "Contract",
    rate: "$2,000",
    rateType: "day",
    matchScore: 92,
    yearsExp: 7,
    certifications: ["CISSP", "AWS ML Specialty", "GICSP"],
    skills: ["AI Risk Management", "LLM Security", "MLSecOps", "AI Governance", "Prompt Injection Defence"],
    industries: ["FinTech", "Healthcare AI", "SaaS"],
    summary: "One of a handful of practitioners specialising in AI security governance and LLM threat modelling. Published researcher in AI red-teaming.",
    aiMatch: "Your AI & Emerging Tech score is the lowest at 35%. Yuki's specialisation directly addresses your most critical gap.",
    verified: true,
  },
];

const AVAILABILITY_COLOR: Record<string, string> = {
  "Immediate": "text-green-400 bg-green-400/10 border-green-400/20",
  "2 weeks":   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "1 month":   "text-orange-400 bg-orange-400/10 border-orange-400/20",
};
const ENGAGEMENT_COLOR: Record<string, string> = {
  "Contract":   "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Full-time":  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Part-time":  "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

function MatchBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-green-500" : score >= 80 ? "bg-cyan-500" : "bg-yellow-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-foreground tabular-nums">{score}%</span>
    </div>
  );
}

function ProfileCard({ p, onEngage }: { p: TalentProfile; onEngage: (p: TalentProfile) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glow-card rounded-xl p-5 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-sm font-bold text-cyan-400 flex-shrink-0">
            {p.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              {p.verified && <CheckCircle2 size={13} className="text-cyan-400" />}
            </div>
            <div className="text-xs text-muted-foreground">{p.role}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm font-bold text-foreground">{p.rate}<span className="text-xs text-muted-foreground font-normal">/{p.rateType}</span></span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${ENGAGEMENT_COLOR[p.engagementType]}`}>{p.engagementType}</span>
        </div>
      </div>

      {/* AI Match score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
            <Bot size={10} className="text-cyan-400" /> AI Match Score
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${AVAILABILITY_COLOR[p.availability]}`}>{p.availability}</span>
        </div>
        <MatchBar score={p.matchScore} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><MapPin size={11} />{p.location}</div>
        <div className="flex items-center gap-1"><Briefcase size={11} />{p.yearsExp} yrs exp</div>
        <div className="flex items-center gap-1"><Award size={11} />{p.certifications[0]}{p.certifications.length > 1 ? ` +${p.certifications.length - 1}` : ""}</div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {p.skills.slice(0, 4).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">{s}</span>
        ))}
        {p.skills.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">+{p.skills.length - 4} more</span>}
      </div>

      {/* AI insight — expandable */}
      <div
        className="px-3 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium">
            <Sparkles size={10} /> Why Cyber Dome matched this profile
          </div>
          <ChevronRight size={12} className={`text-cyan-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
        {expanded && (
          <p className="text-xs text-foreground/75 mt-2 leading-relaxed">{p.aiMatch}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <Button
          size="sm"
          className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold"
          onClick={() => onEngage(p)}
        >
          Engage via Workday <ArrowRight size={12} className="ml-1" />
        </Button>
        <Button size="sm" variant="outline" className="text-xs px-3">
          View Profile
        </Button>
      </div>
    </div>
  );
}

function EngageModal({ profile, onClose }: { profile: TalentProfile; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "workday" | "done">("form");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("3 months");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glow-card rounded-2xl p-6 w-full max-w-lg flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        {step === "form" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Engage {profile.name}</div>
                <div className="text-xs text-muted-foreground">{profile.role}</div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Start Date</label>
                <Input type="date" className="text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Engagement Duration</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                >
                  {["1 month","2 months","3 months","6 months","12 months","Ongoing"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Scope Notes (optional)</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                  placeholder="Describe the key deliverables or focus areas…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
                <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                Engagement contract, background checks, and onboarding will be managed via Workday. No third-party agency required.
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={() => setStep("workday")}>
                Submit to Workday <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === "workday" && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-foreground">Workday Integration</div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Create Contingent Worker requisition", done: true },
                { label: "Background check initiated via Workday Recruiting", done: true },
                { label: "Rate card validated against approved vendor schedule", done: true },
                { label: "Contract auto-generated from engagement template", done: false },
                { label: "Onboarding tasks assigned in Workday", done: false },
              ].map(({ label, done }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  {done
                    ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex-shrink-0" />
                  }
                  <span className={done ? "text-foreground/80" : "text-muted-foreground"}>{label}</span>
                </div>
              ))}
            </div>
            <Button size="sm" className="w-full text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={() => setStep("done")}>
              Confirm & Submit
            </Button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground mb-1">Engagement submitted</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {profile.name}'s engagement request has been created in Workday. Contract and onboarding tasks will be emailed within 24 hours. No recruiting agency, no MSP, no SI.
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onClose}>Close</Button>
              <Button size="sm" className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={onClose}>View in Workday</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function TalentMarketplace() {
  const [search, setSearch] = useState("");
  const [filterEngagement, setFilterEngagement] = useState<string>("All");
  const [filterAvailability, setFilterAvailability] = useState<string>("All");
  const [engageProfile, setEngageProfile] = useState<TalentProfile | null>(null);
  const [sortBy, setSortBy] = useState<"match" | "rate" | "exp">("match");

  const filtered = TALENT_POOL
    .filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.role.toLowerCase().includes(q) && !p.skills.some(s => s.toLowerCase().includes(q))) return false;
      if (filterEngagement !== "All" && p.engagementType !== filterEngagement) return false;
      if (filterAvailability !== "All" && p.availability !== filterAvailability) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore;
      if (sortBy === "exp") return b.yearsExp - a.yearsExp;
      return parseInt(b.rate.replace(/\D/g, "")) - parseInt(a.rate.replace(/\D/g, ""));
    });

  return (
    <div className="space-y-6">
      {engageProfile && <EngageModal profile={engageProfile} onClose={() => setEngageProfile(null)} />}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-cyan-400" />
          <h1 className="text-xl font-bold text-foreground">Talent Marketplace</h1>
          <Badge variant="secondary" className="text-[10px] text-cyan-400 border-cyan-400/20">AI-Matched</Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Cyber Dome's AI agent analyses your security posture gaps and surfaces pre-vetted specialists — no recruiting agency, no consulting firm, no intermediary. Pick directly. Onboard via Workday.
        </p>
      </div>

      {/* How it works banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: "01", icon: Bot,          title: "AI analyses your gaps",       desc: "Posture score + open incidents drive matching" },
          { step: "02", icon: Sparkles,     title: "Profiles surface instantly",  desc: "Ranked by AI match score, not agency margin" },
          { step: "03", icon: Users,        title: "CISO picks directly",         desc: "No recruiter, no SI, no middleman" },
          { step: "04", icon: CheckCircle2, title: "Onboard via Workday",         desc: "Contract, BGC, and onboarding automated" },
        ].map(({ step, icon: Icon, title, desc }) => (
          <div key={step} className="glow-card rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Icon size={13} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-[10px] text-cyan-400/60 font-mono mb-0.5">STEP {step}</div>
              <div className="text-xs font-semibold text-foreground leading-tight">{title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Verified specialists", value: "2,400+",  icon: CheckCircle2, color: "text-green-400" },
          { label: "Avg AI match score",   value: "91%",     icon: Bot,          color: "text-cyan-400" },
          { label: "Avg time to onboard",  value: "4 days",  icon: Clock,        color: "text-blue-400" },
          { label: "Agency fees saved",    value: "$0",      icon: DollarSign,   color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glow-card rounded-xl p-4 text-center">
            <div className={`flex items-center justify-center mb-1.5`}><Icon size={16} className={color} /></div>
            <div className="text-xl font-bold text-foreground">{value}</div>
            <div className="text-[11px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 text-xs h-8"
            placeholder="Search by name, role, or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterEngagement}
          onChange={e => setFilterEngagement(e.target.value)}
        >
          {["All","Contract","Full-time","Part-time"].map(v => <option key={v}>{v}</option>)}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
        >
          {["All","Immediate","2 weeks","1 month"].map(v => <option key={v}>{v}</option>)}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
        >
          <option value="match">Sort: AI Match</option>
          <option value="exp">Sort: Experience</option>
          <option value="rate">Sort: Rate</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} profiles</span>
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(p => (
          <ProfileCard key={p.id} p={p} onEngage={setEngageProfile} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-muted-foreground text-sm">
            No profiles match your filters. Try broadening the search.
          </div>
        )}
      </div>

      {/* Workday integration banner */}
      <div className="glow-card rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="hsl(213 100% 60%)" strokeWidth="1.5"/>
            <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="hsl(213 100% 60%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground mb-0.5">Workday HCM Integration</div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Every engagement flows directly into Workday — contingent worker records, background checks, contracts, and onboarding tasks. No manual data entry, no recruiting agency in the loop, no SI required to configure the integration.
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Connected</span>
        </div>
      </div>
    </div>
  );
}
