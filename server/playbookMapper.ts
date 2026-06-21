/**
 * Playbook Mapper — maps ingested regional/local threat intelligence
 * into actionable Incident Responder playbook steps.
 *
 * Design principle: No MSP, no SI, no consultant required.
 * The CISO gets a fully-formed defensive playbook from raw threat data.
 */

export type ThreatScope = "local" | "regional" | "global";
export type ThreatCategory =
  | "ransomware"
  | "data-breach"
  | "ddos"
  | "zero-day"
  | "nation-state"
  | "insider"
  | "phishing"
  | "supply-chain"
  | "identity"
  | "vulnerability";

export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface IngestedThreat {
  id: string;
  scope: ThreatScope;
  category: ThreatCategory;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;       // ISO 8601
  affectedSectors: string[];
  iocs: string[];            // Indicators of Compromise
  ttps: string[];            // MITRE ATT&CK technique IDs
  severity: SeverityLevel;
  region: string;            // e.g. "AU", "APAC", "Global"
  threatActor?: string;
  cveIds?: string[];
  ingestedAt: string;        // ISO 8601 — when we ingested it
}

export interface PlaybookStep {
  order: number;
  phase: "detection" | "containment" | "eradication" | "recovery" | "lessons-learned";
  action: string;
  owner: string;             // e.g. "SOC Analyst", "CISO", "IT Admin"
  priority: "immediate" | "within-1h" | "within-24h" | "within-7d";
  toolHint?: string;         // Which connected tool to use
  automatable: boolean;
}

export interface DefensiveStance {
  threatId: string;
  generatedAt: string;
  overallRisk: SeverityLevel;
  summary: string;
  affectedControls: string[];   // Essential 8 / ISO 27001 control IDs
  playbook: PlaybookStep[];
  mitigations: string[];
  agentActions: AgentAction[];  // Which agents to trigger + why
  postureDelta: number;          // Estimated posture score impact (-ve = degraded)
}

export interface AgentAction {
  agentId: string;
  agentName: string;
  reason: string;
  priority: "immediate" | "within-1h" | "within-24h";
  expectedOutput: string;
}

// ── Category → Playbook template ─────────────────────────────────────────────

