import { PageGLEditor, gridSnapPlugin } from "../src/index";

const canvas = document.getElementById("c") as HTMLCanvasElement | null;
if (!canvas) throw new Error("canvas not found");

const editor = new PageGLEditor({
  canvas,
  plugins: [gridSnapPlugin({ size: 8 })]
});

editor.load({
  page: { width: 1200, height: 800, background: [0.08, 0.08, 0.1, 1] },
  nodes: [
    { id: "r1", type: "rect", x: 80, y: 80, w: 220, h: 120, fill: [0.2, 0.6, 0.9, 1] },
    { id: "r2", type: "rect", x: 360, y: 160, w: 180, h: 180, fill: [0.9, 0.4, 0.3, 1] }
  ]
});

const addButton = document.getElementById("add");
addButton?.addEventListener("click", () => {
  editor.addNode({
    id: `r${Math.random().toString(16).slice(2)}`,
    type: "rect",
    x: 120,
    y: 120,
    w: 140,
    h: 90,
    fill: [0.4, 0.9, 0.5, 1]
  });
});
