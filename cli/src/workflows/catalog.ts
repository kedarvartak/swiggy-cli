import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import type { JsonValue } from "../types.js";
import type { WorkflowDefinition, WorkflowInputField, WorkflowStepDefinition } from "./types.js";

/**
 * Resolves the directory that stores user-declarable workflow manifests.
 */
export function getWorkflowDirectory(): string {
  const configured = process.env.SWIGGY_WORKFLOW_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const packageRelativeSharedDirectory = fileURLToPath(
    new URL("../../../workflows", import.meta.url),
  );
  return path.resolve(packageRelativeSharedDirectory);
}

/**
 * Validates workflow input field declarations loaded from JSON manifests.
 */
function isWorkflowInputField(value: unknown): value is WorkflowInputField {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Boolean(
    typeof candidate.name === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.description === "string" &&
      typeof candidate.required === "boolean",
  );
}

/**
 * Validates workflow step declarations loaded from JSON manifests.
 */
function isWorkflowStepDefinition(value: unknown): value is WorkflowStepDefinition {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Boolean(
    typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.kind === "string" &&
      typeof candidate.description === "string",
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
 * Validates a workflow manifest payload supplied by the CLI before writing it to disk.
 */
export function validateWorkflowDefinition(value: JsonValue, source = "inline payload"): WorkflowDefinition {
  return assertWorkflowDefinition(value, source);
}

/**
 * Converts a workflow id into a predictable manifest filename.
 */
function workflowFileName(workflowId: string): string {
  return `${workflowId.replace(/[^a-z0-9._-]+/gi, "-")}.json`;
}

/**
 * Reads all workflow manifests declared by the user in the workflow directory.
 */
export async function listWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  const workflowDirectory = getWorkflowDirectory();
  let entries;
  try {
    entries = await readdir(workflowDirectory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
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

/**
 * Writes a validated workflow manifest into the user-declarable workflow directory.
 */
export async function writeWorkflowDefinition(
  definition: WorkflowDefinition,
  options?: { force?: boolean },
): Promise<string> {
  const workflowDirectory = getWorkflowDirectory();
  await mkdir(workflowDirectory, { recursive: true });

  const filePath = path.join(workflowDirectory, workflowFileName(definition.id));
  await writeFile(`${filePath}`, `${JSON.stringify(definition, null, 2)}\n`, {
    encoding: "utf8",
    flag: options?.force ? "w" : "wx",
  });

  return filePath;
}
