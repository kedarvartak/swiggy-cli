import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  backendApi,
  type JsonValue,
  type WorkflowDefinition,
  type WorkflowDomain,
  type WorkflowInputField,
  type WorkflowPlan,
  type WorkflowRun,
  type WorkflowRunStepStatus,
  type WorkflowStepKind,
} from "../../api/backend";
import { workflowCreationStyles as styles } from "./styles";

type NodeState = "draft" | "running" | "done" | "waiting" | "failed" | "blocked";
type WorkflowCreationMode = "author" | "run";

type WorkflowBoardStep = {
  id: string;
  toolName: string;
  title: string;
  stage: string;
  domain: WorkflowDomain;
  kind: WorkflowStepKind;
  state: NodeState;
  description: string;
};

type FlowNodeData = {
  title: string;
  toolName: string;
  stage: string;
  state: NodeState;
  isSelected: boolean;
};

const domainLabels: Record<WorkflowDomain, string> = {
  food: "Food",
  dineout: "Dineout",
  instamart: "Instamart",
  "multi-domain": "Multi-domain",
};

const nodeStateLabel: Record<NodeState, string> = {
  draft: "Pending",
  running: "Executing",
  done: "Completed",
  waiting: "Awaiting approval",
  failed: "Failed",
  blocked: "Blocked",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

const FLOW_NODE_WIDTH = 264;
const FLOW_NODE_HEIGHT = 148;
const FLOW_COLUMN_GAP = 132;
const FLOW_ROW_GAP = 208;

function defaultInputValue(field: WorkflowInputField): JsonValue {
  if (field.example !== undefined) {
    return field.example;
  }
  if (field.type === "number") {
    return 1;
  }
  if (field.type === "boolean") {
    return true;
  }
  if (field.type === "array") {
    return [];
  }
  if (field.type === "object") {
    return {};
  }
  return "";
}

function inputToString(value: JsonValue | undefined) {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function parseInputValue(field: WorkflowInputField, value: string): JsonValue {
  if (field.type === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.type === "boolean") {
    return value === "true";
  }
  if (field.type === "array" || field.type === "object") {
    try {
      return JSON.parse(value) as JsonValue;
    } catch {
      return value;
    }
  }
  return value;
}

function payloadFromWorkflow(workflow: WorkflowDefinition) {
  return workflow.inputs.reduce<Record<string, JsonValue>>((payload, field) => {
    payload[field.name] = defaultInputValue(field);
    return payload;
  }, {});
}

function getColumnCount(nodeCount: number) {
  if (nodeCount <= 3) {
    return Math.max(nodeCount, 1);
  }
  if (nodeCount <= 6) {
    return 3;
  }
  return 4;
}

function layoutSteps(steps: WorkflowBoardStep[]) {
  const columnCount = getColumnCount(steps.length);

  return steps.map((step, index) => {
    const row = Math.floor(index / columnCount);
    const rowStart = row * columnCount;
    const rowItems = Math.min(columnCount, steps.length - rowStart);
    const indexInRow = index - rowStart;
    const rowWidth = rowItems * FLOW_NODE_WIDTH + Math.max(rowItems - 1, 0) * FLOW_COLUMN_GAP;
    const rowOffset = -rowWidth / 2 + FLOW_NODE_WIDTH / 2;

    return {
      ...step,
      x: rowOffset + indexInRow * (FLOW_NODE_WIDTH + FLOW_COLUMN_GAP),
      y: row * FLOW_ROW_GAP,
    };
  });
}

function buildFlowEdges(steps: WorkflowBoardStep[], plan: WorkflowPlan | null) {
  const planEdges = plan?.graph.edges;
  const edges =
    planEdges && planEdges.length > 0
      ? planEdges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target }))
      : steps.slice(0, -1).map((step, index) => ({
          id: `edge-${step.id}-${steps[index + 1].id}`,
          source: step.id,
          target: steps[index + 1].id,
        }));

  return edges.map((edge) => {
    const sourceStep = steps.find((step) => step.id === edge.source);
    const isActivePath = sourceStep?.state === "done" || sourceStep?.state === "running";

    return {
      ...edge,
      type: "smoothstep",
      animated: sourceStep?.state === "running",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: isActivePath ? "#FF5200" : "rgba(90, 95, 109, 0.3)",
      },
      style: {
        stroke: isActivePath ? "#FF5200" : "rgba(90, 95, 109, 0.24)",
        strokeWidth: isActivePath ? 3 : 2,
      },
    } satisfies Edge;
  });
}

