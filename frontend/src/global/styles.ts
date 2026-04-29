import type { CSSProperties } from "react";
import GilroyLight from "../../Gilroy-Font/Gilroy-Light.ttf";
import GilroyRegular from "../../Gilroy-Font/Gilroy-Regular.ttf";
import GilroyMedium from "../../Gilroy-Font/Gilroy-Medium.ttf";
import GilroyBold from "../../Gilroy-Font/Gilroy-Bold.ttf";
import GilroyHeavy from "../../Gilroy-Font/Gilroy-Heavy.ttf";

export const theme = {
  colors: {
    ink: "#1b1e28",
    muted: "#5a5f6d",
    soft: "#8f95a3",
    surface: "#ffffff",
    surfaceStrong: "#ffffff",
    line: "rgba(21, 32, 51, 0.08)",
    orange: "#FF5200",
    orangeDeep: "#FF5200",
    gray: "#F0F0F5",
    coal: "#111111",
  },
  shadows: {
    card: "0 14px 40px rgba(27, 30, 40, 0.12)",
    glow: "0 18px 36px rgba(255, 82, 0, 0.18)",
  },
  radius: {
    card: "28px",
    pill: "999px",
  },
} as const;

export const layout = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
  } satisfies CSSProperties,
  shell: {
    width: "100%",
    margin: "0 auto",
  } satisfies CSSProperties,
} as const;

export const globalStyleText = `
  @font-face {
    font-family: "Gilroy";
    src: url("${GilroyLight}") format("truetype");
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Gilroy";
    src: url("${GilroyRegular}") format("truetype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Gilroy";
    src: url("${GilroyMedium}") format("truetype");
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Gilroy";
    src: url("${GilroyBold}") format("truetype");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "Gilroy";
    src: url("${GilroyHeavy}") format("truetype");
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }

  :root {
    color: ${theme.colors.ink};
    background: #ffffff;
    font-family: "Gilroy", "Segoe UI", sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: #ffffff;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ::selection {
    background: rgba(255, 82, 0, 0.2);
  }

  @keyframes floatUp {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