const PLAYBOOK_TEMPLATES: Record<ThreatCategory, PlaybookStep[]> = {
  ransomware: [
    { order: 1, phase: "detection", action: "Verify EDR alerts — confirm ransomware binary hash against known IOCs", owner: "SOC Analyst", priority: "immediate", toolHint: "CrowdStrike Falcon / SentinelOne", automatable: true },
    { order: 2, phase: "detection", action: "Identify Patient Zero host and account", owner: "SOC Analyst", priority: "immediate", toolHint: "Microsoft Sentinel / Splunk", automatable: true },
    { order: 3, phase: "containment", action: "Network-isolate infected host(s) immediately — disable NIC or push EDR isolation policy", owner: "IT Admin", priority: "immediate", toolHint: "CrowdStrike Falcon Network Contain", automatable: true },
    { order: 4, phase: "containment", action: "Disable shared drives and revoke Patient Zero's credentials", owner: "IT Admin", priority: "immediate", toolHint: "Okta / Azure AD Entra", automatable: true },
    { order: 5, phase: "containment", action: "Take memory and disk forensic snapshot before remediation", owner: "SOC Analyst", priority: "within-1h", automatable: false },
    { order: 6, phase: "containment", action: "Alert Privacy Officer — assess Australian Privacy Act notifiable data breach obligation (72h threshold)", owner: "CISO", priority: "within-1h", automatable: false },
    { order: 7, phase: "containment", action: "Check backup integrity — verify last known-good backup pre-incident", owner: "IT Admin", priority: "within-1h", toolHint: "Veeam Backup", automatable: true },
    { order: 8, phase: "eradication", action: "Wipe and reimage infected hosts from golden image", owner: "IT Admin", priority: "within-24h", automatable: false },
    { order: 9, phase: "eradication", action: "Rotate all service account credentials and admin passwords", owner: "IT Admin", priority: "within-24h", toolHint: "1Password Teams / HashiCorp Vault", automatable: true },
    { order: 10, phase: "eradication", action: "Scan entire environment for lateral movement indicators using IOC list", owner: "SOC Analyst", priority: "within-24h", toolHint: "CrowdStrike / Microsoft Defender", automatable: true },
    { order: 11, phase: "recovery", action: "Restore from clean backup — validate file integrity post-restore", owner: "IT Admin", priority: "within-24h", toolHint: "Veeam Backup", automatable: false },
    { order: 12, phase: "recovery", action: "Re-enable services incrementally — monitor for re-infection", owner: "SOC Analyst", priority: "within-24h", automatable: false },
    { order: 13, phase: "lessons-learned", action: "Conduct root cause analysis — document initial access vector", owner: "CISO", priority: "within-7d", automatable: false },
    { order: 14, phase: "lessons-learned", action: "Update macro controls (E8-3) and application allowlisting (E8-1) to prevent re-entry", owner: "IT Admin", priority: "within-7d", automatable: false },
    { order: 15, phase: "lessons-learned", action: "Brief board — update Q-on-Q risk posture narrative", owner: "CISO", priority: "within-7d", toolHint: "Board Reporter Agent", automatable: true },
  ],

  "data-breach": [
    { order: 1, phase: "detection", action: "Confirm scope of breach — identify what data was accessed, by whom, for how long", owner: "SOC Analyst", priority: "immediate", toolHint: "SIEM / CloudTrail / DLP", automatable: true },
    { order: 2, phase: "detection", action: "Preserve all access logs — litigation hold on relevant systems", owner: "CISO", priority: "immediate", automatable: false },
    { order: 3, phase: "containment", action: "Revoke access credentials for compromised accounts", owner: "IT Admin", priority: "immediate", toolHint: "Okta / Azure AD", automatable: true },
    { order: 4, phase: "containment", action: "Patch or remove the vulnerability that enabled the breach", owner: "IT Admin", priority: "immediate", toolHint: "Tenable Nessus", automatable: false },
    { order: 5, phase: "containment", action: "Assess Australian Privacy Act (APA) notification requirement — 72h threshold for eligible data breach", owner: "CISO", priority: "within-1h", automatable: false },
    { order: 6, phase: "containment", action: "If NZ data involved — assess NZ Privacy Act 2020 notification (OAIC equivalent: OPC NZ)", owner: "CISO", priority: "within-1h", automatable: false },
    { order: 7, phase: "eradication", action: "Audit all similar data stores / buckets / endpoints for equivalent exposure", owner: "SOC Analyst", priority: "within-24h", toolHint: "Wiz / Lacework", automatable: true },
    { order: 8, phase: "recovery", action: "Re-encrypt all affected data stores with updated keys", owner: "IT Admin", priority: "within-24h", toolHint: "HashiCorp Vault", automatable: false },
    { order: 9, phase: "lessons-learned", action: "Implement CSPM policy to auto-detect public exposure in cloud", owner: "IT Admin", priority: "within-7d", toolHint: "Wiz / Lacework", automatable: true },
    { order: 10, phase: "lessons-learned", action: "Board notification — include regulatory status and remediation timeline", owner: "CISO", priority: "within-7d", toolHint: "Board Reporter Agent", automatable: true },
  ],

  ddos: [
    { order: 1, phase: "detection", action: "Confirm attack via traffic analysis — identify attack vector (volumetric, protocol, application layer)", owner: "SOC Analyst", priority: "immediate", toolHint: "Cloudflare Gateway / SIEM", automatable: true },
    { order: 2, phase: "containment", action: "Enable Cloudflare DDoS mitigation / WAF rules — rate-limit offending ASNs", owner: "IT Admin", priority: "immediate", toolHint: "Cloudflare Gateway", automatable: true },
    { order: 3, phase: "containment", action: "Geo-block non-essential origin countries if service is regional", owner: "IT Admin", priority: "immediate", toolHint: "Cloudflare Gateway", automatable: true },
    { order: 4, phase: "containment", action: "Contact upstream ISP for null-routing if volumetric > 100Gbps", owner: "IT Admin", priority: "within-1h", automatable: false },
    { order: 5, phase: "eradication", action: "Capture attack signatures and add permanent firewall rules", owner: "SOC Analyst", priority: "within-24h", automatable: true },
    { order: 6, phase: "recovery", action: "Validate service restoration — test from multiple geographies", owner: "SOC Analyst", priority: "within-24h", automatable: true },
    { order: 7, phase: "lessons-learned", action: "Review DDoS protection capacity — benchmark against known APAC attack volumes (>600Gbps)", owner: "CISO", priority: "within-7d", automatable: false },
  ],

  "zero-day": [
    { order: 1, phase: "detection", action: "Confirm CVE details — check CVSS score, affected versions against your asset inventory", owner: "SOC Analyst", priority: "immediate", toolHint: "Tenable Nessus / Vulnerability Manager Agent", automatable: true },
    { order: 2, phase: "containment", action: "Apply vendor-published workaround or temporary mitigation immediately (WAF rule, config change, network segment)", owner: "IT Admin", priority: "immediate", automatable: false },
    { order: 3, phase: "containment", action: "If CVSS ≥ 9.0 and no patch — isolate affected system from network", owner: "IT Admin", priority: "immediate", automatable: true },
    { order: 4, phase: "containment", action: "Block exploit-related network signatures at perimeter and EDR", owner: "SOC Analyst", priority: "within-1h", toolHint: "CrowdStrike / Palo Alto Cortex", automatable: true },
    { order: 5, phase: "eradication", action: "Apply vendor patch as soon as released — prioritise internet-facing instances", owner: "IT Admin", priority: "within-24h", automatable: false },
    { order: 6, phase: "eradication", action: "Scan environment for exploitation indicators (web shells, new accounts, lateral movement)", owner: "SOC Analyst", priority: "within-24h", toolHint: "Microsoft Sentinel / Splunk", automatable: true },
    { order: 7, phase: "recovery", action: "Validate patch and re-enable full service", owner: "IT Admin", priority: "within-24h", automatable: false },
    { order: 8, phase: "lessons-learned", action: "Update vulnerability management SLA — internet-facing CVSS ≥ 9.0 must be patched within 48h", owner: "CISO", priority: "within-7d", automatable: false },
  ],

  "nation-state": [
    { order: 1, phase: "detection", action: "Escalate immediately to ASD (Australian Signals Directorate) ReportCyber — nation-state activity is a national security matter", owner: "CISO", priority: "immediate", automatable: false },
    { order: 2, phase: "detection", action: "Preserve all evidence in tamper-evident format — do not remediate until ASD/AFP guidance received", owner: "SOC Analyst", priority: "immediate", automatable: false },
    { order: 3, phase: "containment", action: "Identify all affected systems and accounts — assume full credential compromise", owner: "SOC Analyst", priority: "immediate", toolHint: "CrowdStrike / Microsoft Sentinel", automatable: true },
    { order: 4, phase: "containment", action: "Disable all VPN and remote access temporarily — rebuild with zero-trust architecture", owner: "IT Admin", priority: "within-1h", toolHint: "Tailscale / Okta ZTNA", automatable: false },
    { order: 5, phase: "containment", action: "Rotate ALL credentials — privileged accounts first, then all users", owner: "IT Admin", priority: "within-1h", toolHint: "Okta / Azure AD / 1Password", automatable: true },
    { order: 6, phase: "eradication", action: "Hunt for persistent access mechanisms (scheduled tasks, WMI subscriptions, rogue service accounts)", owner: "SOC Analyst", priority: "within-24h", toolHint: "CrowdStrike Threat Graph", automatable: true },
    { order: 7, phase: "lessons-learned", action: "Board notification — nation-state event requires immediate board awareness and potentially ASX disclosure", owner: "CISO", priority: "within-7d", automatable: false },
  ],

  insider: [
    { order: 1, phase: "detection", action: "Preserve evidence securely — ensure HR and Legal are looped in before confronting the individual", owner: "CISO", priority: "immediate", automatable: false },
    { order: 2, phase: "containment", action: "Revoke data access silently — avoid alerting the individual while investigation is underway", owner: "IT Admin", priority: "immediate", toolHint: "Okta / Azure AD", automatable: true },
    { order: 3, phase: "containment", action: "Audit all data accessed/exfiltrated in the past 90 days by the account", owner: "SOC Analyst", priority: "within-1h", toolHint: "SIEM / DLP / Microsoft Purview", automatable: true },
    { order: 4, phase: "eradication", action: "Implement data loss prevention controls to prevent future exfiltration", owner: "IT Admin", priority: "within-24h", toolHint: "Microsoft Purview / Proofpoint", automatable: false },
    { order: 5, phase: "lessons-learned", action: "Review least-privilege access model — E8-5 requires admin rights review quarterly", owner: "CISO", priority: "within-7d", automatable: false },
  ],

  phishing: [
    { order: 1, phase: "detection", action: "Pull email headers — confirm sending domain, DKIM/SPF/DMARC status", owner: "SOC Analyst", priority: "immediate", toolHint: "Proofpoint Essentials", automatable: true },
    { order: 2, phase: "containment", action: "Purge phishing email from all mailboxes organisation-wide", owner: "IT Admin", priority: "immediate", toolHint: "Microsoft 365 / Proofpoint", automatable: true },
    { order: 3, phase: "containment", action: "Block sending domain at email gateway and DNS layer", owner: "IT Admin", priority: "immediate", toolHint: "Cloudflare Gateway / Proofpoint", automatable: true },
    { order: 4, phase: "containment", action: "Force MFA re-auth and session revocation for any accounts that clicked", owner: "IT Admin", priority: "immediate", toolHint: "Okta / Azure AD", automatable: true },
    { order: 5, phase: "eradication", action: "Deploy targeted KnowBe4 phishing simulation within 7 days", owner: "CISO", priority: "within-7d", toolHint: "KnowBe4", automatable: true },
  ],

  "supply-chain": [
    { order: 1, phase: "detection", action: "Identify all systems using the compromised vendor/package version", owner: "SOC Analyst", priority: "immediate", toolHint: "Snyk / Semgrep / Tenable", automatable: true },
    { order: 2, phase: "containment", action: "Isolate or disable affected components — accept service degradation over continued risk", owner: "IT Admin", priority: "immediate", automatable: false },
    { order: 3, phase: "eradication", action: "Update or replace compromised dependency — pin to known-good version hash", owner: "IT Admin", priority: "within-24h", toolHint: "Snyk / GitGuardian", automatable: true },
    { order: 4, phase: "lessons-learned", action: "Implement software composition analysis (SCA) in CI/CD pipeline", owner: "IT Admin", priority: "within-7d", toolHint: "Snyk", automatable: true },
  ],

  identity: [
    { order: 1, phase: "detection", action: "Identify compromised accounts — check for impossible travel, unusual login hours, new MFA devices", owner: "SOC Analyst", priority: "immediate", toolHint: "Okta / Azure AD Identity Protection", automatable: true },
    { order: 2, phase: "containment", action: "Revoke all active sessions for compromised identities", owner: "IT Admin", priority: "immediate", toolHint: "Okta / Azure AD", automatable: true },
    { order: 3, phase: "eradication", action: "Enable phishing-resistant MFA (FIDO2/passkey) for all privileged accounts", owner: "IT Admin", priority: "within-24h", toolHint: "Okta Authenticator / Azure AD", automatable: false },
    { order: 4, phase: "lessons-learned", action: "Review and enforce Conditional Access policies — require compliant devices", owner: "CISO", priority: "within-7d", automatable: false },
  ],

  vulnerability: [
    { order: 1, phase: "detection", action: "Validate finding — run authenticated scan to confirm exploitability", owner: "SOC Analyst", priority: "within-1h", toolHint: "Tenable Nessus / Intruder", automatable: true },
    { order: 2, phase: "containment", action: "Apply temporary mitigation (WAF rule, config change) if patch not immediately available", owner: "IT Admin", priority: "within-1h", automatable: false },
    { order: 3, phase: "eradication", action: "Apply vendor patch — prioritise by CVSS score and internet exposure", owner: "IT Admin", priority: "within-24h", automatable: false },
    { order: 4, phase: "lessons-learned", action: "Add to patch management tracking — verify E8-2 compliance (patch applications within 48h for internet-facing)", owner: "CISO", priority: "within-7d", automatable: false },
  ],
};

