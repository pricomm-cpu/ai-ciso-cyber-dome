import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, Header, Footer,
  UnderlineType
} from "docx";
import { writeFileSync } from "fs";

const BRAND_TEAL = "00B4CC";
const DARK_BG = "0D1520";
const MID_GRAY = "4A5568";
const LIGHT_GRAY = "F7FAFC";
const TEXT_DARK = "1A202C";
const WHITE = "FFFFFF";

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: BRAND_TEAL, font: "Calibri" })],
    spacing: { before: 480, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND_TEAL, space: 4 } },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: DARK_BG, font: "Calibri" })],
    spacing: { before: 360, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: "2D3748", font: "Calibri" })],
    spacing: { before: 240, after: 80 },
  });
}

function para(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Calibri", color: TEXT_DARK, ...options })],
    spacing: { before: 80, after: 80 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 19, font: "Calibri", color: TEXT_DARK })],
    bullet: { level },
    spacing: { before: 40, after: 40 },
  });
}

function note(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: "Calibri", color: "718096", italics: true })],
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_TEAL, space: 8 } },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTable(headers, rows, colWidths) {
  const headerCells = headers.map((h, i) =>
    new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri", color: WHITE })],
        spacing: { before: 60, after: 60 },
      })],
      shading: { fill: DARK_BG, type: ShadingType.CLEAR, color: "auto" },
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
    })
  );

  const tableRows = [
    new TableRow({ children: headerCells, tableHeader: true }),
    ...rows.map((row, ri) =>
      new TableRow({
        children: row.map((cell, ci) =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: cell, size: 18, font: "Calibri", color: TEXT_DARK })],
              spacing: { before: 40, after: 40 },
            })],
            shading: ri % 2 === 1 ? { fill: LIGHT_GRAY, type: ShadingType.CLEAR, color: "auto" } : undefined,
            width: colWidths ? { size: colWidths[ci], type: WidthType.PERCENTAGE } : undefined,
          })
        ),
      })
    ),
  ];

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Build document ────────────────────────────────────────────────────────

