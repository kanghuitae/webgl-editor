import { Block, Breakpoints, DocumentModel, Style } from "./types";
import { instantiateSectionTemplate, sectionTemplates } from "./templates";

const defaultPageStyle: Style = {
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: "1.6"
};

const starterTemplateIds = [
  "hero-split",
  "feature-grid",
  "cta-banner",
  "footer-simple"
];

function buildStarterSections() {
  const blocks: Record<string, Block> = {};
  const order: string[] = [];

  for (const id of starterTemplateIds) {
    const template = sectionTemplates.find((item) => item.id === id);
    if (!template) continue;
    const inst = instantiateSectionTemplate(template);
    Object.assign(blocks, inst.blocks);
    order.push(inst.rootId);
  }

  return { blocks, order };
}

export function createDefaultDocument(): DocumentModel {
  const { blocks: sectionBlocks, order } = buildStarterSections();
  return {
    version: 1,
    breakpoints: Breakpoints,
    page: {
      title: "Untitled",
      lang: "en",
      style: { base: defaultPageStyle }
    },
    root: "page-root",
    blocks: {
      "page-root": {
        id: "page-root",
        type: "container",
        name: "Page",
        children: order,
        style: {
          base: {
            display: "flex",
            flexDirection: "column"
          }
        }
      },
      ...sectionBlocks
    }
  };
}

export function cloneDocument<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}
