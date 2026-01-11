import { Block, DocumentModel } from "./types";

export type ValidationLevel = "error" | "warning";

export interface ValidationIssue {
  level: ValidationLevel;
  blockId?: string;
  message: string;
}

function blockLabel(block: Block) {
  return block.name ?? block.type;
}

export function validateDocument(doc: DocumentModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!doc.blocks[doc.root]) {
    issues.push({ level: "error", message: "Root block is missing." });
    return issues;
  }

  for (const block of Object.values(doc.blocks)) {
    if (block.children) {
      for (const childId of block.children) {
        if (!doc.blocks[childId]) {
          issues.push({
            level: "error",
            blockId: block.id,
            message: `Missing child block ${childId} in ${blockLabel(block)}.`
          });
        }
      }
    }

    if (block.type === "image" && !block.content.src) {
      issues.push({
        level: "warning",
        blockId: block.id,
        message: `Image block ${blockLabel(block)} is missing a source URL.`
      });
    }

    if (block.type === "button" && !block.content.label) {
      issues.push({
        level: "warning",
        blockId: block.id,
        message: `Button block ${blockLabel(block)} is missing a label.`
      });
    }
  }

  return issues;
}
