import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ReactNode,
  MouseEvent,
  ChangeEvent,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent
} from "react";
import {
  Block,
  BreakpointId,
  DocumentModel,
  SectionTemplate,
  Style,
  createDefaultDocument,
  cloneDocument,
  instantiateSectionTemplate,
  resolveStyle,
  sectionTemplates,
} from "@pagegl/builder-core";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Footprints,
  GripVertical,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Sparkles,
  Star
} from "lucide-react";
import { getBridge } from "./bridge";

const breakpointWidths: Record<BreakpointId, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375
};

const categoryOrder = [
  "Hero",
  "Features",
  "Social Proof",
  "Pricing",
  "CTA",
  "Stats",
  "Footer"
];

function groupSectionTemplates(templates: SectionTemplate[]) {
  const map = new Map<string, SectionTemplate[]>();
  for (const template of templates) {
    const list = map.get(template.category) ?? [];
    list.push(template);
    map.set(template.category, list);
  }

  const sorted = Array.from(map.entries()).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a[0]);
    const bIndex = categoryOrder.indexOf(b[0]);
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sorted;
}

function CategoryIcon({ name }: { name: string }) {
  const common = {
    className: "category-icon-svg",
    size: 16,
    strokeWidth: 1.8,
    "aria-hidden": true
  };

  switch (name) {
    case "Basics":
      return <LayoutGrid {...common} />;
    case "Features":
      return <Star {...common} />;
    case "Social Proof":
      return <MessageSquare {...common} />;
    case "Pricing":
      return <CreditCard {...common} />;
    case "CTA":
      return <Sparkles {...common} />;
    case "Stats":
      return <BarChart3 {...common} />;
    case "Footer":
      return <Footprints {...common} />;
    default:
      return <LayoutGrid {...common} />;
  }
}

function findParentId(doc: DocumentModel, childId: string) {
  for (const block of Object.values(doc.blocks)) {
    if (block.children && block.children.includes(childId)) return block.id;
  }
  return null;
}

function collectSubtreeIds(doc: DocumentModel, rootId: string) {
  const ids: string[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    const block = doc.blocks[currentId];
    if (!block) continue;
    ids.push(currentId);
    if (block.children) stack.push(...block.children);
  }
  return ids;
}

function cloneSubtree(doc: DocumentModel, rootId: string) {
  const ids = collectSubtreeIds(doc, rootId);
  const suffix = Math.random().toString(16).slice(2, 8);
  const idMap = new Map<string, string>();

  for (const id of ids) {
    idMap.set(id, `${id}-${suffix}`);
  }

  const blocks: Record<string, Block> = {};
  for (const id of ids) {
    const original = doc.blocks[id];
    if (!original) continue;
    const next = JSON.parse(JSON.stringify(original)) as Block;
    next.id = idMap.get(id) ?? id;
    if (next.children) {
      next.children = next.children.map((childId) => idMap.get(childId) ?? childId);
    }
    blocks[next.id] = next;
  }

  return { rootId: idMap.get(rootId) ?? rootId, blocks };
}

function findRepeatableContainers(doc: DocumentModel, sectionId: string) {
  const ids = collectSubtreeIds(doc, sectionId);
  return ids
    .map((id) => doc.blocks[id])
    .filter((block): block is Block => Boolean(block))
    .filter((block) => block.type === "container" && block.meta?.repeatable);
}

function findSectionButtons(doc: DocumentModel, sectionId: string) {
  const ids = collectSubtreeIds(doc, sectionId);
  return ids
    .map((id) => doc.blocks[id])
    .filter((block): block is Block => Boolean(block))
    .filter((block) => block.type === "button");
}

type HistoryState = {
  past: DocumentModel[];
  present: DocumentModel;
  future: DocumentModel[];
};

const storageKey = "pagegl-builder-doc";

function loadInitialDoc() {
  if (typeof window === "undefined") return createDefaultDocument();
  const bridge = getBridge();
  if (bridge?.disableLocalStorage) return createDefaultDocument();
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return createDefaultDocument();
  try {
    const parsed = JSON.parse(raw) as DocumentModel;
    if (!parsed || !parsed.root) return createDefaultDocument();
    return parsed;
  } catch {
    return createDefaultDocument();
  }
}

function useHistory(initial: DocumentModel) {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initial,
    future: []
  });

  const commit = useCallback((next: DocumentModel) => {
    setState((prev) => ({
      past: [...prev.past, prev.present],
      present: next,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1)
      };
    });
  }, []);

  const reset = useCallback((next: DocumentModel) => {
    setState({ past: [], present: next, future: [] });
  }, []);

  return { state, commit, undo, redo, reset };
}

function styleToInline(style: Style): CSSProperties {
  const inline: CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (value == null || key === "cssVars") continue;
    (inline as Record<string, string>)[key] = value;
  }
  if (style.cssVars) {
    for (const [key, value] of Object.entries(style.cssVars)) {
      if (value == null) continue;
      const name = key.startsWith("--") ? key : `--${key}`;
      (inline as Record<string, string>)[name] = value;
    }
  }
  return inline;
}

