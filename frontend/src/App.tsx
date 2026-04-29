import { DomainMatrix } from "./components/DomainMatrix/DomainMatrix";
import { ExecutionConsole } from "./components/ExecutionConsole/ExecutionConsole";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { WorkflowShowcase } from "./components/WorkflowShowcase/WorkflowShowcase";
import { layout } from "./global/styles";

export default function App() {
  return (
    <main style={layout.page}>
      <div style={layout.shell}>
        <HeroSection />
        <WorkflowShowcase />
        <DomainMatrix />
        <ExecutionConsole />
      </div>
    </main>
  );
}
