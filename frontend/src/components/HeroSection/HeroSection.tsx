import { heroCards, heroImages } from "./utils";
import { heroStyles } from "./styles";

function LocationIcon() {
  return (
    <svg viewBox="0 0 18 23" fill="none" aria-hidden="true" style={heroStyles.icon}>
      <path
        d="M10.115 21.8122C12.4772 19.4062 17.7886 13.4751 17.7886 8.78883C17.7886 3.79647 13.9976 0 9.00526 0C4.0129 0 0.210938 3.79647 0.210938 8.78883C0.210938 13.4755 5.52998 19.4073 7.89476 21.8129C8.51149 22.4403 9.49871 22.44 10.115 21.8122ZM8.99988 12.7888C11.4269 12.7888 13.3943 10.8214 13.3943 8.39441C13.3943 5.96745 11.4269 4 8.99988 4C6.57292 4 4.60547 5.96745 4.60547 8.39441C4.60547 10.8214 6.57292 12.7888 8.99988 12.7888Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#FF5200"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 22" fill="currentColor" aria-hidden="true" style={heroStyles.ctaIcon}>
      <path d="M12.634 3.45a1 1 0 0 0-1.365 1.462l4.827 4.506c.238.221.44.41.614.577H2.996a1 1 0 0 0 0 2h13.777c-.186.18-.41.39-.677.64l-4.769 4.45a1 1 0 0 0 1.365 1.462l4.817-4.495c.546-.51 1.03-.96 1.367-1.376.365-.449.664-.979.664-1.65 0-.672-.299-1.201-.664-1.65-.338-.415-.821-.866-1.367-1.376z" />
    </svg>
  );
}

type HeroSectionProps = {
  onTryWorkflows?: () => void;
};

export function HeroSection({ onTryWorkflows }: HeroSectionProps) {
  return (
    <section style={heroStyles.section}>
      <img alt="" src={heroImages.veggies} style={heroStyles.sideImageLeft} />
      <img alt="" src={heroImages.plate} style={heroStyles.sideImageRight} />

      <nav style={heroStyles.nav}>
        <div style={heroStyles.brand}>
          <img alt="Swiggy" src={heroImages.logo} style={heroStyles.logo} />
        </div>
        <button style={heroStyles.ctaButton} onClick={onTryWorkflows} type="button">
          <span style={heroStyles.ctaText}>Try Workflows</span>
          <ArrowIcon />
        </button>
      </nav>

      <div style={heroStyles.heroBody}>
        <h1 style={heroStyles.heading}>
          <>
            Order food & groceries with{" "}
            <span style={heroStyles.aiAccent}>
              <span style={heroStyles.aiText}>AI</span>
            </span>
            <br />
            Discover best restaurants. Swiggy it!
          </>
        </h1>

        <div style={heroStyles.searchRow}>
          <div style={heroStyles.searchBox}>
            <div style={heroStyles.searchBoxTextWrap}>
              <LocationIcon />
              <div style={{ width: "100%" }}>
                <div style={heroStyles.fieldLabel}>Latitude</div>
                <input
                  aria-label="Latitude"
                  defaultValue="12.9716"
                  placeholder="Enter latitude"
                  style={heroStyles.coordinateInput}
                />
              </div>
            </div>
            <span style={heroStyles.inputText}>Lat</span>
          </div>
          <div style={heroStyles.searchBox}>
            <div style={heroStyles.searchBoxTextWrap}>
              <LocationIcon />
              <div style={{ width: "100%" }}>
                <div style={heroStyles.fieldLabel}>Longitude</div>
                <input
                  aria-label="Longitude"
                  defaultValue="77.5946"
                  placeholder="Enter longitude"
                  style={heroStyles.coordinateInput}
                />
              </div>
            </div>
            <span style={heroStyles.inputText}>Lng</span>
          </div>
        </div>

        <div style={heroStyles.cardsRow}>
          {heroCards.map((card) => (
            <img
              key={card.title}
              alt={`${card.title} card`}
              src={card.image}
              style={heroStyles.serviceCardImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
