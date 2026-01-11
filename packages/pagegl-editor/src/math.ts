import { AnyNode, Viewport } from "./types";

export function screenToWorld(x: number, y: number, vp: Viewport) {
  return { x: x / vp.zoom + vp.panX, y: y / vp.zoom + vp.panY };
}

export function worldToScreen(x: number, y: number, vp: Viewport) {
  return { x: (x - vp.panX) * vp.zoom, y: (y - vp.panY) * vp.zoom };
}

// MVP: rotation ignored, axis-aligned hit-test
export function hitTest(nodes: AnyNode[], wx: number, wy: number): AnyNode | null {
  const sorted = [...nodes]
    .filter((n) => !n.hidden)
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  for (let i = sorted.length - 1; i >= 0; i--) {
    const n = sorted[i];
    if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
  }
  return null;
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
