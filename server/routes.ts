import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import questions from "./assessment-questions.json";
import connectors from "./connectors.json";
import agents from "./agents.json";

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
    // Simulate agent run result
    const outputs: Record<string, any> = {
      "threat-hunter": { result: "Scanned 2,847 CVEs. 3 match your asset inventory. 1 critical (CVE-2026-8821 in OpenSSL 3.1)." },
      "compliance-auditor": { result: "Audited 14 controls. 2 controls degraded since last run: E8-3 Macro Controls, ISO A.8.2." },
      "vuln-scanner": { result: "47 vulnerabilities found across 8 assets. 4 critical, 12 high. Patch priority list updated." },
      "incident-responder": { result: "No new incidents. 1 incident in lessons-learned phase requires closure sign-off." },
      "tech-assessor": { result: "Stack review complete. 3 assets EOL. Cisco ASA critical — no patches since Aug 2023." },
      "board-reporter": { result: "Q2 2026 board report generated. Risk score: 62/100. 5 actions recommended for board approval." },
      "vendor-scout": { result: "Based on your gaps: Recommend Intruder (vuln scan), KnowBe4 (training), Cloudflare Gateway (DNS). Total est. $340/month." },
      "posture-scorer": { result: "Posture score updated: 62/100 (↑4 from last week). Biggest gain: MFA rollout partial completion." },
    };
    res.json({ agentId: id, ranAt: new Date().toISOString(), output: outputs[id] ?? { result: "Agent run complete." } });
  });

}
