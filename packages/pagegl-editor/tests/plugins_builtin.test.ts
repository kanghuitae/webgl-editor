import { describe, expect, it } from "vitest";
import { gridSnapPlugin } from "../src/plugins_builtin";
import { DocumentModel } from "../src/types";

function makeDoc(): DocumentModel {
  return {
    page: { width: 100, height: 100, background: [0, 0, 0, 1] },
    nodes: [
      { id: "a", type: "rect", x: 9, y: 17, w: 10, h: 10, fill: [0, 0, 0, 1] },
      { id: "b", type: "rect", x: 9, y: 17, w: 10, h: 10, fill: [0, 0, 0, 1], locked: true }
    ]
  };
}

describe("gridSnapPlugin", () => {
  it("snaps positions on move commits", () => {
    const plugin = gridSnapPlugin({ size: 8 });
    const doc = makeDoc();

    const next = plugin.onBeforeCommit?.(doc, "move") ?? doc;

    expect(next.nodes[0].x).toBe(8);
    expect(next.nodes[0].y).toBe(16);
    expect(next.nodes[1].x).toBe(9);
    expect(next.nodes[1].y).toBe(17);
  });

  it("returns original doc for non-move reasons", () => {
    const plugin = gridSnapPlugin({ size: 8 });
    const doc = makeDoc();

    const next = plugin.onBeforeCommit?.(doc, "add") ?? doc;

    expect(next).toBe(doc);
  });
});