// ── Affected controls by category ────────────────────────────────────────────

const AFFECTED_CONTROLS: Record<ThreatCategory, string[]> = {
  ransomware:      ["E8-1", "E8-3", "E8-8", "ISO A.12.6", "ISO A.16.1"],
  "data-breach":   ["E8-4", "ISO A.8.2", "ISO A.9.4", "ISO A.16.1"],
  ddos:            ["ISO A.12.6", "ISO A.17.1"],
  "zero-day":      ["E8-2", "E8-4", "ISO A.12.6"],
  "nation-state":  ["E8-1", "E8-5", "E8-7", "ISO A.6.1", "ISO A.16.1"],
  insider:         ["E8-5", "ISO A.9.4", "ISO A.8.2"],
  phishing:        ["E8-7", "E8-3", "ISO A.9.4"],
  "supply-chain":  ["E8-2", "ISO A.12.6", "ISO A.14.2"],
  identity:        ["E8-7", "E8-5", "ISO A.9.4"],
  vulnerability:   ["E8-2", "ISO A.12.6"],
};

// ── Agent actions by category ─────────────────────────────────────────────────

const AGENT_TRIGGERS: Record<ThreatCategory, AgentAction[]> = {
  ransomware: [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Ransomware event requires immediate IR playbook activation and phase tracking", priority: "immediate", expectedOutput: "Active incident created with ransomware playbook, phase set to detection" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Scan environment for matching IOCs and ransomware family signatures", priority: "immediate", expectedOutput: "IOC match report against local asset inventory" },
    { agentId: "compliance-auditor", agentName: "Compliance Auditor", reason: "Ransomware triggers E8-1, E8-3, E8-8 control review", priority: "within-1h", expectedOutput: "Compliance delta report for Essential 8 Maturity Level gap" },
    { agentId: "board-reporter", agentName: "Board Reporter", reason: "Critical incident requires board notification within 24h", priority: "within-24h", expectedOutput: "Board notification draft with incident summary and remediation status" },
  ],
  "data-breach": [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Data breach triggers Privacy Act notification assessment", priority: "immediate", expectedOutput: "IR playbook with APA notification timeline" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Identify exfiltration channel and scope", priority: "immediate", expectedOutput: "Data movement analysis report" },
    { agentId: "board-reporter", agentName: "Board Reporter", reason: "Board and regulatory notification required for notifiable data breach", priority: "within-24h", expectedOutput: "Board notification + regulatory disclosure draft" },
  ],
  ddos: [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "DDoS event requires immediate containment playbook", priority: "immediate", expectedOutput: "DDoS response playbook with Cloudflare mitigation steps" },
    { agentId: "posture-scorer", agentName: "Posture Scorer", reason: "Availability impact should be reflected in posture score", priority: "within-1h", expectedOutput: "Updated posture score with availability domain degradation" },
  ],
  "zero-day": [
    { agentId: "vuln-scanner", agentName: "Vulnerability Manager", reason: "Scan all assets for the zero-day CVE immediately", priority: "immediate", expectedOutput: "Asset exposure list for this CVE with patch status" },
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "CVSS ≥ 9.0 zero-day requires IR playbook", priority: "immediate", expectedOutput: "Zero-day response playbook with workaround steps" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Check for active exploitation in environment", priority: "within-1h", expectedOutput: "Exploitation indicator scan results" },
  ],
  "nation-state": [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Nation-state activity is highest severity — full playbook activation", priority: "immediate", expectedOutput: "Nation-state IR playbook with ASD escalation steps" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Full environment threat hunt for persistence mechanisms", priority: "immediate", expectedOutput: "Persistence and lateral movement indicators report" },
    { agentId: "compliance-auditor", agentName: "Compliance Auditor", reason: "Nation-state event may trigger ISM/PSPF obligations", priority: "within-1h", expectedOutput: "Regulatory obligation checklist" },
    { agentId: "board-reporter", agentName: "Board Reporter", reason: "Board and potentially ASX notification required", priority: "within-1h", expectedOutput: "Board and ASX disclosure draft" },
  ],
  insider: [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Insider threat requires HR/Legal-coordinated IR playbook", priority: "immediate", expectedOutput: "Insider threat playbook with evidence preservation steps" },
    { agentId: "compliance-auditor", agentName: "Compliance Auditor", reason: "E8-5 least-privilege violation requires compliance review", priority: "within-24h", expectedOutput: "Privilege access compliance gap report" },
  ],
  phishing: [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Phishing event requires immediate credential containment", priority: "immediate", expectedOutput: "Phishing IR playbook with email purge and MFA steps" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Check for credential use after phishing click", priority: "immediate", expectedOutput: "Post-phishing credential abuse indicators" },
  ],
  "supply-chain": [
    { agentId: "tech-assessor", agentName: "Tech Stack Assessor", reason: "Supply chain compromise requires full dependency audit", priority: "immediate", expectedOutput: "Affected package/vendor inventory list" },
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Supply chain events require formal IR activation", priority: "within-1h", expectedOutput: "Supply chain IR playbook" },
  ],
  identity: [
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "Identity compromise requires immediate session revocation playbook", priority: "immediate", expectedOutput: "Identity IR playbook with MFA enforcement steps" },
    { agentId: "threat-hunter", agentName: "Threat Hunter", reason: "Scan for lateral movement from compromised identities", priority: "within-1h", expectedOutput: "Lateral movement indicator report" },
  ],
  vulnerability: [
    { agentId: "vuln-scanner", agentName: "Vulnerability Manager", reason: "New vulnerability requires immediate scan of asset inventory", priority: "immediate", expectedOutput: "Affected asset list with patch availability status" },
    { agentId: "incident-responder", agentName: "Incident Responder", reason: "High-severity vulnerabilities require IR readiness", priority: "within-1h", expectedOutput: "Vulnerability response playbook" },
  ],
};

