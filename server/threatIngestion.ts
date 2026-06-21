/**
 * Threat Ingestion Pipeline
 *
 * Ingests structured threat intelligence from external feeds
 * (CyberNews page, ACSC, AusCERT, threat feeds) and maps each
 * threat to a defensive stance + IR playbook via playbookMapper.
 *
 * The pipeline stores ingested threats and derived stances in SQLite
 * so the Agent Swarm can query them without re-processing.
 *
 * Flow:
 *   Threat Feed → normalise() → IngestedThreat → mapThreatToDefensiveStance()
 *   → DefensiveStance → stored in ingested_threats + defensive_stances tables
 */

import Database from "better-sqlite3";
import {
  mapThreatToDefensiveStance,
  prioritiseByScope,
  type IngestedThreat,
  type DefensiveStance,
  type ThreatCategory,
  type ThreatScope,
  type SeverityLevel,
} from "./playbookMapper";

// ── Database setup ────────────────────────────────────────────────────────────

const sqlite = new Database("data.db");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS ingested_threats (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    published_at TEXT NOT NULL,
    affected_sectors TEXT NOT NULL DEFAULT '[]',
    iocs TEXT NOT NULL DEFAULT '[]',
    ttps TEXT NOT NULL DEFAULT '[]',
    severity TEXT NOT NULL,
    region TEXT NOT NULL,
    threat_actor TEXT,
    cve_ids TEXT,
    ingested_at TEXT NOT NULL,
    pipeline_version TEXT NOT NULL DEFAULT '1.0'
  );

  CREATE TABLE IF NOT EXISTS defensive_stances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    threat_id TEXT NOT NULL UNIQUE,
    generated_at TEXT NOT NULL,
    overall_risk TEXT NOT NULL,
    summary TEXT NOT NULL,
    affected_controls TEXT NOT NULL DEFAULT '[]',
    playbook TEXT NOT NULL DEFAULT '[]',
    mitigations TEXT NOT NULL DEFAULT '[]',
    agent_actions TEXT NOT NULL DEFAULT '[]',
    posture_delta INTEGER NOT NULL DEFAULT 0,
    acknowledged INTEGER NOT NULL DEFAULT 0,
    acknowledged_at TEXT,
    acknowledged_by TEXT,
    FOREIGN KEY (threat_id) REFERENCES ingested_threats(id)
  );

  CREATE TABLE IF NOT EXISTS pipeline_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at TEXT NOT NULL,
    source TEXT NOT NULL,
    threats_ingested INTEGER NOT NULL DEFAULT 0,
    threats_new INTEGER NOT NULL DEFAULT 0,
    threats_updated INTEGER NOT NULL DEFAULT 0,
    stances_generated INTEGER NOT NULL DEFAULT 0,
    errors TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    pipeline_version TEXT NOT NULL DEFAULT '1.0'
  );

  CREATE INDEX IF NOT EXISTS idx_ingested_threats_scope     ON ingested_threats(scope);
  CREATE INDEX IF NOT EXISTS idx_ingested_threats_severity  ON ingested_threats(severity);
  CREATE INDEX IF NOT EXISTS idx_ingested_threats_category  ON ingested_threats(category);
  CREATE INDEX IF NOT EXISTS idx_defensive_stances_risk     ON defensive_stances(overall_risk);
  CREATE INDEX IF NOT EXISTS idx_defensive_stances_ack      ON defensive_stances(acknowledged);
