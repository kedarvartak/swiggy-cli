import { useEffect, useState } from "react";

import { WorkflowCreation } from "./components/WorkflowCreation/WorkflowCreation";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { WorkflowStudio } from "./components/WorkflowStudio/WorkflowStudio";
import { layout } from "./global/styles";

const WORKFLOW_HASH = "#/workflows";
const WORKFLOW_CREATION_HASH = "#/workflow-creation";

function getCurrentView() {
  if (window.location.hash.startsWith(WORKFLOW_CREATION_HASH)) {
    return "workflowCreation" as const;
  }

  return window.location.hash === WORKFLOW_HASH ? ("workflows" as const) : ("home" as const);
}

function getSelectedWorkflowId() {
  const [, query = ""] = window.location.hash.split("?");
  return new URLSearchParams(query).get("workflow");
}

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "workflows" | "workflowCreation">(
    getCurrentView,
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(getSelectedWorkflowId);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(getCurrentView());
      setSelectedWorkflowId(getSelectedWorkflowId());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openWorkflows = () => {
    window.location.hash = WORKFLOW_HASH;
  };

  const openWorkflowCreation = (workflowId?: string) => {
    window.location.hash = workflowId
      ? `${WORKFLOW_CREATION_HASH}?workflow=${encodeURIComponent(workflowId)}`
      : WORKFLOW_CREATION_HASH;
  };

  const goHome = () => {
    window.location.hash = "";
  };

  return (
    <main style={layout.page}>
      <div style={layout.shell}>
        {currentView === "home" ? (
          <HeroSection onTryWorkflows={openWorkflows} />
        ) : currentView === "workflows" ? (
          <WorkflowStudio onBack={goHome} onOpenCreation={openWorkflowCreation} />
        ) : (
          <WorkflowCreation initialWorkflowId={selectedWorkflowId} onBack={goHome} />
        )}
      </div>
    </main>
  );
}