// ── Posture delta by severity ─────────────────────────────────────────────────

const POSTURE_DELTA: Record<SeverityLevel, number> = {
  critical: -12,
  high:     -7,
  medium:   -3,
  low:      -1,
};

// ── Main mapper function ──────────────────────────────────────────────────────

export function mapThreatToDefensiveStance(threat: IngestedThreat): DefensiveStance {
  const template = PLAYBOOK_TEMPLATES[threat.category] ?? PLAYBOOK_TEMPLATES.vulnerability;
  const controls = AFFECTED_CONTROLS[threat.category] ?? [];
  const agentActions = AGENT_TRIGGERS[threat.category] ?? [];

  // Inject any CVE-specific context into zero-day steps
  const enrichedPlaybook: PlaybookStep[] = template.map(step => {
    if (threat.cveIds && threat.cveIds.length > 0 && step.order === 1) {
      return {
        ...step,
        action: `${step.action} [CVEs: ${threat.cveIds.join(", ")}]`,
      };
    }
    if (threat.threatActor && step.phase === "containment" && step.order === 3) {
      return {
        ...step,
        action: `${step.action} [Threat Actor: ${threat.threatActor}]`,
      };
    }
    return step;
  });

  // Scope-specific guidance for local/regional threats
  const scopeContext = threat.scope === "local"
    ? `This is a LOCAL threat (${threat.region}) — your organisation faces elevated risk as a nearby target. Immediate action warranted.`
    : threat.scope === "regional"
    ? `This is a REGIONAL threat (${threat.region}) — APAC sector targeting confirmed. Review sector alignment and proactively harden relevant controls.`
    : `This is a GLOBAL threat — monitor for local indicators and apply standard defensive posture uplift.`;

  const mitigations = generateMitigations(threat);

  return {
    threatId: threat.id,
    generatedAt: new Date().toISOString(),
    overallRisk: threat.severity,
    summary: `${scopeContext} Threat: ${threat.title}. Category: ${threat.category}. ${threat.affectedSectors.length > 0 ? `Affected sectors: ${threat.affectedSectors.join(", ")}.` : ""} Recommended defensive stance: activate ${agentActions.length} agents, follow ${enrichedPlaybook.length}-step playbook.`,
    affectedControls: controls,
    playbook: enrichedPlaybook,
    mitigations,
    agentActions,
    postureDelta: POSTURE_DELTA[threat.severity],
  };
}

