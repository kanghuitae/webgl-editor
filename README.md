# PageGL Workspace

This repository is a workspace for the PageGL editor packages and apps.

## Packages

- `packages/pagegl-editor`: WebGL-based editor core (legacy canvas editor MVP)
- `packages/builder-core`: Website builder schema + export helpers

## Apps

- `apps/builder`: Website builder app (React)

## Workspace Scripts

```bash
npm run build
npm run test
npm run typecheck
```

## Run Builder App

```bash
npm install
npm --workspace @pagegl/builder run dev
```

## Builder Integration (Callbacks)

To embed the builder into a service and persist data, set a global bridge before the app loads:

```js
window.PageGLBridge = {
  loadDocument: () => fetch("/api/page").then((r) => r.json()),
  onDocumentChange: (doc) => fetch("/api/page", { method: "POST", body: JSON.stringify(doc) }),
  onDocumentSave: (doc) => fetch("/api/page/save", { method: "POST", body: JSON.stringify(doc) }),
  onExport: ({ html, css }) => {
    // return true to handle export yourself
    console.log(html, css);
    return true;
  },
  onImageUpload: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    return json.url;
  },
  disableLocalStorage: true
};
```

If `onImageUpload` is not provided, the builder falls back to storing the image as a data URL in the document.
The Save button is enabled when `onDocumentSave` is provided.
