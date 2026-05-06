import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { workflowCreationStyles as styles } from "./styles";

type DomainKey = "food" | "dineout" | "instamart";
type NodeState = "draft" | "running" | "done" | "waiting";

type ToolCard = {
  name: string;
  label: string;
  stage: string;
  description: string;
};

type CanvasNode = {
  id: string;
  toolName: string;
  title: string;
  stage: string;
  domain: DomainKey;
  x: number;
  y: number;
  state: NodeState;
};

const toolGroups: Record<
  DomainKey,
  {
    label: string;
    tools: ToolCard[];
  }
> = {
  food: {
    label: "Food",
    tools: [
      { name: "get_addresses", label: "Get addresses", stage: "Discover", description: "Load saved delivery addresses." },
      { name: "search_restaurants", label: "Search restaurants", stage: "Discover", description: "Find restaurants for delivery." },
      { name: "search_menu", label: "Search menu", stage: "Discover", description: "Search dishes and menu items." },
      { name: "get_restaurant_menu", label: "Get restaurant menu", stage: "Discover", description: "Browse restaurant menu categories." },
      { name: "update_food_cart", label: "Update food cart", stage: "Cart", description: "Add or update food items in cart." },
      { name: "get_food_cart", label: "Get food cart", stage: "Cart", description: "Inspect active food cart." },
      { name: "fetch_food_coupons", label: "Fetch food coupons", stage: "Cart", description: "Get offers for the current cart." },
      { name: "apply_food_coupon", label: "Apply food coupon", stage: "Cart", description: "Apply a coupon to the cart." },
      { name: "flush_food_cart", label: "Flush food cart", stage: "Cart", description: "Clear the food cart." },
      { name: "place_food_order", label: "Place food order", stage: "Order", description: "Place a food order." },
      { name: "get_food_orders", label: "Get food orders", stage: "Track", description: "Fetch active food orders." },
      { name: "get_food_order_details", label: "Get food order details", stage: "Track", description: "Inspect one order deeply." },
      { name: "track_food_order", label: "Track food order", stage: "Track", description: "Track delivery progress." },
      { name: "report_error", label: "Report error", stage: "Support", description: "Escalate MCP errors." },
    ],
  },
  dineout: {
    label: "Dineout",
    tools: [
      { name: "get_saved_locations", label: "Get saved locations", stage: "Find", description: "Load dineout search locations." },
      { name: "search_restaurants_dineout", label: "Search restaurants", stage: "Find", description: "Find dineout venues." },
      { name: "get_restaurant_details", label: "Get restaurant details", stage: "Find", description: "Inspect timings, deals, and address." },
      { name: "get_available_slots", label: "Get available slots", stage: "Reserve", description: "Check live reservation slots." },
      { name: "create_cart", label: "Create booking cart", stage: "Reserve", description: "Prepare reservation state." },
      { name: "book_table", label: "Book table", stage: "Reserve", description: "Confirm a table booking." },
      { name: "get_booking_status", label: "Get booking status", stage: "Manage", description: "Track reservation status." },
      { name: "report_error", label: "Report error", stage: "Support", description: "Escalate MCP errors." },
    ],
  },
  instamart: {
    label: "Instamart",
    tools: [
      { name: "get_addresses", label: "Get addresses", stage: "Discover", description: "Load grocery delivery addresses." },
      { name: "create_address", label: "Create address", stage: "Discover", description: "Add a new address." },
      { name: "delete_address", label: "Delete address", stage: "Discover", description: "Remove a saved address." },
      { name: "search_products", label: "Search products", stage: "Discover", description: "Find products and variants." },
      { name: "your_go_to_items", label: "Your go-to items", stage: "Discover", description: "Fetch frequent grocery items." },
      { name: "update_cart", label: "Update cart", stage: "Cart", description: "Build or replace grocery cart." },
      { name: "get_cart", label: "Get cart", stage: "Cart", description: "Inspect Instamart cart." },
      { name: "clear_cart", label: "Clear cart", stage: "Cart", description: "Clear grocery cart." },
      { name: "checkout", label: "Checkout", stage: "Order", description: "Place grocery order." },
      { name: "get_orders", label: "Get orders", stage: "Track", description: "Fetch grocery orders." },
      { name: "get_order_details", label: "Get order details", stage: "Track", description: "Inspect one order deeply." },
      { name: "track_order", label: "Track order", stage: "Track", description: "Track grocery delivery." },
      { name: "report_error", label: "Report error", stage: "Support", description: "Escalate MCP errors." },
    ],
  },
};

