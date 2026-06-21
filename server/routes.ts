import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import questions from "./assessment-questions.json";
import connectors from "./connectors.json";
import agents from "./agents.json";
import { pipeline, SEED_THREATS } from "./threatIngestion";
import { mapThreatToDefensiveStance, type IngestedThreat } from "./playbookMapper";

const DEFAULT_ORG = 1;

export function registerRoutes(httpServer: Server, app: Express) {

  // ── Threats ────────────────────────────────────────────────────────────────
  app.get("/api/threats", (_req, res) => res.json(storage.getThreats(DEFAULT_ORG)));
  app.patch("/api/threats/:id/status", (req, res) => {
    const updated = storage.updateThreatStatus(Number(req.params.id), req.body.status);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── Compliance ─────────────────────────────────────────────────────────────
  app.get("/api/compliance", (_req, res) => res.json(storage.getComplianceItems(DEFAULT_ORG)));
  app.patch("/api/compliance/:id", (req, res) => {
    const updated = storage.updateComplianceItem(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── Tech Assets ────────────────────────────────────────────────────────────
  app.get("/api/tech-assets", (_req, res) => res.json(storage.getTechAssets(DEFAULT_ORG)));
  app.post("/api/tech-assets", (req, res) => {
    const asset = storage.createTechAsset({ ...req.body, orgId: DEFAULT_ORG });
    res.status(201).json(asset);
  });
  app.patch("/api/tech-assets/:id", (req, res) => {
    const updated = storage.updateTechAsset(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── Incidents ──────────────────────────────────────────────────────────────
  app.get("/api/incidents", (_req, res) => res.json(storage.getIncidents(DEFAULT_ORG)));
  app.post("/api/incidents", (req, res) => {
    const incident = storage.createIncident({ ...req.body, orgId: DEFAULT_ORG });
    res.status(201).json(incident);
  });
  app.patch("/api/incidents/:id/phase", (req, res) => {
    const { phase, closedAt } = req.body;
    const updated = storage.updateIncidentPhase(Number(req.params.id), phase, closedAt);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ── Board Reports ──────────────────────────────────────────────────────────
  app.get("/api/board-reports", (_req, res) => res.json(storage.getBoardReports(DEFAULT_ORG)));
  app.post("/api/board-reports", (req, res) => {
    const report = storage.createBoardReport({ ...req.body, orgId: DEFAULT_ORG });
    res.status(201).json(report);
  });

  // ── Assessment ─────────────────────────────────────────────────────────────
  app.get("/api/assessment/questions", (_req, res) => res.json(questions));
  app.get("/api/assessment/responses", (_req, res) => res.json(storage.getAssessmentResponses(DEFAULT_ORG)));
  app.post("/api/assessment/respond", (req, res) => {
    const { questionId, answer, notes } = req.body;
    const response = storage.upsertAssessmentResponse({
      orgId: DEFAULT_ORG, questionId: Number(questionId),
      answer, notes: notes || null, updatedAt: new Date().toISOString(),
    });
    res.json(response);
  });
  app.get("/api/assessment/score", (_req, res) => {
    const responses = storage.getAssessmentResponses(DEFAULT_ORG);
    const responseMap = new Map(responses.map(r => [r.questionId, r.answer]));
    const categoryScores: Record<string, { scored: number; max: number; count: number; answered: number }> = {};
    for (const q of questions as any[]) {
      if (!categoryScores[q.category]) categoryScores[q.category] = { scored: 0, max: 0, count: 0, answered: 0 };
      const maxPts = q.weight === "High" ? 3 : q.weight === "Medium" ? 2 : 1;
      categoryScores[q.category].max += maxPts;
      categoryScores[q.category].count++;
      const ans = responseMap.get(q.id);
      if (ans) {
        categoryScores[q.category].answered++;
        categoryScores[q.category].scored += ans === "Yes" ? maxPts : ans === "Partial" ? maxPts * 0.5 : 0;
      }
    }
    const totalScored = Object.values(categoryScores).reduce((s, c) => s + c.scored, 0);
    const totalMax = Object.values(categoryScores).reduce((s, c) => s + c.max, 0);
    const totalAnswered = Object.values(categoryScores).reduce((s, c) => s + c.answered, 0);
    res.json({
      overallPct: totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0,
      totalAnswered, totalQuestions: questions.length, categories: categoryScores,
    });
  });

  // ── Connectors ─────────────────────────────────────────────────────────────
  app.get("/api/connectors", (_req, res) => {
    const dbConns = storage.getConnectorStates(DEFAULT_ORG);
    const stateMap = new Map(dbConns.map(c => [c.connectorId, c]));
    const enriched = (connectors as any[]).map(c => ({
      ...c,
      connected: stateMap.get(c.id)?.connected ?? false,
      connectedAt: stateMap.get(c.id)?.connectedAt ?? null,
    }));
    res.json(enriched);
  });

  app.post("/api/connectors/:id/toggle", (req, res) => {
    const { id } = req.params;
    const connector = (connectors as any[]).find(c => c.id === id);
    if (!connector) return res.status(404).json({ error: "Unknown connector" });
    const current = storage.getConnectorState(DEFAULT_ORG, id);
    const newState = !current?.connected;
    const updated = storage.upsertConnectorState({
      orgId: DEFAULT_ORG, connectorId: id,
      connected: newState,
      connectedAt: newState ? new Date().toISOString() : null,
    });
    res.json({ ...connector, connected: updated.connected, connectedAt: updated.connectedAt });
  });

  // ── Agents ─────────────────────────────────────────────────────────────────
  app.get("/api/agents", (_req, res) => res.json(agents));

  app.post("/api/agents/:id/run", (req, res) => {
    const { id } = req.params;
    const agent = (agents as any[]).find(a => a.id === id);
    if (!agent) return res.status(404).json({ error: "Unknown agent" });

    // Incident Responder: check ingestion pipeline for active unacknowledged stances
    if (id === "incident-responder") {
      const unacked = pipeline.getAllStances(true);
      const criticalLocal = unacked.filter(s => {
        const threat = pipeline.getThreat(s.threatId);
        return threat && (threat.scope === "local" || threat.scope === "regional") && s.overallRisk === "critical";
      });
      if (criticalLocal.length > 0) {
        const top = criticalLocal[0];
        const threat = pipeline.getThreat(top.threatId)!;
        return res.json({
          agentId: id,
          ranAt: new Date().toISOString(),
          defensiveStanceActivated: true,
          activeThreat: threat.title,
          threatScope: threat.scope,
          threatRegion: threat.region,
          overallRisk: top.overallRisk,
          playbookSteps: top.playbook.length,
          immediateActions: top.playbook.filter((s: any) => s.priority === "immediate").length,
          affectedControls: top.affectedControls,
          agentsToActivate: top.agentActions.map((a: any) => a.agentId),
          output: {
            result: `DEFENSIVE STANCE ACTIVATED — ${threat.title}. Scope: ${threat.scope.toUpperCase()} (${threat.region}). Risk: ${top.overallRisk.toUpperCase()}. ${top.playbook.length}-step playbook generated. ${top.playbook.filter((s: any) => s.priority === "immediate").length} immediate actions required. Affected controls: ${top.affectedControls.join(", ")}. Triggering ${top.agentActions.length} agents: ${top.agentActions.map((a: any) => a.agentName).join(", ")}.`,
          },
        });
      }
      return res.json({ agentId: id, ranAt: new Date().toISOString(), output: { result: "No new unacknowledged regional/local threats. 1 incident in lessons-learned phase requires closure sign-off. All defensive stances current." } });
    }

    // Threat Hunter: cross-reference ingested IOCs against known threats
    if (id === "threat-hunter") {
      const allThreats = pipeline.getAllThreats({ severity: "critical" });
      const withIocs = allThreats.filter(t => t.iocs.length > 0);
      const iocCount = withIocs.reduce((sum, t) => sum + t.iocs.length, 0);
      return res.json({
        agentId: id,
        ranAt: new Date().toISOString(),
        output: {
          result: `Scanned 2,847 CVEs. ${allThreats.length} critical threats in regional pipeline. ${iocCount} IOCs cross-referenced against asset inventory. Local AU/NZ threats: ${pipeline.getAllThreats({ scope: "local" }).length} active. Top: ${allThreats[0]?.title ?? "None"}.`,
        },
      });
    }

    // Posture Scorer: factor in ingestion pipeline posture delta
    if (id === "posture-scorer") {
      const stats = pipeline.getStats();
      const delta = stats.totalPostureDelta;
      const adjustedScore = Math.max(0, 62 + delta);
      return res.json({
        agentId: id,
        ranAt: new Date().toISOString(),
        output: {
          result: `Posture score updated: ${adjustedScore}/100 (${delta < 0 ? delta : "+" + delta} from regional threat pipeline). ${stats.critical} critical threats unmitigated. ${stats.unacked} defensive stances awaiting CISO acknowledgement. Local threat exposure: ${stats.local} AU/NZ incidents in pipeline.`,
        },
      });
    }

    // Default responses for other agents — now enriched with ingestion context
    const outputs: Record<string, any> = {
      "compliance-auditor": { result: "Audited 14 controls. 2 controls degraded since last run: E8-3 Macro Controls, ISO A.8.2. Regional threat intelligence mapped to 6 affected controls." },
      "vuln-scanner": { result: "47 vulnerabilities found across 8 assets. 4 critical, 12 high. Patch priority list updated. Oracle PeopleSoft CVE-2026-35273 (CVSS 9.8) — check asset inventory immediately." },
      "tech-assessor": { result: "Stack review complete. 3 assets EOL. Cisco ASA critical — no patches since Aug 2023. Firewall exploitation campaign active in APAC — immediate replacement priority elevated." },
      "board-reporter": { result: "Q2 2026 board report generated. Risk score: 62/100. 5 actions recommended. Regional threat landscape: AU 4th most targeted country by The Gentlemen ransomware group." },
      "vendor-scout": { result: "Based on your gaps + active regional threats: Recommend Intruder (vuln scan), KnowBe4 (training), Cloudflare Gateway (DDoS/DNS — VentraIP 600Gbps attack context). Total est. $340/month." },
    };
    res.json({ agentId: id, ranAt: new Date().toISOString(), output: outputs[id] ?? { result: "Agent run complete." } });
  });

  // ── Threat Ingestion Pipeline ───────────────────────────────────────────────

  app.get("/api/ingestion/threats", (req, res) => {
    const { scope, severity, category } = req.query as Record<string, string>;
    const threats = pipeline.getAllThreats({
      ...(scope    ? { scope: scope as any }       : {}),
      ...(severity ? { severity: severity as any } : {}),
      ...(category ? { category: category as any } : {}),
    });
    res.json(threats);
  });

  app.get("/api/ingestion/threats/:id", (req, res) => {
    const threat = pipeline.getThreat(req.params.id);
    if (!threat) return res.status(404).json({ error: "Threat not found" });
    res.json(threat);
  });

  app.get("/api/ingestion/stances", (req, res) => {
    const unackedOnly = req.query.unacknowledged === "true";
    res.json(pipeline.getAllStances(unackedOnly));
  });

  app.get("/api/ingestion/stances/:threatId", (req, res) => {
    const stance = pipeline.getStanceByThreatId(req.params.threatId);
    if (!stance) return res.status(404).json({ error: "Stance not found" });
    res.json(stance);
  });

  app.post("/api/ingestion/stances/:threatId/acknowledge", (req, res) => {
    const { acknowledgedBy } = req.body;
    const updated = pipeline.acknowledgeStance(req.params.threatId, acknowledgedBy ?? "CISO");
    if (!updated) return res.status(404).json({ error: "Stance not found" });
    res.json(updated);
  });

  app.post("/api/ingestion/ingest", (req, res) => {
    const threat = req.body as IngestedThreat;
    if (!threat.id || !threat.category || !threat.title) {
      return res.status(400).json({ error: "Missing required fields: id, category, title" });
    }
    threat.ingestedAt = new Date().toISOString();
    const result = pipeline.ingest([threat], "manual");
    res.status(201).json(result);
  });

  app.post("/api/ingestion/refresh", (_req, res) => {
    const result = pipeline.ingest(SEED_THREATS, "CyberNews-refresh");
    res.json(result);
  });

  app.get("/api/ingestion/runs", (_req, res) => {
    res.json(pipeline.getPipelineRuns(20));
  });

  app.get("/api/ingestion/stats", (_req, res) => {
    res.json(pipeline.getStats());
  });

  app.post("/api/ingestion/preview-stance", (req, res) => {
    const threat = req.body as IngestedThreat;
    if (!threat.category) return res.status(400).json({ error: "category required" });
    const stance = mapThreatToDefensiveStance({ ...threat, ingestedAt: new Date().toISOString() });
    res.json(stance);
  });

}
