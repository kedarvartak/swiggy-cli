import { useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
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

import { workflowCreationStyles as styles } from "./styles";

type DomainKey = "food" | "dineout" | "instamart";
type NodeState = "draft" | "running" | "done" | "waiting";

type WorkflowStep = {
  id: string;
  toolName: string;
  title: string;
  stage: string;
  domain: DomainKey;
  state: NodeState;
};

type FlowNodeData = {
  title: string;
  toolName: string;
  stage: string;
  state: NodeState;
  isSelected: boolean;
};

const domainConfigs: Record<
  DomainKey,
  {
    label: string;
    subtitle: string;
    audience: string;
    guardrail: string;
    toolCount: number;
  }
> = {
  food: {
    label: "Food",
    subtitle: "Repeat meal decisions with budget and approval rules already baked in.",
    audience: "Quick meals",
    guardrail: "Pause before final order placement",
    toolCount: 14,
  },
  dineout: {
    label: "Dineout",
    subtitle: "Shape reservation workflows around plan, slot, and reviewable booking intent.",
    audience: "Plans and reservations",
    guardrail: "Hold on the booking cart until approval",
    toolCount: 8,
  },
  instamart: {
    label: "Instamart",
    subtitle: "Turn repeat restocking into saved grocery playbooks instead of rebuilt carts.",
    audience: "Restocks and staples",
    guardrail: "Check substitutions and budget before checkout",
    toolCount: 13,
  },
};

const promptSuggestions: Record<DomainKey, string[]> = {
  food: [
    "Order my usual weekday lunch under ₹250 and stop before payment.",
    "Compare biryani options near Koramangala, build the best value cart, then wait.",
    "Find a high-protein dinner under 30 minutes with one vegetarian option.",
  ],
  dineout: [
    "Find a dinner place for 4 in Indiranagar tonight, shortlist top options, and hold a booking.",
    "Plan a date-night reservation with indoor seating and a spend-friendly deal.",
    "Check 8pm table availability near MG Road and prepare the best booking option.",
  ],
  instamart: [
    "Restock weekly groceries for 2 people under ₹1800 and allow smart substitutions.",
    "Refill breakfast staples and fruit for the week with a 20-minute delivery preference.",
    "Rebuild my monthly pantry basics and pause before checkout.",
  ],
};

const promptTemplates: Record<DomainKey, Omit<WorkflowStep, "id" | "state">[]> = {
  food: [
    { toolName: "get_addresses", title: "Resolve delivery context", stage: "Discover", domain: "food" },
    { toolName: "search_restaurants", title: "Rank likely restaurant picks", stage: "Discover", domain: "food" },
    { toolName: "get_restaurant_menu", title: "Inspect menu depth", stage: "Discover", domain: "food" },
    { toolName: "update_food_cart", title: "Prepare the cart", stage: "Cart", domain: "food" },
    { toolName: "get_food_cart", title: "Pause for approval", stage: "Approval", domain: "food" },
  ],
  dineout: [
    { toolName: "get_saved_locations", title: "Resolve plan location", stage: "Find", domain: "dineout" },
    { toolName: "search_restaurants_dineout", title: "Shortlist venues", stage: "Find", domain: "dineout" },
    { toolName: "get_available_slots", title: "Check live reservation slots", stage: "Reserve", domain: "dineout" },
    { toolName: "create_cart", title: "Prepare booking state", stage: "Reserve", domain: "dineout" },
    { toolName: "book_table", title: "Pause for approval", stage: "Approval", domain: "dineout" },
  ],
  instamart: [
    { toolName: "get_addresses", title: "Resolve grocery address", stage: "Discover", domain: "instamart" },
    { toolName: "your_go_to_items", title: "Pull repeat items", stage: "Discover", domain: "instamart" },
    { toolName: "search_products", title: "Fill missing essentials", stage: "Discover", domain: "instamart" },
    { toolName: "update_cart", title: "Build the grocery cart", stage: "Cart", domain: "instamart" },
    { toolName: "get_cart", title: "Pause for approval", stage: "Approval", domain: "instamart" },
  ],
};

const guardrailCards: Record<DomainKey, { label: string; value: string }[]> = {
  food: [
    { label: "Budget cap", value: "₹250 to ₹450" },
    { label: "Preference bias", value: "Prioritize usual orders" },
    { label: "Final action", value: "Manual approval" },
  ],
  dineout: [
    { label: "Party setup", value: "2 to 6 people" },
    { label: "Time sensitivity", value: "Slot-first ranking" },
    { label: "Final action", value: "Manual approval" },
  ],
  instamart: [
    { label: "Budget cap", value: "₹1,500 to ₹2,500" },
    { label: "Substitutions", value: "Allow like-for-like swaps" },
    { label: "Final action", value: "Manual approval" },
  ],
};

const nodeStateLabel: Record<NodeState, string> = {
  draft: "Drafted",
  running: "Executing",
  done: "Completed",
  waiting: "Awaiting approval",
};

const FLOW_NODE_WIDTH = 248;
const FLOW_NODE_HEIGHT = 132;
const FLOW_COLUMN_GAP = 88;
const FLOW_ROW_GAP = 156;

function getColumnCount(nodeCount: number) {
  if (nodeCount <= 3) {
    return nodeCount;
  }

  if (nodeCount <= 6) {
    return 3;
  }

  return 4;
}

function layoutSteps(steps: WorkflowStep[]) {
  const columnCount = Math.max(getColumnCount(steps.length), 1);

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

function buildFlowEdges(steps: WorkflowStep[]) {
  return steps.slice(0, -1).map((step, index) => {
    const nextStep = steps[index + 1];
    const isActivePath = step.state === "done" || step.state === "running";

    return {
      id: `edge-${step.id}-${nextStep.id}`,
      source: step.id,
      target: nextStep.id,
      type: "smoothstep",
      animated: step.state === "running",
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

function FlowWorkflowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div style={data.isSelected ? styles.flowNodeCardActive : styles.flowNodeCard}>
      <Handle position={Position.Left} style={styles.flowHandle} type="target" />
      <div style={styles.flowNodeTopRow}>
        <span style={styles.flowNodeStage}>{data.stage}</span>
        <span
          style={
            data.state === "done"
              ? styles.nodeStateDone
              : data.state === "running"
                ? styles.nodeStateRunning
                : data.state === "waiting"
                  ? styles.nodeStateWaiting
                  : styles.nodeStateDraft
          }
        >
          {nodeStateLabel[data.state]}
        </span>
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
  onBack?: () => void;
};

export function WorkflowCreation({ onBack }: WorkflowCreationProps) {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("food");
  const [prompt, setPrompt] = useState(promptSuggestions.food[0]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<"idle" | "drafting" | "ready">("idle");
  const [executionIndex, setExecutionIndex] = useState(-1);
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 1180);

  useEffect(() => {
    setPrompt(promptSuggestions[activeDomain][0]);
    setSteps([]);
    setSelectedNodeId(null);
    setGenerationPhase("idle");
    setExecutionIndex(-1);
  }, [activeDomain]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1180);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (generationPhase !== "drafting") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const draftSteps = promptTemplates[activeDomain].map((step, index) => ({
        ...step,
        id: `${activeDomain}-${Date.now()}-${index}`,
        state: "draft" as NodeState,
      }));

      setSteps(draftSteps);
      setSelectedNodeId(draftSteps[0]?.id ?? null);
      setGenerationPhase("ready");
      setExecutionIndex(0);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [activeDomain, generationPhase]);

  useEffect(() => {
    if (generationPhase !== "ready" || executionIndex < 0 || steps.length === 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setExecutionIndex((current) => {
        if (current >= steps.length - 1) {
          return current;
        }

        return current + 1;
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [executionIndex, generationPhase, steps.length]);

  useEffect(() => {
    setSteps((current) =>
      current.map((step, index) => {
        if (generationPhase !== "ready") {
          return { ...step, state: "draft" };
        }

        if (index < executionIndex) {
          return { ...step, state: "done" };
        }

        if (index === executionIndex && index < current.length - 1) {
          return { ...step, state: "running" };
        }

        if (index === current.length - 1 && executionIndex >= current.length - 1) {
          return { ...step, state: "waiting" };
        }

        return { ...step, state: "draft" };
      }),
    );
  }, [executionIndex, generationPhase]);

  const activeGroup = domainConfigs[activeDomain];
  const selectedStep = steps.find((step) => step.id === selectedNodeId) ?? null;
  const completedStepCount = steps.filter((step) => step.state === "done").length;

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

  const flowEdges = useMemo(() => buildFlowEdges(steps), [steps]);

  const handlePromptDraft = () => {
    setGenerationPhase("drafting");
    setExecutionIndex(-1);
  };

  const resetWorkflow = () => {
    setSteps([]);
    setSelectedNodeId(null);
    setGenerationPhase("idle");
    setExecutionIndex(-1);
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
            <p style={styles.sidebarEyebrow}>Creator studio</p>
            <h1 style={styles.sidebarTitle}>Design a reusable Swiggy playbook</h1>
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
          <section style={styles.briefCard}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionEyebrow}>Intent first</p>
                <h2 style={styles.sectionTitle}>What should this workflow achieve?</h2>
              </div>
            </div>

            <div style={styles.domainTabs}>
              {(Object.entries(domainConfigs) as [DomainKey, (typeof domainConfigs)[DomainKey]][]).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => setActiveDomain(key)}
                  style={key === activeDomain ? styles.domainTabActive : styles.domainTab}
                  type="button"
                >
                  <span style={styles.domainTabTitle}>{group.label}</span>
                  <span style={styles.domainTabCopy}>{group.audience}</span>
                </button>
              ))}
            </div>

            <div style={styles.domainSummaryCard}>
              <div>
                <p style={styles.domainSummaryTitle}>{activeGroup.label}</p>
                <p style={styles.domainSummaryText}>{activeGroup.subtitle}</p>
              </div>
              <div style={styles.domainSummaryMeta}>
                <span style={styles.metaPill}>{activeGroup.toolCount} MCP tools underneath</span>
                <span style={styles.metaPill}>{activeGroup.guardrail}</span>
              </div>
            </div>

            <label htmlFor="workflow-prompt" style={styles.promptLabel}>
              Workflow brief
            </label>
            <textarea
              id="workflow-prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the repeat outcome, user preferences, and when execution should pause."
              style={styles.promptInput}
              value={prompt}
            />

            <div style={styles.suggestionRail}>
              {promptSuggestions[activeDomain].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  style={styles.suggestionChip}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <section style={styles.canvasArea}>
        <div style={styles.canvasBackdrop} />

        <div style={styles.canvasHeader}>
          <div style={styles.canvasHeaderCopy}>
            <p style={styles.canvasEyebrow}>Generated runbook</p>
            <h2 style={styles.canvasTitle}>Live plan board for {activeGroup.label.toLowerCase()} workflows</h2>
            <p style={styles.canvasSubtitle}>
              Users describe the outcome in plain language. The system turns that brief into a clear execution graph with approvals, visible progress, and a final review step.
            </p>
          </div>

          <div style={styles.canvasHeaderActions}>
            <button onClick={resetWorkflow} style={styles.canvasSecondaryButton} type="button">
              Clear board
            </button>
            <button onClick={handlePromptDraft} style={styles.generateButton} type="button">
              Generate runbook
            </button>
          </div>
        </div>

        <div style={styles.canvasMetaBar}>
          <span style={styles.canvasMetaPill}>{activeGroup.label}</span>
          <span style={styles.canvasMetaPill}>{steps.length || 0} steps on board</span>
          <span style={styles.canvasMetaPill}>{activeGroup.guardrail}</span>
        </div>

        <div
          style={{
            ...styles.workspaceLayout,
            gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1fr) 300px",
          }}
        >
          <div style={styles.flowColumn}>
            <div style={styles.guardrailStrip}>
              {guardrailCards[activeDomain].map((item) => (
                <article key={item.label} style={styles.guardrailTile}>
                  <p style={styles.guardrailLabel}>{item.label}</p>
                  <p style={styles.guardrailValue}>{item.value}</p>
                </article>
              ))}
            </div>

            <section style={styles.flowShell}>
              <div style={styles.flowShellHeader}>
                <div>
                  <p style={styles.flowShellEyebrow}>Execution map</p>
                  <h3 style={styles.flowShellTitle}>Workflow graph</h3>
                </div>
                {generationPhase === "drafting" ? (
                  <div style={styles.flowStatusBadge}>Drafting the runbook graph</div>
                ) : (
                  <div style={styles.flowStatusBadgeMuted}>
                    {steps.length > 0 ? "Graph centered around the execution path" : "Generate to preview the graph"}
                  </div>
                )}
              </div>

              <div style={styles.flowViewport}>
                {steps.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyCard}>
                      <p style={styles.emptyKicker}>Start with intent</p>
                      <p style={styles.emptyTitle}>Describe the outcome, then let the graph show the plan.</p>
                      <p style={styles.emptyText}>
                        This workspace should feel like a saved playbook taking shape. Generate from the brief to see a centered flow with a readable execution path and approval stop.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ReactFlow
                    defaultEdgeOptions={{ type: "smoothstep" }}
                    edges={flowEdges}
                    elementsSelectable
                    fitView
                    fitViewOptions={{ padding: 0.28, maxZoom: 1.05 }}
                    nodes={flowNodes}
                    nodesConnectable={false}
                    nodesDraggable={false}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    panOnDrag={false}
                    panOnScroll={false}
                    proOptions={{ hideAttribution: true }}
                    selectionOnDrag={false}
                    style={styles.reactFlow}
                    zoomOnDoubleClick={false}
                    zoomOnPinch={false}
                    zoomOnScroll={false}
                  >
                    <Background
                      color="rgba(255, 82, 0, 0.08)"
                      gap={28}
                      lineWidth={1}
                      variant={BackgroundVariant.Dots}
                    />
                  </ReactFlow>
                )}
              </div>
            </section>
          </div>

          <aside style={styles.inspectorRail}>
            <div style={styles.inspectorSection}>
              <p style={styles.inspectorEyebrow}>Execution view</p>
              <h3 style={styles.inspectorTitle}>Workflow status</h3>
              <div style={styles.progressMetric}>
                <span style={styles.progressValue}>{completedStepCount}</span>
                <span style={styles.progressLabel}>completed steps</span>
              </div>
              <p style={styles.inspectorText}>
                {generationPhase === "ready"
                  ? "The workflow is simulating a real execution path and will stop at the approval node."
                  : "Generate a runbook to preview the graph users will trust before final action."}
              </p>
            </div>

            <div style={styles.inspectorSection}>
              <p style={styles.inspectorEyebrow}>Selected step</p>
              {selectedStep ? (
                <>
                  <h3 style={styles.inspectorTitle}>{selectedStep.title}</h3>
                  <p style={styles.inspectorText}>{selectedStep.toolName}</p>
                  <div style={styles.selectedMetaList}>
                    <span style={styles.selectedMetaChip}>{domainConfigs[selectedStep.domain].label}</span>
                    <span style={styles.selectedMetaChip}>{selectedStep.stage}</span>
                    <span style={styles.selectedMetaChip}>{nodeStateLabel[selectedStep.state]}</span>
                  </div>
                </>
              ) : (
                <p style={styles.inspectorText}>Select a graph node to inspect the generated step details.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
