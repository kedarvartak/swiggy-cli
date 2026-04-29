import type { CSSProperties } from "react";

import { theme } from "../../global/styles";

export const consoleStyles = {
  wrap: {
    display: "grid",
    gap: "16px",
  } satisfies CSSProperties,
  shell: {
    padding: "20px",
    borderRadius: theme.radius.card,
    background: "#101725",
    color: "#eff4ff",
    boxShadow: "0 24px 70px rgba(8, 12, 20, 0.28)",
    overflow: "hidden",
  } satisfies CSSProperties,
  topbar: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
  } satisfies CSSProperties,
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.22)",
  } satisfies CSSProperties,
  body: {
    display: "grid",
    gap: "14px",
  } satisfies CSSProperties,
  stage: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  } satisfies CSSProperties,
  badge: {
    alignSelf: "start",
    justifySelf: "start",
    padding: "6px 10px",
    borderRadius: theme.radius.pill,
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  } satisfies CSSProperties,
} as const;