const promptSuggestions: Record<DomainKey, string> = {
  food: "Find the best biryani near Koramangala, inspect menu, add the top option to cart, then pause.",
  dineout: "Find dinner places in Indiranagar, check 8pm slots for 4 people, and prepare a booking.",
  instamart: "Build a weekly grocery cart for 2 people under ₹1800 with essentials and snacks.",
};

const promptTemplates: Record<DomainKey, Omit<CanvasNode, "id" | "x" | "y" | "state">[]> = {
  food: [
    { toolName: "get_addresses", title: "Resolve delivery context", stage: "Discover", domain: "food" },
    { toolName: "search_restaurants", title: "Search restaurant options", stage: "Discover", domain: "food" },
    { toolName: "get_restaurant_menu", title: "Inspect menu", stage: "Discover", domain: "food" },
    { toolName: "update_food_cart", title: "Prepare cart", stage: "Cart", domain: "food" },
    { toolName: "get_food_cart", title: "Await approval", stage: "Cart", domain: "food" },
  ],
  dineout: [
    { toolName: "get_saved_locations", title: "Resolve location", stage: "Find", domain: "dineout" },
    { toolName: "search_restaurants_dineout", title: "Search venues", stage: "Find", domain: "dineout" },
    { toolName: "get_available_slots", title: "Check slots", stage: "Reserve", domain: "dineout" },
    { toolName: "create_cart", title: "Prepare booking state", stage: "Reserve", domain: "dineout" },
    { toolName: "book_table", title: "Await approval", stage: "Reserve", domain: "dineout" },
  ],
  instamart: [
    { toolName: "get_addresses", title: "Resolve grocery address", stage: "Discover", domain: "instamart" },
    { toolName: "search_products", title: "Search products", stage: "Discover", domain: "instamart" },
    { toolName: "your_go_to_items", title: "Pull repeat items", stage: "Discover", domain: "instamart" },
    { toolName: "update_cart", title: "Build grocery cart", stage: "Cart", domain: "instamart" },
    { toolName: "get_cart", title: "Await approval", stage: "Cart", domain: "instamart" },
  ],
};

type WorkflowCreationProps = {
  onBack?: () => void;
};

