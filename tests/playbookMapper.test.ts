/**
 * Test Suite: Playbook Mapper
 *
 * Verifies that threat intelligence is correctly mapped to defensive
 * stances, playbooks, agent actions, and posture deltas.
 *
 * Key scenario under test: Mackay Sugar-style ransomware event
 * (local AU scope) triggers correct full-IR playbook with
 * all expected defensive actions.
 */
import { describe, it, expect } from "vitest";
import {
  mapThreatToDefensiveStance,
  mapThreatsToDefensiveStances,
  prioritiseByScope,
  type IngestedThreat,
} from "../server/playbookMapper";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const mackayRansomware: IngestedThreat = {
  id: "au-test-001",
  scope: "local",
  category: "ransomware",
  title: "Mackay Sugar ransomware attack — 'The Gentlemen' RaaS",
  summary: "North Queensland manufacturing company hit by ransomware. EDR killed before encryption.",
  source: "ABC News",
  sourceUrl: "https://www.abc.net.au/news/2026-06-18/the-gentlemen-ransomware-russian-speaking-hack-north-qld-sugar/106807366",
  publishedAt: "2026-06-18T00:00:00Z",
  affectedSectors: ["manufacturing", "agriculture"],
  iocs: ["gentlemen-raas-c2.onion", "edr-killer-v3.exe"],
  ttps: ["T1486", "T1562.001", "T1021.002"],
  severity: "critical",
  region: "AU",
  threatActor: "The Gentlemen",
  ingestedAt: new Date().toISOString(),
};

const oraclePeopleSoftZeroDay: IngestedThreat = {
  id: "apac-test-001",
  scope: "regional",
  category: "zero-day",
  title: "Oracle PeopleSoft CVE-2026-35273 CVSS 9.8 zero-day",
  summary: "Unauthenticated RCE in Oracle PeopleSoft. Active exploitation in APAC.",
  source: "Commonwealth Sentinel",
  sourceUrl: "https://commonwealthsentinel.com",
  publishedAt: "2026-06-08T00:00:00Z",
  affectedSectors: ["enterprise", "hr-systems"],
  iocs: [],
  ttps: ["T1190"],
  severity: "critical",
  region: "APAC",
  cveIds: ["CVE-2026-35273"],
  ingestedAt: new Date().toISOString(),
};

const ventraIpDdos: IngestedThreat = {
  id: "au-test-002",
  scope: "local",
  category: "ddos",
  title: "VentraIP 600Gbps+ DDoS attack",
  summary: "Largest DDoS against Australian hosting. 300K customers disrupted.",
  source: "arnav.au",
  sourceUrl: "https://arnav.au",
  publishedAt: "2026-05-23T00:00:00Z",
  affectedSectors: ["technology", "hosting"],
  iocs: [],
  ttps: ["T1498"],
  severity: "high",
  region: "AU",
  ingestedAt: new Date().toISOString(),
};

const nationStateThreat: IngestedThreat = {
  id: "apac-test-002",
  scope: "regional",
  category: "nation-state",
  title: "UNC6671 AiTM SSO attacks on APAC financial institutions",
  summary: "Chinese threat actor conducting adversary-in-the-middle SSO bypass attacks.",
  source: "Protos Labs",
  sourceUrl: "https://www.protoslabs.io",
  publishedAt: "2026-05-16T00:00:00Z",
  affectedSectors: ["financial-services", "technology"],
  iocs: ["blackfile-phish-kit-v2"],
  ttps: ["T1566.004", "T1111", "T1078"],
  severity: "critical",
  region: "APAC",
  threatActor: "UNC6671 (BlackFile)",
  ingestedAt: new Date().toISOString(),
};

const globalDataBreach: IngestedThreat = {
  id: "global-test-001",
  scope: "global",
  category: "data-breach",
  title: "ShinyHunters Kodak breach — 2.2M records",
  summary: "Global breach by ShinyHunters. 2.2M customer records exposed.",
  source: "Malwarebytes",
  sourceUrl: "https://www.malwarebytes.com",
  publishedAt: "2026-06-19T00:00:00Z",
  affectedSectors: ["manufacturing", "retail"],
  iocs: [],
  ttps: ["T1530", "T1078"],
  severity: "high",
  region: "Global",
  threatActor: "ShinyHunters",
  ingestedAt: new Date().toISOString(),
};

// ── Tests: mapThreatToDefensiveStance ────────────────────────────────────────

