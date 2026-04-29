export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Swiggy Workspace</p>
        <h1>Workflow UI Scaffold</h1>
        <p className="copy">
          This frontend will sit on top of the shared backend and eventually
          orchestrate Food, Instamart, and Dineout workflows.
        </p>
      </section>

      <section className="cards">
        <article className="card">
          <h2>CLI</h2>
          <p>Existing TypeScript command-line interface moved into `cli/`.</p>
        </article>
        <article className="card">
          <h2>Backend</h2>
          <p>Shared Python service layer for workflow execution and API access.</p>
        </article>
        <article className="card">
          <h2>Frontend</h2>
          <p>React app scaffold for workflow creation, execution, and monitoring.</p>
        </article>
      </section>
    </main>
  );
}
