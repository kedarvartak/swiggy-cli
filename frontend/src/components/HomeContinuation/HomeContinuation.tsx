import { homeContinuationStyles as styles } from "./styles";

const logo = "https://www.swiggy.com/corporate/wp-content/uploads/2024/10/swiggy-logo.webp";

const workflowSteps = [
  {
    kind: "INPUT",
    title: "Capture constraints",
    text: "Collect location, budget, dietary rules, timing, and surface before any tool runs.",
  },
  {
    kind: "TOOL-CALL",
    title: "Search and plan",
    text: "Discover restaurants, groceries, or dineout choices with every constraint visible.",
  },
  {
    kind: "APPROVAL",
    title: "Review before action",
    text: "Inspect the cart or reservation candidate before checkout, booking, or placement.",
  },
];

const metrics = [
  { value: "3", label: "Swiggy surfaces in one workflow model" },
  { value: "4+", label: "Tool calls planned, inspected, and approved" },
  { value: "1", label: "Human review before any irreversible action" },
];

export function HomeContinuation() {
  return (
    <>
      <section style={styles.section}>
        <div style={styles.inner}>

          {/* ── Left: copy + metrics ────────────────────────────────── */}
          <div style={styles.copy}>
            <p style={styles.kicker}>Agentic ordering</p>
            <h2 style={styles.title}>From one prompt to a reviewed Swiggy plan.</h2>
            <p style={styles.body}>
              Build food, Instamart, and dineout flows that feel fast without
              hiding the important parts. Constraints, tool movement, and approvals
              stay visible before anything is ordered.
            </p>
            <div style={styles.metricRow}>
              {metrics.map((m) => (
                <div key={m.value} style={styles.metric}>
                  <p style={styles.metricValue}>{m.value}</p>
                  <p style={styles.metricLabel}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: workflow preview panel ───────────────────────── */}
          <div style={styles.workflowPanel}>
            <div style={styles.panelTop}>
              <div>
                <p style={styles.panelEyebrow}>Live preview</p>
                <p style={styles.panelTitle}>Healthy meal workflow</p>
              </div>
              <span style={styles.statusPill}>Ready to run</span>
            </div>
            <div style={styles.stepList}>
              {workflowSteps.map((step) => (
                <article key={step.title} style={styles.stepCard}>
                  <div style={styles.stepCardTop}>
                    <span style={styles.stepKind}>{step.kind}</span>
                    <span style={styles.stepState}>Pending</span>
                  </div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepText}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <img alt="Swiggy" src={logo} style={styles.footerLogo} />
            <p style={styles.footerTagline}>
              Food, groceries, and dineout — now with workflow-grade control.
            </p>
          </div>
          <nav aria-label="Footer navigation" style={styles.footerLinks}>
            <a href="#/" style={styles.footerLink}>Home</a>
            <a href="#/workflows" style={styles.footerLink}>Workflows</a>
            <a href="#/workflow-creation?mode=author" style={styles.footerLinkPrimary}>
              Create workflow →
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
