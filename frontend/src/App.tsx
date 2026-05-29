import { useEffect, useState } from "react";

import { WorkflowCreation } from "./components/WorkflowCreation/WorkflowCreation";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { HomeContinuation } from "./components/HomeContinuation/HomeContinuation";
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

function getWorkflowCreationMode() {
  const [, query = ""] = window.location.hash.split("?");
  const mode = new URLSearchParams(query).get("mode");
  return mode === "run" ? ("run" as const) : ("author" as const);
}

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "workflows" | "workflowCreation">(
    getCurrentView,
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(getSelectedWorkflowId);
  const [workflowCreationMode, setWorkflowCreationMode] = useState<"author" | "run">(
    getWorkflowCreationMode,
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(getCurrentView());
      setSelectedWorkflowId(getSelectedWorkflowId());
      setWorkflowCreationMode(getWorkflowCreationMode());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openWorkflows = () => {
    window.location.hash = WORKFLOW_HASH;
  };

  const openWorkflowCreation = (workflowId?: string, mode: "author" | "run" = workflowId ? "run" : "author") => {
    window.location.hash = workflowId
      ? `${WORKFLOW_CREATION_HASH}?workflow=${encodeURIComponent(workflowId)}&mode=${mode}`
      : `${WORKFLOW_CREATION_HASH}?mode=${mode}`;
  };

  const goHome = () => {
    window.location.hash = "";
  };

  return (
    <main style={layout.page}>
      <div style={layout.shell}>
        {currentView === "home" ? (
          <>
            <HeroSection onTryWorkflows={openWorkflows} />
            <HomeContinuation />
          </>
        ) : currentView === "workflows" ? (
          <WorkflowStudio onBack={goHome} onOpenCreation={openWorkflowCreation} />
        ) : (
          <WorkflowCreation
            initialMode={workflowCreationMode}
            initialWorkflowId={selectedWorkflowId}
            onBack={goHome}
          />
        )}
      </div>
    </main>
  );
}
