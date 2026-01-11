import { BreakpointId, ResponsiveStyle, Style } from "./types";

export function mergeStyle(base: Style, override?: Partial<Style>): Style {
  const next: Style = { ...base, ...(override ?? {}) };
  if (base.cssVars || override?.cssVars) {
    next.cssVars = { ...(base.cssVars ?? {}), ...(override?.cssVars ?? {}) };
  }
  return next;
}

export function resolveStyle(style: ResponsiveStyle<Style>, bp: BreakpointId): Style {
  if (!style.overrides || !style.overrides[bp]) return style.base;
  return mergeStyle(style.base, style.overrides[bp]);
}

function toKebabCase(key: string) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function styleToCss(style: Style): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value == null || key === "cssVars") continue;
    pairs.push(`${toKebabCase(key)}: ${value};`);
  }
  if (style.cssVars) {
    for (const [key, value] of Object.entries(style.cssVars)) {
      if (value == null) continue;
      const name = key.startsWith("--") ? key : `--${key}`;
      pairs.push(`${name}: ${value};`);
    }
  }
  return pairs.join(" ");
}
