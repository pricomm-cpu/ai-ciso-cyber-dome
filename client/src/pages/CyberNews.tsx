import { useState } from "react";
import {
  Newspaper, Globe, MapPin, TrendingUp, AlertTriangle,
  ExternalLink, Clock, Filter, Search, RefreshCw,
  ChevronRight, Flame, Shield, Zap, Activity, ArrowUpRight,
  Radio, BarChart3, Target, Users, Lock, Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/* ─── types ─── */
type Scope = "local" | "regional" | "global";
type Category = "breach" | "ransomware" | "vulnerability" | "regulation" | "trend" | "nation-state";

interface NewsItem {
  id: number;
  scope: Scope;
  category: Category;
  severity: "critical" | "high" | "medium" | "info";
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  date: string;
  sector?: string;
  country?: string;
  tags: string[];
  aiTakeaway: string;
}

interface TrendItem {
  scope: Scope;
  title: string;
  delta: string;
  direction: "up" | "down";
  context: string;
  color: string;
}

/* ─── real news data (June 2026) ─── */
const NEWS: NewsItem[] = [
  // ── LOCAL (AU/NZ) ──────────────────────────────────────────────
  {
    id: 1, scope: "local", category: "ransomware", severity: "critical",
    headline: "Mackay Sugar Mills shut down by 'The Gentlemen' ransomware group",
    summary: "Russian-speaking ransomware group The Gentlemen claimed a cyber attack on Queensland sugar producer Mackay Sugar, forcing mill operations offline. Australia is the fourth most-targeted country by the group globally, with 1,570 real victims behind its 320 publicly claimed.",
    source: "ABC News", sourceUrl: "https://www.abc.net.au/news/2026-06-18/the-gentlemen-ransomware-russian-speaking-hack-north-qld-sugar/106807366",
    date: "2026-06-18", sector: "Agriculture / Critical Infrastructure", country: "AU",
    tags: ["Ransomware", "OT", "Queensland", "Critical Infrastructure"],
    aiTakeaway: "OT/ICS environments remain critically under-defended. Air-gap controls and offline backups are non-negotiable for operational continuity.",
  },
  {
    id: 2, scope: "local", category: "breach", severity: "high",
    headline: "VentraIP Australia hit by 600Gbps+ DDoS — 300,000 customers offline for 7 hours",
    summary: "Australia's largest privately owned web host suffered a terabit-scale DDoS on 23 May 2026. The same threat actor previously targeted Brisbane cloud provider Binary Lane. ASD confirmed engagement. No data breach — service disruption only.",
    source: "arnav.au", sourceUrl: "https://arnav.au/2026/06/02/australian-cyber-attacks-denial-of-service-data-breaches/",
    date: "2026-05-23", sector: "Cloud / Hosting", country: "AU",
    tags: ["DDoS", "Cloud", "Web Hosting", "IoT Botnet"],
    aiTakeaway: "DDoS attacks surged 280% in AU FY2024-25. SMBs relying on shared hosting have no controls — direct BGP-level scrubbing or a CDN with DDoS mitigation is the minimum.",
  },
  {
    id: 3, scope: "local", category: "breach", severity: "high",
    headline: "NSW Treasury insider steals 5,600 sensitive government documents",
    summary: "A 45-year-old NSW Treasury commercial team staffer was arrested after allegedly exfiltrating more than 5,600 confidential government documents to an external server. No external compromise — pure insider threat. Strike Force Civic established. All data located and secured.",
    source: "Mercury IT", sourceUrl: "https://mercuryit.com.au/cyber-insights-with-mercuryit-may-2026/",
    date: "2026-04-19", sector: "Government", country: "AU",
    tags: ["Insider Threat", "Government", "NSW", "Data Exfiltration"],
    aiTakeaway: "DLP and UEBA controls are essential in government environments. Privileged access to bulk-download capabilities should trigger real-time alerts.",
  },
  {
    id: 4, scope: "local", category: "breach", severity: "high",
    headline: "Instructure Canvas breach hits 9 Australian universities and state schools",
    summary: "ShinyHunters exploited Oracle PeopleSoft and Canvas LMS to reach up to 275M users globally. AU victims include UTS, University of Melbourne, RMIT, University of Sydney, Queensland and Tasmania state schools. Instructure ultimately paid ShinyHunters. Names, emails, course enrolments exposed.",
    source: "iStart", sourceUrl: "https://istart.com.au/news-items/appwrap-2026/",
    date: "2026-05-06", sector: "Education", country: "AU",
    tags: ["Third-Party Risk", "Education", "ShinyHunters", "SaaS"],
    aiTakeaway: "Third-party SaaS platforms are the dominant breach vector in 2026. Every vendor with access to your data needs a security evidence review — not just a questionnaire.",
  },
  {
    id: 5, scope: "local", category: "breach", severity: "high",
    headline: "NZ Manage My Health breach: 99,000 patient records stolen, Privacy Commissioner finds systemic failures",
    summary: "Privacy Commissioner found both Manage My Health and Health NZ breached the Health Information Privacy Code. Compromised credentials used to access My Health Documents for ~99,000 mostly Northland patients. Stolen data offered for sale. Compliance notices issued.",
    source: "Privacy Commissioner NZ", sourceUrl: "https://www.privacy.org.nz/focus-areas/manage-my-health-inquiry/executive-summary-manage-my-health-phase-one/",
    date: "2026-05-27", sector: "Healthcare", country: "NZ",
    tags: ["Healthcare", "Privacy", "New Zealand", "Credential Compromise"],
    aiTakeaway: "Credential-based attacks bypass perimeter defences entirely. MFA on patient portals and anomaly detection for bulk data access are the minimum response.",
  },
  {
    id: 6, scope: "local", category: "regulation", severity: "medium",
    headline: "Federal Court orders AU$2.5M penalty against AFSL holder for cybersecurity failures",
    summary: "In a landmark ASIC ruling, an Australian Financial Services Licensee was ordered to pay AU$2.5M in penalties after a cyber attack resulting in 385GB of data exfiltration. First AFS Licensee to receive such an order — signals ASIC's intent to enforce cyber obligations.",
    source: "CyberLawWatch", sourceUrl: "https://www.cyberlawwatch.com/2026/06/16/an-afs-licensee-first-receiving-an-order-to-pay-au2-5-million-for-cybersecurity-failures/",
    date: "2026-06-16", sector: "Financial Services", country: "AU",
    tags: ["ASIC", "Regulation", "Penalty", "AFSL", "Compliance"],
    aiTakeaway: "ASIC is now actively penalising inadequate cyber posture. Financial services CISOs should map controls to the ASIC Cyber Resilience Good Practices framework immediately.",
  },
  {
    id: 7, scope: "local", category: "ransomware", severity: "high",
    headline: "youX Sydney fintech breach: 444K borrowers exposed including 229K driver's licence numbers",
    summary: "Sydney fintech youX (Vroom) disclosed a breach exposing 444,538 borrowers' data including nearly 229,226 driver's licence numbers and data from ~800 broker organisations. Notified OAIC. Data posted online by threat actor.",
    source: "Bright Defense", sourceUrl: "https://www.brightdefense.com/resources/recent-data-breaches/",
    date: "2026-02-18", sector: "Fintech", country: "AU",
    tags: ["Fintech", "PII", "Identity Documents", "OAIC"],
    aiTakeaway: "Identity document exposure creates long-tail fraud risk for customers. Tokenisation of government IDs at rest is now essential for fintech platforms.",
  },

  // ── REGIONAL (APAC) ────────────────────────────────────────────
  {
    id: 8, scope: "regional", category: "breach", severity: "critical",
    headline: "ShinyHunters exploits Oracle PeopleSoft zero-day CVE-2026-35273 (CVSS 9.8) across APAC universities",
    summary: "Unauthenticated RCE in Oracle PeopleSoft PeopleTools exploited in the wild for 2 weeks before patching. ShinyHunters used the flaw to breach institutions across APAC including South Korea, Australia, and Japan. Data offered for sale on criminal forums.",
    source: "Commonwealth Sentinel", sourceUrl: "https://commonwealthsentinel.com/cyber-security-weekly-top-5-cybersecurity-news-stories-for-the-week-of-june-8-14-2026/",
    date: "2026-06-08", sector: "Education / Enterprise", country: "APAC",
    tags: ["Zero-Day", "Oracle", "CVE-2026-35273", "RCE", "ShinyHunters"],
    aiTakeaway: "Zero-day exploitation windows are shrinking to hours. Internet-facing ERP platforms need WAF + virtual patching as the first line while patches are tested.",
  },
  {
    id: 9, scope: "regional", category: "nation-state", severity: "critical",
    headline: "China-linked UNC6671 / BlackFile targets APAC government estates via vishing + AiTM SSO",
    summary: "Mandiant GTIG published UNC6671/BlackFile reporting — China-linked espionage cluster using vishing combined with Adversary-in-the-Middle SSO attacks against government networks across APAC. Identity compromise enabling stealthy, long-dwell intrusions.",
    source: "Protos Labs", sourceUrl: "https://www.protoslabs.io/weekly-threat-briefs/apac-weekly-threat-brief-2026-05-22",
    date: "2026-05-16", sector: "Government", country: "APAC",
    tags: ["Nation-State", "China", "AiTM", "Espionage", "Vishing"],
    aiTakeaway: "AiTM attacks bypass MFA. Phishing-resistant MFA (FIDO2/passkeys) is the only effective countermeasure. Token binding and conditional access policies must be reviewed.",
  },
  {
    id: 10, scope: "regional", category: "breach", severity: "high",
    headline: "Fox Tempest malware-signing-as-a-service targets APAC MSSPs — Microsoft disrupts operation",
    summary: "Microsoft disrupted Fox Tempest, a criminal malware-signing-as-a-service operation specifically targeting Managed Security Service Providers in APAC. Signed malware bypasses EDR detection by appearing as legitimate software.",
    source: "Protos Labs", sourceUrl: "https://www.protoslabs.io/weekly-threat-briefs/apac-weekly-threat-brief-2026-05-22",
    date: "2026-05-19", sector: "MSSP / Security", country: "APAC",
    tags: ["MSSP", "Malware Signing", "Fox Tempest", "Microsoft", "EDR Bypass"],
    aiTakeaway: "MSSP supply chain compromise is a force-multiplier attack. Verify code signing certificates on all security tooling and audit MSSP access scopes quarterly.",
  },
  {
    id: 11, scope: "regional", category: "trend", severity: "medium",
    headline: "APAC data leaks surge 143% — 5.3 million records in Q1 2026, South Korea and India top targets",
    summary: "Group-IB AUNZ Intelligence report shows leaked data events surging 143.38% in APAC, totalling 5.3M+ records. Redline Stealer the most prevalent malware. South Korea, China, and India experienced the most activity. Government and military sectors primary targets.",
    source: "Group-IB", sourceUrl: "https://www.group-ib.com/resources/research-hub/aunz-intelligence-insights-report-april-2026/",
    date: "2026-06-01", sector: "Cross-Sector", country: "APAC",
    tags: ["Data Leaks", "Infostealer", "Redline", "APAC Trends"],
    aiTakeaway: "Infostealer-sourced credentials are fuelling APAC breach escalation. Dark web monitoring and credential exposure scanning should be continuous, not periodic.",
  },
  {
    id: 12, scope: "regional", category: "trend", severity: "medium",
    headline: "INTERPOL warns of rising cybercrime surge across Asia-Pacific as digitisation accelerates",
    summary: "INTERPOL's 2026 Asia-Pacific cybercrime report documents a sharp increase in business email compromise, AI-assisted phishing, and ransomware-as-a-service attacks as the region's digital economy expands. 3.4M cybersecurity workforce shortage compounding the threat.",
    source: "Infosecurity Magazine", sourceUrl: "https://www.infosecurity-magazine.com/news/cybercrime-surges-apac-digitization/",
    date: "2026-06-18", sector: "Cross-Sector", country: "APAC",
    tags: ["INTERPOL", "BEC", "AI Phishing", "RaaS", "Workforce Gap"],
    aiTakeaway: "The 3.4M specialist shortage means AI automation of Tier-1 security tasks isn't optional — it's the only path to coverage. Cyber Dome's agent swarm addresses exactly this gap.",
  },
  {
    id: 13, scope: "regional", category: "breach", severity: "high",
    headline: "Global credential theft hits 320,000 firewall devices across 194 countries — APAC heavily impacted",
    summary: "Coordinated attack leverages stolen credentials to compromise 320,000 firewall devices worldwide. APAC organisations among the most impacted. Attackers used lateral movement to pivot from perimeter devices into internal networks.",
    source: "CybersecAsia", sourceUrl: "https://cybersecasia.net",
    date: "2026-06-19", sector: "Network", country: "APAC",
    tags: ["Firewall", "Credential Theft", "Lateral Movement", "Network"],
    aiTakeaway: "Default and reused firewall credentials remain endemic. Privileged Access Management and rotation of all network device credentials should be immediate priorities.",
  },

  // ── GLOBAL ─────────────────────────────────────────────────────
  {
    id: 14, scope: "global", category: "vulnerability", severity: "critical",
    headline: "Microsoft RoguePlanet zero-day CVE-2026-50656 in Windows Defender — patch in development",
    summary: "Microsoft confirmed CVE-2026-50656 (CVSS 7.8), a privilege escalation zero-day in the Microsoft Malware Protection Engine allowing attackers to reach SYSTEM-level access. Actively exploited in the wild. Emergency patch under development.",
    source: "Security Affairs", sourceUrl: "https://securityaffairs.com/193830/security/microsoft-confirms-rogueplanet-zero-day-in-defender-patch-under-development.html",
    date: "2026-06-19", sector: "Cross-Sector", country: "Global",
    tags: ["Microsoft", "Zero-Day", "Privilege Escalation", "CVE-2026-50656", "Windows Defender"],
    aiTakeaway: "Ironic that Defender itself is the attack surface. Apply Exploit Protection rules and restrict Defender engine update channels until the official patch ships.",
  },
  {
    id: 15, scope: "global", category: "ransomware", severity: "critical",
    headline: "'The Gentlemen' adds EDR killer tools to RaaS platform — ESET warns of widescale EDR bypass",
    summary: "ESET research revealed The Gentlemen ransomware group — one of 2026's most active — added sophisticated EDR-disabling tools to its RaaS platform, giving affiliates the ability to disable CrowdStrike, SentinelOne, and other enterprise EDR products. 90/10 revenue split making it highly attractive to affiliates.",
    source: "CSO Online", sourceUrl: "https://www.csoonline.com/article/4187329/threat-actor-adds-advanced-edr-killer-tools-to-ransomware-as-a-service-platform.html",
    date: "2026-06-20", sector: "Cross-Sector", country: "Global",
    tags: ["Ransomware", "EDR Bypass", "The Gentlemen", "RaaS", "ESET"],
    aiTakeaway: "EDR-killer tooling fundamentally changes the threat model. Backup-based resilience and network segmentation must be treated as equal-priority defences alongside endpoint protection.",
  },
  {
    id: 16, scope: "global", category: "ransomware", severity: "high",
    headline: "INC ransomware claims 830+ victims since 2023 — Q4 most active RaaS group globally",
    summary: "ZeroFox data charts INC ransomware as the fourth most prominent RaaS group in Q1 2026 with 120+ incidents. 65%+ of victims are US organisations. Legal services, manufacturing, construction, technology, and healthcare most targeted.",
    source: "The Hacker News", sourceUrl: "https://thehackernews.com/2026/06/inc-ransomware-claims-830-victims-since.html",
    date: "2026-06-19", sector: "Cross-Sector", country: "Global",
    tags: ["Ransomware", "INC", "RaaS", "ZeroFox"],
    aiTakeaway: "INC's sector targeting overlaps heavily with SMB. Offline backup validation, network segmentation, and tested recovery runbooks are essential preparation.",
  },
  {
    id: 17, scope: "global", category: "breach", severity: "high",
    headline: "Kodak confirms breach — ShinyHunters claims 2.2M records, sets leak deadline",
    summary: "Eastman Kodak confirmed a security breach after ShinyHunters claimed theft of 2.2M customer records including PII. Company says incident was contained and limited in scope. ShinyHunters leak deadline passed with partial data release.",
    source: "Malwarebytes", sourceUrl: "https://www.malwarebytes.com/blog/news/2026/06/kodak-confirms-breach-as-shinyhunters-leak-threat-reaches-deadline",
    date: "2026-06-19", sector: "Manufacturing", country: "Global",
    tags: ["ShinyHunters", "Extortion", "PII", "Breach"],
    aiTakeaway: "ShinyHunters' double-extortion pattern — steal then threaten — is now standard. Data classification and DLP controls must extend to CRM and customer databases.",
  },
  {
    id: 18, scope: "global", category: "vulnerability", severity: "high",
    headline: "June 2026 Patch Tuesday: 206 vulnerabilities, 3 zero-days including HTTP/2 Bomb flaw CVE-2026-49160",
    summary: "Microsoft's largest-ever Patch Tuesday drops 206 CVEs including an HTTP/2 Rapid Reset variant (CVE-2026-49160), the RoguePlanet Defender privilege escalation, and a Windows Kernel RCE. BitLocker bypass also patched.",
    source: "Malware.news", sourceUrl: "https://malware.news/t/june-2026-patch-tuesday-206-vulnerabilities-three-zero-days-including-http-2-bomb-flaw-cve-2026-49160/107737",
    date: "2026-06-10", sector: "Cross-Sector", country: "Global",
    tags: ["Patch Tuesday", "CVE", "HTTP/2", "BitLocker", "Windows Kernel"],
    aiTakeaway: "206 CVEs in a single Patch Tuesday overwhelms manual patching teams. Automated vulnerability management with prioritisation by CVSS + exploitation likelihood is essential.",
  },
  {
    id: 19, scope: "global", category: "trend", severity: "info",
    headline: "Verizon 2026 DBIR: 31,000 incidents, 22,000 breaches — AI-assisted attacks in 1-in-6 breaches",
    summary: "The Verizon 2026 Data Breach Investigations Report analysed 31,000+ incidents across 145 countries. AI is now present in 1-in-6 (16%) breaches. Phishing (37% of AI-assisted cases) and deepfakes (35%) dominate. Supply chain and espionage incidents rising sharply.",
    source: "National CIO Review", sourceUrl: "https://nationalcioreview.com/articles-insights/extra-bytes/security-priorities-revealed-in-verizons-2026-data-breach-report/",
    date: "2026-06-19", sector: "Research", country: "Global",
    tags: ["DBIR", "Verizon", "AI Attacks", "Phishing", "Deepfake"],
    aiTakeaway: "AI-assisted phishing is now the norm, not the exception. Human-only email security controls are insufficient — AI-based detection must be layered over legacy filters.",
  },
  {
    id: 20, scope: "global", category: "trend", severity: "info",
    headline: "92% of security leaders concerned about AI agent security risks — CSA 2026 report",
    summary: "Cloud Security Alliance survey of 1,500+ security leaders: 92% are concerned about AI agent security implications, 44% extremely concerned about third-party LLMs. AI governance frameworks are lagging deployment by 18–24 months in most organisations.",
    source: "CSA", sourceUrl: "https://cloudsecurityalliance.org/blog/2026/04/02/the-state-of-ai-cybersecurity-2026-unveiling-insights-from-over-1-500-security-leaders",
    date: "2026-04-02", sector: "Research", country: "Global",
    tags: ["AI Security", "AI Agents", "LLM", "CSA", "Governance"],
    aiTakeaway: "AI agent security is the most under-addressed control gap in 2026. Your AI & Emerging Tech posture score of 35% reflects exactly this industry-wide blind spot.",
  },
  {
    id: 21, scope: "global", category: "ransomware", severity: "high",
    headline: "Australia 4th most targeted country by 'The Gentlemen' — 1,570 real victims vs 320 claimed",
    summary: "Check Point Research analysis shows The Gentlemen massively under-reports victims — 1,570 actual attacks vs 320 dark-web claims. Australia ranks 4th globally. Healthcare and manufacturing disproportionately targeted. EDR-killer tooling deployed against 60%+ of victims.",
    source: "ABC News", sourceUrl: "https://www.abc.net.au/news/2026-06-18/the-gentlemen-ransomware-russian-speaking-hack-north-qld-sugar/106807366",
    date: "2026-06-18", sector: "Cross-Sector", country: "Global",
    tags: ["The Gentlemen", "Australia", "Check Point", "RaaS", "EDR Bypass"],
    aiTakeaway: "Real attack volumes are 5x reported figures. Australian boards and CISOs should assume active targeting, not theoretical risk.",
  },
];

/* ─── trend data ─── */
const TRENDS: TrendItem[] = [
  { scope: "local",    title: "DDoS attacks",           delta: "+280%",  direction: "up",   context: "FY2024-25 vs prior year (ASD)",             color: "text-red-400" },
  { scope: "local",    title: "Ransomware notifications",delta: "+23%",  direction: "up",   context: "ACSC FY2024-25 annual report",               color: "text-orange-400" },
  { scope: "local",    title: "Avg SMB breach cost",    delta: "AU$46k", direction: "up",   context: "ACSC 2025 report (per incident)",            color: "text-yellow-400" },
  { scope: "local",    title: "ACSC incidents responded",delta: "1,200+",direction: "up",   context: "FY2024-25 (ASD Annual Cyber Threat Report)", color: "text-cyan-400" },
  { scope: "regional", title: "APAC data leaks",        delta: "+143%",  direction: "up",   context: "Q1 2026 vs Q1 2025 (Group-IB)",              color: "text-red-400" },
  { scope: "regional", title: "Cyber workforce gap",    delta: "3.4M",   direction: "up",   context: "APAC shortfall 2026 (ISC2 / INTERPOL)",      color: "text-orange-400" },
  { scope: "regional", title: "Financial cyberattacks", delta: "#1",     direction: "up",   context: "APAC tops global list (SecurityBrief Asia)", color: "text-yellow-400" },
  { scope: "regional", title: "APAC records leaked",    delta: "5.3M",   direction: "up",   context: "Q1 2026 (Group-IB AUNZ Intelligence)",       color: "text-cyan-400" },
  { scope: "global",   title: "AI-assisted breaches",   delta: "1-in-6", direction: "up",   context: "2026 Verizon DBIR (16% of all breaches)",    color: "text-red-400" },
  { scope: "global",   title: "RaaS victim count",      delta: "830+",   direction: "up",   context: "INC Ransomware alone (ZeroFox Q1 2026)",     color: "text-orange-400" },
  { scope: "global",   title: "Patch Tuesday CVEs",     delta: "206",    direction: "up",   context: "June 2026 — largest ever single release",    color: "text-yellow-400" },
  { scope: "global",   title: "Security leaders AI-concerned", delta: "92%", direction: "up", context: "CSA 2026 survey of 1,500+ leaders",        color: "text-cyan-400" },
];

/* ─── helpers ─── */
const SEV_COLOR: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  info:     "text-blue-400 bg-blue-500/10 border-blue-500/30",
};
const CAT_COLOR: Record<Category, string> = {
  breach:       "text-red-400",
  ransomware:   "text-orange-400",
  vulnerability:"text-yellow-400",
  regulation:   "text-blue-400",
  trend:        "text-cyan-400",
  "nation-state":"text-purple-400",
};
const CAT_ICON: Record<Category, any> = {
  breach:        AlertTriangle,
  ransomware:    Flame,
  vulnerability: Zap,
  regulation:    Shield,
  trend:         TrendingUp,
  "nation-state":Target,
};
const SCOPE_LABEL: Record<Scope, string> = {
  local: "🇦🇺  Local — AU / NZ",
  regional: "🌏  Regional — APAC",
  global: "🌐  Global",
};
const SCOPE_DESC: Record<Scope, string> = {
  local: "Australia & New Zealand incidents, regulation, and breach reports",
  regional: "Asia-Pacific threat intelligence, trends, and nation-state activity",
  global: "Worldwide incidents, CVEs, research, and threat actor intelligence",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function NewsCard({ item }: { item: NewsItem }) {
  const [expanded, setExpanded] = useState(false);
  const CatIcon = CAT_ICON[item.category];
  return (
    <div className="glow-card rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${SEV_COLOR[item.severity]}`}>
            {item.severity}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-medium ${CAT_COLOR[item.category]}`}>
            <CatIcon size={10} />
            {item.category.replace("-", " ")}
          </span>
          {item.country && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin size={9} /> {item.country}
            </span>
          )}
          {item.sector && (
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{item.sector}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 flex items-center gap-1">
          <Clock size={9} /> {formatDate(item.date)}
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-semibold text-foreground leading-snug">{item.headline}</h3>

      {/* Summary */}
      <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
        {item.summary}
      </p>
      {!expanded && (
        <button onClick={() => setExpanded(true)} className="text-[10px] text-cyan-400 hover:text-cyan-300 self-start">
          Read more →
        </button>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {item.tags.map(t => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{t}</span>
        ))}
      </div>

      {/* AI Takeaway */}
      <div className="px-3 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
        <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium mb-1">
          <Activity size={10} /> CISO Takeaway
        </div>
        <p className="text-[11px] text-foreground/75 leading-relaxed">{item.aiTakeaway}</p>
      </div>

      {/* Source */}
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <Newspaper size={10} /> {item.source} <ArrowUpRight size={9} />
      </a>
    </div>
  );
}

function TrendCard({ t }: { t: TrendItem }) {
  return (
    <div className="glow-card rounded-xl p-4 flex flex-col gap-1.5">
      <div className={`text-2xl font-bold tabular-nums ${t.color}`}>{t.delta}</div>
      <div className="text-xs font-semibold text-foreground">{t.title}</div>
      <div className="text-[10px] text-muted-foreground leading-relaxed">{t.context}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function CyberNews() {
  const [activeScope, setActiveScope] = useState<Scope>("local");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("All");

  const scopeNews = NEWS.filter(n => {
    if (n.scope !== activeScope) return false;
    const q = search.toLowerCase();
    if (q && !n.headline.toLowerCase().includes(q) && !n.summary.toLowerCase().includes(q) && !n.tags.some(t => t.toLowerCase().includes(q))) return false;
    if (filterCat !== "All" && n.category !== filterCat) return false;
    return true;
  });

  const scopeTrends = TRENDS.filter(t => t.scope === activeScope);
  const criticalCount = scopeNews.filter(n => n.severity === "critical").length;
  const highCount = scopeNews.filter(n => n.severity === "high").length;

  const categories: string[] = ["All", ...Array.from(new Set(NEWS.filter(n => n.scope === activeScope).map(n => n.category)))];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-cyan-400" />
          <h1 className="text-xl font-bold text-foreground">Cyber Intelligence</h1>
          <Badge variant="secondary" className="text-[10px] text-cyan-400 border-cyan-400/20 flex items-center gap-1">
            <Radio size={9} className="animate-pulse" /> Live Feed
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Real-time cybersecurity incidents, threat intelligence, and regulatory updates — scoped to your region. AI-curated CISO takeaways on every item.
        </p>
      </div>

      {/* Scope selector — the dashboard tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["local", "regional", "global"] as Scope[]).map(scope => {
          const count = NEWS.filter(n => n.scope === scope).length;
          const critical = NEWS.filter(n => n.scope === scope && n.severity === "critical").length;
          const active = activeScope === scope;
          return (
            <button
              key={scope}
              onClick={() => { setActiveScope(scope); setFilterCat("All"); setSearch(""); }}
              className={`glow-card rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 ${active ? "border-cyan-500/40 shadow-[0_0_20px_hsl(192_100%_42%_/_0.08)]" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-foreground">{SCOPE_LABEL[scope]}</div>
                {critical > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold text-red-400 bg-red-500/10 border-red-500/30">
                    {critical} CRITICAL
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug mb-3">{SCOPE_DESC[scope]}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Newspaper size={10} /> {count} items</span>
                {active && <span className="flex items-center gap-1 text-cyan-400"><Eye size={10} /> Viewing</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Trend stats strip */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-cyan-400" />
          <span className="text-xs font-semibold text-foreground">{SCOPE_LABEL[activeScope]} — Key Stats</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scopeTrends.map((t, i) => <TrendCard key={i} t={t} />)}
        </div>
      </div>

      {/* Alert banner if criticals */}
      {criticalCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-400">{criticalCount} critical incident{criticalCount > 1 ? "s" : ""} in this scope.</span>
            <span className="text-xs text-muted-foreground ml-2">Review CISO takeaways and verify your controls are in place.</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 text-xs h-8" placeholder="Search headlines, tags…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${filterCat === c ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{scopeNews.length} items</span>
      </div>

      {/* News grid */}
      {scopeNews.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scopeNews.map(item => <NewsCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">No items match your filters.</div>
      )}

      {/* Sources footer */}
      <div className="glow-card rounded-xl p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-foreground mb-1">Intelligence Sources</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {[
            { name: "The Hacker News", url: "https://thehackernews.com" },
            { name: "Bleeping Computer", url: "https://bleepingcomputer.com" },
            { name: "Security Affairs", url: "https://securityaffairs.com" },
            { name: "Malwarebytes", url: "https://malwarebytes.com" },
            { name: "CSO Online", url: "https://csoonline.com" },
            { name: "Group-IB", url: "https://group-ib.com" },
            { name: "CybersecAsia", url: "https://cybersecasia.net" },
            { name: "ABC News AU", url: "https://abc.net.au" },
            { name: "iStart AU", url: "https://istart.com.au" },
            { name: "Privacy Commissioner NZ", url: "https://privacy.org.nz" },
            { name: "Verizon DBIR", url: "https://verizon.com/dbir" },
            { name: "CSA", url: "https://cloudsecurityalliance.org" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpRight size={9} /> {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
