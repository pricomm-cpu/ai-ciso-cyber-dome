import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import {
  organisations, threats, complianceItems, techAssets,
  incidents, boardReports, assessmentResponses, connectorStates,
  type Organisation, type InsertOrganisation,
  type Threat, type InsertThreat,
  type ComplianceItem, type InsertComplianceItem,
  type TechAsset, type InsertTechAsset,
  type Incident, type InsertIncident,
  type BoardReport, type InsertBoardReport,
  type AssessmentResponse, type InsertAssessmentResponse,
  type ConnectorState, type InsertConnectorState,
} from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS organisations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    industry TEXT NOT NULL, size TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS threats (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    title TEXT NOT NULL, severity TEXT NOT NULL, category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', description TEXT NOT NULL,
    detected_at TEXT NOT NULL, resolved_at TEXT, ai_recommendation TEXT
  );
  CREATE TABLE IF NOT EXISTS compliance_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    framework TEXT NOT NULL, control TEXT NOT NULL, control_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not-assessed', evidence TEXT,
    due_date TEXT, ai_guidance TEXT
  );
  CREATE TABLE IF NOT EXISTS tech_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    name TEXT NOT NULL, category TEXT NOT NULL, vendor TEXT, version TEXT,
    eol_date TEXT, risk_level TEXT DEFAULT 'unknown',
    refresh_needed INTEGER DEFAULT 0, ai_recommendation TEXT, recommended_vendors TEXT
  );
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    title TEXT NOT NULL, severity TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'detection', summary TEXT NOT NULL,
    ai_playbook TEXT, reported_at TEXT NOT NULL, closed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS board_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    title TEXT NOT NULL, period TEXT NOT NULL, risk_summary TEXT NOT NULL,
    compliance_summary TEXT NOT NULL, key_actions TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assessment_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL, answer TEXT, notes TEXT, updated_at TEXT NOT NULL,
    UNIQUE(org_id, question_id)
  );
  CREATE TABLE IF NOT EXISTS connector_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL,
    connector_id TEXT NOT NULL, connected INTEGER NOT NULL DEFAULT 0,
    connected_at TEXT,
    UNIQUE(org_id, connector_id)
  );
