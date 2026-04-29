import { matrixStyles } from "./styles";
import { domains } from "./utils";

export function DomainMatrix() {
  return (
    <section style={matrixStyles.section}>
      <div style={matrixStyles.board}>
        <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Domain coverage</h2>
        <p style={{ margin: "8px 0 0", color: "#5d6a81", lineHeight: 1.6 }}>
          The UI should make it obvious that Swiggy workflows are not one
          product. They are multiple product surfaces with different rules,
          parameters, and consequences.
        </p>

        <div style={matrixStyles.grid}>
          {domains.map((domain) => (
            <article
              key={domain.name}
              style={{ ...matrixStyles.domainCard, background: domain.accent }}
            >
              <h3 style={matrixStyles.domainTitle}>{domain.name}</h3>
              <ul style={matrixStyles.bulletList}>
                {domain.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <aside style={matrixStyles.sidePanel}>
        <p
          style={{
            margin: 0,
            color: "#db4d13",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontSize: "0.8rem",
          }}
        >
          Design note
        </p>
        <h3 style={{ margin: "10px 0 12px", fontSize: "1.45rem" }}>
          Show certainty, not clutter
        </h3>
        <p style={{ margin: 0, color: "#445067", lineHeight: 1.7 }}>
          This product should feel operational. Users need to see what the
          agent knows, what it still needs, and what it is about to do. The UI
          should highlight approvals, risky actions, and tool-by-tool movement
          through the workflow.
        </p>
      </aside>
    </section>
  );
}
