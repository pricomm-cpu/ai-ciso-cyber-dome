import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const organisations = sqliteTable("organisations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), industry: text("industry").notNull(),
  size: text("size").notNull(), createdAt: text("created_at").notNull(),
});
export const insertOrganisationSchema = createInsertSchema(organisations).omit({ id: true });
export type InsertOrganisation = z.infer<typeof insertOrganisationSchema>;
export type Organisation = typeof organisations.$inferSelect;

export const threats = sqliteTable("threats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), title: text("title").notNull(),
  severity: text("severity").notNull(), category: text("category").notNull(),
  status: text("status").notNull().default("open"), description: text("description").notNull(),
  detectedAt: text("detected_at").notNull(), resolvedAt: text("resolved_at"),
  aiRecommendation: text("ai_recommendation"),
});
export const insertThreatSchema = createInsertSchema(threats).omit({ id: true });
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type Threat = typeof threats.$inferSelect;

export const complianceItems = sqliteTable("compliance_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), framework: text("framework").notNull(),
  control: text("control").notNull(), controlId: text("control_id").notNull(),
  status: text("status").notNull().default("not-assessed"), evidence: text("evidence"),
  dueDate: text("due_date"), aiGuidance: text("ai_guidance"),
});
export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({ id: true });
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;
export type ComplianceItem = typeof complianceItems.$inferSelect;

export const techAssets = sqliteTable("tech_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), name: text("name").notNull(),
  category: text("category").notNull(), vendor: text("vendor"), version: text("version"),
  eolDate: text("eol_date"), riskLevel: text("risk_level").default("unknown"),
  refreshNeeded: integer("refresh_needed", { mode: "boolean" }).default(false),
  aiRecommendation: text("ai_recommendation"), recommendedVendors: text("recommended_vendors"),
});
export const insertTechAssetSchema = createInsertSchema(techAssets).omit({ id: true });
export type InsertTechAsset = z.infer<typeof insertTechAssetSchema>;
export type TechAsset = typeof techAssets.$inferSelect;

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), title: text("title").notNull(),
  severity: text("severity").notNull(), phase: text("phase").notNull().default("detection"),
  summary: text("summary").notNull(), aiPlaybook: text("ai_playbook"),
  reportedAt: text("reported_at").notNull(), closedAt: text("closed_at"),
});
export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export const boardReports = sqliteTable("board_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), title: text("title").notNull(),
  period: text("period").notNull(), riskSummary: text("risk_summary").notNull(),
  complianceSummary: text("compliance_summary").notNull(), keyActions: text("key_actions").notNull(),
  createdAt: text("created_at").notNull(),
});
export const insertBoardReportSchema = createInsertSchema(boardReports).omit({ id: true });
export type InsertBoardReport = z.infer<typeof insertBoardReportSchema>;
export type BoardReport = typeof boardReports.$inferSelect;

export const assessmentResponses = sqliteTable("assessment_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), questionId: integer("question_id").notNull(),
  answer: text("answer"), notes: text("notes"), updatedAt: text("updated_at").notNull(),
});
export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({ id: true });
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;

// ── Connector integration states ─────────────────────────────────────────────
export const connectorStates = sqliteTable("connector_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull(), connectorId: text("connector_id").notNull(),
  connected: integer("connected", { mode: "boolean" }).notNull().default(false),
  connectedAt: text("connected_at"),
});
export const insertConnectorStateSchema = createInsertSchema(connectorStates).omit({ id: true });
export type InsertConnectorState = z.infer<typeof insertConnectorStateSchema>;
export type ConnectorState = typeof connectorStates.$inferSelect;
