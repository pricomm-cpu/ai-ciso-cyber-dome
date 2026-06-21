import { useState } from "react";
import {
  ShoppingCart, Search, CheckCircle2, ArrowRight, Filter,
  DollarSign, Star, Zap, Globe, Shield, Clock, Bot,
  ChevronRight, XCircle, TrendingUp, Package, FileText,
  Sparkles, Building2, RefreshCw, ExternalLink, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─── types ─── */
interface Vendor {
  id: number;
  name: string;
  category: string;
  description: string;
  pricing: string;
  pricingModel: string;
  aiScore: number;
  aiVerdict: string;
  smb_fit: number;
  pros: string[];
  cons: string[];
  integrations: string[];
  contractType: string;
  aribaVendorId: string;
  complianceCertified: string[];
  recommended: boolean;
  status: "Available" | "Under Review" | "Approved";
}

/* ─── vendor catalogue ─── */
const VENDORS: Vendor[] = [
  {
    id: 1,
    name: "CrowdStrike Falcon",
    category: "EDR / Endpoint",
    description: "Industry-leading endpoint detection and response with AI-powered threat prevention. Cloud-native agent with minimal performance impact.",
    pricing: "From $8.99/device/mo",
    pricingModel: "Per device",
    aiScore: 96,
    aiVerdict: "Best-in-class EDR for SMBs with <500 endpoints. Falcon Go tier is cost-effective and covers all critical prevention capabilities. Direct price match available via Ariba.",
    smb_fit: 94,
    pros: ["Zero-config cloud deployment", "Best threat intelligence (CrowdStrike Intel)", "Low CPU overhead (~1%)"],
    cons: ["Premium pricing vs competitors", "Over-featured for very small environments"],
    integrations: ["Microsoft Sentinel", "Splunk", "PagerDuty", "Jira"],
    contractType: "Monthly or Annual",
    aribaVendorId: "CS-FALCON-AU-001",
    complianceCertified: ["SOC 2 Type II", "ISO 27001", "FedRAMP"],
    recommended: true,
    status: "Available",
  },
  {
    id: 2,
    name: "SentinelOne Singularity",
    category: "EDR / Endpoint",
    description: "Autonomous AI-powered endpoint protection with rollback capability. Strong Linux/macOS support.",
    pricing: "From $6.50/device/mo",
    pricingModel: "Per device",
    aiScore: 91,
    aiVerdict: "Strong CrowdStrike alternative. Rollback feature is unique — can reverse ransomware encryption without a backup. Better Linux coverage.",
    smb_fit: 89,
    pros: ["Autonomous rollback on ransomware", "Excellent Linux/macOS support", "Transparent pricing"],
    cons: ["Smaller threat intel network than CrowdStrike", "Management console less polished"],
    integrations: ["Splunk", "Azure Sentinel", "ServiceNow"],
    contractType: "Annual",
    aribaVendorId: "S1-SING-AU-002",
    complianceCertified: ["SOC 2 Type II", "ISO 27001"],
    recommended: false,
    status: "Available",
  },
  {
    id: 3,
    name: "Vanta",
    category: "Compliance Automation",
    description: "Automated compliance monitoring and evidence collection for SOC 2, ISO 27001, HIPAA, and more.",
    pricing: "From $800/mo",
    pricingModel: "Per organisation",
    aiScore: 95,
    aiVerdict: "Highest ROI compliance tool for SMBs pursuing SOC 2 or ISO 27001. Cuts audit prep from 6 months to 6 weeks. Direct Ariba PO available.",
    smb_fit: 97,
    pros: ["Fastest SOC 2 path on market", "Pre-built integrations to 200+ tools", "Automated evidence collection"],
    cons: ["Price scales up at enterprise tier", "Some manual evidence still required"],
    integrations: ["AWS", "GCP", "Azure", "Okta", "GitHub", "Jira"],
    contractType: "Annual",
    aribaVendorId: "VANTA-AU-003",
    complianceCertified: ["SOC 2 Type II"],
    recommended: true,
    status: "Approved",
  },
  {
    id: 4,
    name: "Wiz",
    category: "Cloud Security",
    description: "Agentless cloud security platform covering misconfigurations, vulnerabilities, and secrets across AWS, Azure, and GCP.",
    pricing: "From $15,000/yr",
    pricingModel: "Per cloud workload",
    aiScore: 93,
    aiVerdict: "Essential if you run workloads on AWS, Azure, or GCP. Agentless deployment means zero friction. Your cloud score (62%) is directly addressable with Wiz.",
    smb_fit: 82,
    pros: ["Agentless — deploy in 30 minutes", "Unified multi-cloud visibility", "CSPM + CWPP in one platform"],
    cons: ["Minimum deal size may be high for very small orgs", "Annual commitment required"],
    integrations: ["Jira", "PagerDuty", "Slack", "Microsoft Sentinel"],
    contractType: "Annual",
    aribaVendorId: "WIZ-AU-004",
    complianceCertified: ["SOC 2 Type II", "ISO 27001"],
    recommended: true,
    status: "Under Review",
  },
  {
    id: 5,
    name: "KnowBe4",
    category: "Security Awareness",
    description: "World's largest security awareness training and phishing simulation platform.",
    pricing: "From $5/user/mo",
    pricingModel: "Per user",
    aiScore: 88,
    aiVerdict: "Critical given your active phishing threat. Phishing simulations can reduce click rates by 60–80% within 90 days. Most cost-effective risk reduction available.",
    smb_fit: 95,
    pros: ["Largest content library (>1500 modules)", "Automated phishing simulation", "Proven click-rate reduction"],
    cons: ["Requires ongoing admin to manage campaigns", "Content can feel dated"],
    integrations: ["Okta", "Azure AD", "Microsoft 365", "Slack"],
    contractType: "Annual",
    aribaVendorId: "KB4-AU-005",
    complianceCertified: ["SOC 2 Type II", "ISO 27001"],
    recommended: false,
    status: "Available",
  },
  {
    id: 6,
    name: "Snyk",
    category: "Application Security",
    description: "Developer-first security platform for finding and fixing vulnerabilities in code, dependencies, containers, and IaC.",
    pricing: "Free tier + from $25/dev/mo",
    pricingModel: "Per developer",
    aiScore: 90,
    aiVerdict: "Best AppSec tool for engineering teams already using GitHub/GitLab. Free tier covers most SMB AppSec needs. Strong ROI vs alternative SAST tools.",
    smb_fit: 91,
    pros: ["Free tier very capable", "Native IDE and CI/CD integration", "Low friction developer adoption"],
    cons: ["Licensing can get complex at scale", "False positives in IaC scanning"],
    integrations: ["GitHub", "GitLab", "Jira", "Slack"],
    contractType: "Monthly or Annual",
    aribaVendorId: "SNYK-AU-006",
    complianceCertified: ["SOC 2 Type II"],
    recommended: false,
    status: "Available",
  },
  {
    id: 7,
    name: "Drata",
    category: "Compliance Automation",
    description: "Continuous compliance automation platform. Strong competitor to Vanta with excellent audit management features.",
    pricing: "From $1,000/mo",
    pricingModel: "Per organisation",
    aiScore: 87,
    aiVerdict: "Strong Vanta alternative. Better audit management UI. If you already have Drata, no reason to switch. If starting fresh, Vanta has broader integrations.",
    smb_fit: 85,
    pros: ["Superior audit management workflow", "Strong customer success team", "Multi-framework support"],
    cons: ["Slightly higher price than Vanta at entry", "Fewer native integrations"],
    integrations: ["AWS", "Azure", "Okta", "GitHub"],
    contractType: "Annual",
    aribaVendorId: "DRATA-AU-007",
    complianceCertified: ["SOC 2 Type II"],
    recommended: false,
    status: "Available",
  },
  {
    id: 8,
    name: "Proofpoint Essentials",
    category: "Email Security",
    description: "Cloud-based email security for SMBs. Advanced threat protection, spam filtering, and email continuity.",
    pricing: "From $3/user/mo",
    pricingModel: "Per user",
    aiScore: 86,
    aiVerdict: "Best-value email security for Microsoft 365 environments. Plugs gaps in native M365 Defender at a fraction of the cost of a full SEG.",
    smb_fit: 93,
    pros: ["Extremely cost-effective", "Easy Microsoft 365 integration", "BEC and impersonation protection"],
    cons: ["Limited reporting vs enterprise solutions", "No built-in DMARC management"],
    integrations: ["Microsoft 365", "Okta", "Splunk"],
    contractType: "Annual",
    aribaVendorId: "PFP-ESSENTIALS-AU-008",
    complianceCertified: ["SOC 2 Type II", "ISO 27001"],
    recommended: false,
    status: "Available",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "EDR / Endpoint":          "text-red-400 bg-red-400/10 border-red-400/20",
  "Compliance Automation":   "text-green-400 bg-green-400/10 border-green-400/20",
  "Cloud Security":          "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Security Awareness":      "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Application Security":    "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Email Security":          "text-blue-400 bg-blue-400/10 border-blue-400/20",
};
const STATUS_COLOR: Record<string, string> = {
  "Available":     "text-green-400 bg-green-400/10 border-green-400/20",
  "Under Review":  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Approved":      "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

interface CartItem { vendor: Vendor; quantity: number; }

function VendorCard({ v, onAddCart, inCart }: { v: Vendor; onAddCart: (v: Vendor) => void; inCart: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`glow-card rounded-xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5 ${v.recommended ? "border-cyan-500/30 shadow-[0_0_20px_hsl(192_100%_42%_/_0.05)]" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-foreground">{v.name}</span>
            {v.recommended && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">AI PICK</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[v.category] || "text-muted-foreground bg-secondary border-border"}`}>{v.category}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLOR[v.status]}`}>{v.status}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-semibold text-foreground">{v.pricing}</div>
          <div className="text-[10px] text-muted-foreground">{v.pricingModel}</div>
        </div>
      </div>

      {/* AI Score */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
          <div className="flex items-center gap-1"><Bot size={10} className="text-cyan-400" /> AI Score</div>
          <div className="flex items-center gap-1"><Star size={10} className="text-yellow-400" /> SMB Fit: {v.smb_fit}%</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${v.aiScore >= 90 ? "bg-green-500" : v.aiScore >= 80 ? "bg-cyan-500" : "bg-yellow-500"}`} style={{ width: `${v.aiScore}%` }} />
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">{v.aiScore}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>

      {/* AI Verdict expandable */}
      <div
        className="px-3 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium">
            <Sparkles size={10} /> AI Verdict
          </div>
          <ChevronRight size={12} className={`text-cyan-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
        {expanded && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-foreground/75 leading-relaxed">{v.aiVerdict}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-green-400 font-medium mb-1">Pros</div>
                {v.pros.map(p => <div key={p} className="text-[11px] text-muted-foreground flex items-start gap-1"><CheckCircle2 size={9} className="text-green-400 mt-0.5 flex-shrink-0" />{p}</div>)}
              </div>
              <div>
                <div className="text-[10px] text-yellow-400 font-medium mb-1">Cons</div>
                {v.cons.map(c => <div key={c} className="text-[11px] text-muted-foreground flex items-start gap-1"><AlertTriangle size={9} className="text-yellow-400 mt-0.5 flex-shrink-0" />{c}</div>)}
              </div>
            </div>
            <div className="pt-1 border-t border-border">
              <div className="text-[10px] text-muted-foreground mb-1">Certifications</div>
              <div className="flex flex-wrap gap-1">
                {v.complianceCertified.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">{c}</span>)}
              </div>
            </div>
            <div className="pt-1 border-t border-border text-[10px] text-muted-foreground">
              <span className="text-muted-foreground/60">Ariba Vendor ID: </span>{v.aribaVendorId}
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <Button
        size="sm"
        className={`w-full text-xs font-semibold transition-colors ${inCart ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30" : "bg-cyan-500 hover:bg-cyan-400 text-background"}`}
        onClick={() => onAddCart(v)}
        disabled={inCart}
      >
        {inCart ? <><CheckCircle2 size={12} className="mr-1.5" /> Added to Ariba Cart</> : <><ShoppingCart size={12} className="mr-1.5" /> Add to Procurement Cart</>}
      </Button>
    </div>
  );
}

function AribaCartDrawer({ items, onClose, onRemove }: { items: CartItem[]; onClose: () => void; onRemove: (id: number) => void }) {
  const [step, setStep] = useState<"cart" | "ariba" | "done">("cart");
  const total = items.reduce((_, item) => _, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glow-card rounded-2xl p-6 w-full max-w-md h-full md:h-auto md:max-h-[80vh] overflow-y-auto flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        {step === "cart" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">SAP Ariba Procurement Cart</div>
                <div className="text-xs text-muted-foreground">{items.length} product{items.length !== 1 ? "s" : ""} selected</div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="space-y-3">
              {items.map(({ vendor }) => (
                <div key={vendor.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary border border-border">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground">{vendor.name}</div>
                    <div className="text-[10px] text-muted-foreground">{vendor.pricing} · Ariba ID: {vendor.aribaVendorId}</div>
                  </div>
                  <button onClick={() => onRemove(vendor.id)} className="text-muted-foreground hover:text-red-400"><XCircle size={14} /></button>
                </div>
              ))}
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1.5 text-foreground font-medium mb-1"><Shield size={12} className="text-cyan-400" /> What happens next</div>
              Selecting "Submit to Ariba" creates PO requisitions in SAP Ariba for each vendor. Approval workflows run per your procurement policy. Contracts are auto-generated from Ariba templates. No manual intervention, no MSP required.
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onClose}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={() => setStep("ariba")}>
                Submit to Ariba <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === "ariba" && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-foreground">SAP Ariba Processing</div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XCircle size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Vendor IDs validated in Ariba Supplier Network",     done: true },
                { label: "PO requisitions created per procurement policy",     done: true },
                { label: "Budget check against approved security spend",       done: true },
                { label: "Approval workflow triggered (auto-approve <$5k)",   done: false },
                { label: "Contracts generated from Ariba template library",    done: false },
                { label: "Vendor notification and onboarding initiated",       done: false },
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
              Confirm Submission
            </Button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground mb-1">Submitted to SAP Ariba</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {items.length} PO requisition{items.length !== 1 ? "s" : ""} created. Approval workflows are running. You'll be notified when contracts are ready for signature. No MSP, no SI, no middleman.
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground border border-border rounded-lg p-3 text-left space-y-1">
              {items.map(({ vendor }) => (
                <div key={vendor.id} className="flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-green-400" />
                  <span>{vendor.name} — Ariba PO #{Math.floor(Math.random() * 90000 + 10000)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onClose}>Close</Button>
              <Button size="sm" className="flex-1 text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={onClose}>View in Ariba</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Procurement() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const categories = ["All", ...Array.from(new Set(VENDORS.map(v => v.category)))];

  const filtered = VENDORS.filter(v => {
    const q = search.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.category.toLowerCase().includes(q)) return false;
    if (filterCat !== "All" && v.category !== filterCat) return false;
    return true;
  });

  const addCart = (v: Vendor) => {
    if (!cart.find(c => c.vendor.id === v.id)) setCart(prev => [...prev, { vendor: v, quantity: 1 }]);
  };
  const removeCart = (id: number) => setCart(prev => prev.filter(c => c.vendor.id !== id));

  return (
    <div className="space-y-6">
      {showCart && cart.length > 0 && (
        <AribaCartDrawer items={cart} onClose={() => setShowCart(false)} onRemove={removeCart} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-cyan-400" />
            <h1 className="text-xl font-bold text-foreground">Procurement</h1>
            <Badge variant="secondary" className="text-[10px] text-cyan-400 border-cyan-400/20">SAP Ariba Connected</Badge>
          </div>
          {cart.length > 0 && (
            <Button size="sm" className="text-xs bg-cyan-500 hover:bg-cyan-400 text-background font-semibold" onClick={() => setShowCart(true)}>
              <ShoppingCart size={13} className="mr-1.5" /> Ariba Cart ({cart.length})
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl">
          AI-evaluated cybersecurity products with pricing, verdicts, and direct procurement via SAP Ariba. No vendor sales calls, no MSP markup, no SI required to configure integrations.
        </p>
      </div>

      <Card className="glow-card p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Framework-ready procurement</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tools are scored against how well they support compliance programs like NIST CSF, ISO 27001, SOC 2, PCI DSS, APRA CPS 234, and Essential 8.
        </p>
      </Card>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: "01", icon: Bot,          title: "AI evaluates tools",         desc: "Scored against your posture gaps and SMB fit" },
          { step: "02", icon: Sparkles,     title: "Transparent comparison",     desc: "Pros, cons, pricing — no vendor spin" },
          { step: "03", icon: ShoppingCart, title: "Add to Ariba cart",          desc: "Direct PO — no sales call, no MSP markup" },
          { step: "04", icon: CheckCircle2, title: "Ariba handles the rest",     desc: "Contracts, approvals, and onboarding automated" },
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Products evaluated",    value: "47",       icon: Package,    color: "text-cyan-400" },
          { label: "AI-recommended",        value: "8",        icon: Bot,        color: "text-green-400" },
          { label: "Avg time to PO",        value: "< 1 day",  icon: Clock,      color: "text-blue-400" },
          { label: "Vendor markup saved",   value: "0%",       icon: DollarSign, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glow-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-1.5"><Icon size={16} className={color} /></div>
            <div className="text-xl font-bold text-foreground">{value}</div>
            <div className="text-[11px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 text-xs h-8" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filterCat === c ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} products</span>
      </div>

      {/* Vendor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(v => (
          <VendorCard key={v.id} v={v} onAddCart={addCart} inCart={!!cart.find(c => c.vendor.id === v.id)} />
        ))}
      </div>

      {/* Ariba integration banner */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glow-card rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="hsl(25 100% 60%)" strokeWidth="1.5"/>
              <path d="M7 9h10M7 12h7" stroke="hsl(25 100% 60%)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-sm font-semibold text-foreground">SAP Ariba Buying</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">Connected</span></div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">All procurement flows through your existing Ariba instance. PO requisitions, approval workflows, contracts, and supplier management — no separate system needed.</div>
          </div>
        </div>
        <div className="glow-card rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="hsl(213 100% 60%)" strokeWidth="1.5"/>
              <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="hsl(213 100% 60%)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-sm font-semibold text-foreground">Workday Finance</div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">Connected</span></div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">Security spend is tracked in Workday Financials. Budget utilisation, forecast vs actual, and ROI reporting — all automated, no manual spreadsheets.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
