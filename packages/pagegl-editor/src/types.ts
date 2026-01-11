export type RGBA = [number, number, number, number];

export type NodeType = "rect" | "image" | "text";

export interface BaseNode {
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

export interface RectNode extends BaseNode {
  type: "rect";
  fill: RGBA;
}

export interface ImageNode extends BaseNode {
  type: "image";
  src: string;
  opacity?: number;
}

export interface TextNode extends BaseNode {
  type: "text";
  text: string;
  color: RGBA;
  fontSize: number;
}

export type AnyNode = RectNode | ImageNode | TextNode;

export interface PageSpec {
  width: number;
  height: number;
  background: RGBA;
}

export interface DocumentModel {
  page: PageSpec;
  nodes: AnyNode[];
}

export interface Viewport {
  // world -> screen: screen = (world - pan) * zoom
  panX: number;
  panY: number;
  zoom: number;
}

export type EditorEventMap = {
  change: DocumentModel;
  selection: string[];
  viewport: Viewport;
};

export type Handle =
  | "none"
  | "move"
  | "nw" | "n" | "ne"
  | "w"  |      "e"
  | "sw" | "s" | "se";