function generateMitigations(threat: IngestedThreat): string[] {
  const mitigations: string[] = [];

  if (threat.category === "ransomware") {
    mitigations.push("Enable Controlled Folder Access on all Windows endpoints");
    mitigations.push("Enforce application allowlisting (E8-1) — block unsigned executables");
    mitigations.push("Test backup restoration weekly — ransomware renders untested backups worthless");
    mitigations.push(`IOCs from ${threat.threatActor ?? "this threat actor"}: add to EDR blocklist immediately`);
  }

  if (threat.category === "zero-day") {
    mitigations.push("Enable exploit protection in Windows Defender / CrowdStrike");
    mitigations.push("WAF rule deployment for web-exploitable CVEs — Cloudflare managed rules");
    if (threat.cveIds) mitigations.push(`Subscribe to NVD notifications for: ${threat.cveIds.join(", ")}`);
  }

  if (threat.category === "ddos") {
    mitigations.push("Ensure Cloudflare Magic Transit or equivalent upstream scrubbing is active");
    mitigations.push(`Benchmark protection capacity against regional attack volumes (APAC DDoS events now exceed 600Gbps)`);
    mitigations.push("Pre-configure ISP null-routing contact — do not wait until under attack");
  }

  if (threat.scope === "local" || threat.scope === "regional") {
    mitigations.push(`Threat intelligence from ${threat.region}: brief security team within 24h`);
    mitigations.push("Consider sharing IOCs with AusCERT / ACSC if in AU — cross-sector benefit");
  }

  if (threat.iocs.length > 0) {
    mitigations.push(`Block known IOCs in EDR and SIEM: ${threat.iocs.slice(0, 3).join(", ")}${threat.iocs.length > 3 ? ` +${threat.iocs.length - 3} more` : ""}`);
  }

  if (threat.ttps.length > 0) {
    mitigations.push(`MITRE ATT&CK coverage: review detections for ${threat.ttps.join(", ")}`);
  }

  return mitigations;
}

// ── Batch processing ──────────────────────────────────────────────────────────

export function mapThreatsToDefensiveStances(threats: IngestedThreat[]): DefensiveStance[] {
  return threats.map(mapThreatToDefensiveStance);
}

export function prioritiseByScope(threats: IngestedThreat[]): IngestedThreat[] {
  const scopeOrder: Record<ThreatScope, number> = { local: 0, regional: 1, global: 2 };
  const severityOrder: Record<SeverityLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...threats].sort((a, b) => {
    const scopeDiff = scopeOrder[a.scope] - scopeOrder[b.scope];
    if (scopeDiff !== 0) return scopeDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
