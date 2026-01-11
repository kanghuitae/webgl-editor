import { describe, expect, it } from "vitest";
import { History } from "../src/history";
import { DocumentModel } from "../src/types";

function makeDoc(nodes: number): DocumentModel {
  return {
    page: { width: 100, height: 100, background: [0, 0, 0, 1] },
    nodes: Array.from({ length: nodes }).map((_, i) => ({
      id: `n${i}`,
      type: "rect" as const,
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      fill: [0, 0, 0, 1]
    }))
  };
}

describe("History", () => {
  it("undoes and redoes commands", () => {
    const history = new History();
    const base = makeDoc(0);
    const next = makeDoc(1);

    history.push({
      name: "add",
      do: () => next,
      undo: () => base
    });

    expect(history.canUndo()).toBe(true);
    const undo = history.undo(next);
    expect(undo.doc.nodes.length).toBe(0);
    expect(history.canRedo()).toBe(true);

    const redo = history.redo(base);
    expect(redo.doc.nodes.length).toBe(1);
  });
});