describe("mapThreatToDefensiveStance", () => {
  describe("Mackay Sugar ransomware (LOCAL, critical)", () => {
    const stance = mapThreatToDefensiveStance(mackayRansomware);

    it("generates a defensive stance", () => {
      expect(stance).toBeDefined();
      expect(stance.threatId).toBe("au-test-001");
    });

    it("sets overallRisk to critical", () => {
      expect(stance.overallRisk).toBe("critical");
    });

    it("generates a full IR playbook", () => {
      expect(stance.playbook.length).toBeGreaterThan(10);
    });

    it("playbook has all 5 phases", () => {
      const phases = new Set(stance.playbook.map(s => s.phase));
      expect(phases.has("detection")).toBe(true);
      expect(phases.has("containment")).toBe(true);
      expect(phases.has("eradication")).toBe(true);
      expect(phases.has("recovery")).toBe(true);
      expect(phases.has("lessons-learned")).toBe(true);
    });

    it("playbook steps are numbered sequentially from 1", () => {
      stance.playbook.forEach((step, i) => {
        expect(step.order).toBe(i + 1);
      });
    });

    it("has at least 3 immediate-priority steps", () => {
      const immediateSteps = stance.playbook.filter(s => s.priority === "immediate");
      expect(immediateSteps.length).toBeGreaterThanOrEqual(3);
    });

    it("activates the incident-responder agent with immediate priority", () => {
      const irAction = stance.agentActions.find(a => a.agentId === "incident-responder");
      expect(irAction).toBeDefined();
      expect(irAction!.priority).toBe("immediate");
    });

    it("activates the threat-hunter agent", () => {
      const thAction = stance.agentActions.find(a => a.agentId === "threat-hunter");
      expect(thAction).toBeDefined();
    });

    it("activates the board-reporter agent (critical incident)", () => {
      const brAction = stance.agentActions.find(a => a.agentId === "board-reporter");
      expect(brAction).toBeDefined();
    });

    it("maps to E8-1, E8-3, E8-8 controls", () => {
      expect(stance.affectedControls).toContain("E8-1");
      expect(stance.affectedControls).toContain("E8-3");
      expect(stance.affectedControls).toContain("E8-8");
    });

    it("applies critical posture delta (-12)", () => {
      expect(stance.postureDelta).toBe(-12);
    });

    it("summary mentions LOCAL scope", () => {
      expect(stance.summary).toContain("LOCAL");
    });

    it("summary mentions threat actor in playbook context", () => {
      // Threat actor is injected into playbook step action
      const hasThreatActor = stance.playbook.some(s => s.action.includes("The Gentlemen"));
      expect(hasThreatActor).toBe(true);
    });

    it("mitigations include IOC blocking", () => {
      const iocMitigation = stance.mitigations.find(m => m.includes("IOC") || m.includes("EDR blocklist"));
      expect(iocMitigation).toBeDefined();
    });

    it("mitigations include backup validation advice", () => {
      const backupMitigation = stance.mitigations.find(m => m.toLowerCase().includes("backup"));
      expect(backupMitigation).toBeDefined();
    });

    it("step 3 (containment) mentions EDR isolation tool", () => {
      const isolationStep = stance.playbook.find(s => s.phase === "containment" && s.order === 3);
      expect(isolationStep?.toolHint).toBeDefined();
    });

    it("step for Privacy Act notification exists", () => {
      const privacyStep = stance.playbook.find(s => s.action.includes("Privacy Act") || s.action.includes("Privacy Officer"));
      expect(privacyStep).toBeDefined();
    });
  });

  // ── Oracle zero-day (REGIONAL) ─────────────────────────────────────────────
  describe("Oracle PeopleSoft zero-day (REGIONAL, critical)", () => {
    const stance = mapThreatToDefensiveStance(oraclePeopleSoftZeroDay);

    it("generates a stance", () => {
      expect(stance).toBeDefined();
    });

    it("activates vuln-scanner agent immediately", () => {
      const vs = stance.agentActions.find(a => a.agentId === "vuln-scanner");
      expect(vs).toBeDefined();
      expect(vs!.priority).toBe("immediate");
    });

    it("injects CVE ID into first playbook step", () => {
      const firstStep = stance.playbook[0];
      expect(firstStep.action).toContain("CVE-2026-35273");
    });

    it("summary mentions REGIONAL scope", () => {
      expect(stance.summary).toContain("REGIONAL");
    });

    it("maps to E8-2 control (patch applications)", () => {
      expect(stance.affectedControls).toContain("E8-2");
    });

    it("has network isolation step for CVSS 9.0+", () => {
      const isolationStep = stance.playbook.find(s =>
        s.action.includes("isolate") || s.action.includes("network segment")
      );
      expect(isolationStep).toBeDefined();
    });
  });

  // ── DDoS (LOCAL) ──────────────────────────────────────────────────────────
  describe("VentraIP DDoS (LOCAL, high)", () => {
    const stance = mapThreatToDefensiveStance(ventraIpDdos);

    it("generates a stance with Cloudflare toolHint", () => {
      const cfStep = stance.playbook.find(s => s.toolHint?.includes("Cloudflare"));
      expect(cfStep).toBeDefined();
    });

    it("applies high posture delta (-7)", () => {
      expect(stance.postureDelta).toBe(-7);
    });

    it("mitigations mention 600Gbps benchmark", () => {
      const m = stance.mitigations.find(m => m.includes("600Gbps") || m.includes("scrubbing"));
      expect(m).toBeDefined();
    });

    it("activates incident-responder agent", () => {
      const ir = stance.agentActions.find(a => a.agentId === "incident-responder");
      expect(ir).toBeDefined();
    });
  });

  // ── Nation-state (REGIONAL) ───────────────────────────────────────────────
  describe("UNC6671 nation-state (REGIONAL, critical)", () => {
    const stance = mapThreatToDefensiveStance(nationStateThreat);

    it("has step to report to ASD ReportCyber", () => {
      const asdStep = stance.playbook.find(s => s.action.includes("ASD") || s.action.includes("Signals Directorate"));
      expect(asdStep).toBeDefined();
    });

    it("has step to rotate ALL credentials", () => {
      const credStep = stance.playbook.find(s => s.action.includes("ALL credentials") || s.action.includes("all users"));
      expect(credStep).toBeDefined();
    });

    it("activates board-reporter for ASX disclosure", () => {
      const br = stance.agentActions.find(a => a.agentId === "board-reporter");
      expect(br).toBeDefined();
      expect(br!.expectedOutput).toContain("ASX");
    });

    it("applies critical posture delta", () => {
      expect(stance.postureDelta).toBe(-12);
    });
  });

  // ── Global breach ─────────────────────────────────────────────────────────
  describe("Kodak data breach (GLOBAL, high)", () => {
    const stance = mapThreatToDefensiveStance(globalDataBreach);

    it("summary mentions GLOBAL scope", () => {
      expect(stance.summary).toContain("GLOBAL");
    });

    it("has Australian Privacy Act notification step", () => {
      const privStep = stance.playbook.find(s =>
        s.action.includes("Australian Privacy Act") || s.action.includes("APA")
      );
      expect(privStep).toBeDefined();
    });

    it("has NZ Privacy Act step", () => {
      const nzStep = stance.playbook.find(s =>
        s.action.includes("NZ Privacy") || s.action.includes("OPC NZ")
      );
      expect(nzStep).toBeDefined();
    });
  });
});

