import { consoleStyles } from "./styles";
import { runStages } from "./utils";

const stateStyles = {
  complete: { background: "rgba(82, 215, 145, 0.16)", color: "#8af0bd" },
  active: {
    background: "rgba(252, 108, 45, 0.18)",
    color: "#ffb788",
    animation: "pulseGlow 2.4s ease-in-out infinite",
  },
  pending: { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.72)" },
} as const;

export function ExecutionConsole() {
  return (
    <section style={consoleStyles.wrap}>
      <div style={consoleStyles.shell}>
        <div style={consoleStyles.topbar}>
          <span style={{ ...consoleStyles.dot, background: "#ff7e73" }} />
          <span style={{ ...consoleStyles.dot, background: "#ffca59" }} />
          <span style={{ ...consoleStyles.dot, background: "#3cd28b" }} />
        </div>

        <div style={consoleStyles.body}>
          {runStages.map((stage) => (
            <article key={stage.title} style={consoleStyles.stage}>
              <div
                style={{
                  ...consoleStyles.badge,
                  ...stateStyles[stage.state],
                }}
              >
                {stage.state}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{stage.title}</h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", lineHeight: 1.6 }}>
                  {stage.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
