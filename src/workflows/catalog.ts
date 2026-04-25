import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { JsonValue } from "../types.js";
import type { WorkflowDefinition, WorkflowInputField, WorkflowStepDefinition } from "./types.js";

/**
 * Resolves the directory that stores user-declarable workflow manifests.
 */
function getWorkflowDirectory(): string {
  const configured = process.env.SWIGGY_WORKFLOW_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), "workflows");
}

/**
 * Validates workflow input field declarations loaded from JSON manifests.
 */
function isWorkflowInputField(value: JsonValue): value is WorkflowInputField {
  return Boolean(
    value &&
      !Array.isArray(value) &&
      typeof value === "object" &&
      typeof value.name === "string" &&
      typeof value.type === "string" &&
      typeof value.description === "string" &&
      typeof value.required === "boolean",
  );
}

/**
 * Validates workflow step declarations loaded from JSON manifests.
 */
function isWorkflowStepDefinition(value: JsonValue): value is WorkflowStepDefinition {
  return Boolean(
    value &&
      !Array.isArray(value) &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      typeof value.title === "string" &&
      typeof value.kind === "string" &&
      typeof value.description === "string",
  );
}

/**
 * Validates a workflow manifest loaded from disk.
 */
function assertWorkflowDefinition(value: JsonValue, source: string): WorkflowDefinition {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`Workflow manifest ${source} must contain a JSON object.`);
  }

  const candidate = value as Record<string, JsonValue>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.version !== "string" ||
    typeof candidate.app !== "string" ||
    typeof candidate.summary !== "string" ||
    typeof candidate.difficulty !== "string" ||
    !Array.isArray(candidate.tags) ||
    !Array.isArray(candidate.inputs) ||
    !Array.isArray(candidate.tools) ||
    !Array.isArray(candidate.steps) ||
    !Array.isArray(candidate.guarantees) ||
    !Array.isArray(candidate.limitations)
  ) {
    throw new Error(`Workflow manifest ${source} is missing one or more required fields.`);
  }

  if (!candidate.inputs.every((entry) => isWorkflowInputField(entry as JsonValue))) {
    throw new Error(`Workflow manifest ${source} has invalid input field declarations.`);
  }

  if (!candidate.steps.every((entry) => isWorkflowStepDefinition(entry as JsonValue))) {
    throw new Error(`Workflow manifest ${source} has invalid workflow step declarations.`);
  }

  return candidate as unknown as WorkflowDefinition;
}

/**
 * Reads all workflow manifests declared by the user in the workflow directory.
 */
export async function listWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  const workflowDirectory = getWorkflowDirectory();
  const entries = await readdir(workflowDirectory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const workflows = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(workflowDirectory, fileName);
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as JsonValue;
      return assertWorkflowDefinition(parsed, filePath);
    }),
  );

  return workflows;
}

/**
 * Resolves a single workflow definition by id from the user-declared manifest directory.
 */
export async function getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition> {
  const workflows = await listWorkflowDefinitions();
  const workflow = workflows.find((candidate) => candidate.id === workflowId);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${workflowId}`);
  }

  return workflow;
}