function runStatusToNodeState(status: WorkflowRunStepStatus): NodeState {
  if (status === "completed") {
    return "done";
  }
  if (status === "running") {
    return "running";
  }
  if (status === "waiting_for_approval") {
    return "waiting";
  }
  if (status === "failed" || status === "cancelled") {
    return "failed";
  }
  return "draft";
}

function definitionToBoardSteps(definition: WorkflowDefinition): WorkflowBoardStep[] {
  return definition.steps.map((step) => ({
    id: step.id,
    toolName: step.toolName || step.kind,
    title: step.title,
    stage: step.kind,
    domain: definition.domain,
    kind: step.kind,
    state: "draft",
    description: step.description,
  }));
}

function FlowWorkflowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const stateStyle =
    data.state === "done"
      ? styles.nodeStateDone
      : data.state === "running"
        ? styles.nodeStateRunning
        : data.state === "waiting"
          ? styles.nodeStateWaiting
          : data.state === "failed"
            ? styles.nodeStateFailed
            : data.state === "blocked"
              ? styles.nodeStateBlocked
              : styles.nodeStateDraft;

  return (
    <div style={data.isSelected ? styles.flowNodeCardActive : styles.flowNodeCard}>
      <Handle position={Position.Left} style={styles.flowHandle} type="target" />
      <div style={styles.flowNodeTopRow}>
        <span style={styles.flowNodeStage}>{data.stage}</span>
        <span style={stateStyle}>{nodeStateLabel[data.state]}</span>
      </div>
      <div style={styles.flowNodeTitle}>{data.title}</div>
      <div style={styles.flowNodeTool}>{data.toolName}</div>
      <Handle position={Position.Right} style={styles.flowHandle} type="source" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  workflowNode: FlowWorkflowNode,
};

type WorkflowCreationProps = {
  initialMode?: WorkflowCreationMode;
  initialWorkflowId?: string | null;
  onBack?: () => void;
};

