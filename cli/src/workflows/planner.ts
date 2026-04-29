import type { JsonValue } from "../types.js";
import type { WorkflowDefinition, WorkflowInputField, WorkflowPlan, WorkflowPlanStep } from "./types.js";

/**
 * Determines whether a provided input value matches the workflow field type at a coarse level.
 */
function isCompatibleValue(field: WorkflowInputField, value: JsonValue): boolean {
  if (field.type === "array") {
    return Array.isArray(value);
  }

  if (field.type === "object") {
    return Boolean(value) && !Array.isArray(value) && typeof value === "object";
  }

  return typeof value === field.type;
}

/**
 * Validates and normalizes the provided workflow inputs.
 */
function collectWorkflowInputs(
  definition: WorkflowDefinition,
  payload: Record<string, JsonValue>,
): { providedInputs: Record<string, JsonValue>; missingRequiredInputs: string[] } {
  const providedInputs: Record<string, JsonValue> = {};
  const missingRequiredInputs: string[] = [];

  for (const field of definition.inputs) {
    const value = payload[field.name];
    if (value === undefined) {
      if (field.required) {
        missingRequiredInputs.push(field.name);
      }
      continue;
    }

    if (!isCompatibleValue(field, value)) {
      throw new Error(
        `Workflow input \`${field.name}\` must be of type ${field.type}.`,
      );
    }

    providedInputs[field.name] = value;
  }

  return { providedInputs, missingRequiredInputs };
}

/**
 * Turns a reusable workflow definition into a concrete execution preview.
 */
export function createWorkflowPlan(
  definition: WorkflowDefinition,
  payload: Record<string, JsonValue>,
): WorkflowPlan {
  const { providedInputs, missingRequiredInputs } = collectWorkflowInputs(definition, payload);
  const executable = missingRequiredInputs.length === 0;

  const steps: WorkflowPlanStep[] = definition.steps.map((step) => ({
    id: step.id,
    title: step.title,
    kind: step.kind,
    description: step.description,
    status: executable ? "ready" : "blocked",
    toolName: step.toolName,
    argumentHints: step.argumentHints,
  }));

  return {
    workflowId: definition.id,
    title: definition.title,
    summary: definition.summary,
    executable,
    providedInputs,
    missingRequiredInputs,
    toolSequence: definition.steps
      .filter((step) => step.kind === "tool-call" && step.toolName)
      .map((step) => step.toolName as string),
    nextAction: executable
      ? "Workflow definition is sufficiently populated for execution planning."
      : `Provide the missing required inputs: ${missingRequiredInputs.join(", ")}.`,
    steps,
  };
}