const doc = new Document({
  creator: "AI CISO — Cyber Dome Platform",
  title: "AI CISO Platform — Product Specification Document",
  description: "Full platform specification for Cyber Dome: Autonomous AI CISO for SMBs",
  sections: [{
    properties: {},
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "AI CISO — Cyber Dome Platform  |  Confidential", size: 16, font: "Calibri", color: MID_GRAY }),
          ],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "© 2026 Cyber Dome. Built with zero SI dependency. ", size: 16, font: "Calibri", color: MID_GRAY }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: [
      // ── COVER ──────────────────────────────────────────────────────────────
      new Paragraph({
        children: [
          new TextRun({ text: "AI CISO", bold: true, size: 80, font: "Calibri", color: BRAND_TEAL }),
        ],
        spacing: { before: 1440, after: 160 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Cyber Dome Platform", bold: true, size: 48, font: "Calibri", color: DARK_BG })],
        spacing: { after: 200 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Product Specification Document", size: 28, font: "Calibri", color: MID_GRAY, italics: true })],
        spacing: { after: 120 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Version 1.0  ·  June 2026  ·  Confidential", size: 20, font: "Calibri", color: MID_GRAY })],
        spacing: { after: 800 },
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Autonomous Security Leadership for SMBs — No MSP Required. No SI Required. No Vendor Meeting Required.", size: 22, font: "Calibri", color: DARK_BG, bold: true })],
        spacing: { after: 80 },
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: BRAND_TEAL, space: 4 },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_TEAL, space: 4 },
        },
      }),
      pageBreak(),

      // ── 1. EXECUTIVE SUMMARY ───────────────────────────────────────────────
      h1("1. Executive Summary"),
      para("The AI CISO Platform — branded Cyber Dome — is a purpose-built agentic AI system that functions as a fully operational Chief Information Security Officer (CISO) for small and mid-sized businesses (SMBs) with 10–200 employees."),
      para("It eliminates the dependency on Systems Integrators (SIs), Managed Security Service Providers (MSSPs), and vendor sales representatives by autonomously performing threat detection, compliance auditing, vulnerability management, incident response, technology stack assessment, and board reporting."),
      note("Core philosophy: the CISO should be able to onboard, configure, and operate every aspect of their cybersecurity programme independently — without scheduling a vendor meeting, engaging a consultant, or contracting a systems integrator."),
      para("The platform delivers:"),
      bullet("Autonomous 8-agent AI swarm operating 24/7"),
      bullet("29-product connector marketplace with AI-generated vendor verdicts"),
      bullet("200-question security posture assessment (10 categories)"),
      bullet("Real-time threat, compliance, and incident dashboards"),
      bullet("Board-ready reporting generated without human input"),
      bullet("Zero-code technology stack refresh recommendations"),

      pageBreak(),

      // ── 2. PROBLEM STATEMENT ───────────────────────────────────────────────
      h1("2. Problem Statement"),
      h2("2.1 The SMB Security Gap"),
      para("SMBs face sophisticated cyber threats previously reserved for enterprises, but lack the budget and personnel to hire a full-time CISO (AUD $250,000–$400,000/year). The traditional response — engaging SIs, MSSPs, or vCISO consultants — introduces:"),
      bullet("Long sales cycles and vendor lock-in"),
      bullet("High consulting fees for basic security hygiene work"),
      bullet("Dependency on external parties for day-to-day security decisions"),
      bullet("Delays in threat response while waiting for partner availability"),
      bullet("Lack of institutional knowledge when consultant engagements end"),
      h2("2.2 The Systems Integrator Bottleneck"),
      para("Even CISOs who are hired within organisations face a painful dependency on SIs and MSPs for:"),
      bullet("Tool procurement and vendor comparison"),
      bullet("Technology integration and configuration"),
      bullet("Compliance evidence collection and audit preparation"),
      bullet("Incident response playbook execution"),
      para("Cyber Dome eliminates this bottleneck by embedding the SI's capabilities directly into the platform as automated AI agents."),

      pageBreak(),

      // ── 3. PLATFORM OVERVIEW ───────────────────────────────────────────────
      h1("3. Platform Overview"),
      h2("3.1 Core Modules"),
      makeTable(
        ["Module", "Description", "Key Actions"],
        [
          ["Command Centre", "Real-time security operations dashboard", "View KPIs, risk score, recent threats, AI actions log"],
          ["Threat Monitor", "Live threat feed with CVE correlation", "Triage threats, update status, view AI recommendations"],
          ["Compliance", "Multi-framework compliance tracker", "Monitor controls, update evidence, view gap analysis"],
          ["Tech Stack", "EOL detection and refresh advisor", "View asset inventory, AI-scored refresh priorities, vendor alternatives"],
          ["Incidents", "Incident lifecycle management", "Create incidents, advance phases, generate playbooks"],
          ["Posture Assessment", "200-question security assessment", "Answer questions, view category scores, track improvement"],
          ["Board Report", "AI-authored executive reports", "View auto-generated narrative, key risks, action items"],
          ["Connector Marketplace", "29-product vendor comparison engine", "Filter by category, read AI verdicts, connect tools"],
          ["Agent Swarm", "8-agent autonomous AI operations", "Monitor agents, trigger on-demand runs, view outputs"],
        ],
        [30, 35, 35]
      ),

      h2("3.2 Zero-SI Design Principles"),
      para("Every module is designed to replace a function previously dependent on external parties:"),
      makeTable(
        ["Traditional Dependency", "Replaced By"],
        [
          ["SI for tool selection", "Connector Marketplace with AI verdicts — no sales call needed"],
          ["MSSP for threat monitoring", "Threat Hunter agent — runs continuously, 24/7"],
          ["Consultant for compliance audit", "Compliance Auditor agent — monitors all controls automatically"],
          ["vCISO for board reporting", "Board Reporter agent — generates executive narrative on demand"],
          ["SI for technology refresh", "Tech Stack Assessor agent — EOL tracking with vendor recommendations"],
          ["Vendor for incident playbook", "Incident Responder agent — generates playbook from incident data"],
        ],
        [50, 50]
      ),

      pageBreak(),

      // ── 4. AGENT SWARM ─────────────────────────────────────────────────────
      h1("4. Agent Swarm Architecture"),
      h2("4.1 Overview"),
      para("The platform operates an autonomous swarm of 8 specialised AI agents. Each agent runs continuously, is triggered by events, and can also be triggered on-demand. All agents share data through the platform's unified data store, enabling cross-agent intelligence."),
      para("2,427 agent runs were logged in the demo environment within a single day, illustrating the autonomous operational tempo."),
      h2("4.2 Agent Catalogue"),
      makeTable(
        ["Agent", "Domain", "Key Capabilities", "Triggers"],
        [
          ["Threat Hunter", "Threat Intelligence", "CVE correlation, IOC matching, threat feed ingestion, dark web credential monitoring", "New CVE, EDR alert, IOC match"],
          ["Compliance Auditor", "GRC", "Control monitoring, evidence collection, gap analysis, framework mapping", "Config change, daily schedule"],
          ["Vulnerability Manager", "Vulnerability Mgmt", "CVE scoring, EPSS integration, patch prioritisation, asset-CVE mapping", "NVD update, asset change"],
          ["Incident Responder", "Incident Response", "Playbook generation, phase tracking, root cause analysis, comms drafting", "Incident created, phase change"],
          ["Tech Stack Assessor", "Technology Risk", "EOL tracking, CVE-to-product mapping, vendor comparison, cost optimisation", "EOL announcement, monthly review"],
          ["Board Reporter", "Executive Comms", "Executive narrative, KPI summarisation, risk trend analysis, action prioritisation", "End of quarter, major incident"],
          ["Vendor Scout", "Procurement", "Gap-to-product mapping, SMB fit scoring, price comparison, integration compatibility", "Assessment gap identified"],
          ["Posture Scorer", "Risk Aggregation", "Multi-source risk aggregation, score trending, benchmark comparison, what-if scenarios", "Any agent output, hourly"],
        ],
        [15, 15, 40, 30]
      ),

      pageBreak(),

      // ── 5. CONNECTOR MARKETPLACE ───────────────────────────────────────────
      h1("5. Connector Marketplace"),
      h2("5.1 Overview"),
      para("The Connector Marketplace provides a curated catalogue of 29 pre-integrated cybersecurity products across 13 categories. The AI CISO analyses each organisation's security gaps, compliance requirements, and budget profile to generate an AI Verdict — a ranked recommendation of which connectors to activate, without requiring vendor engagement."),
      h2("5.2 Connector Catalogue"),
      makeTable(
        ["Category", "Products", "SMB Fit"],
        [
          ["EDR / Endpoint", "CrowdStrike Falcon, SentinelOne Singularity, Microsoft Defender for Business", "High (MS Defender)"],
          ["Identity & Access", "Okta Workforce Identity, Microsoft Entra ID (Azure AD), 1Password Teams", "High (1Password, Entra)"],
          ["SIEM / Monitoring", "Microsoft Sentinel, Splunk Enterprise Security, Elastic SIEM, AWS GuardDuty", "Medium"],
          ["XDR / SOC", "Palo Alto Cortex XDR", "Medium (Enterprise)"],
          ["Vulnerability Mgmt", "Tenable / Nessus, Intruder", "High (Intruder)"],
          ["Application Security", "Snyk, Semgrep, GitGuardian, HashiCorp Vault", "High (Snyk, GitGuardian)"],
          ["Network Security", "Cloudflare Gateway, Tailscale", "High (both free tiers)"],
          ["Email Security", "Proofpoint Essentials", "Medium"],
          ["Security Awareness", "KnowBe4", "High"],
          ["Compliance Automation", "Vanta, Drata", "High (Vanta)"],
          ["Cloud Security", "Wiz, Lacework", "Medium"],
          ["Incident Response", "PagerDuty, Slack", "High (both)"],
          ["Ticketing / Workflow", "Jira, ServiceNow", "High (Jira)"],
        ],
        [25, 45, 30]
      ),
      note("AI Verdict engine analyses assessment gaps, connected tool coverage, and pricing to surface the highest-priority connectors for each organisation — no vendor sales call required."),

      pageBreak(),

      // ── 6. POSTURE ASSESSMENT ──────────────────────────────────────────────
      h1("6. Security Posture Assessment"),
      h2("6.1 Overview"),
      para("The 200-question Security Posture Assessment is the cornerstone of the platform's gap analysis capability. It is based on the ClearPosture framework, expanded from 100 to 200 questions across 10 categories."),
      para("Each question includes: the question text, weight (High/Medium/Low), AI explanation of why it matters, and a specific remediation recommendation with tool references — all delivered without needing to speak to a consultant."),
      h2("6.2 Assessment Categories"),
      makeTable(
        ["Category", "Questions", "Coverage"],
        [
          ["Identity & Access Management", "26", "MFA, SSO, PAM, JIT access, service accounts"],
          ["Devices & Endpoints", "22", "EDR, MDM, BYOD, patch management, encryption"],
          ["Data & Cloud Security", "26", "DLP, S3 security, cloud config, backup, CASB"],
          ["Network & Email Security", "22", "Firewall, DNS filtering, email auth, VPN, segmentation"],
          ["Application & Software Security", "20", "SAST/DAST, dependency scanning, secrets management, WAF"],
          ["AI & Emerging Technology Security", "16", "LLM governance, data poisoning, AI vendor risk, model access controls"],
          ["Third-Party & Supply Chain Risk", "14", "Vendor assessments, contract clauses, API security, SaaS reviews"],
          ["Policies, Governance & Compliance", "14", "Security policy framework, ISMS, board reporting, audit readiness"],
          ["Ransomware & Business Continuity", "20", "Backup testing, IR planning, RTO/RPO, tabletop exercises"],
          ["Physical & Operational Security", "20", "Office security, CCTV, clean desk, visitor management, data centre"],
        ],
        [40, 15, 45]
      ),
      h2("6.3 Scoring Model"),
      bullet("High-weight questions score 3 points (Yes) / 1.5 points (Partial) / 0 points (No)"),
      bullet("Medium-weight questions score 2 points (Yes) / 1 point (Partial) / 0 points (No)"),
      bullet("Low-weight questions score 1 point (Yes) / 0.5 points (Partial) / 0 points (No)"),
      bullet("Category scores are calculated independently and aggregated to an overall posture percentage"),
      bullet("Scores feed directly into the Posture Scorer agent for continuous trending"),

      pageBreak(),

      // ── 7. TECHNOLOGY STACK ────────────────────────────────────────────────
      h1("7. Technology Stack"),
      h2("7.1 Architecture"),
      makeTable(
        ["Layer", "Technology", "Purpose"],
        [
          ["Frontend", "React 18 + TypeScript", "SPA with hash-based routing (wouter)"],
          ["UI Components", "shadcn/ui + Radix + Tailwind CSS v3", "Accessible component library with dark theme"],
          ["State Management", "TanStack Query v5", "Server state, caching, mutations"],
          ["Backend", "Express.js (Node.js)", "REST API server on port 5000"],
          ["Database", "SQLite via better-sqlite3 + Drizzle ORM", "Persistent on-disk storage, synchronous queries"],
          ["Build Tool", "Vite 7 + esbuild", "Frontend bundler + server bundler"],
          ["Language", "TypeScript (end-to-end)", "Type-safe frontend and backend"],
          ["Charts", "Recharts", "Data visualisation in dashboard"],
          ["Icons", "Lucide React + react-icons/si", "Action icons and vendor brand logos"],
        ],
        [20, 35, 45]
      ),
      h2("7.2 Data Schema"),
      makeTable(
        ["Table", "Key Fields", "Purpose"],
        [
          ["organisations", "id, name, domain, industry, size, country", "Tenant record"],
          ["threats", "id, orgId, title, description, severity, status, affectedAssets, aiRecommendation", "Threat log"],
          ["complianceItems", "id, orgId, framework, control, description, status, evidence, dueDate", "Compliance controls"],
          ["techAssets", "id, orgId, name, vendor, version, eolDate, riskScore, aiAssessment", "Technology inventory"],
          ["incidents", "id, orgId, title, severity, phase, playbook, timeline, rootCause", "Incident log"],
          ["boardReports", "id, orgId, period, riskScore, executiveSummary, keyRisks, actionItems", "Board reports"],
          ["assessmentResponses", "id, orgId, questionId, answer, notes, updatedAt", "Assessment answers (upsert)"],
          ["connectorStates", "id, orgId, connectorId, connected, connectedAt", "Connector activation state"],
        ],
        [20, 45, 35]
      ),
      h2("7.3 API Endpoints"),
      makeTable(
        ["Method", "Endpoint", "Description"],
        [
          ["GET", "/api/threats", "List all threats for org"],
          ["PATCH", "/api/threats/:id/status", "Update threat status"],
          ["GET", "/api/compliance", "List compliance controls"],
          ["PATCH", "/api/compliance/:id", "Update control status/evidence"],
          ["GET", "/api/tech-assets", "List technology assets"],
          ["POST/PATCH", "/api/tech-assets", "Create or update asset"],
          ["GET", "/api/incidents", "List incidents"],
          ["POST", "/api/incidents", "Create incident"],
          ["PATCH", "/api/incidents/:id/phase", "Advance incident phase"],
          ["GET", "/api/board-reports", "List board reports"],
          ["GET", "/api/assessment/questions", "All 200 assessment questions"],
          ["GET", "/api/assessment/responses", "Org's saved responses"],
          ["POST", "/api/assessment/respond", "Upsert answer for question"],
          ["GET", "/api/assessment/score", "Calculated scores by category"],
          ["GET", "/api/connectors", "All 29 connectors with connection state"],
          ["POST", "/api/connectors/:id/toggle", "Toggle connector connection"],
          ["GET", "/api/agents", "All 8 agents with status"],
          ["POST", "/api/agents/:id/run", "Trigger agent run (returns output)"],
        ],
        [12, 38, 50]
      ),

      pageBreak(),

      // ── 8. SECURITY & DESIGN ───────────────────────────────────────────────
      h1("8. Design System & UX"),
      h2("8.1 Visual Identity"),
      makeTable(
        ["Token", "Value", "Usage"],
        [
          ["Background", "#0D1520 (HSL 220 20% 6%)", "Primary app background"],
          ["Card", "#111827 (HSL 222 20% 10%)", "Module cards and sidepanels"],
          ["Primary / Accent", "#00B4CC (HSL 192 100% 42%)", "Cyan — CTAs, active states, AI elements"],
          ["Severity: Critical", "#EF4444 (Red 500)", "Critical threat/compliance badges"],
          ["Severity: High", "#F97316 (Orange 500)", "High severity indicators"],
          ["Severity: Medium", "#EAB308 (Yellow 500)", "Medium severity indicators"],
          ["Font: Interface", "Inter (Variable)", "UI labels, body text"],
          ["Font: Monospace", "IBM Plex Mono", "Code, scores, technical data"],
        ],
        [20, 30, 50]
      ),
      h2("8.2 UX Principles"),
      bullet("Zero-SI messaging embedded in every module header — reinforces the platform's core value proposition"),
      bullet("Progressive disclosure — complex agent and connector details expand on demand"),
      bullet("Real-time loading states — skeleton loaders during data fetch, mutation pending states on all actions"),
      bullet("Mobile-responsive sidebar — collapses on mobile with hamburger toggle, full desktop sidebar on lg+"),
      bullet("Consistent badge system — severity and status badges use semantic colour consistently across all modules"),
      bullet("data-testid attributes on all interactive and meaningful elements for automated QA"),

      pageBreak(),

      // ── 9. ROADMAP ─────────────────────────────────────────────────────────
      h1("9. Product Roadmap"),
      h2("Phase 1 — MVP (Current)"),
      bullet("All 9 core modules deployed and functional"),
      bullet("8-agent swarm with on-demand triggering"),
      bullet("29-connector marketplace with AI verdicts"),
      bullet("200-question assessment framework"),
      bullet("SQLite persistence, single-tenant"),
      h2("Phase 2 — Integration"),
      bullet("Live API integration with connectors (CrowdStrike, Okta, Microsoft Sentinel APIs)"),
      bullet("Real-time threat intelligence feeds (NVD, CISA KEV, MITRE ATT&CK)"),
      bullet("Email/Slack notifications for critical severity events"),
      bullet("PDF export for board reports"),
      bullet("Multi-tenant support with organisation switching"),
      h2("Phase 3 — AI Enhancement"),
      bullet("GPT-4 / Claude integration for dynamic playbook generation"),
      bullet("Natural language query interface — \"What are my top 3 risks this month?\""),
      bullet("Automated evidence collection from connected APIs"),
      bullet("Vendor price comparison via live API pricing feeds"),
      bullet("Custom assessment question builder for industry-specific frameworks"),
      h2("Phase 4 — Enterprise"),
      bullet("SSO/SAML authentication"),
      bullet("Role-based access (CISO, Security Analyst, Board viewer)"),
      bullet("Audit log and change history"),
      bullet("API for third-party integrations"),
      bullet("White-label deployment for MSSPs"),

      pageBreak(),

      // ── 10. COMPETITIVE POSITIONING ────────────────────────────────────────
      h1("10. Competitive Positioning"),
      makeTable(
        ["Platform", "Approach", "Weakness vs Cyber Dome"],
        [
          ["Traditional vCISO", "Human consultant, part-time engagement", "Slow, expensive, unavailable 24/7, SI-dependent"],
          ["MSSP", "Managed service, outsourced SOC", "Expensive, opaque, no CISO-level strategic guidance"],
          ["SecurityScorecard", "Passive posture scoring only", "No active remediation, no agent automation"],
          ["Vanta/Drata", "Compliance automation only", "No threat detection, no incident response"],
          ["Microsoft Sentinel", "SIEM only, requires Azure expertise", "Complex setup, requires SI, no SMB UX"],
          ["Cyber Dome (AI CISO)", "End-to-end autonomous AI CISO", "Zero SI dependency, SMB-native, 8 AI agents, 29 connectors, board-ready"],
        ],
        [22, 35, 43]
      ),

      pageBreak(),

      // ── 11. GLOSSARY ───────────────────────────────────────────────────────
      h1("11. Glossary"),
      makeTable(
        ["Term", "Definition"],
        [
          ["CISO", "Chief Information Security Officer — senior executive responsible for an organisation's information security strategy"],
          ["SI", "Systems Integrator — third-party firm engaged to implement, integrate, and manage technology systems"],
          ["MSSP", "Managed Security Service Provider — outsourced provider of security monitoring and management"],
          ["EDR", "Endpoint Detection & Response — security software detecting and responding to threats on endpoints"],
          ["SIEM", "Security Information & Event Management — centralised log collection and threat correlation platform"],
          ["IOC", "Indicator of Compromise — forensic evidence that a breach has occurred (IP, hash, domain, etc.)"],
          ["CVE", "Common Vulnerabilities and Exposures — publicly disclosed cybersecurity vulnerabilities"],
          ["EPSS", "Exploit Prediction Scoring System — probability score for CVE exploitation in the wild"],
          ["GRC", "Governance, Risk & Compliance — framework for managing governance, risk management, and regulatory compliance"],
          ["EOL", "End of Life — date after which a product no longer receives security patches"],
          ["Zero-SI", "Cyber Dome's design philosophy: every feature delivers value without SI engagement"],
        ],
        [25, 75]
      ),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("/home/user/workspace/ai-ciso-cyber-dome-spec.docx", buffer);
console.log("Spec document written: ai-ciso-cyber-dome-spec.docx");
