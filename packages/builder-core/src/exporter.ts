import {
  Block,
  Breakpoint,
  BreakpointId,
  DocumentModel,
  PageSpec,
  ResponsiveStyle,
  Style
} from "./types";
import { styleToCss } from "./style";

export interface ExportResult {
  html: string;
  css: string;
}

function sanitizeClass(id: string) {
  return `b-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function renderBlock(doc: DocumentModel, blockId: string): string {
  const block = doc.blocks[blockId];
  if (!block) return "";

  const className = sanitizeClass(block.id);
  const attrs = `class=\"${className}\" data-block-id=\"${block.id}\"`;

  switch (block.type) {
    case "section":
      return `<section ${attrs}>${renderChildren(doc, block)}</section>`;
    case "container":
      return `<div ${attrs}>${renderChildren(doc, block)}</div>`;
    case "text":
      return `<p ${attrs}>${escapeHtml(block.content.text)}</p>`;
    case "image":
      return `<img ${attrs} src=\"${escapeHtml(block.content.src)}\" alt=\"${escapeHtml(
        block.content.alt ?? ""
      )}\" />`;
    case "button":
      return `<a ${attrs} href=\"${escapeHtml(block.content.href ?? "#") }\">${escapeHtml(
        block.content.label
      )}</a>`;
    default:
      return "";
  }
}

function renderChildren(doc: DocumentModel, block: Block) {
  if (!block.children || block.children.length === 0) return "";
  return block.children.map((id) => renderBlock(doc, id)).join("");
}

function sortBreakpoints(bps: Breakpoint[]) {
  return [...bps].sort((a, b) => a.minWidth - b.minWidth);
}

function maxWidthFor(bp: Breakpoint, sorted: Breakpoint[]) {
  const index = sorted.findIndex((item) => item.id === bp.id);
  if (index < 0 || index === sorted.length - 1) return null;
  return sorted[index + 1].minWidth - 1;
}

function cssForResponsive(
  selector: string,
  style: ResponsiveStyle<Style>,
  breakpoints: Breakpoint[]
) {
  const cssChunks: string[] = [];

  const baseCss = styleToCss(style.base);
  if (baseCss) cssChunks.push(`${selector} { ${baseCss} }`);

  if (!style.overrides) return cssChunks;

  const sorted = sortBreakpoints(breakpoints);
  const byId = new Map(sorted.map((bp) => [bp.id, bp]));

  const order: BreakpointId[] = ["tablet", "mobile"];
  for (const id of order) {
    const override = style.overrides[id];
    const bp = byId.get(id);
    if (!override || !bp) continue;
    const maxWidth = maxWidthFor(bp, sorted);
    if (!maxWidth) continue;
    const css = styleToCss({ ...style.base, ...override });
    if (!css) continue;
    cssChunks.push(`@media (max-width: ${maxWidth}px) { ${selector} { ${css} } }`);
  }

  return cssChunks;
}

function cssForPage(page: PageSpec, breakpoints: Breakpoint[]) {
  return cssForResponsive("body", page.style, breakpoints).join("\n");
}

function cssForBlocks(doc: DocumentModel) {
  const cssChunks: string[] = [];
  for (const block of Object.values(doc.blocks)) {
    cssChunks.push(
      ...cssForResponsive(`.${sanitizeClass(block.id)}`, block.style, doc.breakpoints)
    );
  }
  return cssChunks.join("\n");
}

export function exportToHtml(doc: DocumentModel): ExportResult {
  const html = `<!doctype html>
<html lang="${escapeHtml(doc.page.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(doc.page.title)}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    ${renderBlock(doc, doc.root)}
  </body>
</html>`;

  const css = [
    "* { box-sizing: border-box; }",
    "body { margin: 0; font-family: \"Space Grotesk\", system-ui, sans-serif; }",
    "img { max-width: 100%; display: block; }",
    cssForPage(doc.page, doc.breakpoints),
    cssForBlocks(doc)
  ]
    .filter(Boolean)
    .join("\n");

  return { html, css };
}
