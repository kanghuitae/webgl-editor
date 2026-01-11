import type { DocumentModel } from "@pagegl/builder-core";

export interface ExportPayload {
  doc: DocumentModel;
  html: string;
  css: string;
}

export interface BuilderBridge {
  loadDocument?: () => DocumentModel | Promise<DocumentModel | null> | null;
  onDocumentChange?: (doc: DocumentModel) => void | Promise<void>;
  onDocumentSave?: (doc: DocumentModel) => void | Promise<void>;
  onExport?: (payload: ExportPayload) => boolean | void | Promise<boolean | void>;
  onImageUpload?: (file: File) => Promise<string | { src: string } | null>;
  disableLocalStorage?: boolean;
}

export function getBridge(): BuilderBridge | null {
  if (typeof window === "undefined") return null;
  return window.PageGLBridge ?? null;
}

declare global {
  interface Window {
    PageGLBridge?: BuilderBridge;
  }
}
