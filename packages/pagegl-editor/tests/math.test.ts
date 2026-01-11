import { describe, expect, it } from "vitest";
import { clamp, hitTest, screenToWorld, worldToScreen } from "../src/math";
import { AnyNode, Viewport } from "../src/types";

describe("math", () => {
  it("converts between screen and world coordinates", () => {
    const vp: Viewport = { panX: 10, panY: 20, zoom: 2 };
    const world = { x: 15, y: 25 };
    const screen = worldToScreen(world.x, world.y, vp);
    const back = screenToWorld(screen.x, screen.y, vp);

    expect(back.x).toBeCloseTo(world.x, 5);
    expect(back.y).toBeCloseTo(world.y, 5);
  });

  it("hit-tests topmost visible node", () => {
    const nodes: AnyNode[] = [
      { id: "a", type: "rect", x: 0, y: 0, w: 10, h: 10, fill: [0, 0, 0, 1], z: 1 },
      { id: "b", type: "rect", x: 0, y: 0, w: 10, h: 10, fill: [0, 0, 0, 1], z: 2 },
      { id: "c", type: "rect", x: 0, y: 0, w: 10, h: 10, fill: [0, 0, 0, 1], z: 3, hidden: true }
    ];

    const hit = hitTest(nodes, 5, 5);
    expect(hit?.id).toBe("b");
  });

  it("clamps values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
