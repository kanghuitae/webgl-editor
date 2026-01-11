import { describe, expect, it } from "vitest";
import { Store } from "../src/store";
import { DocumentModel } from "../src/types";

function makeDoc(): DocumentModel {
  return {
    page: { width: 100, height: 100, background: [0, 0, 0, 1] },
    nodes: []
  };
}

describe("Store", () => {
  it("sets and gets state", () => {
    const store = new Store({ doc: makeDoc(), selection: [], viewport: { panX: 0, panY: 0, zoom: 1 } });
    const next = { doc: makeDoc(), selection: ["a"], viewport: { panX: 1, panY: 2, zoom: 1 } };

    store.set(next);
    expect(store.get()).toEqual(next);
  });

  it("patches state and notifies subscribers", () => {
    const store = new Store({ doc: makeDoc(), selection: [], viewport: { panX: 0, panY: 0, zoom: 1 } });
    const seen: number[] = [];

    store.subscribe((s) => seen.push(s.selection.length));
    store.patch((s) => ({ ...s, selection: ["x", "y"] }));

    expect(store.get().selection).toEqual(["x", "y"]);
    expect(seen).toEqual([2]);
  });
});
