import { DocumentModel, Viewport } from "./types";

export interface PluginContext {
  getDoc(): DocumentModel;
  setDoc(next: DocumentModel, reason?: string): void;
  getViewport(): Viewport;
  setViewport(next: Viewport): void;

  getSelection(): string[];
  setSelection(ids: string[]): void;

  emit(type: "change" | "selection" | "viewport", payload: any): void;
}

export interface EditorPlugin {
  name: string;
  onInit?(ctx: PluginContext): void;
  onBeforeCommit?(doc: DocumentModel, reason?: string): DocumentModel;
  onAfterCommit?(doc: DocumentModel, reason?: string): void;
}
