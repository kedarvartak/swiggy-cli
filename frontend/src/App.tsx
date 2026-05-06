import { useEffect, useState } from "react";

import { WorkflowCreation } from "./components/WorkflowCreation/WorkflowCreation";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { WorkflowStudio } from "./components/WorkflowStudio/WorkflowStudio";
import { layout } from "./global/styles";

const WORKFLOW_HASH = "#/workflows";
const WORKFLOW_CREATION_HASH = "#/workflow-creation";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "workflows" | "workflowCreation">(() => {
    if (window.location.hash === WORKFLOW_CREATION_HASH) {
      return "workflowCreation";
    }

    return window.location.hash === WORKFLOW_HASH ? "workflows" : "home";
  },
  );

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === WORKFLOW_CREATION_HASH) {
        setCurrentView("workflowCreation");
        return;
      }

      setCurrentView(window.location.hash === WORKFLOW_HASH ? "workflows" : "home");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const openWorkflows = () => {
    window.location.hash = WORKFLOW_HASH;
  };

  const openWorkflowCreation = () => {
    window.location.hash = WORKFLOW_CREATION_HASH;
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
          <WorkflowCreation onBack={goHome} />
        )}
      </div>
    </main>
  );
}