export function WorkflowCreation({ initialMode = "author", initialWorkflowId, onBack }: WorkflowCreationProps) {
  const [mode, setMode] = useState<WorkflowCreationMode>(initialMode);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(initialWorkflowId ?? null);
  const [draftDescription, setDraftDescription] = useState(
    "Find a high-protein meal under 500 rupees and pause before placing the order.",
  );
  const [draftDomain, setDraftDomain] = useState<WorkflowDomain>("food");
  const [draftDefinition, setDraftDefinition] = useState<WorkflowDefinition | null>(null);
  const [payload, setPayload] = useState<Record<string, JsonValue>>({});
  const [plan, setPlan] = useState<WorkflowPlan | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Loading backend workflow catalog...");
  const [isBusy, setIsBusy] = useState(false);
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 1180);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    let cancelled = false;

    backendApi
      .listWorkflows()
      .then((catalog) => {
        if (cancelled) {
          return;
        }
        setWorkflows(catalog);
        const nextWorkflowId = initialWorkflowId ?? catalog[0]?.id ?? null;
        setSelectedWorkflowId(nextWorkflowId);
        setStatusText(
          initialMode === "author"
            ? "Describe a workflow and draft it from the backend authoring endpoint."
            : catalog.length > 0
              ? "Select inputs and create a backend plan."
              : "No backend workflows are available.",
        );
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setStatusText(`Backend unavailable: ${error.message}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialMode, initialWorkflowId]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1180);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null;
  const activeDefinition = mode === "author" ? draftDefinition : selectedWorkflow;

  useEffect(() => {
    if (!selectedWorkflow || mode !== "run") {
      return;
    }
    setPayload(payloadFromWorkflow(selectedWorkflow));
    setPlan(null);
    setRun(null);
    setSelectedNodeId(null);
  }, [mode, selectedWorkflow]);

  useEffect(() => {
    if (!selectedWorkflow || mode !== "author" || !initialWorkflowId) {
      return;
    }
    setDraftDefinition(selectedWorkflow);
    setDraftDomain(selectedWorkflow.domain);
    setSelectedNodeId(selectedWorkflow.steps[0]?.id ?? null);
    setStatusText("Loaded workflow definition for authoring.");
  }, [initialWorkflowId, mode, selectedWorkflow]);

  const steps = useMemo<WorkflowBoardStep[]>(() => {
    if (run) {
      return run.steps.map((step) => ({
        id: step.id,
        toolName: step.toolName || step.kind,
        title: step.title,
        stage: step.stage || step.kind,
        domain: run.domain,
        kind: step.kind,
        state:
          run.pendingApproval?.stepId === step.id
            ? "waiting"
            : runStatusToNodeState(step.status),
        description: step.error || "",
      }));
    }

    if (plan) {
      return plan.steps.map((step) => ({
        id: step.id,
        toolName: step.toolName || step.kind,
        title: step.title,
        stage: step.stage || step.kind,
        domain: plan.domain,
        kind: step.kind,
        state: step.status === "ready" ? "draft" : "blocked",
        description: step.description,
      }));
    }

    if (draftDefinition) {
      return definitionToBoardSteps(draftDefinition);
    }

    return [];
  }, [draftDefinition, plan, run]);

  const selectedStep = steps.find((step) => step.id === selectedNodeId) ?? null;
  const completedStepCount = run?.summary.completedSteps ?? steps.filter((step) => step.state === "done").length;
  const totalStepCount = run?.summary.totalSteps ?? steps.length;
  const activeDomain = activeDefinition?.domain ?? plan?.domain ?? run?.domain ?? draftDomain;

  const flowNodes = useMemo<Node<FlowNodeData>[]>(() => {
    return layoutSteps(steps).map((step) => ({
      id: step.id,
      type: "workflowNode",
      position: { x: step.x, y: step.y },
      draggable: false,
      selectable: true,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        title: step.title,
        toolName: step.toolName,
        stage: step.stage,
        state: step.state,
        isSelected: step.id === selectedNodeId,
      },
    }));
  }, [selectedNodeId, steps]);

  const flowEdges = useMemo(() => buildFlowEdges(steps, plan), [plan, steps]);

  const updatePayloadField = (field: WorkflowInputField, value: string) => {
    setPayload((current) => ({
      ...current,
      [field.name]: parseInputValue(field, value),
    }));
  };

  const createPlan = async () => {
    if (!selectedWorkflow) {
      return;
    }
    setIsBusy(true);
    setStatusText("Creating backend plan...");
    try {
      const nextPlan = await backendApi.createPlan(selectedWorkflow.id, payload);
      setPlan(nextPlan);
      setRun(null);
      setSelectedNodeId(nextPlan.steps[0]?.id ?? null);
      setStatusText(nextPlan.nextAction);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Plan request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const startRun = async () => {
    if (!selectedWorkflow) {
      return;
    }
    setIsBusy(true);
    setStatusText("Starting backend workflow run...");
    try {
      const nextRun = await backendApi.createRun(selectedWorkflow.id, payload, true);
      setRun(nextRun);
      setSelectedNodeId(nextRun.currentStepId ?? nextRun.steps[0]?.id ?? null);
      setStatusText(`Run ${nextRun.runId} is ${formatStatus(nextRun.status)}.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Run request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const approveRun = async (approved: boolean) => {
    if (!run) {
      return;
    }
    setIsBusy(true);
    setStatusText(approved ? "Approving backend checkpoint..." : "Rejecting backend checkpoint...");
    try {
      const nextRun = await backendApi.approveRun(run.runId, approved);
      setRun(nextRun);
      setSelectedNodeId(nextRun.currentStepId ?? nextRun.pendingApproval?.stepId ?? nextRun.steps[0]?.id ?? null);
      setStatusText(`Run ${nextRun.runId} is ${formatStatus(nextRun.status)}.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Approval request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const generateDraft = async () => {
    const description = draftDescription.trim();
    if (!description) {
      setStatusText("Describe the workflow before drafting.");
      return;
    }

    setIsBusy(true);
    setStatusText("Drafting workflow definition from backend...");
    try {
      const nextDraft = await backendApi.draftWorkflow(description, draftDomain);
      setDraftDefinition(nextDraft);
      setSelectedNodeId(nextDraft.steps[0]?.id ?? null);
      setPlan(null);
      setRun(null);
      setStatusText("Draft ready. Review metadata, inputs, constraints, and graph before saving.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Draft request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!draftDefinition) {
      setStatusText("Draft a workflow before saving.");
      return;
    }

    setIsBusy(true);
    setStatusText("Saving workflow to marketplace...");
    try {
      const result = await backendApi.saveWorkflow(draftDefinition);
      setStatusText(`Saved ${result.workflowId} to the backend workflow catalog.`);
      setWorkflows((current) => {
        const withoutSaved = current.filter((workflow) => workflow.id !== draftDefinition.id);
        return [...withoutSaved, draftDefinition].sort((left, right) => left.title.localeCompare(right.title));
      });
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Save request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const updateDraft = (updater: (definition: WorkflowDefinition) => WorkflowDefinition) => {
    setDraftDefinition((current) => (current ? updater(current) : current));
  };

  const updateDraftInput = (
    index: number,
    field: "name" | "description" | "required",
    value: string | boolean,
  ) => {
    updateDraft((definition) => ({
      ...definition,
      inputs: definition.inputs.map((input, inputIndex) =>
        inputIndex === index ? { ...input, [field]: value } : input,
      ),
    }));
  };

  const updateDraftConstraint = (
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    updateDraft((definition) => ({
      ...definition,
      constraints: definition.constraints.map((constraint, constraintIndex) =>
        constraintIndex === index ? { ...constraint, [field]: value } : constraint,
      ),
    }));
  };

  return (
    <main
      style={{
        ...styles.page,
        gridTemplateColumns: isCompact ? "1fr" : "440px minmax(0, 1fr)",
      }}
    >
      <aside style={isCompact ? styles.sidebarCompact : styles.sidebar}>
        <div style={styles.sidebarTopRow}>
          <div style={styles.sidebarTitleBlock}>
            <p style={styles.sidebarEyebrow}>{mode === "author" ? "Workflow author" : "Backend workflow"}</p>
            <h1 style={styles.sidebarTitle}>
              {mode === "author" ? "Create a reusable workflow" : "Plan and run from live state"}
            </h1>
          </div>
          <div style={styles.sidebarActions}>
            {onBack ? (
              <button onClick={onBack} style={styles.secondaryIconButton} type="button">
                Home
              </button>
            ) : null}
          </div>
        </div>

        <div className="workflow-sidebar-scroll" style={styles.sidebarScrollArea}>
          {mode === "author" ? (
            <>
              <section style={styles.briefCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <p style={styles.sectionEyebrow}>Author</p>
                    <h2 style={styles.sectionTitle}>Describe the workflow to create</h2>
                  </div>
                </div>

                <label htmlFor="workflow-draft-domain" style={styles.promptLabel}>
                  Domain
                </label>
                <select
                  disabled={isBusy}
                  id="workflow-draft-domain"
                  onChange={(event) => setDraftDomain(event.target.value as WorkflowDomain)}
                  style={styles.selectInput}
                  value={draftDomain}
                >
                  <option value="food">Food</option>
                  <option value="instamart">Instamart</option>
                  <option value="dineout">Dineout</option>
                  <option value="multi-domain">Multi-domain</option>
                </select>

                <label htmlFor="workflow-draft-description" style={styles.promptLabel}>
                  Workflow brief
                </label>
                <textarea
                  disabled={isBusy}
                  id="workflow-draft-description"
                  onChange={(event) => setDraftDescription(event.target.value)}
                  rows={7}
                  style={styles.promptInput}
                  value={draftDescription}
                />

                <button disabled={isBusy} onClick={generateDraft} style={styles.generateButton} type="button">
                  Draft workflow
                </button>
              </section>

              {draftDefinition ? (
                <section style={styles.briefCard}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <p style={styles.sectionEyebrow}>Metadata</p>
                      <h2 style={styles.sectionTitle}>Editable workflow definition</h2>
                    </div>
                  </div>

                  <label style={styles.fieldBlock}>
                    <span style={styles.promptLabel}>Title</span>
                    <input
                      onChange={(event) =>
                        updateDraft((definition) => ({ ...definition, title: event.target.value }))
                      }
                      style={styles.textInput}
                      value={draftDefinition.title}
                    />
                  </label>

                  <label style={styles.fieldBlock}>
                    <span style={styles.promptLabel}>Summary</span>
                    <textarea
                      onChange={(event) =>
                        updateDraft((definition) => ({ ...definition, summary: event.target.value }))
                      }
                      rows={4}
                      style={styles.promptInput}
                      value={draftDefinition.summary}
                    />
                  </label>

                  <label style={styles.fieldBlock}>
                    <span style={styles.promptLabel}>Goal</span>
                    <textarea
                      onChange={(event) =>
                        updateDraft((definition) => ({ ...definition, goal: event.target.value }))
                      }
                      rows={4}
                      style={styles.promptInput}
                      value={draftDefinition.goal}
                    />
                  </label>
                </section>
              ) : null}
            </>
          ) : (
            <>
              <section style={styles.briefCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <p style={styles.sectionEyebrow}>Catalog</p>
                    <h2 style={styles.sectionTitle}>Choose a backend workflow</h2>
                  </div>
                </div>

                <select
                  disabled={workflows.length === 0 || isBusy}
                  onChange={(event) => setSelectedWorkflowId(event.target.value)}
                  style={styles.selectInput}
                  value={selectedWorkflowId ?? ""}
                >
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.title}
                    </option>
                  ))}
                </select>

                {selectedWorkflow ? (
                  <div style={styles.domainSummaryCard}>
                    <div>
                      <p style={styles.domainSummaryTitle}>{selectedWorkflow.title}</p>
                      <p style={styles.domainSummaryText}>{selectedWorkflow.summary}</p>
                    </div>
                    <div style={styles.domainSummaryMeta}>
                      <span style={styles.metaPill}>{domainLabels[selectedWorkflow.domain]}</span>
                      <span style={styles.metaPill}>{selectedWorkflow.tools.length} backend tools</span>
                      <span style={styles.metaPill}>{selectedWorkflow.approvalPoints.length} approvals</span>
                    </div>
                  </div>
                ) : null}
              </section>

              {selectedWorkflow ? (
                <section style={styles.briefCard}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <p style={styles.sectionEyebrow}>Inputs</p>
                      <h2 style={styles.sectionTitle}>Payload sent to planning and run APIs</h2>
                    </div>
                  </div>

                  <div style={styles.inputGrid}>
                    {selectedWorkflow.inputs.map((field) => (
                      <label key={field.name} style={styles.fieldBlock}>
                        <span style={styles.promptLabel}>
                          {field.name}
                          {field.required ? " *" : ""}
                        </span>
                        <span style={styles.fieldHelp}>{field.description}</span>
                        {field.type === "boolean" ? (
                          <select
                            onChange={(event) => updatePayloadField(field, event.target.value)}
                            style={styles.selectInput}
                            value={String(Boolean(payload[field.name]))}
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <textarea
                            onChange={(event) => updatePayloadField(field, event.target.value)}
                            rows={field.type === "array" || field.type === "object" ? 5 : 2}
                            style={styles.promptInput}
                            value={inputToString(payload[field.name])}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </aside>

      <section style={styles.canvasArea}>
        <div style={styles.canvasBackdrop} />

        <div style={styles.canvasHeader}>
          <div style={styles.canvasHeaderCopy}>
            <p style={styles.canvasEyebrow}>{mode === "author" ? "Draft preview" : "Live backend board"}</p>
            <h2 style={styles.canvasTitle}>
              {activeDefinition ? activeDefinition.title : "Workflow execution graph"}
            </h2>
            <p style={styles.canvasSubtitle}>{plan?.summary || activeDefinition?.goal || statusText}</p>
          </div>

          <div style={styles.canvasHeaderActions}>
            {mode === "author" ? (
              <>
                <button disabled={isBusy || !draftDefinition} onClick={saveDraft} style={styles.generateButton} type="button">
                  Save to marketplace
                </button>
                <button disabled={isBusy} onClick={() => setMode("run")} style={styles.canvasSecondaryButton} type="button">
                  Run mode
                </button>
              </>
            ) : (
              <>
                <button disabled={isBusy || !selectedWorkflow} onClick={createPlan} style={styles.canvasSecondaryButton} type="button">
                  Create plan
                </button>
                <button disabled={isBusy || !selectedWorkflow} onClick={startRun} style={styles.generateButton} type="button">
                  Start run
                </button>
                <button disabled={isBusy} onClick={() => setMode("author")} style={styles.canvasSecondaryButton} type="button">
                  Author mode
                </button>
              </>
            )}
          </div>
        </div>

        <div style={styles.canvasMetaBar}>
          <span style={styles.canvasMetaPill}>{domainLabels[activeDomain]}</span>
          <span style={styles.canvasMetaPill}>{totalStepCount} steps on board</span>
          <span style={styles.canvasMetaPill}>
            {mode === "author" ? (draftDefinition ? "drafted" : "not drafted") : run ? formatStatus(run.status) : plan ? "planned" : "not planned"}
          </span>
        </div>

        <div
          style={{
            ...styles.workspaceLayout,
            gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1fr) 300px",
          }}
        >
          <div style={styles.flowColumn}>
            <div style={styles.guardrailStrip}>
              {(plan?.constraints ?? activeDefinition?.constraints ?? []).slice(0, 3).map((item) => (
                <article key={item.id} style={styles.guardrailTile}>
                  <p style={styles.guardrailLabel}>{item.type}</p>
                  <p style={styles.guardrailValue}>{item.title}</p>
                </article>
              ))}
            </div>

            <section style={styles.flowShell}>
              <div style={styles.flowShellHeader}>
                <div>
                  <p style={styles.flowShellEyebrow}>Execution map</p>
                  <h3 style={styles.flowShellTitle}>Workflow graph</h3>
                </div>
                <div style={run?.status === "waiting_for_approval" ? styles.flowStatusBadge : styles.flowStatusBadgeMuted}>
                  {statusText}
                </div>
              </div>

              <div style={styles.flowViewport}>
                <ReactFlow
                  defaultEdgeOptions={{ type: "smoothstep" }}
                  edges={flowEdges}
                  elementsSelectable
                  fitView={steps.length > 0}
                  fitViewOptions={{ padding: 0.42, maxZoom: 1.02 }}
                  maxZoom={1.4}
                  minZoom={0.6}
                  nodes={flowNodes}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  nodeTypes={nodeTypes}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  panOnDrag
                  panOnScroll
                  proOptions={{ hideAttribution: true }}
                  selectionOnDrag={false}
                  style={styles.reactFlow}
                  zoomOnDoubleClick={false}
                  zoomOnPinch
                  zoomOnScroll
                >
                  <Background
                    color="rgba(255, 82, 0, 0.05)"
                    gap={32}
                    lineWidth={1}
                    variant={BackgroundVariant.Dots}
                  />
                  <Controls showFitView={steps.length > 0} style={styles.flowControls} />
                </ReactFlow>

                {steps.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyCard}>
                      <p style={styles.emptyKicker}>{mode === "author" ? "Draft required" : "Backend plan required"}</p>
                      <p style={styles.emptyTitle}>
                        {mode === "author"
                          ? "Describe and draft a workflow to preview its graph."
                          : "Create a plan to draw the execution graph."}
                      </p>
                      <p style={styles.emptyText}>{statusText}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside style={styles.inspectorRail}>
            {mode === "author" ? (
              <div style={styles.inspectorSection}>
                <p style={styles.inspectorEyebrow}>Editable schema</p>
                <h3 style={styles.inspectorTitle}>{draftDefinition ? "Inputs and constraints" : "No draft yet"}</h3>
                {draftDefinition ? (
                  <div style={styles.metadataList}>
                    <p style={styles.inspectorText}>
                      {draftDefinition.inputs.length} inputs, {draftDefinition.constraints.length} constraints,{" "}
                      {draftDefinition.approvalPoints.length} approval points
                    </p>

                    <div style={styles.metadataGroup}>
                      <p style={styles.metadataGroupTitle}>Inputs</p>
                      {draftDefinition.inputs.map((field, index) => (
                        <div key={`${field.name}-${index}`} style={styles.metadataItem}>
                          <input
                            onChange={(event) => updateDraftInput(index, "name", event.target.value)}
                            style={styles.textInput}
                            value={field.name}
                          />
                          <textarea
                            onChange={(event) => updateDraftInput(index, "description", event.target.value)}
                            rows={3}
                            style={styles.compactTextarea}
                            value={field.description}
                          />
                          <label style={styles.checkboxRow}>
                            <input
                              checked={field.required}
                              onChange={(event) => updateDraftInput(index, "required", event.target.checked)}
                              type="checkbox"
                            />
                            Required
                          </label>
                        </div>
                      ))}
                    </div>

                    <div style={styles.metadataGroup}>
                      <p style={styles.metadataGroupTitle}>Constraints</p>
                      {draftDefinition.constraints.map((constraint, index) => (
                        <div key={`${constraint.id}-${index}`} style={styles.metadataItem}>
                          <input
                            onChange={(event) => updateDraftConstraint(index, "title", event.target.value)}
                            style={styles.textInput}
                            value={constraint.title}
                          />
                          <textarea
                            onChange={(event) => updateDraftConstraint(index, "description", event.target.value)}
                            rows={3}
                            style={styles.compactTextarea}
                            value={constraint.description}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={styles.inspectorText}>Draft a workflow to edit its metadata before saving.</p>
                )}
              </div>
            ) : (
              <div style={styles.inspectorSection}>
                <p style={styles.inspectorEyebrow}>Run state</p>
                <h3 style={styles.inspectorTitle}>{run ? run.runId : "No active run"}</h3>
                <div style={styles.progressMetric}>
                  <span style={styles.progressValue}>{completedStepCount}</span>
                  <span style={styles.progressLabel}>of {totalStepCount} completed</span>
                </div>
                <p style={styles.inspectorText}>{run?.pendingApproval?.message || plan?.nextAction || statusText}</p>
                {run?.status === "waiting_for_approval" ? (
                  <div style={styles.approvalActions}>
                    <button disabled={isBusy} onClick={() => approveRun(true)} style={styles.generateButton} type="button">
                      Approve
                    </button>
                    <button disabled={isBusy} onClick={() => approveRun(false)} style={styles.canvasSecondaryButton} type="button">
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <div style={styles.inspectorSection}>
              <p style={styles.inspectorEyebrow}>Selected step</p>
              {selectedStep ? (
                <>
                  <h3 style={styles.inspectorTitle}>{selectedStep.title}</h3>
                  <p style={styles.inspectorText}>{selectedStep.description || selectedStep.toolName}</p>
                  <div style={styles.selectedMetaList}>
                    <span style={styles.selectedMetaChip}>{domainLabels[selectedStep.domain]}</span>
                    <span style={styles.selectedMetaChip}>{selectedStep.stage}</span>
                    <span style={styles.selectedMetaChip}>{nodeStateLabel[selectedStep.state]}</span>
                  </div>
                </>
              ) : (
                <p style={styles.inspectorText}>Select a graph node to inspect backend step details.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
