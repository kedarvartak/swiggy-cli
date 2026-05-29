import { useEffect, useMemo, useState } from "react";

import { backendApi, type WorkflowDefinition } from "../../api/backend";
import { workflowStudioStyles as styles } from "./styles";

const workflowImages = {
  logo: "https://www.swiggy.com/corporate/wp-content/uploads/2024/10/swiggy-logo.webp",
} as const;

const cardImages = [
  "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2025/5/14/43e3c412-4ca9-4894-82ba-24b69da80aa6_06c0d2a9-804c-4bf1-8725-7ebd234e144a",
  "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2025/5/14/097900ca-5d2d-4bb0-8e54-aede1e58dfd8_eab3796c-ac17-48fd-bfc7-6356c6f89783",
  "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2024/7/6/4342c814-6ff9-4bbe-a360-95200ad602a0_1905dc17-a04d-4a9e-9a4e-adde9b27f321",
] as const;

type WorkflowStudioProps = {
  onBack?: () => void;
  onOpenCreation?: (workflowId?: string, mode?: "author" | "run") => void;
};

export function WorkflowStudio({ onBack, onOpenCreation }: WorkflowStudioProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backendApi
      .listWorkflows()
      .then((catalog) => {
        if (cancelled) return;
        setWorkflows(catalog);
        setLoadState("ready");
      })
      .catch((caught: Error) => {
        if (cancelled) return;
        setError(caught.message);
        setLoadState("error");
      });
    return () => { cancelled = true; };
  }, []);

  const workflowCards = useMemo(
    () =>
      workflows.map((workflow, index) => ({
        ...workflow,
        image: cardImages[index % cardImages.length],
        type: `${workflow.domain} / ${workflow.difficulty} / ${workflow.tools.length} tools`,
      })),
    [workflows],
  );

  return (
    <main style={styles.page}>

      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <button aria-label="Back to home page" onClick={onBack} style={styles.logoButton} type="button">
          <img alt="Swiggy" src={workflowImages.logo} style={styles.logo} />
        </button>

        <div style={styles.navCenter}>
          <span style={styles.navTitle}>Workflow catalog</span>
          {loadState === "ready" && (
            <span style={styles.navCount}>{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div style={styles.navActions}>
          <button onClick={() => onOpenCreation?.(undefined, "author")} style={styles.createButton} type="button">
            + New workflow
          </button>
          <button onClick={onBack} style={styles.backButton} type="button">
            Home
          </button>
        </div>
      </nav>

      {/* ── Catalog grid ─────────────────────────────────────────────── */}
      <section style={styles.section}>
        {loadState === "loading" ? (
          <div style={styles.statusPanel}>Loading workflow catalog…</div>
        ) : loadState === "error" ? (
          <div style={styles.statusPanel}>Backend catalog unavailable: {error}</div>
        ) : workflows.length === 0 ? (
          <div style={styles.emptyPanel}>
            <p style={styles.emptyTitle}>No workflows yet</p>
            <p style={styles.emptyText}>Create your first workflow to see it here.</p>
            <button onClick={() => onOpenCreation?.(undefined, "author")} style={styles.emptyCta} type="button">
              Create workflow
            </button>
          </div>
        ) : (
          <div style={styles.marketplaceGrid}>
            {workflowCards.map((workflow) => (
              <article key={workflow.id} style={styles.marketCard}>
                <div style={styles.imageFrame}>
                  <img alt={workflow.title} src={workflow.image} style={styles.cardImage} />
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.marketType}>{workflow.type}</p>
                  <h2 style={styles.marketTitle}>{workflow.title}</h2>
                  <p style={styles.marketSummary}>{workflow.summary}</p>
                  <div style={styles.tagRow}>
                    {workflow.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={styles.tagPill}>{tag}</span>
                    ))}
                  </div>
                  <div style={styles.cardActionRow}>
                    <button
                      onClick={() => onOpenCreation?.(workflow.id, "run")}
                      style={styles.cardButton}
                      type="button"
                    >
                      Run
                    </button>
                    <button
                      onClick={() => onOpenCreation?.(workflow.id, "author")}
                      style={styles.cardSecondaryButton}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