`);

// ── Pipeline result types ─────────────────────────────────────────────────────

export interface PipelineRunResult {
  runId: number;
  runAt: string;
  source: string;
  threatsIngested: number;
  threatsNew: number;
  threatsUpdated: number;
  stancesGenerated: number;
  errors: string[];
  durationMs: number;
  newStances: DefensiveStance[];
}

export interface StoredThreat extends IngestedThreat {
  pipelineVersion: string;
}

export interface StoredStance extends DefensiveStance {
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

// ── Known threat feed from CyberNews.tsx ─────────────────────────────────────
// These are the 21 real June 2026 incidents ingested from the news module.
// In production this would be refreshed via API/RSS; here we seed from constants.

export const SEED_THREATS: IngestedThreat[] = [
  // ── LOCAL — AU/NZ ──────────────────────────────────────────────────────────
  {
    id: "au-2026-001",
    scope: "local",
    category: "ransomware",
    title: "Mackay Sugar ransomware attack — 'The Gentlemen' RaaS",
    summary: "Mackay Sugar (North Queensland) hit by Russian-speaking 'The Gentlemen' ransomware group. OT/IT convergence risk highlighted. Australia is 4th most targeted country globally by this group.",
    source: "ABC News",
    sourceUrl: "https://www.abc.net.au/news/2026-06-18/the-gentlemen-ransomware-russian-speaking-hack-north-qld-sugar/106807366",
    publishedAt: "2026-06-18T00:00:00Z",
    affectedSectors: ["manufacturing", "agriculture", "critical-infrastructure"],
    iocs: ["gentlemen-raas-c2.onion", "edr-killer-v3.exe", "ransom_note_gentlemen.txt"],
    ttps: ["T1486", "T1562.001", "T1021.002"],
    severity: "critical",
    region: "AU",
    threatActor: "The Gentlemen",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "au-2026-002",
    scope: "local",
    category: "ddos",
    title: "VentraIP 600Gbps+ DDoS — 300,000 customers impacted",
    summary: "Australian web hosting provider VentraIP suffered a >600Gbps DDoS attack disrupting 300,000 customers. Largest recorded DDoS against an Australian hosting provider.",
    source: "arnav.au",
    sourceUrl: "https://arnav.au/2026/06/02/australian-cyber-attacks-denial-of-service-data-breaches/",
    publishedAt: "2026-05-23T00:00:00Z",
    affectedSectors: ["technology", "hosting", "smb"],
    iocs: [],
    ttps: ["T1498", "T1498.001"],
    severity: "high",
    region: "AU",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "au-2026-003",
    scope: "local",
    category: "insider",
    title: "NSW Treasury insider — 5,600 sensitive documents stolen",
    summary: "NSW Treasury employee exfiltrated 5,600 sensitive government documents. Highlights insider threat risk in public sector with inadequate DLP controls.",
    source: "Mercury IT",
    sourceUrl: "https://mercuryit.com.au/cyber-insights-with-mercuryit-may-2026/",
    publishedAt: "2026-04-19T00:00:00Z",
    affectedSectors: ["government", "public-sector"],
    iocs: [],
    ttps: ["T1048", "T1213"],
    severity: "high",
    region: "AU",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "au-2026-004",
    scope: "local",
    category: "data-breach",
    title: "Instructure Canvas breach — 9 Australian universities affected",
    summary: "EdTech platform Canvas (Instructure) breach exposed student and faculty data across 9 Australian universities. Supply-chain style breach via SaaS provider.",
    source: "iStart",
    sourceUrl: "https://istart.com.au/news-items/appwrap-2026/",
    publishedAt: "2026-05-06T00:00:00Z",
    affectedSectors: ["education", "higher-education"],
    iocs: [],
    ttps: ["T1190", "T1078"],
    severity: "high",
    region: "AU",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "nz-2026-001",
    scope: "local",
    category: "data-breach",
    title: "NZ Manage My Health — 99,000 patient records exposed",
    summary: "New Zealand healthcare platform 'Manage My Health' exposed 99,000 patient records. NZ Privacy Commissioner launched formal inquiry.",
    source: "NZ Privacy Commissioner",
    sourceUrl: "https://www.privacy.org.nz/focus-areas/manage-my-health-inquiry/executive-summary-manage-my-health-phase-one/",
    publishedAt: "2026-05-27T00:00:00Z",
    affectedSectors: ["healthcare", "digital-health"],
    iocs: [],
    ttps: ["T1190", "T1078.004"],
    severity: "critical",
    region: "NZ",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "au-2026-005",
    scope: "local",
    category: "vulnerability",
    title: "ASIC orders AU$2.5M penalty for cyber failures — AFS licensee",
    summary: "First Australian AFS licensee penalised AU$2.5M for cybersecurity failures. Sets regulatory precedent for CISO accountability under ASIC's cyber obligations framework.",
    source: "CyberLawWatch",
    sourceUrl: "https://www.cyberlawwatch.com/2026/06/16/an-afs-licensee-first-receiving-an-order-to-pay-au2-5-million-for-cybersecurity-failures/",
    publishedAt: "2026-06-16T00:00:00Z",
    affectedSectors: ["financial-services", "fintech"],
    iocs: [],
    ttps: [],
    severity: "high",
    region: "AU",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "au-2026-006",
    scope: "local",
    category: "data-breach",
    title: "youX fintech breach — 444,000 borrowers, 229,000 driver licences",
    summary: "Australian fintech youX suffered breach exposing 444,000 borrowers' data including 229,000 driver licence numbers. Major Privacy Act notifiable breach.",
    source: "Bright Defense",
    sourceUrl: "https://www.brightdefense.com/resources/recent-data-breaches/",
    publishedAt: "2026-02-18T00:00:00Z",
    affectedSectors: ["fintech", "financial-services", "lending"],
    iocs: [],
    ttps: ["T1190", "T1078"],
    severity: "critical",
    region: "AU",
    ingestedAt: new Date().toISOString(),
  },

  // ── REGIONAL — APAC ───────────────────────────────────────────────────────
  {
    id: "apac-2026-001",
    scope: "regional",
    category: "zero-day",
    title: "Oracle PeopleSoft CVE-2026-35273 — CVSS 9.8 zero-day",
    summary: "Critical zero-day in Oracle PeopleSoft (CVE-2026-35273, CVSS 9.8) with active exploitation. Unauthenticated RCE. Patch not yet available at time of disclosure.",
    source: "Commonwealth Sentinel",
    sourceUrl: "https://commonwealthsentinel.com/cyber-security-weekly-top-5-cybersecurity-news-stories-for-the-week-of-june-8-14-2026/",
    publishedAt: "2026-06-08T00:00:00Z",
    affectedSectors: ["enterprise", "hr-systems", "finance"],
    iocs: [],
    ttps: ["T1190"],
    severity: "critical",
    region: "APAC",
    cveIds: ["CVE-2026-35273"],
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "apac-2026-002",
    scope: "regional",
    category: "nation-state",
    title: "China UNC6671/BlackFile — vishing + AiTM SSO attacks on APAC",
    summary: "Chinese threat actor UNC6671 (BlackFile) conducting vishing campaigns combined with adversary-in-the-middle SSO bypasses targeting APAC financial and technology organisations.",
    source: "Protos Labs",
    sourceUrl: "https://www.protoslabs.io/weekly-threat-briefs/apac-weekly-threat-brief-2026-05-22",
    publishedAt: "2026-05-16T00:00:00Z",
    affectedSectors: ["financial-services", "technology", "government"],
    iocs: ["blackfile-phish-kit-v2", "aitm-proxy-apac.domain"],
    ttps: ["T1566.004", "T1111", "T1078"],
    severity: "critical",
    region: "APAC",
    threatActor: "UNC6671 (BlackFile)",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "apac-2026-003",
    scope: "regional",
    category: "supply-chain",
    title: "Fox Tempest malware-signing targeting APAC MSSPs",
    summary: "Threat actor Fox Tempest using stolen code-signing certificates to distribute signed malware through APAC Managed Security Service Providers (MSSPs). Supply chain attack vector.",
    source: "Protos Labs",
    sourceUrl: "https://www.protoslabs.io/weekly-threat-briefs/apac-weekly-threat-brief-2026-05-22",
    publishedAt: "2026-05-19T00:00:00Z",
    affectedSectors: ["managed-services", "technology", "cybersecurity"],
    iocs: ["foxtempest-signer.dll", "mssp-backdoor-v1.2"],
    ttps: ["T1195.002", "T1553.002"],
    severity: "high",
    region: "APAC",
    threatActor: "Fox Tempest",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "apac-2026-004",
    scope: "regional",
    category: "data-breach",
    title: "APAC data leaks surge +143% — 5.3M records in H1 2026",
    summary: "Group-IB intelligence: APAC data leaks increased 143% year-on-year with 5.3 million records exposed in H1 2026. Australia and Southeast Asia most affected sub-regions.",
    source: "Group-IB",
    sourceUrl: "https://www.group-ib.com/resources/research-hub/aunz-intelligence-insights-report-april-2026/",
    publishedAt: "2026-06-01T00:00:00Z",
    affectedSectors: ["cross-sector", "financial-services", "government"],
    iocs: [],
    ttps: ["T1537", "T1048"],
    severity: "high",
    region: "APAC",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "apac-2026-005",
    scope: "regional",
    category: "vulnerability",
    title: "320,000 firewall devices compromised globally — APAC spike",
    summary: "Mass exploitation campaign compromised 320,000 perimeter firewall devices globally. APAC organisations over-represented due to legacy firewall prevalence.",
    source: "CybersecAsia",
    sourceUrl: "https://cybersecasia.net",
    publishedAt: "2026-06-19T00:00:00Z",
    affectedSectors: ["cross-sector", "critical-infrastructure"],
    iocs: ["fw-exploit-kit-2026.py"],
    ttps: ["T1190", "T1133"],
    severity: "critical",
    region: "APAC",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "apac-2026-006",
    scope: "regional",
    category: "ransomware",
    title: "INTERPOL APAC cybercrime surge — ransomware + BEC dominant",
    summary: "INTERPOL reports APAC cybercrime surge driven by digitisation. Ransomware and Business Email Compromise (BEC) are the dominant attack types. SMB sector most vulnerable.",
    source: "Infosecurity Magazine",
    sourceUrl: "https://www.infosecurity-magazine.com/news/cybercrime-surges-apac-digitization/",
    publishedAt: "2026-06-18T00:00:00Z",
    affectedSectors: ["smb", "cross-sector", "financial-services"],
    iocs: [],
    ttps: ["T1486", "T1566.002"],
    severity: "high",
    region: "APAC",
    ingestedAt: new Date().toISOString(),
  },

  // ── GLOBAL ────────────────────────────────────────────────────────────────
  {
    id: "global-2026-001",
    scope: "global",
    category: "zero-day",
    title: "Microsoft RoguePlanet CVE-2026-50656 — Defender zero-day",
    summary: "Microsoft confirmed 'RoguePlanet' zero-day in Microsoft Defender (CVE-2026-50656). Active exploitation in the wild. Patch under development — workaround available.",
    source: "Security Affairs",
    sourceUrl: "https://securityaffairs.com/193830/security/microsoft-confirms-rogueplanet-zero-day-in-defender-patch-under-development.html",
    publishedAt: "2026-06-19T00:00:00Z",
    affectedSectors: ["cross-sector", "enterprise"],
    iocs: ["rogueplanet-exploit-poc.exe"],
    ttps: ["T1562.001", "T1059"],
    severity: "critical",
    region: "Global",
    cveIds: ["CVE-2026-50656"],
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "global-2026-002",
    scope: "global",
    category: "ransomware",
    title: "The Gentlemen RaaS adds EDR killer — 830+ INC Ransomware victims",
    summary: "The Gentlemen ransomware-as-a-service adds advanced EDR killer to toolset. Separate report: INC Ransomware claims 830+ victims since Q4 2025, most active ransomware family globally.",
    source: "CSO Online",
    sourceUrl: "https://www.csoonline.com/article/4187329/threat-actor-adds-advanced-edr-killer-tools-to-ransomware-as-a-service-platform.html",
    publishedAt: "2026-06-20T00:00:00Z",
    affectedSectors: ["cross-sector", "critical-infrastructure", "healthcare"],
    iocs: ["edr-killer-v3.sys", "inc-ransom-payload.dll"],
    ttps: ["T1562.001", "T1486", "T1490"],
    severity: "critical",
    region: "Global",
    threatActor: "The Gentlemen / INC Ransomware",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "global-2026-003",
    scope: "global",
    category: "data-breach",
    title: "Kodak breach — ShinyHunters leak 2.2M records",
    summary: "Kodak confirms breach by ShinyHunters — 2.2 million customer records leaked. ShinyHunters continues prolific breach campaign targeting enterprise cloud storage.",
    source: "Malwarebytes",
    sourceUrl: "https://www.malwarebytes.com/blog/news/2026/06/kodak-confirms-breach-as-shinyhunters-leak-threat-reaches-deadline",
    publishedAt: "2026-06-19T00:00:00Z",
    affectedSectors: ["manufacturing", "enterprise", "retail"],
    iocs: [],
    ttps: ["T1530", "T1078"],
    severity: "high",
    region: "Global",
    threatActor: "ShinyHunters",
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "global-2026-004",
    scope: "global",
    category: "vulnerability",
    title: "June 2026 Patch Tuesday — 206 CVEs, 3 zero-days incl. HTTP/2 bomb",
    summary: "Microsoft June 2026 Patch Tuesday: 206 vulnerabilities patched including 3 zero-days. Includes HTTP/2 continuation flood (CVE-2026-49160) affecting web servers.",
    source: "Malware.news",
    sourceUrl: "https://malware.news/t/june-2026-patch-tuesday-206-vulnerabilities-three-zero-days-including-http-2-bomb-flaw-cve-2026-49160/107737",
    publishedAt: "2026-06-10T00:00:00Z",
    affectedSectors: ["cross-sector", "enterprise"],
    iocs: [],
    ttps: ["T1190", "T1499.003"],
    severity: "high",
    region: "Global",
    cveIds: ["CVE-2026-49160"],
    ingestedAt: new Date().toISOString(),
  },
  {
    id: "global-2026-005",
    scope: "global",
    category: "identity",
    title: "Verizon 2026 DBIR — AI involved in 1-in-6 breaches",
    summary: "Verizon 2026 Data Breach Investigations Report: AI is now involved in 1 in every 6 breaches. Social engineering and credential theft remain top attack vectors.",
    source: "National CIO Review",
    sourceUrl: "https://nationalcioreview.com/articles-insights/extra-bytes/security-priorities-revealed-in-verizons-2026-data-breach-report/",
    publishedAt: "2026-06-19T00:00:00Z",
    affectedSectors: ["cross-sector"],
    iocs: [],
    ttps: ["T1566", "T1078"],
    severity: "high",
    region: "Global",
    ingestedAt: new Date().toISOString(),
  },
];

// ── Pipeline Engine ───────────────────────────────────────────────────────────

export class ThreatIngestionPipeline {
  private readonly version = "1.0";

  /**
   * Main ingest entry point.
   * Accepts raw threats, deduplicates, maps to defensive stances, stores all.
   */
  ingest(threats: IngestedThreat[], source: string = "CyberNews"): PipelineRunResult {
    const startTime = Date.now();
    const runAt = new Date().toISOString();
    const errors: string[] = [];
    let threatsNew = 0;
    let threatsUpdated = 0;
    const newStances: DefensiveStance[] = [];

    // Prioritise: local > regional > global, then critical > high > medium > low
    const prioritised = prioritiseByScope(threats);

    for (const threat of prioritised) {
      try {
        const existing = this.getThreat(threat.id);
        if (existing) {
          this.updateThreat(threat);
          threatsUpdated++;
        } else {
          this.storeThreat(threat);
          threatsNew++;
        }

        // Always regenerate stance on ingest (fresh intelligence → fresh stance)
        const stance = mapThreatToDefensiveStance(threat);
        this.upsertStance(stance);
        if (!existing) newStances.push(stance);
      } catch (err: any) {
        errors.push(`[${threat.id}] ${err.message}`);
      }
    }

    const stancesGenerated = newStances.length;
    const durationMs = Date.now() - startTime;

    const result = sqlite.prepare(`
      INSERT INTO pipeline_runs (run_at, source, threats_ingested, threats_new, threats_updated,
        stances_generated, errors, duration_ms, pipeline_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      runAt, source, threats.length, threatsNew, threatsUpdated,
      stancesGenerated, errors.length > 0 ? JSON.stringify(errors) : null,
      durationMs, this.version
    );

    return {
      runId: result.lastInsertRowid as number,
      runAt,
      source,
      threatsIngested: threats.length,
      threatsNew,
      threatsUpdated,
      stancesGenerated,
      errors,
      durationMs,
      newStances,
    };
  }

  // ── Read operations ──────────────────────────────────────────────────────

  getAllThreats(filters?: { scope?: ThreatScope; severity?: SeverityLevel; category?: ThreatCategory }): StoredThreat[] {
    let query = "SELECT * FROM ingested_threats WHERE 1=1";
    const params: any[] = [];
    if (filters?.scope)    { query += " AND scope = ?";    params.push(filters.scope); }
    if (filters?.severity) { query += " AND severity = ?"; params.push(filters.severity); }
    if (filters?.category) { query += " AND category = ?"; params.push(filters.category); }
    query += " ORDER BY CASE scope WHEN 'local' THEN 0 WHEN 'regional' THEN 1 ELSE 2 END, CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";
    const rows = sqlite.prepare(query).all(...params) as any[];
    return rows.map(this.deserializeThreat);
  }

  getThreat(id: string): StoredThreat | null {
    const row = sqlite.prepare("SELECT * FROM ingested_threats WHERE id = ?").get(id) as any;
    return row ? this.deserializeThreat(row) : null;
  }

  getAllStances(unacknowledgedOnly = false): StoredStance[] {
    let query = "SELECT * FROM defensive_stances";
    if (unacknowledgedOnly) query += " WHERE acknowledged = 0";
    query += " ORDER BY CASE overall_risk WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";
    const rows = sqlite.prepare(query).all() as any[];
    return rows.map(this.deserializeStance);
  }

  getStanceByThreatId(threatId: string): StoredStance | null {
    const row = sqlite.prepare("SELECT * FROM defensive_stances WHERE threat_id = ?").get(threatId) as any;
    return row ? this.deserializeStance(row) : null;
  }

  acknowledgeStance(threatId: string, acknowledgedBy = "CISO"): StoredStance | null {
    sqlite.prepare(`
      UPDATE defensive_stances SET acknowledged = 1, acknowledged_at = ?, acknowledged_by = ?
      WHERE threat_id = ?
    `).run(new Date().toISOString(), acknowledgedBy, threatId);
    return this.getStanceByThreatId(threatId);
  }

  getPipelineRuns(limit = 10): any[] {
    return sqlite.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT ?").all(limit) as any[];
  }

  getLastRun(): any | null {
    return sqlite.prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 1").get() ?? null;
  }

  /** Summary stats for dashboard KPIs */
  getStats() {
    const total = (sqlite.prepare("SELECT COUNT(*) as n FROM ingested_threats").get() as any)?.n ?? 0;
    const local = (sqlite.prepare("SELECT COUNT(*) as n FROM ingested_threats WHERE scope='local'").get() as any)?.n ?? 0;
    const regional = (sqlite.prepare("SELECT COUNT(*) as n FROM ingested_threats WHERE scope='regional'").get() as any)?.n ?? 0;
    const global = (sqlite.prepare("SELECT COUNT(*) as n FROM ingested_threats WHERE scope='global'").get() as any)?.n ?? 0;
    const critical = (sqlite.prepare("SELECT COUNT(*) as n FROM ingested_threats WHERE severity='critical'").get() as any)?.n ?? 0;
    const unacked = (sqlite.prepare("SELECT COUNT(*) as n FROM defensive_stances WHERE acknowledged=0").get() as any)?.n ?? 0;
    const totalPostureDelta = (sqlite.prepare("SELECT SUM(posture_delta) as s FROM defensive_stances WHERE acknowledged=0").get() as any)?.s ?? 0;
    const lastRun = this.getLastRun();
    return { total, local, regional, global, critical, unacked, totalPostureDelta, lastRun };
  }

  // ── Write operations ──────────────────────────────────────────────────────

  private storeThreat(t: IngestedThreat) {
    sqlite.prepare(`
      INSERT INTO ingested_threats
        (id, scope, category, title, summary, source, source_url, published_at,
         affected_sectors, iocs, ttps, severity, region, threat_actor, cve_ids,
         ingested_at, pipeline_version)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      t.id, t.scope, t.category, t.title, t.summary, t.source, t.sourceUrl,
      t.publishedAt, JSON.stringify(t.affectedSectors), JSON.stringify(t.iocs),
      JSON.stringify(t.ttps), t.severity, t.region, t.threatActor ?? null,
      t.cveIds ? JSON.stringify(t.cveIds) : null, t.ingestedAt, this.version
    );
  }

  private updateThreat(t: IngestedThreat) {
    sqlite.prepare(`
      UPDATE ingested_threats SET
        summary=?, severity=?, iocs=?, ttps=?, threat_actor=?, cve_ids=?,
        ingested_at=?, pipeline_version=?
      WHERE id=?
    `).run(
      t.summary, t.severity, JSON.stringify(t.iocs), JSON.stringify(t.ttps),
      t.threatActor ?? null, t.cveIds ? JSON.stringify(t.cveIds) : null,
      new Date().toISOString(), this.version, t.id
    );
  }

  private upsertStance(s: DefensiveStance) {
    sqlite.prepare(`
      INSERT INTO defensive_stances
        (threat_id, generated_at, overall_risk, summary, affected_controls,
         playbook, mitigations, agent_actions, posture_delta, acknowledged)
      VALUES (?,?,?,?,?,?,?,?,?,0)
      ON CONFLICT(threat_id) DO UPDATE SET
        generated_at=excluded.generated_at, overall_risk=excluded.overall_risk,
        summary=excluded.summary, affected_controls=excluded.affected_controls,
        playbook=excluded.playbook, mitigations=excluded.mitigations,
        agent_actions=excluded.agent_actions, posture_delta=excluded.posture_delta
    `).run(
      s.threatId, s.generatedAt, s.overallRisk, s.summary,
      JSON.stringify(s.affectedControls), JSON.stringify(s.playbook),
      JSON.stringify(s.mitigations), JSON.stringify(s.agentActions),
      s.postureDelta
    );
  }

  private deserializeThreat(row: any): StoredThreat {
    return {
      id: row.id,
      scope: row.scope,
      category: row.category,
      title: row.title,
      summary: row.summary,
      source: row.source,
      sourceUrl: row.source_url,
      publishedAt: row.published_at,
      affectedSectors: JSON.parse(row.affected_sectors ?? "[]"),
      iocs: JSON.parse(row.iocs ?? "[]"),
      ttps: JSON.parse(row.ttps ?? "[]"),
      severity: row.severity,
      region: row.region,
      threatActor: row.threat_actor ?? undefined,
      cveIds: row.cve_ids ? JSON.parse(row.cve_ids) : undefined,
      ingestedAt: row.ingested_at,
      pipelineVersion: row.pipeline_version,
    };
  }

  private deserializeStance(row: any): StoredStance {
    return {
      threatId: row.threat_id,
      generatedAt: row.generated_at,
      overallRisk: row.overall_risk,
      summary: row.summary,
      affectedControls: JSON.parse(row.affected_controls ?? "[]"),
      playbook: JSON.parse(row.playbook ?? "[]"),
      mitigations: JSON.parse(row.mitigations ?? "[]"),
      agentActions: JSON.parse(row.agent_actions ?? "[]"),
      postureDelta: row.posture_delta,
      acknowledged: row.acknowledged === 1,
      acknowledgedAt: row.acknowledged_at ?? null,
      acknowledgedBy: row.acknowledged_by ?? null,
    };
  }
}

// ── Singleton + auto-seed ────────────────────────────────────────────────────

export const pipeline = new ThreatIngestionPipeline();

// Seed the pipeline with all 21 known June 2026 threats on first run
const existing = pipeline.getAllThreats();
if (existing.length === 0) {
  console.log("[ThreatIngestion] Seeding pipeline with June 2026 threat intelligence...");
  const result = pipeline.ingest(SEED_THREATS, "CyberNews-2026-06");
  console.log(`[ThreatIngestion] Seeded: ${result.threatsNew} new threats, ${result.stancesGenerated} stances generated in ${result.durationMs}ms`);
}
