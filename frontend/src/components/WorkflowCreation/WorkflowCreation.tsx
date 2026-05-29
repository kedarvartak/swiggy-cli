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
  if (field.example !== undefined) return field.example;
  if (field.type === "number") return 1;
  if (field.type === "boolean") return true;
  if (field.type === "array") return [];
  if (field.type === "object") return {};
  return "";
}

function inputToString(value: JsonValue | undefined) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function parseInputValue(field: WorkflowInputField, value: string): JsonValue {
  if (field.type === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.type === "boolean") return value === "true";
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
  if (nodeCount <= 3) return Math.max(nodeCount, 1);
  if (nodeCount <= 6) return 3;
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
  if (status === "completed") return "done";
  if (status === "running") return "running";
  if (status === "waiting_for_approval") return "waiting";
  if (status === "failed" || status === "cancelled") return "failed";
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
    data.state === "done" ? styles.nodeStateDone
    : data.state === "running" ? styles.nodeStateRunning
    : data.state === "waiting" ? styles.nodeStateWaiting
    : data.state === "failed" ? styles.nodeStateFailed
    : data.state === "blocked" ? styles.nodeStateBlocked
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

const nodeTypes: NodeTypes = { workflowNode: FlowWorkflowNode };

// ─── Modal base ────────────────────────────────────────────────────────────

function ModalBase({
  title,
  kicker,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  kicker?: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={wide ? styles.modalDialogWide : styles.modalDialog}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitleGroup}>
            {kicker && <p style={styles.modalKicker}>{kicker}</p>}
            <h2 style={styles.modalTitle}>{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} style={styles.modalClose} type="button">
              ✕
            </button>
          )}
        </div>
        <div style={styles.modalBody}>{children}</div>
        {footer && <div style={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

const studioImages = {
  logo: "https://www.swiggy.com/corporate/wp-content/uploads/2024/10/swiggy-logo.webp",
} as const;

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

  const [showDescribeModal, setShowDescribeModal] = useState(
    initialMode === "author" && !initialWorkflowId,
  );
  const [showInputsModal, setShowInputsModal] = useState(initialMode === "run");
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    let cancelled = false;
    backendApi
      .listWorkflows()
      .then((catalog) => {
        if (cancelled) return;
        setWorkflows(catalog);
        const nextWorkflowId = initialWorkflowId ?? catalog[0]?.id ?? null;
        setSelectedWorkflowId(nextWorkflowId);
        setStatusText(
          initialMode === "author"
            ? "Describe a workflow to draft it."
            : catalog.length > 0
              ? "Configure inputs and run."
              : "No workflows available.",
        );
      })
      .catch((error: Error) => {
        if (!cancelled) setStatusText(`Backend unavailable: ${error.message}`);
      });
    return () => { cancelled = true; };
  }, [initialMode, initialWorkflowId]);

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId) ?? null;
  const activeDefinition = mode === "author" ? draftDefinition : selectedWorkflow;

  useEffect(() => {
    if (!selectedWorkflow || mode !== "run") return;
    setPayload(payloadFromWorkflow(selectedWorkflow));
    setPlan(null);
    setRun(null);
    setSelectedNodeId(null);
  }, [mode, selectedWorkflow]);

  useEffect(() => {
    if (!selectedWorkflow || mode !== "author" || !initialWorkflowId) return;
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
        state: run.pendingApproval?.stepId === step.id ? "waiting" : runStatusToNodeState(step.status),
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
    if (draftDefinition) return definitionToBoardSteps(draftDefinition);
    return [];
  }, [draftDefinition, plan, run]);

  const selectedStep = steps.find((s) => s.id === selectedNodeId) ?? null;
  const completedStepCount = run?.summary.completedSteps ?? steps.filter((s) => s.state === "done").length;
  const totalStepCount = run?.summary.totalSteps ?? steps.length;
  const activeDomain = activeDefinition?.domain ?? plan?.domain ?? run?.domain ?? draftDomain;
  const activeConstraints = plan?.constraints ?? activeDefinition?.constraints ?? [];

  const flowNodes = useMemo<Node<FlowNodeData>[]>(() =>
    layoutSteps(steps).map((step) => ({
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
    })),
    [selectedNodeId, steps],
  );

  const flowEdges = useMemo(() => buildFlowEdges(steps, plan), [plan, steps]);

  const updatePayloadField = (field: WorkflowInputField, value: string) => {
    setPayload((cur) => ({ ...cur, [field.name]: parseInputValue(field, value) }));
  };

  const generateDraft = async () => {
    const description = draftDescription.trim();
    if (!description) { setStatusText("Describe the workflow before drafting."); return; }
    setIsBusy(true);
    setStatusText("Drafting workflow...");
    try {
      const nextDraft = await backendApi.draftWorkflow(description, draftDomain);
      setDraftDefinition(nextDraft);
      setSelectedNodeId(nextDraft.steps[0]?.id ?? null);
      setPlan(null);
      setRun(null);
      setStatusText("Draft ready. Review and save to marketplace.");
      setShowDescribeModal(false);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Draft request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const createPlan = async () => {
    if (!selectedWorkflow) return;
    setIsBusy(true);
    setStatusText("Creating plan...");
    try {
      const nextPlan = await backendApi.createPlan(selectedWorkflow.id, payload);
      setPlan(nextPlan);
      setRun(null);
      setSelectedNodeId(nextPlan.steps[0]?.id ?? null);
      setStatusText(nextPlan.nextAction);
      setShowInputsModal(false);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Plan request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const startRun = async () => {
    if (!selectedWorkflow) return;
    setIsBusy(true);
    setStatusText("Starting run...");
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
    if (!run) return;
    setIsBusy(true);
    setStatusText(approved ? "Approving..." : "Rejecting...");
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

  const saveDraft = async () => {
    if (!draftDefinition) { setStatusText("Draft a workflow before saving."); return; }
    setIsBusy(true);
    setStatusText("Saving to marketplace...");
    try {
      const result = await backendApi.saveWorkflow(draftDefinition);
      setStatusText(`Saved ${result.workflowId}.`);
      setWorkflows((cur) => {
        const without = cur.filter((w) => w.id !== draftDefinition.id);
        return [...without, draftDefinition].sort((a, b) => a.title.localeCompare(b.title));
      });
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Save request failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const updateDraft = (updater: (d: WorkflowDefinition) => WorkflowDefinition) => {
    setDraftDefinition((cur) => (cur ? updater(cur) : cur));
  };

  const updateDraftInput = (index: number, field: "name" | "description" | "required", value: string | boolean) => {
    updateDraft((d) => ({
      ...d,
      inputs: d.inputs.map((inp, i) => (i === index ? { ...inp, [field]: value } : inp)),
    }));
  };

  const updateDraftConstraint = (index: number, field: "title" | "description", value: string) => {
    updateDraft((d) => ({
      ...d,
      constraints: d.constraints.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const runStatusLabel =
    mode === "author"
      ? draftDefinition ? "drafted" : "not drafted"
      : run ? formatStatus(run.status) : plan ? "planned" : "not planned";

  return (
    <main style={styles.page}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <nav style={styles.topBar}>
        <button aria-label="Back to home" onClick={onBack} style={styles.logoButton} type="button">
          <img alt="Swiggy" src={studioImages.logo} style={styles.logo} />
        </button>

        <div style={styles.topBarCenter}>
          <span style={styles.topBarMode}>{mode === "author" ? "Workflow Studio" : "Workflow Runner"}</span>
          {activeDefinition && <span style={styles.topBarSep}>·</span>}
          {activeDefinition && <span style={styles.topBarName}>{activeDefinition.title}</span>}
        </div>

        <div style={styles.topBarActions}>
          {mode === "author" ? (
            <>
              <button onClick={() => setShowDescribeModal(true)} style={styles.topBarSecondary} type="button">
                {draftDefinition ? "Re-describe" : "Describe workflow"}
              </button>
              {draftDefinition && (
                <button onClick={() => setShowMetadataModal(true)} style={styles.topBarSecondary} type="button">
                  Edit metadata
                </button>
              )}
              <button disabled={isBusy || !draftDefinition} onClick={saveDraft} style={styles.topBarPrimary} type="button">
                Save to marketplace
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowInputsModal(true)} style={styles.topBarSecondary} type="button">
                Configure inputs
              </button>
              {plan && !run && (
                <button disabled={isBusy} onClick={startRun} style={styles.topBarPrimary} type="button">
                  Start run
                </button>
              )}
            </>
          )}
          <button
            onClick={() => {
              const next = mode === "author" ? "run" : "author";
              setMode(next);
              if (next === "author") setShowDescribeModal(!draftDefinition);
              else setShowInputsModal(true);
            }}
            style={styles.topBarSecondary}
            type="button"
          >
            {mode === "author" ? "Run mode" : "Author mode"}
          </button>
        </div>
      </nav>

      {/* ── Canvas ────────────────────────────────────────────────────── */}
      <div style={styles.canvasArea}>
        <div style={styles.canvasBackdrop} />

        {/* Meta pills */}
        <div style={styles.canvasMetaBar}>
          <span style={styles.canvasMetaPill}>{domainLabels[activeDomain]}</span>
          <span style={styles.canvasMetaPill}>{totalStepCount} steps</span>
          <span style={styles.canvasMetaPill}>{runStatusLabel}</span>
          {run && <span style={run.status === "waiting_for_approval" ? styles.canvasMetaPillAlert : styles.canvasMetaPill}>{statusText}</span>}
        </div>

        {/* Guardrail strip (only if there are constraints) */}
        {activeConstraints.length > 0 && (
          <div style={styles.guardrailStrip}>
            {activeConstraints.slice(0, 4).map((item) => (
              <article key={item.id} style={styles.guardrailTile}>
                <p style={styles.guardrailLabel}>{item.type}</p>
                <p style={styles.guardrailValue}>{item.title}</p>
              </article>
            ))}
          </div>
        )}

        {/* React Flow */}
        <div style={styles.flowContainer}>
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
            <Background color="rgba(255, 82, 0, 0.05)" gap={32} lineWidth={1} variant={BackgroundVariant.Dots} />
            <Controls showFitView={steps.length > 0} style={styles.flowControls} />
          </ReactFlow>

          {/* Empty state */}
          {steps.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyCard}>
                <p style={styles.emptyKicker}>{mode === "author" ? "Draft required" : "Plan required"}</p>
                <p style={styles.emptyTitle}>
                  {mode === "author"
                    ? "Describe a workflow to see its execution graph."
                    : "Configure inputs and create a plan to see the graph."}
                </p>
                <p style={styles.emptyText}>{statusText}</p>
                {mode === "author" ? (
                  <button onClick={() => setShowDescribeModal(true)} style={styles.emptyAction} type="button">
                    Describe workflow
                  </button>
                ) : (
                  <button onClick={() => setShowInputsModal(true)} style={styles.emptyAction} type="button">
                    Configure inputs
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Run progress badge */}
          {run && run.status !== "waiting_for_approval" && (
            <div style={styles.runProgressBadge}>
              {completedStepCount} / {totalStepCount} · {formatStatus(run.status)}
            </div>
          )}

          {/* Floating step inspector */}
          {selectedStep && (
            <div style={styles.floatingInspector}>
              <div style={styles.floatingInspectorHeader}>
                <p style={styles.inspectorEyebrow}>Selected step</p>
                <button onClick={() => setSelectedNodeId(null)} style={styles.inspectorCloseBtn} type="button">✕</button>
              </div>
              <h3 style={styles.inspectorTitle}>{selectedStep.title}</h3>
              <p style={styles.inspectorText}>{selectedStep.description || selectedStep.toolName}</p>
              <div style={styles.selectedMetaList}>
                <span style={styles.selectedMetaChip}>{domainLabels[selectedStep.domain]}</span>
                <span style={styles.selectedMetaChip}>{selectedStep.stage}</span>
                <span style={styles.selectedMetaChip}>{nodeStateLabel[selectedStep.state]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Describe workflow modal — left: orange brand panel, right: form */}
      {showDescribeModal && (
        <ModalBase
          footer={
            <button disabled={isBusy} onClick={generateDraft} style={styles.modalPrimary} type="button">
              {isBusy ? "Generating…" : "Draft workflow"}
            </button>
          }
          kicker="Workflow Studio"
          onClose={draftDefinition ? () => setShowDescribeModal(false) : undefined}
          title="Describe your workflow"
        >
          <div style={styles.modalBody}>
            <div style={styles.modalPanelOrange}>
              <p style={styles.modalPanelHeading}>Build a reusable workflow</p>
              <p style={styles.modalPanelText}>
                Describe the outcome you want. The AI will structure it into steps, inputs, constraints, and approval gates.
              </p>
              <p style={styles.modalPanelText}>
                Include budget, dietary rules, timing, or any preferences — the more specific, the better the draft.
              </p>
            </div>
            <div style={styles.modalPanelRight}>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>Domain</span>
                <select
                  disabled={isBusy}
                  onChange={(e) => setDraftDomain(e.target.value as WorkflowDomain)}
                  style={styles.selectInput}
                  value={draftDomain}
                >
                  <option value="food">Food</option>
                  <option value="instamart">Instamart</option>
                  <option value="dineout">Dineout</option>
                  <option value="multi-domain">Multi-domain</option>
                </select>
              </label>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>What should it do?</span>
                <textarea
                  disabled={isBusy}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={7}
                  style={styles.promptInput}
                  value={draftDescription}
                />
              </label>
            </div>
          </div>
        </ModalBase>
      )}

      {/* Configure inputs modal — left: workflow info, right: input fields */}
      {showInputsModal && (
        <ModalBase
          footer={
            <div style={styles.modalFooterRow}>
              <button onClick={() => setShowInputsModal(false)} style={styles.modalSecondary} type="button">
                Cancel
              </button>
              <button disabled={isBusy || !selectedWorkflow} onClick={createPlan} style={styles.modalPrimary} type="button">
                {isBusy ? "Planning…" : "Create plan"}
              </button>
            </div>
          }
          kicker="Configure & run"
          onClose={() => setShowInputsModal(false)}
          title={selectedWorkflow?.title ?? "Configure workflow"}
          wide
        >
          <div style={styles.modalBody}>
            <div style={styles.modalPanelLeft}>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>Workflow</span>
                <select
                  disabled={workflows.length === 0 || isBusy}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  style={styles.selectInput}
                  value={selectedWorkflowId ?? ""}
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              </label>
              {selectedWorkflow && (
                <>
                  <p style={styles.modalInfoSummary}>{selectedWorkflow.summary}</p>
                  <div style={styles.modalInfoChips}>
                    <span style={styles.modalInfoChip}>{domainLabels[selectedWorkflow.domain]}</span>
                    <span style={styles.modalInfoChip}>{selectedWorkflow.tools.length} tools</span>
                    <span style={styles.modalInfoChip}>{selectedWorkflow.approvalPoints.length} approvals</span>
                  </div>
                </>
              )}
            </div>
            <div style={styles.modalPanelRight}>
              {selectedWorkflow && selectedWorkflow.inputs.length > 0 ? (
                selectedWorkflow.inputs.map((field) => (
                  <label key={field.name} style={styles.fieldBlock}>
                    <span style={styles.promptLabel}>
                      {field.name}{field.required ? " *" : ""}
                    </span>
                    <span style={styles.fieldHelp}>{field.description}</span>
                    {field.type === "boolean" ? (
                      <select
                        onChange={(e) => updatePayloadField(field, e.target.value)}
                        style={styles.selectInput}
                        value={String(Boolean(payload[field.name]))}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <textarea
                        onChange={(e) => updatePayloadField(field, e.target.value)}
                        rows={field.type === "array" || field.type === "object" ? 4 : 2}
                        style={styles.promptInput}
                        value={inputToString(payload[field.name])}
                      />
                    )}
                  </label>
                ))
              ) : (
                <p style={styles.modalPanelLabel}>No inputs required for this workflow.</p>
              )}
            </div>
          </div>
        </ModalBase>
      )}

      {/* Edit metadata modal — left: about fields, right: inputs + constraints */}
      {showMetadataModal && draftDefinition && (
        <ModalBase
          footer={
            <button onClick={() => setShowMetadataModal(false)} style={styles.modalPrimary} type="button">
              Done
            </button>
          }
          kicker="Draft metadata"
          onClose={() => setShowMetadataModal(false)}
          title="Edit workflow metadata"
          wide
        >
          <div style={styles.modalBody}>
            <div style={styles.modalPanelLeft}>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>Title</span>
                <input
                  onChange={(e) => updateDraft((d) => ({ ...d, title: e.target.value }))}
                  style={styles.textInput}
                  value={draftDefinition.title}
                />
              </label>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>Summary</span>
                <textarea
                  onChange={(e) => updateDraft((d) => ({ ...d, summary: e.target.value }))}
                  rows={3}
                  style={styles.promptInput}
                  value={draftDefinition.summary}
                />
              </label>
              <label style={styles.fieldBlock}>
                <span style={styles.promptLabel}>Goal</span>
                <textarea
                  onChange={(e) => updateDraft((d) => ({ ...d, goal: e.target.value }))}
                  rows={3}
                  style={styles.promptInput}
                  value={draftDefinition.goal}
                />
              </label>
            </div>
            <div style={styles.modalPanelRight}>
              {draftDefinition.inputs.length > 0 && (
                <div style={styles.metadataGroup}>
                  <p style={styles.metadataGroupTitle}>Inputs ({draftDefinition.inputs.length})</p>
                  {draftDefinition.inputs.map((field, index) => (
                    <div key={`${field.name}-${index}`} style={styles.metadataItem}>
                      <input
                        onChange={(e) => updateDraftInput(index, "name", e.target.value)}
                        style={styles.textInput}
                        value={field.name}
                      />
                      <textarea
                        onChange={(e) => updateDraftInput(index, "description", e.target.value)}
                        rows={2}
                        style={styles.compactTextarea}
                        value={field.description}
                      />
                      <label style={styles.checkboxRow}>
                        <input
                          checked={field.required}
                          onChange={(e) => updateDraftInput(index, "required", e.target.checked)}
                          type="checkbox"
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {draftDefinition.constraints.length > 0 && (
                <div style={styles.metadataGroup}>
                  <p style={styles.metadataGroupTitle}>Constraints ({draftDefinition.constraints.length})</p>
                  {draftDefinition.constraints.map((constraint, index) => (
                    <div key={`${constraint.id}-${index}`} style={styles.metadataItem}>
                      <input
                        onChange={(e) => updateDraftConstraint(index, "title", e.target.value)}
                        style={styles.textInput}
                        value={constraint.title}
                      />
                      <textarea
                        onChange={(e) => updateDraftConstraint(index, "description", e.target.value)}
                        rows={2}
                        style={styles.compactTextarea}
                        value={constraint.description}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalBase>
      )}

      {/* Approval modal — simple vertical, no split needed */}
      {run?.status === "waiting_for_approval" && (
        <ModalBase kicker="Action required" title="Approval required">
          <div style={styles.modalPanelSingle}>
            <p style={styles.approvalMessage}>{run.pendingApproval?.message}</p>
            <div style={styles.approvalActions}>
              <button disabled={isBusy} onClick={() => approveRun(true)} style={styles.modalPrimary} type="button">
                Approve
              </button>
              <button disabled={isBusy} onClick={() => approveRun(false)} style={styles.modalSecondary} type="button">
                Reject
              </button>
            </div>
          </div>
        </ModalBase>
      )}
    </main>
  );
}
