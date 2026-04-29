import type { CSSProperties } from "react";

import { theme } from "../../global/styles";

export const showcaseStyles = {
  section: {
    display: "grid",
    gap: "16px",
    marginBottom: "22px",
  } satisfies CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
  } satisfies CSSProperties,
  title: {
    margin: 0,
    fontSize: "1.2rem",
  } satisfies CSSProperties,
  subtitle: {
    margin: "6px 0 0",
    color: theme.colors.muted,
    maxWidth: "64ch",
    lineHeight: 1.6,
  } satisfies CSSProperties,
  rail: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  } satisfies CSSProperties,
  card: {
    padding: "22px",
    borderRadius: theme.radius.card,
    border: `1px solid ${theme.colors.line}`,
    background: theme.colors.surface,
    boxShadow: theme.shadows.card,
    animation: "floatUp 820ms ease-out both",
  } satisfies CSSProperties,
  cardTitle: {
    margin: "0 0 10px",
    fontSize: "1.2rem",
  } satisfies CSSProperties,
  tools: {
    margin: "0 0 14px",
    color: theme.colors.orangeDeep,
    fontWeight: 700,
    fontSize: "0.92rem",
  } satisfies CSSProperties,
  summary: {
    margin: 0,
    color: theme.colors.muted,
    lineHeight: 1.6,
  } satisfies CSSProperties,
} as const;
