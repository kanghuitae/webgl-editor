# @pagegl/editor

WebGL 기반 페이지(캔버스) 편집 라이브러리의 최소 구현(MVP) 스캐폴딩입니다.

## 설치

```bash
npm install @pagegl/editor
```

## 사용 예시

```ts
import { PageGLEditor, gridSnapPlugin } from "@pagegl/editor";

const canvas = document.querySelector("canvas");
if (!canvas) throw new Error("canvas not found");

const editor = new PageGLEditor({
  canvas,
  plugins: [gridSnapPlugin({ size: 8 })]
});

editor.load({
  page: { width: 1200, height: 800, background: [0.08, 0.08, 0.1, 1] },
  nodes: [
    { id: "r1", type: "rect", x: 80, y: 80, w: 220, h: 120, fill: [0.2, 0.6, 0.9, 1] }
  ]
});
```

## 개발

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 테스트

```bash
npm test
```

## 데모 실행

```bash
npm run demo
```