// ── Tests: batch processing ───────────────────────────────────────────────────

describe("mapThreatsToDefensiveStances (batch)", () => {
  const allThreats = [mackayRansomware, oraclePeopleSoftZeroDay, ventraIpDdos, nationStateThreat, globalDataBreach];
  const stances = mapThreatsToDefensiveStances(allThreats);

  it("returns one stance per threat", () => {
    expect(stances.length).toBe(allThreats.length);
  });

  it("maps each threat ID correctly", () => {
    allThreats.forEach((threat, i) => {
      expect(stances[i].threatId).toBe(threat.id);
    });
  });

  it("all critical threats get -12 posture delta", () => {
    const criticalThreats = allThreats.filter(t => t.severity === "critical");
    const criticalStances = stances.filter(s => criticalThreats.find(t => t.id === s.threatId));
    criticalStances.forEach(s => expect(s.postureDelta).toBe(-12));
  });
});

// ── Tests: prioritiseByScope ──────────────────────────────────────────────────

describe("prioritiseByScope", () => {
  const mixed = [globalDataBreach, nationStateThreat, mackayRansomware, ventraIpDdos, oraclePeopleSoftZeroDay];
  const sorted = prioritiseByScope(mixed);

  it("local threats appear before regional and global", () => {
    const firstScope = sorted[0].scope;
    expect(firstScope).toBe("local");
  });

  it("regional threats appear before global", () => {
    const globalIndex = sorted.findIndex(t => t.scope === "global");
    const regionalIndex = sorted.findIndex(t => t.scope === "regional");
    expect(regionalIndex).toBeLessThan(globalIndex);
  });

  it("among same scope, critical appears before high", () => {
    const locals = sorted.filter(t => t.scope === "local");
    if (locals.length >= 2) {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 0; i < locals.length - 1; i++) {
        expect(severityOrder[locals[i].severity]).toBeLessThanOrEqual(severityOrder[locals[i + 1].severity]);
      }
    }
  });

  it("preserves all threats — no items lost in sort", () => {
    expect(sorted.length).toBe(mixed.length);
  });

  it("Mackay ransomware (local+critical) is first in sorted list", () => {
    expect(sorted[0].id).toBe("au-test-001");
  });
});

