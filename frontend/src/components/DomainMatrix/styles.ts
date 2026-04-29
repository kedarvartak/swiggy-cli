import type { CSSProperties } from "react";

import { theme } from "../../global/styles";

export const matrixStyles = {
  section: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)",
    gap: "16px",
    marginBottom: "22px",
  } satisfies CSSProperties,
  board: {
    padding: "22px",
    borderRadius: theme.radius.card,
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.line}`,
    boxShadow: theme.shadows.card,
  } satisfies CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginTop: "16px",
  } satisfies CSSProperties,
  domainCard: {
    padding: "18px",
    borderRadius: "22px",
    border: `1px solid ${theme.colors.line}`,
  } satisfies CSSProperties,
  domainTitle: {
    margin: "0 0 12px",
    fontSize: "1.1rem",
  } satisfies CSSProperties,
  bulletList: {
    margin: 0,
    paddingLeft: "18px",
    color: theme.colors.muted,
    lineHeight: 1.55,
  } satisfies CSSProperties,
  sidePanel: {
    padding: "22px",
    borderRadius: theme.radius.card,
    background: "linear-gradient(180deg, #ffeddc 0%, #fff8f1 100%)",
    border: `1px solid rgba(252, 108, 45, 0.16)`,
    boxShadow: theme.shadows.glow,
  } satisfies CSSProperties,
} as const;