export function WorkflowCreation(_: WorkflowCreationProps) {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("food");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [prompt, setPrompt] = useState(promptSuggestions.food);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<"idle" | "drafting" | "ready">("idle");
  const [executionIndex, setExecutionIndex] = useState(-1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPrompt(promptSuggestions[activeDomain]);
  }, [activeDomain]);

  useEffect(() => {
    if (generationPhase !== "drafting") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const draftNodes = promptTemplates[activeDomain].map((step, index) => ({
        ...step,
        id: `${activeDomain}-${Date.now()}-${index}`,
        x: 120 + index * 210,
        y: 170 + (index % 2) * 110,
        state: "draft" as NodeState,
      }));

      setNodes(draftNodes);
      setSelectedNodeId(draftNodes[0]?.id ?? null);
      setGenerationPhase("ready");
      setExecutionIndex(0);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [activeDomain, generationPhase]);

  useEffect(() => {
    if (generationPhase !== "ready" || executionIndex < 0 || nodes.length === 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setExecutionIndex((current) => {
        if (current >= nodes.length - 1) {
          return current;
        }

        return current + 1;
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [executionIndex, generationPhase, nodes.length]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node, index) => {
        if (generationPhase !== "ready") {
          return { ...node, state: "draft" };
        }

        if (index < executionIndex) {
          return { ...node, state: "done" };
        }

        if (index === executionIndex && index < current.length - 1) {
          return { ...node, state: "running" };
        }

        if (index === current.length - 1 && executionIndex >= current.length - 1) {
          return { ...node, state: "waiting" };
        }

        return { ...node, state: "draft" };
      }),
    );
  }, [executionIndex, generationPhase]);

  useEffect(() => {
    if (!draggingNodeId) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === draggingNodeId
            ? {
                ...node,
                x: Math.max(24, event.clientX - dragOffset.x),
                y: Math.max(92, event.clientY - dragOffset.y),
              }
            : node,
        ),
      );
    };

    const handleMouseUp = () => {
      setDraggingNodeId(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragOffset.x, dragOffset.y, draggingNodeId]);

  const activeGroup = toolGroups[activeDomain];
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const groupedTools = useMemo(() => {
    const map = new Map<string, ToolCard[]>();

    activeGroup.tools.forEach((tool) => {
      const list = map.get(tool.stage) ?? [];
      list.push(tool);
      map.set(tool.stage, list);
    });

    return Array.from(map.entries());
  }, [activeGroup.tools]);

  const addToolNode = (tool: ToolCard) => {
    const nextNode: CanvasNode = {
      id: `${tool.name}-${Date.now()}`,
      toolName: tool.name,
      title: tool.label,
      stage: tool.stage,
      domain: activeDomain,
      x: 96 + (nodes.length % 4) * 220,
      y: 120 + Math.floor(nodes.length / 4) * 120,
      state: "draft",
    };

    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(nextNode.id);
    setGenerationPhase("idle");
    setExecutionIndex(-1);
  };

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const toolName = event.dataTransfer.getData("text/plain");
    const tool = activeGroup.tools.find((entry) => entry.name === toolName);

    if (!tool) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const nextNode: CanvasNode = {
      id: `${tool.name}-${Date.now()}`,
      toolName: tool.name,
      title: tool.label,
      stage: tool.stage,
      domain: activeDomain,
      x: event.clientX - rect.left - 90,
      y: event.clientY - rect.top - 36,
      state: "draft",
    };

    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(nextNode.id);
    setGenerationPhase("idle");
    setExecutionIndex(-1);
  };

  const handlePromptDraft = () => {
    setGenerationPhase("drafting");
    setExecutionIndex(-1);
  };

  const startNodeDrag = (event: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setSelectedNodeId(nodeId);
  };

  return (
    <main style={styles.page}>
      <aside style={isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebar}>
        <div style={styles.sidebarTopRow}>
          {!isSidebarCollapsed ? <p style={styles.sidebarTitle}>Workflow creation</p> : null}
          <button
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            style={styles.collapseButton}
            type="button"
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
        </div>

        <div style={styles.domainTabs}>
          {(Object.entries(toolGroups) as [DomainKey, (typeof toolGroups)[DomainKey]][]).map(([key, group]) => (
            <button
              key={key}
              onClick={() => setActiveDomain(key)}
              style={key === activeDomain ? styles.domainTabActive : styles.domainTab}
              type="button"
            >
              {isSidebarCollapsed ? group.label.slice(0, 1) : group.label}
            </button>
          ))}
        </div>

        {!isSidebarCollapsed ? (
          <div style={styles.sidebarBody}>
            {groupedTools.map(([stage, tools]) => (
              <section key={stage} style={styles.stageSection}>
                <p style={styles.stageLabel}>{stage}</p>
                <div style={styles.toolList}>
                  {tools.map((tool) => (
                    <button
                      key={`${activeDomain}-${tool.name}`}
                      draggable
                      onClick={() => addToolNode(tool)}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", tool.name)}
                      style={styles.toolCard}
                      type="button"
                    >
                      <div style={styles.toolTitle}>{tool.label}</div>
                      <div style={styles.toolName}>{tool.name}</div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </aside>

      <section
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleCanvasDrop}
        style={styles.canvasArea}
      >
        <div style={styles.canvasToolbar}>
          <textarea
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the workflow you want to create..."
            style={styles.promptInput}
            value={prompt}
          />
          <button onClick={handlePromptDraft} style={styles.generateButton} type="button">
            Start from prompt
          </button>
        </div>

        {generationPhase === "drafting" ? <div style={styles.draftingBadge}>Generating workflow on canvas</div> : null}

        {nodes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>Drag tools here to start building.</p>
            <p style={styles.emptyText}>
              Use the left panel to drop MCP tools into the canvas, or generate a first draft from the prompt bar.
            </p>
          </div>
        ) : null}

        <div style={styles.canvasGrid} />

        {nodes.map((node, index) => (
          <div
            key={node.id}
            onMouseDown={(event) => startNodeDrag(event, node.id)}
            onClick={() => setSelectedNodeId(node.id)}
            style={{
              ...(selectedNodeId === node.id ? styles.canvasNodeActive : styles.canvasNode),
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
          >
            <div style={styles.nodeStage}>{node.stage}</div>
            <div style={styles.nodeTitle}>{node.title}</div>
            <div style={styles.nodeTool}>{node.toolName}</div>
            <div
              style={
                node.state === "done"
                  ? styles.nodeStateDone
                  : node.state === "running"
                    ? styles.nodeStateRunning
                    : node.state === "waiting"
                      ? styles.nodeStateWaiting
                      : styles.nodeStateDraft
              }
            >
              {node.state}
            </div>
            {index < nodes.length - 1 ? <div style={styles.connector} /> : null}
          </div>
        ))}

        {selectedNode ? (
          <div style={styles.selectionPanel}>
            <div style={styles.selectionLabel}>Selected block</div>
            <div style={styles.selectionTitle}>{selectedNode.title}</div>
            <div style={styles.selectionMeta}>{selectedNode.toolName}</div>
            <div style={styles.selectionMeta}>{toolGroups[selectedNode.domain].label}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
