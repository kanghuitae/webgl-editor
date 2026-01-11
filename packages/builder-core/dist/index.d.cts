type BreakpointId = "desktop" | "tablet" | "mobile";
interface Breakpoint {
    id: BreakpointId;
    minWidth: number;
}
declare const Breakpoints: Breakpoint[];
interface ResponsiveStyle<T> {
    base: T;
    overrides?: Partial<Record<BreakpointId, Partial<T>>>;
}
type Display = "block" | "flex" | "grid" | "inline-block";
type FlexDirection = "row" | "column";
type FlexWrap = "wrap" | "nowrap";
type AlignItems = "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
type JustifyContent = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
interface Style {
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
type BlockType = "section" | "container" | "text" | "image" | "button";
interface BaseBlock {
    id: string;
    type: BlockType;
    name?: string;
    children?: string[];
    style: ResponsiveStyle<Style>;
    meta?: {
        repeatable?: boolean;
    };
}
interface TextBlock extends BaseBlock {
    type: "text";
    content: {
        text: string;
    };
}
interface ImageBlock extends BaseBlock {
    type: "image";
    content: {
        src: string;
        alt?: string;
    };
}
interface ButtonBlock extends BaseBlock {
    type: "button";
    content: {
        label: string;
        href?: string;
    };
}
interface ContainerBlock extends BaseBlock {
    type: "container";
    children: string[];
}
interface SectionBlock extends BaseBlock {
    type: "section";
    children: string[];
}
type Block = TextBlock | ImageBlock | ButtonBlock | ContainerBlock | SectionBlock;
interface PageSpec {
    title: string;
    lang: string;
    style: ResponsiveStyle<Style>;
}
interface DocumentModel {
    version: 1;
    breakpoints: Breakpoint[];
    page: PageSpec;
    root: string;
    blocks: Record<string, Block>;
}

declare function mergeStyle(base: Style, override?: Partial<Style>): Style;
declare function resolveStyle(style: ResponsiveStyle<Style>, bp: BreakpointId): Style;
declare function styleToCss(style: Style): string;

declare function createDefaultDocument(): DocumentModel;
declare function cloneDocument<T>(doc: T): T;

interface ExportResult {
    html: string;
    css: string;
}
declare function exportToHtml(doc: DocumentModel): ExportResult;

type ValidationLevel = "error" | "warning";
interface ValidationIssue {
    level: ValidationLevel;
    blockId?: string;
    message: string;
}
declare function validateDocument(doc: DocumentModel): ValidationIssue[];

interface SectionTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    root: string;
    blocks: Record<string, Block>;
}
declare const sectionTemplates: SectionTemplate[];
declare function instantiateSectionTemplate(template: SectionTemplate): {
    rootId: string;
    blocks: Record<string, Block>;
};

export { type AlignItems, type BaseBlock, type Block, type BlockType, type Breakpoint, type BreakpointId, Breakpoints, type ButtonBlock, type ContainerBlock, type Display, type DocumentModel, type ExportResult, type FlexDirection, type FlexWrap, type ImageBlock, type JustifyContent, type PageSpec, type ResponsiveStyle, type SectionBlock, type SectionTemplate, type Style, type TextBlock, type ValidationIssue, type ValidationLevel, cloneDocument, createDefaultDocument, exportToHtml, instantiateSectionTemplate, mergeStyle, resolveStyle, sectionTemplates, styleToCss, validateDocument };
