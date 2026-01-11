import { DocumentModel, Viewport } from "./types";

export interface EditorState {
  doc: DocumentModel;
  selection: string[];
  viewport: Viewport;
}

export type PatchFn = (s: EditorState) => EditorState;

export class Store {
  private state: EditorState;
  private subs = new Set<(s: EditorState) => void>();

  constructor(initial: EditorState) {
    this.state = initial;
  }

  get(): EditorState {
    return this.state;
  }

  set(next: EditorState) {
    this.state = next;
    for (const fn of this.subs) fn(this.state);
  }

  patch(fn: PatchFn) {
    const next = fn(this.state);
    this.set(next);
  }

  subscribe(fn: (s: EditorState) => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}