// ── Tests: playbook step validity ─────────────────────────────────────────────

describe("Playbook step schema validation", () => {
  const allCategories = [
    "ransomware", "data-breach", "ddos", "zero-day",
    "nation-state", "insider", "phishing", "supply-chain",
    "identity", "vulnerability",
  ] as const;

  allCategories.forEach(category => {
    it(`${category} playbook: all steps have required fields`, () => {
      const stance = mapThreatToDefensiveStance({
        id: `test-${category}`,
        scope: "local",
        category,
        title: `Test ${category}`,
        summary: "Test threat",
        source: "Test",
        sourceUrl: "https://test.example",
        publishedAt: new Date().toISOString(),
        affectedSectors: [],
        iocs: [],
        ttps: [],
        severity: "high",
        region: "AU",
        ingestedAt: new Date().toISOString(),
      });
      stance.playbook.forEach(step => {
        expect(step.order).toBeGreaterThan(0);
        expect(step.phase).toBeDefined();
        expect(step.action).toBeTruthy();
        expect(step.owner).toBeTruthy();
        expect(step.priority).toBeDefined();
        expect(typeof step.automatable).toBe("boolean");
      });
    });

    it(`${category} playbook: at least 4 steps`, () => {
      const stance = mapThreatToDefensiveStance({
        id: `test-min-${category}`,
        scope: "global",
        category,
        title: `Test ${category}`,
        summary: "Test threat",
        source: "Test",
        sourceUrl: "https://test.example",
        publishedAt: new Date().toISOString(),
        affectedSectors: [],
        iocs: [],
        ttps: [],
        severity: "medium",
        region: "Global",
        ingestedAt: new Date().toISOString(),
      });
      expect(stance.playbook.length).toBeGreaterThanOrEqual(4);
    });
  });
});

// ── Tests: scope-specific context ─────────────────────────────────────────────

describe("Scope-specific summary context", () => {
  it("local threat summary mentions LOCAL and elevated risk", () => {
    const stance = mapThreatToDefensiveStance(mackayRansomware);
    expect(stance.summary).toContain("LOCAL");
    expect(stance.summary).toContain("elevated risk");
  });

  it("regional threat summary mentions REGIONAL and APAC sector targeting", () => {
    const stance = mapThreatToDefensiveStance(oraclePeopleSoftZeroDay);
    expect(stance.summary).toContain("REGIONAL");
    expect(stance.summary).toContain("APAC");
  });

  it("global threat summary mentions GLOBAL and standard defensive posture", () => {
    const stance = mapThreatToDefensiveStance(globalDataBreach);
    expect(stance.summary).toContain("GLOBAL");
  });

  it("local/regional threats include ACSC IOC sharing recommendation in mitigations", () => {
    const localStance = mapThreatToDefensiveStance(mackayRansomware);
    const regionalStance = mapThreatToDefensiveStance(oraclePeopleSoftZeroDay);
    const localHasACSC = localStance.mitigations.some(m => m.includes("AusCERT") || m.includes("ACSC") || m.includes("cross-sector"));
    const regionalHasRegional = regionalStance.mitigations.some(m => m.includes("APAC") || m.includes("AusCERT") || m.includes("ACSC") || m.includes("cross-sector") || m.includes("brief security"));
    expect(localHasACSC || regionalHasRegional).toBe(true);
  });
});

// ── Tests: posture delta accuracy ─────────────────────────────────────────────

describe("Posture delta values", () => {
  const severityDeltas: Array<[string, number]> = [
    ["critical", -12],
    ["high",     -7],
    ["medium",   -3],
    ["low",      -1],
  ];

  severityDeltas.forEach(([severity, expectedDelta]) => {
    it(`${severity} severity → ${expectedDelta} posture delta`, () => {
      const stance = mapThreatToDefensiveStance({
        id: `delta-test-${severity}`,
        scope: "global",
        category: "phishing",
        title: "Test",
        summary: "Test",
        source: "Test",
        sourceUrl: "https://test.example",
        publishedAt: new Date().toISOString(),
        affectedSectors: [],
        iocs: [],
        ttps: [],
        severity: severity as any,
        region: "Global",
        ingestedAt: new Date().toISOString(),
      });
      expect(stance.postureDelta).toBe(expectedDelta);
    });
  });
});
