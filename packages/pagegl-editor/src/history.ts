import { DocumentModel } from "./types";

export interface Command {
  name: string;
  do(doc: DocumentModel): DocumentModel;
  undo(doc: DocumentModel): DocumentModel;
}

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  push(cmd: Command) {
    this.undoStack.push(cmd);
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(doc: DocumentModel): { doc: DocumentModel; name?: string } {
    const cmd = this.undoStack.pop();
    if (!cmd) return { doc };
    const next = cmd.undo(doc);
    this.redoStack.push(cmd);
    return { doc: next, name: cmd.name };
  }

  redo(doc: DocumentModel): { doc: DocumentModel; name?: string } {
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
}
