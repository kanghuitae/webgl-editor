export type BreakpointId = "desktop" | "tablet" | "mobile";

export interface Breakpoint {
  id: BreakpointId;
  minWidth: number;
}

export const Breakpoints: Breakpoint[] = [
  { id: "desktop", minWidth: 1200 },
  { id: "tablet", minWidth: 768 },
  { id: "mobile", minWidth: 375 }
];

export interface ResponsiveStyle<T> {
  base: T;
  overrides?: Partial<Record<BreakpointId, Partial<T>>>;
}

export type Display = "block" | "flex" | "grid" | "inline-block";
export type FlexDirection = "row" | "column";
export type FlexWrap = "wrap" | "nowrap";
export type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
export type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export interface Style {
  width?: string;
  maxWidth?: string;
  minHeight?: string;

  padding?: string;
  margin?: string;

  display?: Display;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  flex?: string;
  gap?: string;
  alignItems?: AlignItems;
  justifyContent?: JustifyContent;

  // Grid properties
  gridTemplateColumns?: string;
  gridTemplateRows?: string;

  background?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  color?: string;
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: string;
  letterSpacing?: string;
  textAlign?: "left" | "center" | "right" | "justify";

  borderRadius?: string;
  border?: string;
  borderLeft?: string;
  borderRight?: string;
  borderTop?: string;
  borderBottom?: string;
  boxShadow?: string;
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  cssVars?: Record<string, string>;
}

export type BlockType = "section" | "container" | "text" | "image" | "button";

export interface BaseBlock {
  id: string;
  type: BlockType;
  name?: string;
  children?: string[];
  style: ResponsiveStyle<Style>;
  meta?: {
    repeatable?: boolean;
  };
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: {
    text: string;
  };
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  content: {
    src: string;
    alt?: string;
  };
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  content: {
    label: string;
    href?: string;
  };
}

export interface ContainerBlock extends BaseBlock {
  type: "container";
  children: string[];
}

export interface SectionBlock extends BaseBlock {
  type: "section";
  children: string[];
}

export type Block = TextBlock | ImageBlock | ButtonBlock | ContainerBlock | SectionBlock;

export interface PageSpec {
  title: string;
  lang: string;
  style: ResponsiveStyle<Style>;
}

export interface DocumentModel {
  version: 1;
  breakpoints: Breakpoint[];
  page: PageSpec;
  root: string;
  blocks: Record<string, Block>;
}
