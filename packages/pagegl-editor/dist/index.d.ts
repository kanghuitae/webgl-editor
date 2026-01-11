type RGBA = [number, number, number, number];
type NodeType = "rect" | "image" | "text";
interface BaseNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    w: number;
    h: number;
    r?: number;
    z?: number;
    locked?: boolean;
    hidden?: boolean;
}
interface RectNode extends BaseNode {
    type: "rect";
    fill: RGBA;
}
interface ImageNode extends BaseNode {
    type: "image";
    src: string;
    opacity?: number;
}
interface TextNode extends BaseNode {
    type: "text";
    text: string;
    color: RGBA;
    fontSize: number;
}
type AnyNode = RectNode | ImageNode | TextNode;
interface PageSpec {
    width: number;
    height: number;
    background: RGBA;
}
interface DocumentModel {
    page: PageSpec;
    nodes: AnyNode[];
}
interface Viewport {
    panX: number;
    panY: number;
    zoom: number;
}
type EditorEventMap = {
    change: DocumentModel;
    selection: string[];
    viewport: Viewport;
};
type Handle = "none" | "move" | "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

interface PluginContext {
    getDoc(): DocumentModel;
    setDoc(next: DocumentModel, reason?: string): void;
    getViewport(): Viewport;
    setViewport(next: Viewport): void;
    getSelection(): string[];
    setSelection(ids: string[]): void;
    emit(type: "change" | "selection" | "viewport", payload: any): void;
}
interface EditorPlugin {
    name: string;
    onInit?(ctx: PluginContext): void;
    onBeforeCommit?(doc: DocumentModel, reason?: string): DocumentModel;
    onAfterCommit?(doc: DocumentModel, reason?: string): void;
}

declare class PageGLEditor {
    private emitter;
    private store;
    private renderer;
    private plugins;
    private history;
    private unbindInput?;
    private dragging;
    private dragHandle;
    private dragStart;
    private originalNodes;
    constructor(opts: {
        canvas: HTMLCanvasElement;
        plugins?: EditorPlugin[];
    });
    on<K extends keyof EditorEventMap>(type: K, fn: (payload: EditorEventMap[K]) => void): () => void;
    getDoc(): DocumentModel;
    getSelection(): string[];
    load(doc: DocumentModel): void;
    serialize(): string;
    undo(): void;
    redo(): void;
    addNode(node: AnyNode): void;
    setSelection(ids: string[]): void;
    setViewport(vp: Viewport): void;
    destroy(): void;
    private initPlugins;
    private commitWithHistory;
    private commitDoc;
    private bindInput;
    private getDocFromOriginals;
}

declare function gridSnapPlugin(opts: {
    size: number;
}): EditorPlugin;
declare function historyPlugin(): EditorPlugin;

export { type AnyNode, type BaseNode, type DocumentModel, type EditorEventMap, type Handle, type ImageNode, type NodeType, PageGLEditor, type PageSpec, type RGBA, type RectNode, type TextNode, type Viewport, gridSnapPlugin, historyPlugin };
