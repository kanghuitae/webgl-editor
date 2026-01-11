import { DocumentModel, RGBA, RectNode, Viewport } from "./types";
import { worldToScreen } from "./math";

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log ?? ""}`);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const p = gl.createProgram();
  if (!p) throw new Error("createProgram failed");
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`program link failed: ${log ?? ""}`);
  }
  return p;
}

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;

  private vao: WebGLVertexArrayObject;
  private quadVbo: WebGLBuffer;
  private instanceVbo: WebGLBuffer;

  private uResolution: WebGLUniformLocation;
  private uBg: WebGLUniformLocation | null;

  private capacity = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    const vs = compile(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
      precision highp float;

      // unit quad: (0,0)-(1,1)
      layout(location=0) in vec2 aPos;

      // instance attributes
      layout(location=1) in vec4 iRect; // x,y,w,h in screen space (px)
      layout(location=2) in vec4 iColor;

      uniform vec2 uResolution;

      out vec4 vColor;

      void main() {
        vec2 pos = iRect.xy + aPos * iRect.zw;
        // px -> clip
        vec2 clip = (pos / uResolution) * 2.0 - 1.0;
        // flip y (canvas y down)
        clip.y = -clip.y;
        gl_Position = vec4(clip, 0.0, 1.0);
        vColor = iColor;
      }
    `
    );

    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
      precision highp float;
      in vec4 vColor;
      uniform vec4 uBg;
      out vec4 outColor;
      void main() {
        outColor = vColor + uBg * 0.0;
      }
    `
    );

    this.program = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const uRes = gl.getUniformLocation(this.program, "uResolution");
    const uBg = gl.getUniformLocation(this.program, "uBg");
    if (!uRes) throw new Error("uniform location missing: uResolution");
    this.uResolution = uRes;
    this.uBg = uBg;

    const vao = gl.createVertexArray();
    const quadVbo = gl.createBuffer();
    const instanceVbo = gl.createBuffer();
    if (!vao || !quadVbo || !instanceVbo) throw new Error("buffer/vao create failed");
    this.vao = vao;
    this.quadVbo = quadVbo;
    this.instanceVbo = instanceVbo;

    gl.bindVertexArray(this.vao);

    // quad vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // instance buffer: iRect(4 floats) + iColor(4 floats)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVbo);
    gl.bufferData(gl.ARRAY_BUFFER, 0, gl.DYNAMIC_DRAW);

    const stride = 8 * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 4 * 4);
    gl.vertexAttribDivisor(2, 1);

    gl.bindVertexArray(null);
  }

  resizeToDisplaySize(dpr = window.devicePixelRatio) {
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  render(doc: DocumentModel, vp: Viewport, selection: string[]) {
    const gl = this.gl;
    this.resizeToDisplaySize();

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.useProgram(this.program);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);

    const bg = doc.page.background;
    if (this.uBg) gl.uniform4f(this.uBg, bg[0], bg[1], bg[2], bg[3]);
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rects = doc.nodes.filter(
      (n): n is RectNode => n.type === "rect" && !n.hidden
    );

    const count = rects.length;
    const data = new Float32Array(count * 8);
    const selectionSet = new Set(selection);

    for (let i = 0; i < count; i++) {
      const n = rects[i];
      const p = worldToScreen(n.x, n.y, vp);
      const w = n.w * vp.zoom;
      const h = n.h * vp.zoom;

      const isSel = selectionSet.has(n.id);
      const c: RGBA = n.fill;
      const k = isSel ? 1.15 : 1.0;

      const o = i * 8;
      data[o + 0] = p.x;
      data[o + 1] = p.y;
      data[o + 2] = w;
      data[o + 3] = h;
      data[o + 4] = Math.min(1, c[0] * k);
      data[o + 5] = Math.min(1, c[1] * k);
      data[o + 6] = Math.min(1, c[2] * k);
      data[o + 7] = c[3];
    }

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVbo);

    if (count > this.capacity) {
      this.capacity = Math.max(count, Math.floor(this.capacity * 1.5) + 64);
      gl.bufferData(gl.ARRAY_BUFFER, this.capacity * 8 * 4, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);

    gl.bindVertexArray(null);
  }

  destroy() {
    const gl = this.gl;
    gl.deleteBuffer(this.quadVbo);
    gl.deleteBuffer(this.instanceVbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
