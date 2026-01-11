import { EditorPlugin } from "./plugins";
import { DocumentModel } from "./types";

export function gridSnapPlugin(opts: { size: number }): EditorPlugin {
  const size = Math.max(1, Math.floor(opts.size));
  return {
    name: "gridSnap",
    onBeforeCommit(doc: DocumentModel, reason?: string) {
      if (!reason?.includes("move")) return doc;

      const next = JSON.parse(JSON.stringify(doc)) as DocumentModel;
      for (const n of next.nodes) {
        if (n.locked || n.hidden) continue;
        n.x = Math.round(n.x / size) * size;
        n.y = Math.round(n.y / size) * size;
      }
      return next;
    },
  };
}

export function historyPlugin(): EditorPlugin {
  return {
    name: "history",
  };
}
