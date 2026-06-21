import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, XCircle, MinusCircle, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { ComplianceItem } from "@shared/schema";

const STATUS_ICON: Record<string, React.ReactNode> = {
  compliant: <CheckSquare size={14} className="text-green-400" />,
  partial: <MinusCircle size={14} className="text-yellow-400" />,
  "non-compliant": <XCircle size={14} className="text-red-400" />,
  "not-assessed": <HelpCircle size={14} className="text-muted-foreground" />,
};
const STATUS_CLASS: Record<string, string> = {
  compliant: "badge-low",
  partial: "badge-medium",
  "non-compliant": "badge-critical",
  "not-assessed": "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

export default function Compliance() {
  const qc = useQueryClient();
  const [framework, setFramework] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<ComplianceItem[]>({ queryKey: ["/api/compliance"] });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<ComplianceItem> }) =>
      apiRequest("PATCH", `/api/compliance/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/compliance"] }),
  });

  const frameworks = ["all", ...Array.from(new Set(items.map(i => i.framework)))];
  const frameworkList = Array.from(new Set(items.map(i => i.framework))).sort();
  const filtered = items.filter(i => framework === "all" || i.framework === framework);

  const frameworkStatusCounts = frameworkList.reduce<Record<string, Record<string, number>>>((acc, fw) => {
    acc[fw] = { compliant: 0, partial: 0, "non-compliant": 0, "not-assessed": 0 };
    return acc;
  }, {});
  items.forEach(item => {
    frameworkStatusCounts[item.framework][item.status] += 1;
  });

  const grouped = filtered.reduce<Record<string, ComplianceItem[]>>((acc, item) => {
    (acc[item.framework] = acc[item.framework] || []).push(item);
    return acc;
  }, {});

  const compliantCount = items.filter(i => i.status === "compliant").length;
  const pct = items.length ? Math.round((compliantCount / items.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">AI-mapped controls · no consultant required</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">{pct}%</div>
          <div className="text-xs text-muted-foreground">{compliantCount}/{items.length} controls</div>
        </div>
      </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-secondary p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Core Risk Management Frameworks</div>
        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">NIST Cybersecurity Framework (CSF) 2.0</span> — six functions: Govern, Identify, Protect, Detect, Respond, Recover. Use it to map controls and priorities across the program.</li>
          <li><span className="font-semibold text-foreground">NIST SP 800-53</span> — detailed security and privacy controls catalog, mandatory for US federal systems and often used as a baseline outside government.</li>
          <li><span className="font-semibold text-foreground">NIST SP 800-37</span> — Risk Management Framework (RMF) process for categorise, select, implement, assess, authorise, and monitor 800-53 controls.</li>
          <li><span className="font-semibold text-foreground">ISO/IEC 27001</span> — international ISMS standard, certifiable and commonly required for enterprise vendor relationships worldwide.</li>
          <li><span className="font-semibold text-foreground">ISO/IEC 27002</span> — companion guidance to 27001 with practical control implementation advice.</li>
          <li><span className="font-semibold text-foreground">FAIR</span> — quantitative risk model for translating cyber risk into financial terms for the board.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-secondary p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Technical Control Frameworks</div>
        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">CIS Controls</span> — prioritized practical safeguards, popular for smaller and mid-size organisations needing a fast baseline.</li>
          <li><span className="font-semibold text-foreground">MITRE ATT&amp;CK</span> — adversary tactics and techniques knowledge base used for threat modeling, red/blue team exercises, and detection engineering.</li>
          <li><span className="font-semibold text-foreground">Zero Trust Architecture (NIST SP 800-207)</span> — assumes no implicit trust and is increasingly a CISO mandate for federal-adjacent and hybrid-cloud environments.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-secondary p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Industry &amp; Regulatory Compliance</div>
        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">PCI DSS</span> — payment card data controls.</li>
          <li><span className="font-semibold text-foreground">HIPAA / HITECH</span> — US healthcare privacy and security.</li>
          <li><span className="font-semibold text-foreground">SOC 2</span> — service organisation controls for SaaS and managed service providers.</li>
          <li><span className="font-semibold text-foreground">GDPR / Australian Privacy Act / APRA CPS 234</span> — data protection and financial services requirements in Europe and Australia.</li>
          <li><span className="font-semibold text-foreground">FedRAMP</span> — US government cloud authorisation.</li>
          <li><span className="font-semibold text-foreground">NIS2 Directive</span> — EU critical infrastructure cybersecurity obligations.</li>
          <li><span className="font-semibold text-foreground">SOX</span> — financial reporting controls including IT general controls.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-secondary p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Privacy, Response &amp; Governance</div>
        <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
          <li><span className="font-semibold text-foreground">NIST Privacy Framework</span> — pairs with CSF for organisations handling significant personal data.</li>
          <li><span className="font-semibold text-foreground">NIST SP 800-61</span> — standard incident handling lifecycle from preparation through post-incident review.</li>
          <li><span className="font-semibold text-foreground">SANS Incident Response Process</span> — widely taught incident lifecycle alternative.</li>
          <li><span className="font-semibold text-foreground">COBIT</span> — IT governance framework aligning security with broader business and audit committee objectives.</li>
          <li><span className="font-semibold text-foreground">C2M2</span> — capability maturity model useful for cybersecurity program self-assessment.</li>
          <li><span className="font-semibold text-foreground">CMMC</span> — required for US defense-industrial-base contractors and layered on NIST 800-171.</li>
        </ul>
      </div>
    </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-secondary p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Frameworks tracked</div>
          <div className="text-3xl font-bold text-foreground">{frameworkList.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Distinct compliance frameworks mapped by the AI CISO.</div>
        </div>
        <div className="rounded-2xl border border-border bg-secondary p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Control coverage</div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Compliant</span>
              <span className="font-semibold text-foreground">{items.filter(i => i.status === "compliant").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Partial</span>
              <span className="font-semibold text-foreground">{items.filter(i => i.status === "partial").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Non-compliant</span>
              <span className="font-semibold text-foreground">{items.filter(i => i.status === "non-compliant").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Not assessed</span>
              <span className="font-semibold text-foreground">{items.filter(i => i.status === "not-assessed").length}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-secondary p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Most urgent focus</div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            Review non-compliant controls first, then close partial controls. This builds a stronger foundation for NIST CSF, ISO 27001, SOC 2, and APRA CPS 234 compliance.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Framework status matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead>
              <tr>
                <th className="py-2 pr-4">Framework</th>
                <th className="py-2 px-3">Compliant</th>
                <th className="py-2 px-3">Partial</th>
                <th className="py-2 px-3">Non-compliant</th>
                <th className="py-2 px-3">Not assessed</th>
              </tr>
            </thead>
            <tbody>
              {frameworkList.map(fw => (
                <tr key={fw} className="border-t border-border">
                  <td className="py-2 pr-4 font-medium text-foreground">{fw}</td>
                  <td className="py-2 px-3">{frameworkStatusCounts[fw].compliant}</td>
                  <td className="py-2 px-3">{frameworkStatusCounts[fw].partial}</td>
                  <td className="py-2 px-3">{frameworkStatusCounts[fw]["non-compliant"]}</td>
                  <td className="py-2 px-3">{frameworkStatusCounts[fw]["not-assessed"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Framework tabs */}
      <div className="flex gap-2 flex-wrap">
        {frameworks.map(f => (
          <button
            key={f}
            onClick={() => setFramework(f)}
            data-testid={`fw-${f}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors
              ${framework === f
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Controls */}
      {isLoading
        ? [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)
        : Object.entries(grouped).map(([fw, controls]) => (
            <div key={fw} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{fw}</div>
              {controls.map(item => (
                <Card key={item.id} className="glow-card" data-testid={`compliance-${item.id}`}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {STATUS_ICON[item.status]}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          <span className="text-muted-foreground text-xs mr-2 mono">{item.controlId}</span>
                          {item.control}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[item.status]} flex-shrink-0`}>
                        {item.status}
                      </span>
                      <ChevronDown size={13} className={`text-muted-foreground transition-transform flex-shrink-0 ${expanded === item.id ? "rotate-180" : ""}`} />
                    </button>

                    {expanded === item.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        {item.aiGuidance && (
                          <div className="rounded-md bg-cyan-500/5 border border-cyan-500/20 p-3">
                            <div className="text-xs font-semibold text-cyan-400 mb-1 ai-pulse">AI Guidance</div>
                            <p className="text-xs text-muted-foreground">{item.aiGuidance}</p>
                          </div>
                        )}
                        {item.dueDate && (
                          <div className="text-xs text-muted-foreground">Due: {item.dueDate}</div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {(["compliant","partial","non-compliant","not-assessed"] as const)
                            .filter(s => s !== item.status)
                            .map(s => (
                              <Button
                                key={s}
                                size="sm" variant="outline" className="text-xs h-7 capitalize"
                                data-testid={`btn-compliance-${s}-${item.id}`}
                                disabled={updateMut.isPending}
                                onClick={() => updateMut.mutate({ id: item.id, patch: { status: s } })}
                              >
                                {s}
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
      }
    </div>
  );
}
