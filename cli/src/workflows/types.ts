import type { JsonValue } from "../types.js";

export type WorkflowInputType = "string" | "number" | "boolean" | "array" | "object";
export type WorkflowDomain = "food" | "instamart" | "dineout" | "multi-domain";
export type WorkflowConstraintType =
  | "budget"
  | "location"
  | "dietary"
  | "timing"
  | "approval"
  | "preference"
  | "custom";
export type WorkflowApprovalKind =
  | "before_mutation"
  | "before_placement"
  | "final_confirmation"
  | "custom";

export interface WorkflowInputField {
  name: string;
  type: WorkflowInputType;
  description: string;
  required: boolean;
  example?: JsonValue;
}

export type WorkflowStepKind = "input" | "decision" | "tool-call" | "approval" | "output";

export interface WorkflowConstraint {
  id: string;
  title: string;
  description: string;
  type: WorkflowConstraintType;
}

export interface WorkflowApprovalPoint {
  stepId: string;
  title: string;
  description: string;
  kind: WorkflowApprovalKind;
}

export interface WorkflowSuccessOutput {
  type: string;
  description: string;
}

export interface WorkflowStepDefinition {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  description: string;
  toolName?: string;
  argumentHints?: string[];
  produces?: string[];
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  version: string;
  app: string;
  domain: WorkflowDomain;
  goal: string;
  summary: string;
  difficulty: "simple" | "advanced" | "complex";
  tags: string[];
  inputs: WorkflowInputField[];
  constraints: WorkflowConstraint[];
  approvalPoints: WorkflowApprovalPoint[];
  tools: string[];
  steps: WorkflowStepDefinition[];
  guarantees: string[];
  limitations: string[];
  fallbackRules: string[];
  toolStrategy: string[];
  successOutput?: WorkflowSuccessOutput;
}

export interface WorkflowPlanStep {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  description: string;
  status: "ready" | "blocked";
  toolName?: string;
  argumentHints?: string[];
  produces?: string[];
  domain?: string;
  stage?: string;
  retryClass?: string;
  requiresApproval: boolean;
  supportsBlindRetry: boolean;
  statusCheckTool?: string;
  notes: string[];
}

export interface WorkflowPlanNode {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  status: "ready" | "blocked";
  stage?: string;
  toolName?: string;
  requiresApproval: boolean;
}

export interface WorkflowPlanEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowPlanGraph {
  nodes: WorkflowPlanNode[];
  edges: WorkflowPlanEdge[];
}

export interface WorkflowPlan {
  workflowId: string;
  title: string;
  domain: WorkflowDomain;
  goal: string;
  summary: string;
  executable: boolean;
  providedInputs: Record<string, JsonValue>;
  missingRequiredInputs: string[];
  toolSequence: string[];
  nextAction: string;
  approvalRequired: boolean;
  constraints: WorkflowConstraint[];
  approvalPoints: WorkflowApprovalPoint[];
  fallbackRules: string[];
  successOutput?: WorkflowSuccessOutput;
  steps: WorkflowPlanStep[];
  graph: WorkflowPlanGraph;
}