`);

export interface IStorage {
  getOrg(id: number): Organisation | undefined;
  createOrg(data: InsertOrganisation): Organisation;
  getThreats(orgId: number): Threat[];
  createThreat(data: InsertThreat): Threat;
  updateThreatStatus(id: number, status: string): Threat | undefined;
  getComplianceItems(orgId: number): ComplianceItem[];
  updateComplianceItem(id: number, patch: Partial<ComplianceItem>): ComplianceItem | undefined;
  getTechAssets(orgId: number): TechAsset[];
  createTechAsset(data: InsertTechAsset): TechAsset;
  updateTechAsset(id: number, patch: Partial<TechAsset>): TechAsset | undefined;
  getIncidents(orgId: number): Incident[];
  createIncident(data: InsertIncident): Incident;
  updateIncidentPhase(id: number, phase: string, closedAt?: string): Incident | undefined;
  getBoardReports(orgId: number): BoardReport[];
  createBoardReport(data: InsertBoardReport): BoardReport;
  getAssessmentResponses(orgId: number): AssessmentResponse[];
  upsertAssessmentResponse(data: InsertAssessmentResponse): AssessmentResponse;
  getConnectorStates(orgId: number): ConnectorState[];
  getConnectorState(orgId: number, connectorId: string): ConnectorState | undefined;
  upsertConnectorState(data: InsertConnectorState): ConnectorState;
}

class SqliteStorage implements IStorage {
  getOrg(id: number) { return db.select().from(organisations).where(eq(organisations.id, id)).get(); }
  createOrg(data: InsertOrganisation) { return db.insert(organisations).values(data).returning().get(); }
  getThreats(orgId: number) { return db.select().from(threats).where(eq(threats.orgId, orgId)).all(); }
  createThreat(data: InsertThreat) { return db.insert(threats).values(data).returning().get(); }
  updateThreatStatus(id: number, status: string) { return db.update(threats).set({ status }).where(eq(threats.id, id)).returning().get(); }
  getComplianceItems(orgId: number) { return db.select().from(complianceItems).where(eq(complianceItems.orgId, orgId)).all(); }
  updateComplianceItem(id: number, patch: Partial<ComplianceItem>) { return db.update(complianceItems).set(patch).where(eq(complianceItems.id, id)).returning().get(); }
  getTechAssets(orgId: number) { return db.select().from(techAssets).where(eq(techAssets.orgId, orgId)).all(); }
  createTechAsset(data: InsertTechAsset) { return db.insert(techAssets).values(data).returning().get(); }
  updateTechAsset(id: number, patch: Partial<TechAsset>) { return db.update(techAssets).set(patch).where(eq(techAssets.id, id)).returning().get(); }
  getIncidents(orgId: number) { return db.select().from(incidents).where(eq(incidents.orgId, orgId)).all(); }
  createIncident(data: InsertIncident) { return db.insert(incidents).values(data).returning().get(); }
  updateIncidentPhase(id: number, phase: string, closedAt?: string) {
    return db.update(incidents).set({ phase, ...(closedAt ? { closedAt } : {}) }).where(eq(incidents.id, id)).returning().get();
  }
  getBoardReports(orgId: number) { return db.select().from(boardReports).where(eq(boardReports.orgId, orgId)).all(); }
  createBoardReport(data: InsertBoardReport) { return db.insert(boardReports).values(data).returning().get(); }
  getAssessmentResponses(orgId: number) { return db.select().from(assessmentResponses).where(eq(assessmentResponses.orgId, orgId)).all(); }
  upsertAssessmentResponse(data: InsertAssessmentResponse) {
    return db.insert(assessmentResponses).values(data)
      .onConflictDoUpdate({ target: [assessmentResponses.orgId, assessmentResponses.questionId], set: { answer: data.answer, notes: data.notes, updatedAt: data.updatedAt } })
      .returning().get();
  }
  getConnectorStates(orgId: number) { return db.select().from(connectorStates).where(eq(connectorStates.orgId, orgId)).all(); }
  getConnectorState(orgId: number, connectorId: string) {
    return db.select().from(connectorStates).where(and(eq(connectorStates.orgId, orgId), eq(connectorStates.connectorId, connectorId))).get();
  }
  upsertConnectorState(data: InsertConnectorState) {
    return db.insert(connectorStates).values(data)
      .onConflictDoUpdate({ target: [connectorStates.orgId, connectorStates.connectorId], set: { connected: data.connected, connectedAt: data.connectedAt } })
      .returning().get();
  }
}

function seedIfEmpty() {
  if (db.select().from(organisations).all().length > 0) return;
  const now = new Date().toISOString();
  const org = db.insert(organisations).values({ name: "Acme Technologies Pty Ltd", industry: "Technology", size: "51-200", createdAt: now }).returning().get();
  const oid = org.id;

  const threatData = [
    { title: "Phishing campaign targeting finance team", severity: "critical", category: "phishing", status: "investigating", description: "3 employees received credential-harvesting emails impersonating ATO. One clicked the link before detection.", detectedAt: "2026-06-19T08:14:00Z", aiRecommendation: "1. Force password reset for affected accounts immediately.\n2. Enable MFA on all finance accounts if not already active.\n3. Block sending domain at email gateway.\n4. Run KnowBe4 phishing simulation within 7 days." },
    { title: "Unpatched Apache Log4j on legacy API server", severity: "high", category: "vulnerability", status: "open", description: "Log4Shell (CVE-2021-44228) detected on api-legacy.acme.internal. Server not in patch rotation.", detectedAt: "2026-06-18T11:30:00Z", aiRecommendation: "Patch or isolate api-legacy.internal immediately. Apply Log4j 2.17.1+. If patching delayed >48h, firewall off external access and enable WAF rule." },
    { title: "Excessive admin privileges — 14 accounts", severity: "high", category: "insider", status: "open", description: "Privilege audit found 14 non-IT staff with domain admin rights. Violates least-privilege policy.", detectedAt: "2026-06-17T09:00:00Z", aiRecommendation: "Revoke admin rights for all 14 accounts. Implement JIT access via PIM. Schedule quarterly privilege review." },
    { title: "Public S3 bucket exposing customer invoices", severity: "critical", category: "data-breach", status: "mitigated", description: "S3 bucket acme-invoices-2024 was publicly accessible. 1,200 invoice PDFs exposed.", detectedAt: "2026-06-15T14:22:00Z", resolvedAt: "2026-06-15T16:45:00Z", aiRecommendation: "Bucket restricted. Notify Privacy Officer for potential notifiable data breach assessment under Australian Privacy Act." },
    { title: "Brute-force attempts on VPN portal", severity: "medium", category: "vulnerability", status: "open", description: "1,400 failed login attempts against vpn.acme.com.au over 6 hours from 3 IPs.", detectedAt: "2026-06-20T02:17:00Z", aiRecommendation: "Block offending IPs at perimeter. Enable account lockout after 5 failures. Consider geo-blocking non-AU/US to VPN." },
    { title: "Outdated SSL certificate on customer portal", severity: "low", category: "vulnerability", status: "open", description: "TLS cert for portal.acme.com expires in 6 days. Auto-renewal failed due to DNS change.", detectedAt: "2026-06-21T06:00:00Z", aiRecommendation: "Renew cert immediately. Fix DNS record. Implement cert expiry monitoring." },
  ];
  for (const t of threatData) db.insert(threats).values({ orgId: oid, ...t }).run();

  const complianceData = [
    { framework: "Essential 8", controlId: "E8-1", control: "Application Control", status: "partial", aiGuidance: "Implement application allowlisting on all user workstations. AppLocker or WDAC are zero-cost on Windows." },
    { framework: "Essential 8", controlId: "E8-2", control: "Patch Applications", status: "compliant", aiGuidance: "Patching SLA meets Essential 8 ML2. Maintain <48h for internet-facing apps." },
    { framework: "Essential 8", controlId: "E8-3", control: "Configure Microsoft Office Macros", status: "non-compliant", aiGuidance: "Disable macros by default via Group Policy. Allow only signed macros from trusted publishers." },
    { framework: "Essential 8", controlId: "E8-4", control: "User Application Hardening", status: "partial", aiGuidance: "Block web ads and Flash. Disable unneeded browser plugins via MDM." },
    { framework: "Essential 8", controlId: "E8-5", control: "Restrict Admin Privileges", status: "non-compliant", aiGuidance: "14 excess admin accounts found. Immediate remediation required." },
    { framework: "Essential 8", controlId: "E8-6", control: "Patch Operating Systems", status: "compliant", aiGuidance: "All endpoints on Windows 11 22H2+ or macOS 14+. Intune enforcing monthly patch cycle." },
    { framework: "Essential 8", controlId: "E8-7", control: "Multi-Factor Authentication", status: "partial", aiGuidance: "MFA enabled for 87% of accounts. Finance and HR not fully enrolled. Complete within 30 days." },
    { framework: "Essential 8", controlId: "E8-8", control: "Regular Backups", status: "compliant", aiGuidance: "Daily encrypted backups to offsite S3. Restoration tested quarterly." },
    { framework: "ISO 27001", controlId: "A.5.1", control: "Information Security Policies", status: "compliant", aiGuidance: "Policy suite reviewed March 2026. Schedule next review March 2027." },
    { framework: "ISO 27001", controlId: "A.6.1", control: "Internal Organisation", status: "partial", aiGuidance: "Security roles defined but no formal CISO appointment. AI CISO platform fulfils this — document accordingly." },
    { framework: "ISO 27001", controlId: "A.8.2", control: "Information Classification", status: "non-compliant", aiGuidance: "No data classification scheme. Implement 4-tier: Public, Internal, Confidential, Restricted." },
    { framework: "ISO 27001", controlId: "A.9.4", control: "System & Application Access Control", status: "partial", aiGuidance: "SSO for cloud apps. Legacy on-prem still on local accounts. Migrate within 90 days." },
    { framework: "ISO 27001", controlId: "A.12.6", control: "Technical Vulnerability Management", status: "partial", aiGuidance: "Log4j gap found. Formalise vuln management with monthly scan cadence." },
    { framework: "ISO 27001", controlId: "A.16.1", control: "Incident Management", status: "compliant", aiGuidance: "Playbook in place. AI CISO provides automated tracking. Test annually." },
  ];
  for (const c of complianceData) db.insert(complianceItems).values({ orgId: oid, ...c }).run();

  const assetData = [
    { name: "Cisco ASA 5506-X Firewall", category: "firewall", vendor: "Cisco", version: "9.8(4)", eolDate: "2023-08-31", riskLevel: "high", refreshNeeded: true, aiRecommendation: "EOL Aug 2023. No patches. Replace with Fortinet FortiGate 60F or Palo Alto PA-440. Budget ~$2,500 AUD.", recommendedVendors: JSON.stringify(["Fortinet FortiGate 60F", "Palo Alto PA-440", "Sophos XGS 87"]) },
    { name: "CrowdStrike Falcon EDR", category: "edr", vendor: "CrowdStrike", version: "7.14", eolDate: null, riskLevel: "low", refreshNeeded: false, aiRecommendation: "Current. 3 devices missing agent — enrol immediately.", recommendedVendors: null },
    { name: "Microsoft 365 Business Premium", category: "iam", vendor: "Microsoft", version: "Current", eolDate: null, riskLevel: "low", refreshNeeded: false, aiRecommendation: "Configure Conditional Access. Enable Defender for Business included in licence." },
    { name: "Veeam Backup & Replication v11a", category: "backup", vendor: "Veeam", version: "11a", eolDate: "2025-01-31", riskLevel: "medium", refreshNeeded: true, aiRecommendation: "EOL Jan 2025. Upgrade to Veeam v12 (free upgrade on active support).", recommendedVendors: JSON.stringify(["Veeam v12", "Acronis Cyber Protect"]) },
    { name: "Proofpoint Essentials Email Security", category: "email-security", vendor: "Proofpoint", version: "Current", eolDate: null, riskLevel: "low", refreshNeeded: false, aiRecommendation: "Enable DMARC enforcement. Current policy is p=none — upgrade to p=reject." },
    { name: "Splunk SIEM Free", category: "siem", vendor: "Splunk", version: "9.0", eolDate: "2025-10-22", riskLevel: "medium", refreshNeeded: true, aiRecommendation: "EOL Oct 2025. Upgrade to 9.3+ or migrate to Microsoft Sentinel.", recommendedVendors: JSON.stringify(["Splunk 9.3", "Microsoft Sentinel", "Elastic SIEM"]) },
    { name: "Okta Workforce Identity", category: "iam", vendor: "Okta", version: "Current", eolDate: null, riskLevel: "low", refreshNeeded: false, aiRecommendation: "Enable phishing-resistant MFA (FIDO2). Upgrade admin accounts to hardware keys." },
    { name: "Tenable Nessus Essentials", category: "vulnerability-scanner", vendor: "Tenable", version: "10.6", eolDate: null, riskLevel: "low", refreshNeeded: false, aiRecommendation: "Run weekly authenticated scans. Schedule Mon 6am. Export results to SIEM." },
  ];
  for (const a of assetData) db.insert(techAssets).values({ orgId: oid, ...a }).run();

  const incidentData = [
    { title: "Phishing Response — Finance Team", severity: "critical", phase: "containment", summary: "ATO phishing campaign targeted 3 finance staff. One credential compromised. Password reset and token revocation executed.", aiPlaybook: JSON.stringify(["Isolate affected user accounts", "Force password reset for all finance staff", "Review email gateway logs for related IOCs", "Block sender domain at perimeter", "Notify Privacy Officer if data accessed", "Run targeted phishing awareness training"]), reportedAt: "2026-06-19T08:30:00Z" },
    { title: "Public S3 Bucket Data Exposure", severity: "critical", phase: "lessons-learned", summary: "Customer invoice bucket publicly accessible for ~18 hours. 1,200 files exposed. Bucket locked.", aiPlaybook: JSON.stringify(["Immediately revoke public access on bucket", "Enable S3 Block Public Access at account level", "Audit all S3 buckets for misconfiguration", "Assess Australian Privacy Act notification requirement", "Implement AWS Config rule to alert on public buckets", "Add to monthly cloud security review"]), reportedAt: "2026-06-15T14:22:00Z", closedAt: "2026-06-16T10:00:00Z" },
  ];
  for (const i of incidentData) db.insert(incidents).values({ orgId: oid, ...i }).run();

  db.insert(boardReports).values({
    orgId: oid, title: "Security Status Report — Q2 2026", period: "Q2 2026",
    riskSummary: "Aggregate risk score 62/100 (Elevated). Two critical events resolved. Primary open risks: unpatched legacy firewall (EOL), incomplete MFA rollout, excess admin privileges. No confirmed data loss.",
    complianceSummary: "Essential 8 maturity: Level 1. ISO 27001: 8/14 controls compliant or partial. Priority gaps: data classification absent, macro controls not enforced.",
    keyActions: JSON.stringify(["Replace EOL Cisco ASA firewall — Q3 priority, est. $2,500 AUD", "Complete MFA rollout for remaining 13% of accounts within 30 days", "Revoke excess admin privileges for 14 accounts — immediate", "Implement data classification using Microsoft Purview", "Upgrade Veeam Backup from EOL v11a to v12 — free upgrade"]),
    createdAt: now,
  }).run();

  console.log("Seed complete:", oid);
}

seedIfEmpty();
export const storage = new SqliteStorage();
