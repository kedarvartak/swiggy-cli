import { clampLabel, workflowVerb } from "../../global/utils";
import { showcaseStyles } from "./styles";
import { workflowCards } from "./utils";

export function WorkflowShowcase() {
  return (
    <section style={showcaseStyles.section}>
      <header style={showcaseStyles.header}>
        <div>
          <h2 style={showcaseStyles.title}>Workflow families</h2>
          <p style={showcaseStyles.subtitle}>
            Each flow is designed as an agentic sequence, not just a raw tool
            list. The UI should make users feel the chain of reasoning, inputs,
            guardrails, and confirmations behind every run.
          </p>
        </div>
      </header>

      <div style={showcaseStyles.rail}>
        {workflowCards.map((card) => (
          <article key={card.title} style={showcaseStyles.card}>
            <h3 style={showcaseStyles.cardTitle}>{card.title}</h3>
            <p style={showcaseStyles.tools}>
              {card.tools.length} {workflowVerb(card.tools.length)} ·{" "}
              {clampLabel(card.tools)}
            </p>
            <p style={showcaseStyles.summary}>{card.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