function App() {
  const bridge = useMemo(() => getBridge(), []);
  const { state, commit, undo, redo, reset } = useHistory(loadInitialDoc());
  const doc = state.present;
  const [selection, setSelection] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<BreakpointId>("desktop");
  const [activeCategory, setActiveCategory] = useState("Basics");
  const [categoryView, setCategoryView] = useState<"grid" | "list">("grid");
  const [sidebarTab, setSidebarTab] = useState<"add" | "layers">("add");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [dragState, setDragState] = useState<{
    dragId: string | null;
    overId: string | null;
    position: "before" | "after" | null;
  }>({ dragId: null, overId: null, position: null });
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "error" | "info" } | null>(null);
  const changeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeState = useRef<{ id: string; startY: number; startHeight: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);

  const canvasWidth = breakpointWidths[breakpoint];

  const groupedTemplates = useMemo(
    () => groupSectionTemplates(sectionTemplates),
    []
  );
  const categories = useMemo(
    () => ["Basics", ...groupedTemplates.map(([category]) => category)],
    [groupedTemplates]
  );
  const templatesByCategory = useMemo(
    () => new Map(groupedTemplates),
    [groupedTemplates]
  );
  const visibleTemplates = activeCategory === "Basics"
    ? []
    : (templatesByCategory.get(activeCategory) ?? []);
  const activeCategoryCount = activeCategory === "Basics" ? 1 : visibleTemplates.length;

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0] ?? "Basics");
      setCategoryView("grid");
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const rect = viewport.getBoundingClientRect();
      const available = Math.max(320, rect.width - 48);
      const nextScale = Math.min(1, available / canvasWidth);
      setPreviewScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    updateScale();

    return () => observer.disconnect();
  }, [canvasWidth]);

  const saveDoc = useCallback(async () => {
    if (!bridge?.onDocumentSave) return;
    try {
      await bridge.onDocumentSave(cloneDocument(doc));
      setToast({ message: "Saved.", tone: "ok" });
    } catch (error) {
      console.error("Save failed", error);
      setToast({ message: "Save failed.", tone: "error" });
    }
  }, [bridge, doc]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      if (event.key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      }
      if (event.key === "s" && bridge?.onDocumentSave) {
        event.preventDefault();
        void saveDoc();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, saveDoc, bridge]);

  useEffect(() => {
    if (!bridge?.loadDocument) return;
    const result = bridge.loadDocument();
    if (!result) return;

    if (typeof (result as Promise<DocumentModel | null>).then === "function") {
      (result as Promise<DocumentModel | null>)
        .then((loaded) => {
          if (loaded) reset(loaded);
        })
        .catch((error) => {
          console.error("Load document failed", error);
        });
      return;
    }

    reset(result as DocumentModel);
  }, [bridge, reset]);

  useEffect(() => {
    if (!bridge?.onDocumentChange) return;
    if (changeTimer.current) clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      Promise.resolve(bridge.onDocumentChange?.(cloneDocument(doc))).catch((error) => {
        console.error("Sync failed", error);
      });
    }, 400);
    return () => {
      if (changeTimer.current) clearTimeout(changeTimer.current);
    };
  }, [doc, bridge]);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (bridge?.disableLocalStorage) return;
    window.localStorage.setItem(storageKey, JSON.stringify(doc));
  }, [doc, bridge]);

  const selectedBlock = selection ? doc.blocks[selection] : null;
  const selectedSection = selectedBlock?.type === "section" ? selectedBlock : null;
  const showInspector = Boolean(selectedSection);

  const updateDoc = (fn: (draft: DocumentModel) => void) => {
    const next = cloneDocument(doc);
    fn(next);
    commit(next);
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    updateDoc((draft) => {
      const block = draft.blocks[id];
      if (!block) return;
      draft.blocks[id] = { ...block, ...patch } as Block;
    });
  };

  const updateBlockStyle = (id: string, patch: Partial<Style>) => {
    updateDoc((draft) => {
      const block = draft.blocks[id];
      if (!block) return;
      if (breakpoint === "desktop") {
        block.style.base = { ...block.style.base, ...patch };
        return;
      }
      const overrides = block.style.overrides ?? {};
      const current = overrides[breakpoint] ?? {};
      overrides[breakpoint] = { ...current, ...patch };
      block.style.overrides = overrides;
    });
  };

  const updateBlockStyleBase = (id: string, patch: Partial<Style>) => {
    updateDoc((draft) => {
      const block = draft.blocks[id];
      if (!block) return;
      block.style.base = { ...block.style.base, ...patch };
    });
  };

  const updatePageStyle = (patch: Partial<Style>) => {
    updateDoc((draft) => {
      if (breakpoint === "desktop") {
        draft.page.style.base = { ...draft.page.style.base, ...patch };
        return;
      }
      const overrides = draft.page.style.overrides ?? {};
      const current = overrides[breakpoint] ?? {};
      overrides[breakpoint] = { ...current, ...patch };
      draft.page.style.overrides = overrides;
    });
  };

  const updatePageStyleBase = (patch: Partial<Style>) => {
    updateDoc((draft) => {
      draft.page.style.base = { ...draft.page.style.base, ...patch };
    });
  };

  const updatePagePalette = (key: string, value: string) => {
    updateDoc((draft) => {
      const base = draft.page.style.base;
      const nextVars = { ...(base.cssVars ?? {}) };
      if (!value) {
        delete nextVars[key];
      } else {
        nextVars[key] = value;
      }
      base.cssVars = nextVars;
    });
  };

  const removeSubtree = (draft: DocumentModel, rootIds: string[]) => {
    const stack = [...rootIds];
    const idsToDelete = new Set<string>();
    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;
      if (idsToDelete.has(currentId)) continue;
      const current = draft.blocks[currentId];
      if (!current) continue;
      idsToDelete.add(currentId);
      if (current.children) stack.push(...current.children);
    }

    for (const id of idsToDelete) {
      delete draft.blocks[id];
    }
    if (selection && idsToDelete.has(selection)) setSelection(null);
  };

  const deleteSection = (id: string) => {
    updateDoc((draft) => {
      if (id === draft.root) return;
      const target = draft.blocks[id];
      if (!target || target.type !== "section") return;

      const parentId = findParentId(draft, id);
      if (parentId) {
        const parent = draft.blocks[parentId];
        if (parent?.children) {
          parent.children = parent.children.filter((childId) => childId !== id);
        }
      }

      removeSubtree(draft, [id]);
    });
  };

  const clearSections = () => {
    const root = doc.blocks[doc.root];
    if (!root || !root.children || root.children.length === 0) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Clear all sections from this page?");
      if (!confirmed) return;
    }

    updateDoc((draft) => {
      const page = draft.blocks[draft.root];
      if (!page || !page.children) return;
      const children = [...page.children];
      page.children = [];
      removeSubtree(draft, children);
    });
  };

  const toggleTree = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reorderSections = (dragId: string, overId: string, position: "before" | "after") => {
    if (dragId === overId) return;
    const dragBlock = doc.blocks[dragId];
    const overBlock = doc.blocks[overId];
    if (!dragBlock || !overBlock) return;
    if (dragBlock.type !== "section" || overBlock.type !== "section") return;
    if (findParentId(doc, dragId) !== doc.root) return;
    if (findParentId(doc, overId) !== doc.root) return;

    updateDoc((draft) => {
      const parent = draft.blocks[draft.root];
      if (!parent || !parent.children) return;
      const list = [...parent.children];
      const fromIndex = list.indexOf(dragId);
      const toIndex = list.indexOf(overId);
      if (fromIndex < 0 || toIndex < 0) return;
      list.splice(fromIndex, 1);
      const nextIndex = list.indexOf(overId);
      const insertIndex = nextIndex + (position === "after" ? 1 : 0);
      list.splice(insertIndex, 0, dragId);
      parent.children = list;
    });
  };

  const handleDragStart = (id: string) => {
    setDragState({ dragId: id, overId: null, position: null });
  };

  const handleDragOver = (id: string, position: "before" | "after") => {
    setDragState((prev) =>
      prev.dragId ? { ...prev, overId: id, position } : prev
    );
  };

  const handleDragEnd = () => {
    setDragState({ dragId: null, overId: null, position: null });
  };

  const handleDrop = (dragId: string, overId: string, position: "before" | "after") => {
    reorderSections(dragId, overId, position);
    handleDragEnd();
  };

  const addRepeatableItem = (containerId: string) => {
    updateDoc((draft) => {
      const container = draft.blocks[containerId];
      if (!container || container.type !== "container" || !container.children?.length) return;
      const templateId = container.children[container.children.length - 1];
      const cloned = cloneSubtree(draft, templateId);
      Object.assign(draft.blocks, cloned.blocks);
      container.children.push(cloned.rootId);
    });
  };

  const removeRepeatableItem = (containerId: string) => {
    updateDoc((draft) => {
      const container = draft.blocks[containerId];
      if (!container || container.type !== "container" || !container.children?.length) return;
      const removeId = container.children[container.children.length - 1];
      container.children = container.children.filter((id) => id !== removeId);
      removeSubtree(draft, [removeId]);
    });
  };

  const addBlankSection = () => {
    const sectionId = `section-${Math.random().toString(16).slice(2)}`;
    const containerId = `container-${Math.random().toString(16).slice(2)}`;
    const textId = `text-${Math.random().toString(16).slice(2)}`;

    updateDoc((draft) => {
      const parent = draft.blocks[draft.root];
      if (!parent || !parent.children) return;

      draft.blocks[sectionId] = {
        id: sectionId,
        type: "section",
        name: "Section",
        children: [containerId],
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            padding: "56px 48px"
          },
          overrides: {
            tablet: { flexDirection: "column", padding: "48px 32px" },
            mobile: { flexDirection: "column", padding: "32px 20px", gap: "16px" }
          }
        }
      };
      draft.blocks[containerId] = {
        id: containerId,
        type: "container",
        name: "Content",
        children: [textId],
        style: {
          base: { display: "flex", flexDirection: "column", gap: "12px", maxWidth: "560px" }
        }
      };
      draft.blocks[textId] = {
        id: textId,
        type: "text",
        name: "Headline",
        content: { text: "New section headline" },
        style: {
          base: { fontSize: "32px", fontWeight: "600", lineHeight: "1.2" }
        }
      };
      parent.children.push(sectionId);
    });

    setSelection(sectionId);
  };

  const addSectionTemplate = (templateId: string) => {
    const template = sectionTemplates.find((item) => item.id === templateId);
    if (!template) return;
    const inst = instantiateSectionTemplate(template);

    updateDoc((draft) => {
      const parent = draft.blocks[draft.root];
      if (!parent || !parent.children) return;
      for (const [id, block] of Object.entries(inst.blocks)) {
        draft.blocks[id] = block;
      }
      parent.children.push(inst.rootId);
    });

    setSelection(inst.rootId);
  };

  const handleImageUpload = async (blockId: string, file: File | null) => {
    if (!file) return;
    const block = doc.blocks[blockId];
    if (!block || block.type !== "image") return;

    try {
      let src: string | null = null;
      if (bridge?.onImageUpload) {
        const result = await bridge.onImageUpload(file);
        src = typeof result === "string" ? result : result?.src ?? null;
      }
      if (!src) src = await readFileAsDataUrl(file);
      updateBlock(blockId, { content: { ...block.content, src } });
    } catch (error) {
      console.error("Image upload failed", error);
    }
  };

  const handleSectionResizeStart = useCallback(
    (event: ReactPointerEvent, blockId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      const section = target.closest(".block-section") as HTMLElement | null;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      resizeState.current = { id: blockId, startY: event.clientY, startHeight: rect.height };
      setResizingId(blockId);
      setResizeHeight(Math.round(rect.height));
      target.setPointerCapture?.(event.pointerId);
    },
    []
  );

  useEffect(() => {
    const canvas = glCanvasRef.current;
    const host = canvasHostRef.current;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("shader create failed");
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(log ?? "shader compile failed");
      }
      return shader;
    };

    let program: WebGLProgram;
    try {
      const vs = compile(gl.VERTEX_SHADER, `#version 300 es
        precision highp float;
        const vec2 positions[3] = vec2[](
          vec2(-1.0, -1.0),
          vec2(3.0, -1.0),
          vec2(-1.0, 3.0)
        );
        void main() {
          gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
        }
      `);
      const fs = compile(gl.FRAGMENT_SHADER, `#version 300 es
        precision highp float;
        out vec4 outColor;
        uniform vec2 uResolution;
        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          float gridX = step(0.98, fract(uv.x * 20.0));
          float gridY = step(0.98, fract(uv.y * 20.0));
          float grid = clamp(gridX + gridY, 0.0, 1.0);
          vec3 base = mix(vec3(0.98, 0.97, 0.94), vec3(0.90, 0.97, 0.95), uv.y);
          vec3 color = base - grid * 0.06;
          outColor = vec4(color, 0.35);
        }
      `);
      const nextProgram = gl.createProgram();
      if (!nextProgram) throw new Error("program create failed");
      gl.attachShader(nextProgram, vs);
      gl.attachShader(nextProgram, fs);
      gl.linkProgram(nextProgram);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(nextProgram);
        gl.deleteProgram(nextProgram);
        throw new Error(log ?? "program link failed");
      }
      program = nextProgram;
    } catch (error) {
      console.error("WebGL overlay failed", error);
      return;
    }

    const uResolution = gl.getUniformLocation(program, "uResolution");
    if (!uResolution) {
      gl.deleteProgram(program);
      return;
    }
    let frameId: number | null = null;

    const render = () => {
      gl.useProgram(program);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
      const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      frameId = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      gl.deleteProgram(program);
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const current = resizeState.current;
      if (!current) return;
      const delta = event.clientY - current.startY;
      const nextHeight = Math.max(50, Math.round(current.startHeight + delta));
      updateBlockStyle(current.id, { minHeight: `${nextHeight}px` });
      setResizeHeight(nextHeight);
    };

    const onStop = () => {
      resizeState.current = null;
      setResizingId(null);
      setResizeHeight(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onStop);
    window.addEventListener("pointercancel", onStop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onStop);
      window.removeEventListener("pointercancel", onStop);
    };
  }, [updateBlockStyle]);

  const pageStyle = useMemo(() => resolveStyle(doc.page.style, breakpoint), [doc, breakpoint]);
  const canSave = Boolean(bridge?.onDocumentSave);

  return (
    <div className="app">
      <div className="top-controls">
        <div className="control-group left">
          <div className="control-pill">
            <button onClick={undo} disabled={state.past.length === 0}>Undo</button>
            <button onClick={redo} disabled={state.future.length === 0}>Redo</button>
          </div>
        </div>
        <div className="control-group center">
          <div className="control-pill">
            {(["desktop", "tablet", "mobile"] as BreakpointId[]).map((bp) => (
              <button
                key={bp}
                className={bp === breakpoint ? "active" : ""}
                onClick={() => setBreakpoint(bp)}
              >
                {bp}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group right">
          <button className="control-button primary" onClick={saveDoc} disabled={!canSave}>Save</button>
        </div>
      </div>
      <div
        className="layout"
      >
        <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
          <div className="sidebar-header">
            <button
              type="button"
              className="sidebar-collapse"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="sidebar-collapse-icon" aria-hidden="true" />
              ) : (
                <ChevronLeft className="sidebar-collapse-icon" aria-hidden="true" />
              )}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-content">
              <div className="sidebar-tabs">
                <button
                  type="button"
                  className={`sidebar-tab${sidebarTab === "add" ? " active" : ""}`}
                  onClick={() => setSidebarTab("add")}
                >
                  Add
                </button>
                <button
                  type="button"
                  className={`sidebar-tab${sidebarTab === "layers" ? " active" : ""}`}
                  onClick={() => setSidebarTab("layers")}
                >
                  Layers
                </button>
              </div>
              {sidebarTab === "add" && (
                <div className="section-browser">
                  <div className="sidebar-section-title">Add</div>
                  {categoryView === "grid" && (
                    <div className="category-grid">
                      {categories.map((category) => {
                        const count = category === "Basics"
                          ? 1
                          : (templatesByCategory.get(category)?.length ?? 0);
                        return (
                          <button
                            key={category}
                            type="button"
                            className={`category-card${category === activeCategory ? " active" : ""}`}
                            onClick={() => {
                              setActiveCategory(category);
                              setCategoryView("list");
                            }}
                            aria-pressed={category === activeCategory}
                          >
                            <span className="category-icon">
                              <CategoryIcon name={category} />
                            </span>
                            <span className="category-title">{category}</span>
                            <span className="category-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {categoryView === "list" && (
                    <div className="section-list">
                      <div className="section-list-header">
                        <button
                          type="button"
                          className="section-back"
                          onClick={() => setCategoryView("grid")}
                          aria-label="Back to categories"
                        >
                          <ArrowLeft className="section-back-icon" aria-hidden="true" />
                        </button>
                        <div className="section-list-meta">
                          <span className="section-list-title">{activeCategory}</span>
                          <span className="section-list-count">{activeCategoryCount}</span>
                        </div>
                      </div>
                      <div className="section-grid">
                        {activeCategory === "Basics" && (
                          <button className="section-card" onClick={addBlankSection}>
                            <span className="section-title">Blank Section</span>
                            <span className="section-desc">Start from a clean section.</span>
                          </button>
                        )}
                        {activeCategory !== "Basics" && visibleTemplates.length > 0 && (
                          visibleTemplates.map((template) => (
                            <button
                              key={template.id}
                              className="section-card"
                              onClick={() => addSectionTemplate(template.id)}
                            >
                              <span className="section-title">{template.name}</span>
                              <span className="section-desc">{template.description}</span>
                            </button>
                          ))
                        )}
                        {activeCategory !== "Basics" && visibleTemplates.length === 0 && (
                          <div className="section-empty">No sections yet.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {sidebarTab === "layers" && (
                <>
                  <div className="tree-title">Page Structure</div>
                  <div className="tree">
                    <Tree
                      doc={doc}
                      rootId={doc.root}
                      parentId={null}
                      depth={0}
                      selection={selection}
                      onSelect={setSelection}
                      collapsedIds={collapsedIds}
                      onToggle={toggleTree}
                      onRename={updateBlock}
                      onDelete={deleteSection}
                      onClear={clearSections}
                      dragState={dragState}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
        <main className="canvas-shell">
          <div className="canvas-meta">
            <span>{breakpoint.toUpperCase()}</span>
            <span>{canvasWidth}px</span>
          </div>
          <div className="canvas" onClick={() => setSelection(null)} ref={canvasViewportRef}>
            <div className="canvas-surface" ref={canvasHostRef}>
              <canvas className="gl-canvas" ref={glCanvasRef} />
              <div
                className="device-frame"
                style={{
                  width: canvasWidth,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center"
                }}
              >
                <div
                  className="page"
                  style={{
                    ...styleToInline(pageStyle),
                    width: "100%",
                    minHeight: "70vh"
                  }}
                >
                  <BlockRenderer
                    doc={doc}
                    blockId={doc.root}
                    breakpoint={breakpoint}
                    selection={selection}
                    resizingId={resizingId}
                    resizeHeight={resizeHeight}
                    onSelect={setSelection}
                    onSectionResizeStart={handleSectionResizeStart}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {toast && (
        <div className={`toast ${toast.tone}`}>
          {toast.message}
        </div>
      )}
      {showInspector && selectedSection && (
        <aside className="inspector floating-inspector">
          <Inspector
            doc={doc}
            breakpoint={breakpoint}
            block={selectedSection}
            pageStyle={pageStyle}
            onUpdateBlock={updateBlock}
            onUpdateBlockStyle={updateBlockStyle}
            onUpdateBlockStyleBase={updateBlockStyleBase}
            onUpdatePageStyle={updatePageStyle}
            onUpdatePageStyleBase={updatePageStyleBase}
            onUpdatePagePalette={updatePagePalette}
            onAddRepeatableItem={addRepeatableItem}
            onRemoveRepeatableItem={removeRepeatableItem}
            onImageUpload={handleImageUpload}
            onDeleteSection={deleteSection}
          />
        </aside>
      )}
    </div>
  );
}

function BlockRenderer({
  doc,
  blockId,
  breakpoint,
  selection,
  resizingId,
  resizeHeight,
  onSelect,
  onSectionResizeStart
}: {
  doc: DocumentModel;
  blockId: string;
  breakpoint: BreakpointId;
  selection: string | null;
  resizingId: string | null;
  resizeHeight: number | null;
  onSelect: (id: string) => void;
  onSectionResizeStart: (event: ReactPointerEvent, id: string) => void;
}) {
  const block = doc.blocks[blockId];
  if (!block) return null;

  const style = styleToInline(resolveStyle(block.style, breakpoint));
  const isSelected = selection === block.id;
  const isResizing = resizingId === block.id;
  const className = `block block-${block.type}${block.type === "section" ? " block-section" : ""}${
    isSelected ? " is-selected" : ""
  }${isResizing ? " is-resizing" : ""}`;

  const selectBlock = (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(block.id);
  };

  switch (block.type) {
    case "section":
      return (
        <section className={className} style={style} data-block-id={block.id} onClick={selectBlock}>
          <div className="section-label">{block.name ?? "Section"}</div>
          {block.children?.map((childId) => (
            <BlockRenderer
              key={childId}
              doc={doc}
              blockId={childId}
              breakpoint={breakpoint}
              selection={selection}
              resizingId={resizingId}
              resizeHeight={resizeHeight}
              onSelect={onSelect}
              onSectionResizeStart={onSectionResizeStart}
            />
          ))}
          <div
            className={`section-resize-handle${isResizing ? " active" : ""}`}
            onPointerDown={(event) => onSectionResizeStart(event, block.id)}
          >
            <span className="section-resize-line" />
            <span className="section-resize-grip" />
            {isResizing && (
              <div className="resize-tooltip">
                {Math.round(resizeHeight ?? 0)}px
              </div>
            )}
          </div>
        </section>
      );
    case "container":
      return (
        <div className={className} style={style} data-block-id={block.id} onClick={selectBlock}>
          {block.children?.map((childId) => (
            <BlockRenderer
              key={childId}
              doc={doc}
              blockId={childId}
              breakpoint={breakpoint}
              selection={selection}
              onSelect={onSelect}
              onSectionResizeStart={onSectionResizeStart}
            />
          ))}
        </div>
      );
    case "text":
      return (
        <p className={className} style={style} data-block-id={block.id} onClick={selectBlock}>
          {block.content.text}
        </p>
      );
    case "image":
      return (
        <img
          className={className}
          style={style}
          data-block-id={block.id}
          src={block.content.src}
          alt={block.content.alt ?? ""}
          onClick={(event) => {
            event.preventDefault();
            selectBlock(event);
          }}
        />
      );
    case "button":
      return (
        <a
          className={className}
          style={style}
          data-block-id={block.id}
          href={block.content.href ?? "#"}
          onClick={(event) => {
            event.preventDefault();
            selectBlock(event);
          }}
        >
          {block.content.label}
        </a>
      );
    default:
      return null;
  }
}

function Tree({
  doc,
  rootId,
  parentId,
  depth,
  selection,
  onSelect,
  collapsedIds,
  onToggle,
  onRename,
  onDelete,
  onClear,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}: {
  doc: DocumentModel;
  rootId: string;
  parentId: string | null;
  depth: number;
  selection: string | null;
  onSelect: (id: string) => void;
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  onRename: (id: string, patch: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  dragState: { dragId: string | null; overId: string | null; position: "before" | "after" | null };
  onDragStart: (id: string) => void;
  onDragOver: (id: string, position: "before" | "after") => void;
  onDragEnd: () => void;
  onDrop: (dragId: string, overId: string, position: "before" | "after") => void;
}) {
  const block = doc.blocks[rootId];
  if (!block) return null;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(block.name ?? block.type);
  const hasChildren = Boolean(block.children && block.children.length > 0);
  const isCollapsed = collapsedIds.has(block.id);
  const isTopLevelSection = block.type === "section" && parentId === doc.root;
  const isDragOver = dragState.overId === block.id && dragState.position;
  const dragClass = isDragOver ? ` drag-over-${dragState.position}` : "";
  const isDragging = dragState.dragId === block.id;
  const indent = depth * 12 + 8;

  useEffect(() => {
    if (!editing) setDraftName(block.name ?? block.type);
  }, [block.name, block.type, editing]);

  const commitName = () => {
    const nextName = draftName.trim();
    onRename(block.id, { name: nextName.length ? nextName : undefined });
    setEditing(false);
  };

  const cancelName = () => {
    setDraftName(block.name ?? block.type);
    setEditing(false);
  };

  const handleRenameKey = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitName();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelName();
    }
  };

  const canDelete = block.type === "section" && block.id !== doc.root;
  const canClear = block.id === doc.root;
  return (
    <div
      className={`tree-item${selection === block.id ? " active" : ""}${dragClass}${isTopLevelSection ? " draggable" : ""}${isDragging ? " dragging" : ""}`}
      draggable={isTopLevelSection && !editing}
      onDragStart={(event: ReactDragEvent<HTMLDivElement>) => {
        if (!isTopLevelSection || editing) return;
        event.dataTransfer.setData("text/plain", block.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(block.id);
      }}
      onDragOver={(event: ReactDragEvent<HTMLDivElement>) => {
        if (!isTopLevelSection) return;
        const dragId = dragState.dragId ?? event.dataTransfer.getData("text/plain");
        if (!dragId || dragId === block.id) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY - rect.top < rect.height / 2 ? "before" : "after";
        onDragOver(block.id, position);
      }}
      onDragEnd={onDragEnd}
      onDrop={(event: ReactDragEvent<HTMLDivElement>) => {
        if (!isTopLevelSection) return;
        event.preventDefault();
        const dragId = dragState.dragId ?? event.dataTransfer.getData("text/plain");
        if (!dragId || dragId === block.id) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY - rect.top < rect.height / 2 ? "before" : "after";
        onDrop(dragId, block.id, position);
      }}
    >
      <div className="tree-row" style={{ paddingLeft: indent }}>
        <span className="tree-grip" aria-hidden="true">
          <GripVertical className="tree-grip-icon" />
        </span>
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(block.id);
            }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="tree-chevron" aria-hidden="true" />
            ) : (
              <ChevronDown className="tree-chevron" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="tree-toggle spacer" />
        )}
        {editing ? (
          <input
            className="tree-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitName}
            onKeyDown={handleRenameKey}
            autoFocus
          />
        ) : (
          <button className="tree-label" onClick={() => onSelect(block.id)}>
            {block.name ?? block.type}
          </button>
        )}
        <details className="tree-menu" onClick={(event) => event.stopPropagation()}>
          <summary className="tree-menu-button" aria-label="Options">
            <MoreHorizontal className="tree-menu-icon" aria-hidden="true" />
          </summary>
          <div className="tree-menu-list">
            {!editing && (
              <button
                type="button"
                className="tree-menu-item"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(true);
                  const details = event.currentTarget.closest("details") as HTMLDetailsElement | null;
                  if (details) details.open = false;
                }}
              >
                Rename
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="tree-menu-item danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(block.id);
                  const details = event.currentTarget.closest("details") as HTMLDetailsElement | null;
                  if (details) details.open = false;
                }}
              >
                Delete
              </button>
            )}
            {canClear && (
              <button
                type="button"
                className="tree-menu-item danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                  const details = event.currentTarget.closest("details") as HTMLDetailsElement | null;
                  if (details) details.open = false;
                }}
              >
                Clear
              </button>
            )}
          </div>
        </details>
      </div>
      {hasChildren && !isCollapsed && (
        <div className="tree-children">
          {block.children.map((childId) => (
            <Tree
              key={childId}
              doc={doc}
              rootId={childId}
              parentId={block.id}
              depth={depth + 1}
              selection={selection}
              onSelect={onSelect}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onClear={onClear}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Inspector({
  doc,
  breakpoint,
  block,
  pageStyle,
  onUpdateBlock,
  onUpdateBlockStyle,
  onUpdateBlockStyleBase,
  onUpdatePageStyle,
  onUpdatePageStyleBase,
  onUpdatePagePalette,
  onAddRepeatableItem,
  onRemoveRepeatableItem,
  onImageUpload,
  onDeleteSection
}: {
  doc: DocumentModel;
  breakpoint: BreakpointId;
  block: Block | null;
  pageStyle: Style;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onUpdateBlockStyle: (id: string, patch: Partial<Style>) => void;
  onUpdateBlockStyleBase: (id: string, patch: Partial<Style>) => void;
  onUpdatePageStyle: (patch: Partial<Style>) => void;
  onUpdatePageStyleBase: (patch: Partial<Style>) => void;
  onUpdatePagePalette: (key: string, value: string) => void;
  onAddRepeatableItem: (containerId: string) => void;
  onRemoveRepeatableItem: (containerId: string) => void;
  onImageUpload: (id: string, file: File | null) => void | Promise<void>;
  onDeleteSection: (id: string) => void;
}) {
  const activeStyle = block ? resolveStyle(block.style, breakpoint) : null;
  const sectionRepeaters = block?.type === "section" ? findRepeatableContainers(doc, block.id) : [];
  const sectionButtons = block?.type === "section" ? findSectionButtons(doc, block.id) : [];
  const palette = pageStyle.cssVars ?? {};

  const applyButtonVariant = (id: string, variant: "primary" | "secondary" | "ghost") => {
    const variants: Record<string, Partial<Style>> = {
      primary: {
        background: "#111827",
        color: "#ffffff",
        border: "1px solid #111827"
      },
      secondary: {
        background: "#ffffff",
        color: "#111827",
        border: "1px solid #e2e8f0"
      },
      ghost: {
        background: "transparent",
        color: "#111827",
        border: "1px solid transparent"
      }
    };
    onUpdateBlockStyleBase(id, variants[variant]);
  };

  const normalizeBackgroundImage = (value: string) => {
    if (!value.trim()) return "";
    if (value.trim().startsWith("url(")) return value.trim();
    return `url("${value.trim()}")`;
  };

  const extractBackgroundImage = (value: string) => {
    const match = value.match(/^url\(["']?(.*?)["']?\)$/);
    return match ? match[1] : value;
  };

  const resolveButtonVariant = (style: Style | null) => {
    if (!style) return "";
    if (style.background === "#111827") return "primary";
    if (style.background === "#ffffff") return "secondary";
    if (style.background === "transparent") return "ghost";
    return "";
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{block ? (block.type === "section" ? "Section" : "Block") : "Page"}</h2>
        <span className="badge">{breakpoint}</span>
      </div>
      {!block && (
        <div className="panel-body">
          <Field
            label="Background"
            value={pageStyle.background ?? ""}
            onChange={(value) => onUpdatePageStyle({ background: value })}
          />
          <Field
            label="Text Color"
            value={pageStyle.color ?? ""}
            onChange={(value) => onUpdatePageStyle({ color: value })}
          />
          <Field
            label="Font Size"
            value={pageStyle.fontSize ?? ""}
            onChange={(value) => onUpdatePageStyle({ fontSize: value })}
          />
        </div>
      )}
      {block && (
        <div className="panel-body">
          <Field
            label="Name"
            value={block.name ?? ""}
            onChange={(value) => onUpdateBlock(block.id, { name: value })}
          />
          <Section title="Global Theme">
            <ColorField
              label="Page Background"
              value={pageStyle.background ?? ""}
              onChange={(value) => onUpdatePageStyleBase({ background: value })}
            />
            <ColorField
              label="Text Color"
              value={pageStyle.color ?? ""}
              onChange={(value) => onUpdatePageStyleBase({ color: value })}
            />
            <Field
              label="Background Image"
              value={extractBackgroundImage(pageStyle.backgroundImage ?? "")}
              onChange={(value) =>
                onUpdatePageStyleBase({
                  backgroundImage: value ? normalizeBackgroundImage(value) : undefined,
                  backgroundSize: value ? "cover" : undefined,
                  backgroundPosition: value ? "center" : undefined,
                  backgroundRepeat: value ? "no-repeat" : undefined
                })
              }
            />
            <div className="palette-grid">
              <ColorField
                label="Primary"
                value={palette.primary ?? ""}
                onChange={(value) => onUpdatePagePalette("primary", value)}
              />
              <ColorField
                label="Secondary"
                value={palette.secondary ?? ""}
                onChange={(value) => onUpdatePagePalette("secondary", value)}
              />
              <ColorField
                label="Accent"
                value={palette.accent ?? ""}
                onChange={(value) => onUpdatePagePalette("accent", value)}
              />
              <ColorField
                label="Neutral"
                value={palette.neutral ?? ""}
                onChange={(value) => onUpdatePagePalette("neutral", value)}
              />
            </div>
          </Section>
          {block.type === "text" && (
            <Field
              label="Text"
              value={block.content.text}
              onChange={(value) =>
                onUpdateBlock(block.id, {
                  content: { ...block.content, text: value }
                })
              }
              multiline
            />
          )}
          {block.type === "button" && (
            <>
              <Field
                label="Label"
                value={block.content.label}
                onChange={(value) =>
                  onUpdateBlock(block.id, {
                    content: { ...block.content, label: value }
                  })
                }
              />
              <Field
                label="Href"
                value={block.content.href ?? ""}
                onChange={(value) =>
                  onUpdateBlock(block.id, {
                    content: { ...block.content, href: value }
                  })
                }
              />
            </>
          )}
          {block.type === "image" && (
            <>
              <FileField
                label="Upload"
                accept="image/*"
                onChange={(file) => onImageUpload(block.id, file)}
              />
              <Field
                label="Image URL"
                value={block.content.src}
                onChange={(value) =>
                  onUpdateBlock(block.id, {
                    content: { ...block.content, src: value }
                  })
                }
              />
              <Field
                label="Alt"
                value={block.content.alt ?? ""}
                onChange={(value) =>
                  onUpdateBlock(block.id, {
                    content: { ...block.content, alt: value }
                  })
                }
              />
            </>
          )}
          {block.type === "section" && (
            <Section title="Section Background">
              <ColorField
                label="Background"
                value={activeStyle?.background ?? ""}
                onChange={(value) => onUpdateBlockStyle(block.id, { background: value })}
              />
              <ColorField
                label="Text Color"
                value={activeStyle?.color ?? ""}
                onChange={(value) => onUpdateBlockStyle(block.id, { color: value })}
              />
              <Field
                label="Background Image"
                value={extractBackgroundImage(activeStyle?.backgroundImage ?? "")}
                onChange={(value) =>
                  onUpdateBlockStyle(block.id, {
                    backgroundImage: value ? normalizeBackgroundImage(value) : undefined,
                    backgroundSize: value ? "cover" : undefined,
                    backgroundPosition: value ? "center" : undefined,
                    backgroundRepeat: value ? "no-repeat" : undefined
                  })
                }
              />
            </Section>
          )}
          {block.type === "section" && sectionRepeaters.length > 0 && (
            <Section title="Repeatable Items">
              {sectionRepeaters.map((container) => {
                const count = container.children?.length ?? 0;
                return (
                  <div key={container.id} className="repeatable-row">
                    <div>
                      <div className="repeatable-title">{container.name ?? "Items"}</div>
                      <div className="repeatable-count">{count} items</div>
                    </div>
                    <div className="repeatable-actions">
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => onAddRepeatableItem(container.id)}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="mini-button ghost"
                        onClick={() => onRemoveRepeatableItem(container.id)}
                        disabled={count <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </Section>
          )}
          {block.type === "section" && sectionButtons.length > 0 && (
            <Section title="Buttons">
              {sectionButtons.map((button) => {
                const style = resolveStyle(button.style, breakpoint);
                const variant = resolveButtonVariant(style);
                return (
                  <div key={button.id} className="button-editor">
                    <div className="button-meta">{button.name ?? "Button"}</div>
                    <Field
                      label="Label"
                      value={button.content.label}
                      onChange={(value) =>
                        onUpdateBlock(button.id, {
                          content: { ...button.content, label: value }
                        })
                      }
                    />
                    <Field
                      label="Link"
                      value={button.content.href ?? ""}
                      onChange={(value) =>
                        onUpdateBlock(button.id, {
                          content: { ...button.content, href: value }
                        })
                      }
                    />
                    <div className="button-variants">
                      {(["primary", "secondary", "ghost"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`variant-button${variant === opt ? " active" : ""}`}
                          onClick={() => applyButtonVariant(button.id, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Section>
          )}
          <Section title="Layout">
            <Field
              label="Width"
              value={activeStyle?.width ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { width: value })}
            />
            <Field
              label="Min Height"
              value={activeStyle?.minHeight ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { minHeight: value })}
            />
            <Field
              label="Max Width"
              value={activeStyle?.maxWidth ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { maxWidth: value })}
            />
            <Field
              label="Padding"
              value={activeStyle?.padding ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { padding: value })}
            />
            <Field
              label="Gap"
              value={activeStyle?.gap ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { gap: value })}
            />
            <SelectField
              label="Direction"
              value={activeStyle?.flexDirection ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { flexDirection: value || undefined })}
              options={[
                { label: "Row", value: "row" },
                { label: "Column", value: "column" }
              ]}
            />
            <SelectField
              label="Align"
              value={activeStyle?.alignItems ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { alignItems: value || undefined })}
              options={[
                { label: "Start", value: "flex-start" },
                { label: "Center", value: "center" },
                { label: "End", value: "flex-end" },
                { label: "Stretch", value: "stretch" }
              ]}
            />
            <SelectField
              label="Justify"
              value={activeStyle?.justifyContent ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { justifyContent: value || undefined })}
              options={[
                { label: "Start", value: "flex-start" },
                { label: "Center", value: "center" },
                { label: "End", value: "flex-end" },
                { label: "Space Between", value: "space-between" }
              ]}
            />
          </Section>
          <Section title="Style">
            {block.type !== "section" && (
              <>
                <ColorField
                  label="Background"
                  value={activeStyle?.background ?? ""}
                  onChange={(value) => onUpdateBlockStyle(block.id, { background: value })}
                />
                <ColorField
                  label="Color"
                  value={activeStyle?.color ?? ""}
                  onChange={(value) => onUpdateBlockStyle(block.id, { color: value })}
                />
              </>
            )}
            <Field
              label="Font Size"
              value={activeStyle?.fontSize ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { fontSize: value })}
            />
            <Field
              label="Line Height"
              value={activeStyle?.lineHeight ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { lineHeight: value })}
            />
            <Field
              label="Radius"
              value={activeStyle?.borderRadius ?? ""}
              onChange={(value) => onUpdateBlockStyle(block.id, { borderRadius: value })}
            />
          </Section>
          {block.type === "section" && (
            <Section title="Actions">
              <button
                type="button"
                className="danger-button"
                onClick={() => onDeleteSection(block.id)}
              >
                Delete Section
              </button>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  type,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          type={type ?? "text"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeValue = value && value.startsWith("#") ? value : "#ffffff";
  return (
    <label className="field color-field">
      <span>{label}</span>
      <div className="color-inputs">
        <input
          type="color"
          value={safeValue}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          value={value}
          placeholder="#ffffff"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function FileField({
  label,
  accept,
  onChange
}: {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onChange(file);
    event.target.value = "";
  };

  return (
    <label className="field">
      <span>{label}</span>
      <input type="file" accept={accept} onChange={handleChange} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Default</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default App;
