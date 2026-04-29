import type { JsonValue } from "../types.js";

export type WorkflowInputType = "string" | "number" | "boolean" | "array" | "object";

export interface WorkflowInputField {
  name: string;
  type: WorkflowInputType;
  description: string;
  required: boolean;
  example?: JsonValue;
}

export type WorkflowStepKind = "input" | "decision" | "tool-call" | "approval" | "output";

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
  summary: string;
  difficulty: "simple" | "advanced" | "complex";
  tags: string[];
  inputs: WorkflowInputField[];
  tools: string[];
  steps: WorkflowStepDefinition[];
  guarantees: string[];
  limitations: string[];
}

export interface WorkflowPlanStep {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  description: string;
  status: "ready" | "blocked";
  toolName?: string;
  argumentHints?: string[];
}

export interface WorkflowPlan {
  workflowId: string;
  title: string;
  summary: string;
  executable: boolean;
  providedInputs: Record<string, JsonValue>;
  missingRequiredInputs: string[];
  toolSequence: string[];
  nextAction: string;
  steps: WorkflowPlanStep[];
}
