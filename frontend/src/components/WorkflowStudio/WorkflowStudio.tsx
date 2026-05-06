import { workflowStudioStyles as styles } from "./styles";

const workflowImages = {
  logo: "https://www.swiggy.com/corporate/wp-content/uploads/2024/10/swiggy-logo.webp",
} as const;

const workflowCards = [
  {
    id: "dessert-drop",
    title: "Fresh Veggie Restock",
    type: "Weekly essentials",
    summary:
      "When vegetables run out midweek and you do not want to rebuild the same basket again, this workflow restocks common greens and staples based on household size, budget, and delivery slot preference.",
    image:
      "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2025/5/14/43e3c412-4ca9-4894-82ba-24b69da80aa6_06c0d2a9-804c-4bf1-8725-7ebd234e144a",
  },
  {
    id: "shake-run",
    title: "Monthly Staples Refill",
    type: "Pantry planner",
    summary:
      "For homes that reorder rice, atta, and breakfast basics every few weeks, this workflow checks repeat staples, fills the missing items, and prepares a budget-safe cart without repeated searching.",
    image:
      "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2025/5/14/097900ca-5d2d-4bb0-8e54-aede1e58dfd8_eab3796c-ac17-48fd-bfc7-6356c6f89783",
  },
  {
    id: "late-night-fix",
    title: "Bathroom Shelf Refill",
    type: "Household routine",
    summary:
      "When shampoo, soap, or personal care items are almost over but nobody remembers exact brands, this workflow pulls likely repeats, compares pack sizes, and rebuilds the household essentials cart before checkout.",
    image:
      "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2024/7/6/4342c814-6ff9-4bbe-a360-95200ad602a0_1905dc17-a04d-4a9e-9a4e-adde9b27f321",
  },
  {
    id: "shawarma-pick",
    title: "Pet Care Reorder",
    type: "Repeat purchase flow",
    summary:
      "When pet food and litter are due for refill, this workflow reorders the usual brands, checks pack availability, and prepares the final Instamart basket so the user only needs to approve the purchase.",
    image:
      "https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/NI_CATALOG/IMAGES/CIW/2025/5/14/705173ff-7cd9-4d7e-9e5b-3886d81411b9_bb324827-9556-48e4-b8f6-280706478fe2",
  },
] as const;

type WorkflowStudioProps = {
  onBack?: () => void;
  onOpenCreation?: () => void;
};

export function WorkflowStudio({ onBack, onOpenCreation }: WorkflowStudioProps) {
  return (
    <main style={styles.page}>
      <section style={styles.navSection}>
        <div style={styles.nav}>
          <button
            aria-label="Back to home page"
            onClick={onBack}
            style={styles.logoButton}
            type="button"
          >
            <img alt="Swiggy" src={workflowImages.logo} style={styles.logo} />
          </button>

          <div style={styles.navActions}>
            <button onClick={onOpenCreation} style={styles.secondaryButton} type="button">
              Open workflow creation
            </button>
            <button onClick={onBack} style={styles.backButton} type="button">
              Back to home page
            </button>
          </div>
        </div>
      </section>

      <section style={styles.heroSection}>
        <p style={styles.kicker}>Workflows marketplace</p>
        <h1 style={styles.title}>Reusable Swiggy workflows for repeat intent.</h1>
        <p style={styles.subtitle}>
          Browse ready-made workflows, save the ones you like, and run them anytime with your own
          preferences and approval rules.
        </p>
      </section>

      <section style={styles.section}>
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
