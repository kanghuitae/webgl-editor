import { Emitter } from "./events";
import { Store } from "./store";
import { AnyNode, DocumentModel, EditorEventMap, Handle, Viewport } from "./types";
import { hitTest, screenToWorld, clamp } from "./math";
import { WebGLRenderer } from "./renderer_webgl";
import { EditorPlugin, PluginContext } from "./plugins";
import { History, Command } from "./history";

function defaultDoc(): DocumentModel {
  return {
    page: { width: 1200, height: 800, background: [0.1, 0.1, 0.12, 1] },
    nodes: [],
  };
}

function defaultViewport(): Viewport {
  return { panX: 0, panY: 0, zoom: 1 };
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export class PageGLEditor {
  private emitter = new Emitter<EditorEventMap>();
  private store: Store;
  private renderer: WebGLRenderer;

  private plugins: EditorPlugin[] = [];
  private history = new History();

  private unbindInput?: () => void;
  private dragging = false;
  private dragHandle: Handle = "none";
  private dragStart = { sx: 0, sy: 0, wx: 0, wy: 0 };
  private originalNodes = new Map<string, AnyNode>();

  constructor(opts: { canvas: HTMLCanvasElement; plugins?: EditorPlugin[] }) {
    const initial = {
      doc: defaultDoc(),
      selection: [],
      viewport: defaultViewport(),
    };
    this.store = new Store(initial);
    this.renderer = new WebGLRenderer(opts.canvas);

    this.plugins = opts.plugins ?? [];
    this.initPlugins();
    this.bindInput(opts.canvas);

    this.store.subscribe((s) => {
      this.renderer.render(s.doc, s.viewport, s.selection);
    });

    this.renderer.render(initial.doc, initial.viewport, initial.selection);
  }

  on<K extends keyof EditorEventMap>(type: K, fn: (payload: EditorEventMap[K]) => void) {
    return this.emitter.on(type, fn);
  }

  getDoc(): DocumentModel {
    return this.store.get().doc;
  }

  getSelection(): string[] {
    return this.store.get().selection;
  }

  load(doc: DocumentModel) {
    const safe = deepClone(doc);
    this.store.patch((s) => ({ ...s, doc: safe, selection: [] }));
    this.emitter.emit("change", safe);
    this.emitter.emit("selection", []);
  }

  serialize(): string {
    return JSON.stringify(this.getDoc());
  }

  undo() {
    const cur = this.store.get().doc;
    const r = this.history.undo(cur);
    this.commitDoc(r.doc, `undo:${r.name ?? ""}`, false);
  }

  redo() {
    const cur = this.store.get().doc;
    const r = this.history.redo(cur);
    this.commitDoc(r.doc, `redo:${r.name ?? ""}`, false);
  }

  addNode(node: AnyNode) {
    const cur = this.store.get().doc;
    const next = deepClone(cur);
    next.nodes.push(node);
    this.commitWithHistory("addNode", cur, next);
    this.setSelection([node.id]);
  }

  setSelection(ids: string[]) {
    this.store.patch((s) => ({ ...s, selection: [...ids] }));
    this.emitter.emit("selection", [...ids]);
  }

  setViewport(vp: Viewport) {
    this.store.patch((s) => ({ ...s, viewport: vp }));
    this.emitter.emit("viewport", vp);
  }

  destroy() {
    if (this.unbindInput) this.unbindInput();
    this.renderer.destroy();
  }

  private initPlugins() {
    const ctx: PluginContext = {
      getDoc: () => this.store.get().doc,
      setDoc: (next, reason) => this.commitDoc(next, reason, true),
      getViewport: () => this.store.get().viewport,
      setViewport: (next) => this.setViewport(next),
      getSelection: () => this.store.get().selection,
      setSelection: (ids) => this.setSelection(ids),
      emit: (type, payload) => (this.emitter as any).emit(type, payload),
    };

    for (const p of this.plugins) p.onInit?.(ctx);
  }

  private commitWithHistory(name: string, prev: DocumentModel, next: DocumentModel) {
    const prevSnap = deepClone(prev);
    const nextSnap = deepClone(next);

    const cmd: Command = {
      name,
      do: () => deepClone(nextSnap),
      undo: () => deepClone(prevSnap),
    };
    this.history.push(cmd);
    this.commitDoc(nextSnap, name, true);
  }

  private commitDoc(nextDoc: DocumentModel, reason?: string, runPlugins = true) {
    let doc = deepClone(nextDoc);

    if (runPlugins) {
      for (const p of this.plugins) {
        if (p.onBeforeCommit) doc = p.onBeforeCommit(doc, reason);
      }
    }

    this.store.patch((s) => ({ ...s, doc }));
    this.emitter.emit("change", doc);

    if (runPlugins) {
      for (const p of this.plugins) p.onAfterCommit?.(doc, reason);
    }
  }

  private bindInput(canvas: HTMLCanvasElement) {
    canvas.tabIndex = 0;

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);

      const s = this.store.get();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const w = screenToWorld(sx, sy, s.viewport);
      const hit = hitTest(s.doc.nodes, w.x, w.y);

      this.dragging = true;
      this.dragStart = { sx, sy, wx: w.x, wy: w.y };
      this.dragHandle = "move";

      this.originalNodes.clear();
      if (hit && !hit.locked) {
        if (!s.selection.includes(hit.id)) this.setSelection([hit.id]);

        const sel = this.store.get().selection;
        for (const id of sel) {
          const n = s.doc.nodes.find((node) => node.id === id);
          if (n) this.originalNodes.set(id, deepClone(n));
        }
      } else {
        this.setSelection([]);
        this.dragging = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.dragging) return;
      if (this.dragHandle !== "move") return;
      const s = this.store.get();
      if (s.selection.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const w = screenToWorld(sx, sy, s.viewport);
      const dx = w.x - this.dragStart.wx;
      const dy = w.y - this.dragStart.wy;

      const cur = s.doc;
      const next = deepClone(cur);

      for (const id of s.selection) {
        const idx = next.nodes.findIndex((node) => node.id === id);
        if (idx < 0) continue;
        const base = this.originalNodes.get(id);
        if (!base) continue;

        next.nodes[idx].x = base.x + dx;
        next.nodes[idx].y = base.y + dy;
      }

      this.commitDoc(next, "drag(move)", true);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      const s = this.store.get();
      const before = this.getDocFromOriginals(s);
      if (!before) return;

      const after = deepClone(s.doc);
      const b = JSON.stringify(before);
      const a = JSON.stringify(after);
      if (b !== a) this.commitWithHistory("move", before, after);
    };

    const onWheel = (e: WheelEvent) => {
      const s = this.store.get();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const isZoom = e.ctrlKey;
      if (!isZoom) return;

      e.preventDefault();

      const vp = s.viewport;
      const before = screenToWorld(sx, sy, vp);

      const zoomFactor = Math.exp(-e.deltaY * 0.002);
      const nextZoom = clamp(vp.zoom * zoomFactor, 0.1, 8);

      const nextVp: Viewport = { ...vp, zoom: nextZoom };
      const after = screenToWorld(sx, sy, nextVp);

      nextVp.panX += before.x - after.x;
      nextVp.panY += before.y - after.y;

      this.setViewport(nextVp);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      if (
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === "y" && (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        this.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const s = this.store.get();
        if (s.selection.length === 0) return;
        const prev = s.doc;
        const next = deepClone(prev);
        next.nodes = next.nodes.filter((n) => !s.selection.includes(n.id));
        this.commitWithHistory("delete", prev, next);
        this.setSelection([]);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("keydown", onKeyDown);

    this.unbindInput = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
    };
  }

  private getDocFromOriginals(s: { doc: DocumentModel; selection: string[] }) {
    if (this.originalNodes.size === 0) return null;
    const prev = deepClone(s.doc);
    for (const [id, original] of this.originalNodes.entries()) {
      const idx = prev.nodes.findIndex((n) => n.id === id);
      if (idx >= 0) prev.nodes[idx] = deepClone(original);
    }
    return prev;
  }
}
