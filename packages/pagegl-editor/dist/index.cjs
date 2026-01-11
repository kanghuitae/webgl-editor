'use strict';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/events.ts
var Emitter = class {
  constructor() {
    __publicField(this, "listeners", /* @__PURE__ */ new Map());
  }
  on(type, fn) {
    var _a;
    const set = (_a = this.listeners.get(type)) != null ? _a : /* @__PURE__ */ new Set();
    set.add(fn);
    this.listeners.set(type, set);
    return () => set.delete(fn);
  }
  emit(type, payload) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const fn of set) fn(payload);
  }
};

// src/store.ts
var Store = class {
  constructor(initial) {
    __publicField(this, "state");
    __publicField(this, "subs", /* @__PURE__ */ new Set());
    this.state = initial;
  }
  get() {
    return this.state;
  }
  set(next) {
    this.state = next;
    for (const fn of this.subs) fn(this.state);
  }
  patch(fn) {
    const next = fn(this.state);
    this.set(next);
  }
  subscribe(fn) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
};

// src/math.ts
function screenToWorld(x, y, vp) {
  return { x: x / vp.zoom + vp.panX, y: y / vp.zoom + vp.panY };
}
function worldToScreen(x, y, vp) {
  return { x: (x - vp.panX) * vp.zoom, y: (y - vp.panY) * vp.zoom };
}
function hitTest(nodes, wx, wy) {
  const sorted = [...nodes].filter((n) => !n.hidden).sort((a, b) => {
    var _a, _b;
    return ((_a = a.z) != null ? _a : 0) - ((_b = b.z) != null ? _b : 0);
  });
  for (let i = sorted.length - 1; i >= 0; i--) {
    const n = sorted[i];
    if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) return n;
  }
  return null;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// src/renderer_webgl.ts
function compile(gl, type, src) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log != null ? log : ""}`);
  }
  return sh;
}
function link(gl, vs, fs) {
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`program link failed: ${log != null ? log : ""}`);
  }
  return p;
}
var WebGLRenderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    __publicField(this, "gl");
    __publicField(this, "program");
    __publicField(this, "vao");
    __publicField(this, "quadVbo");
    __publicField(this, "instanceVbo");
    __publicField(this, "uResolution");
    __publicField(this, "uBg");
    __publicField(this, "capacity", 0);
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    const vs = compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
      precision highp float;

      // unit quad: (0,0)-(1,1)
      layout(location=0) in vec2 aPos;

      // instance attributes
      layout(location=1) in vec4 iRect; // x,y,w,h in screen space (px)
      layout(location=2) in vec4 iColor;

      uniform vec2 uResolution;

      out vec4 vColor;

      void main() {
        vec2 pos = iRect.xy + aPos * iRect.zw;
        // px -> clip
        vec2 clip = (pos / uResolution) * 2.0 - 1.0;
        // flip y (canvas y down)
        clip.y = -clip.y;
        gl_Position = vec4(clip, 0.0, 1.0);
        vColor = iColor;
      }
    `
    );
    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
      precision highp float;
      in vec4 vColor;
      uniform vec4 uBg;
      out vec4 outColor;
      void main() {
        outColor = vColor + uBg * 0.0;
      }
    `
    );
    this.program = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    const uRes = gl.getUniformLocation(this.program, "uResolution");
    const uBg = gl.getUniformLocation(this.program, "uBg");
    if (!uRes) throw new Error("uniform location missing: uResolution");
    this.uResolution = uRes;
    this.uBg = uBg;
    const vao = gl.createVertexArray();
    const quadVbo = gl.createBuffer();
    const instanceVbo = gl.createBuffer();
    if (!vao || !quadVbo || !instanceVbo) throw new Error("buffer/vao create failed");
    this.vao = vao;
    this.quadVbo = quadVbo;
    this.instanceVbo = instanceVbo;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        1,
        1,
        0,
        1,
        1
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVbo);
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.DYNAMIC_DRAW);
    const stride = 8 * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 4 * 4);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);
  }
  resizeToDisplaySize(dpr = window.devicePixelRatio) {
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }
  render(doc, vp, selection) {
    const gl = this.gl;
    this.resizeToDisplaySize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    const bg = doc.page.background;
    if (this.uBg) gl.uniform4f(this.uBg, bg[0], bg[1], bg[2], bg[3]);
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const rects = doc.nodes.filter(
      (n) => n.type === "rect" && !n.hidden
    );
    const count = rects.length;
    const data = new Float32Array(count * 8);
    const selectionSet = new Set(selection);
    for (let i = 0; i < count; i++) {
      const n = rects[i];
      const p = worldToScreen(n.x, n.y, vp);
      const w = n.w * vp.zoom;
      const h = n.h * vp.zoom;
      const isSel = selectionSet.has(n.id);
      const c = n.fill;
      const k = isSel ? 1.15 : 1;
      const o = i * 8;
      data[o + 0] = p.x;
      data[o + 1] = p.y;
      data[o + 2] = w;
      data[o + 3] = h;
      data[o + 4] = Math.min(1, c[0] * k);
      data[o + 5] = Math.min(1, c[1] * k);
      data[o + 6] = Math.min(1, c[2] * k);
      data[o + 7] = c[3];
    }
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVbo);
    if (count > this.capacity) {
      this.capacity = Math.max(count, Math.floor(this.capacity * 1.5) + 64);
      gl.bufferData(gl.ARRAY_BUFFER, this.capacity * 8 * 4, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    gl.bindVertexArray(null);
  }
  destroy() {
    const gl = this.gl;
    gl.deleteBuffer(this.quadVbo);
    gl.deleteBuffer(this.instanceVbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
};

// src/history.ts
var History = class {
  constructor() {
    __publicField(this, "undoStack", []);
    __publicField(this, "redoStack", []);
  }
  push(cmd) {
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
  canUndo() {
    return this.undoStack.length > 0;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }
  undo(doc) {
    const cmd = this.undoStack.pop();
    if (!cmd) return { doc };
    const next = cmd.undo(doc);
    this.redoStack.push(cmd);
    return { doc: next, name: cmd.name };
  }
  redo(doc) {
    const cmd = this.redoStack.pop();
    if (!cmd) return { doc };
    const next = cmd.do(doc);
    this.undoStack.push(cmd);
    return { doc: next, name: cmd.name };
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
};

// src/editor.ts
function defaultDoc() {
  return {
    page: { width: 1200, height: 800, background: [0.1, 0.1, 0.12, 1] },
    nodes: []
  };
}
function defaultViewport() {
  return { panX: 0, panY: 0, zoom: 1 };
}
function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}
var PageGLEditor = class {
  constructor(opts) {
    __publicField(this, "emitter", new Emitter());
    __publicField(this, "store");
    __publicField(this, "renderer");
    __publicField(this, "plugins", []);
    __publicField(this, "history", new History());
    __publicField(this, "unbindInput");
    __publicField(this, "dragging", false);
    __publicField(this, "dragHandle", "none");
    __publicField(this, "dragStart", { sx: 0, sy: 0, wx: 0, wy: 0 });
    __publicField(this, "originalNodes", /* @__PURE__ */ new Map());
    var _a;
    const initial = {
      doc: defaultDoc(),
      selection: [],
      viewport: defaultViewport()
    };
    this.store = new Store(initial);
    this.renderer = new WebGLRenderer(opts.canvas);
    this.plugins = (_a = opts.plugins) != null ? _a : [];
    this.initPlugins();
    this.bindInput(opts.canvas);
    this.store.subscribe((s) => {
      this.renderer.render(s.doc, s.viewport, s.selection);
    });
    this.renderer.render(initial.doc, initial.viewport, initial.selection);
  }
  on(type, fn) {
    return this.emitter.on(type, fn);
  }
  getDoc() {
    return this.store.get().doc;
  }
  getSelection() {
    return this.store.get().selection;
  }
  load(doc) {
    const safe = deepClone(doc);
    this.store.patch((s) => ({ ...s, doc: safe, selection: [] }));
    this.emitter.emit("change", safe);
    this.emitter.emit("selection", []);
  }
  serialize() {
    return JSON.stringify(this.getDoc());
  }
  undo() {
    var _a;
    const cur = this.store.get().doc;
    const r = this.history.undo(cur);
    this.commitDoc(r.doc, `undo:${(_a = r.name) != null ? _a : ""}`, false);
  }
  redo() {
    var _a;
    const cur = this.store.get().doc;
    const r = this.history.redo(cur);
    this.commitDoc(r.doc, `redo:${(_a = r.name) != null ? _a : ""}`, false);
  }
  addNode(node) {
    const cur = this.store.get().doc;
    const next = deepClone(cur);
    next.nodes.push(node);
    this.commitWithHistory("addNode", cur, next);
    this.setSelection([node.id]);
  }
  setSelection(ids) {
    this.store.patch((s) => ({ ...s, selection: [...ids] }));
    this.emitter.emit("selection", [...ids]);
  }
  setViewport(vp) {
    this.store.patch((s) => ({ ...s, viewport: vp }));
    this.emitter.emit("viewport", vp);
  }
  destroy() {
    if (this.unbindInput) this.unbindInput();
    this.renderer.destroy();
  }
  initPlugins() {
    var _a;
    const ctx = {
      getDoc: () => this.store.get().doc,
      setDoc: (next, reason) => this.commitDoc(next, reason, true),
      getViewport: () => this.store.get().viewport,
      setViewport: (next) => this.setViewport(next),
      getSelection: () => this.store.get().selection,
      setSelection: (ids) => this.setSelection(ids),
      emit: (type, payload) => this.emitter.emit(type, payload)
    };
    for (const p of this.plugins) (_a = p.onInit) == null ? void 0 : _a.call(p, ctx);
  }
  commitWithHistory(name, prev, next) {
    const prevSnap = deepClone(prev);
    const nextSnap = deepClone(next);
    const cmd = {
      name,
      do: () => deepClone(nextSnap),
      undo: () => deepClone(prevSnap)
    };
    this.history.push(cmd);
    this.commitDoc(nextSnap, name, true);
  }
  commitDoc(nextDoc, reason, runPlugins = true) {
    var _a;
    let doc = deepClone(nextDoc);
    if (runPlugins) {
      for (const p of this.plugins) {
        if (p.onBeforeCommit) doc = p.onBeforeCommit(doc, reason);
      }
    }
    this.store.patch((s) => ({ ...s, doc }));
    this.emitter.emit("change", doc);
    if (runPlugins) {
      for (const p of this.plugins) (_a = p.onAfterCommit) == null ? void 0 : _a.call(p, doc, reason);
    }
  }
  bindInput(canvas) {
    canvas.tabIndex = 0;
    const onPointerDown = (e) => {
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
    const onPointerMove = (e) => {
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
    const onPointerUp = (e) => {
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
    const onWheel = (e) => {
      const s = this.store.get();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const isZoom = e.ctrlKey;
      if (!isZoom) return;
      e.preventDefault();
      const vp = s.viewport;
      const before = screenToWorld(sx, sy, vp);
      const zoomFactor = Math.exp(-e.deltaY * 2e-3);
      const nextZoom = clamp(vp.zoom * zoomFactor, 0.1, 8);
      const nextVp = { ...vp, zoom: nextZoom };
      const after = screenToWorld(sx, sy, nextVp);
      nextVp.panX += before.x - after.x;
      nextVp.panY += before.y - after.y;
      this.setViewport(nextVp);
    };
    const onKeyDown = (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey || e.key === "y" && (e.ctrlKey || e.metaKey)) {
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
  getDocFromOriginals(s) {
    if (this.originalNodes.size === 0) return null;
    const prev = deepClone(s.doc);
    for (const [id, original] of this.originalNodes.entries()) {
      const idx = prev.nodes.findIndex((n) => n.id === id);
      if (idx >= 0) prev.nodes[idx] = deepClone(original);
    }
    return prev;
  }
};

// src/plugins_builtin.ts
function gridSnapPlugin(opts) {
  const size = Math.max(1, Math.floor(opts.size));
  return {
    name: "gridSnap",
    onBeforeCommit(doc, reason) {
      if (!(reason == null ? void 0 : reason.includes("move"))) return doc;
      const next = JSON.parse(JSON.stringify(doc));
      for (const n of next.nodes) {
        if (n.locked || n.hidden) continue;
        n.x = Math.round(n.x / size) * size;
        n.y = Math.round(n.y / size) * size;
      }
      return next;
    }
  };
}
function historyPlugin() {
  return {
    name: "history"
  };
}

exports.PageGLEditor = PageGLEditor;
exports.gridSnapPlugin = gridSnapPlugin;
exports.historyPlugin = historyPlugin;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map