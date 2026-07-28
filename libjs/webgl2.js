import { memory } from './loader.js'
import { ptrToString, allocString } from './utils.js'
import { ctx as gl } from './glue.js'

let nextId = 1;
/** @type {Map<number, {id: number, name: string, location: WebGLUniformLocation}>} */
const uniforms = new Map();

const shaders = [];
const programs = [];
const vaos = [];
const vbos = [];
const textures = [];
const framebuffers = [];

// TODO check return values, add missing gl funcs, fix performance issue?
export const webgl2 = {
  glTexImage2DBitmap: new WebAssembly.Suspending(async (target, level, internalformat, format, type, data, len, width, height, mimetype, flipY) => {
    const bytes = memory.u8.subarray(data, data + len);
    const blob = new Blob([bytes], { type: mimetype ? ptrToString(mimetype) : "image/png" });

    // TODO Promise.all for multiple textures by temp storing bitmaps before calling texImage2D
    const bmp = await createImageBitmap(blob, {
      imageOrientation: flipY ? 'flipY' : 'none',
      colorSpaceConversion: "none",
      premultiplyAlpha: "none",
    });

    if (width && height) {
      memory.u32[width >> 2] = bmp.width;
      memory.u32[height >> 2] = bmp.height;
    }

    gl.texImage2D(target, level, internalformat, format, type, bmp);
    bmp.close();
  }),
  glGetString: (name) => {
    const str = gl.getParameter(name);
    return allocString(str);
  },
  glClearColor: (r, g, b, a) => gl.clearColor(r, g, b, a),
  glClear: (mask) => gl.clear(mask),
  glCreateProgram: () => {
    const program = gl.createProgram();
    programs[nextId] = program;
    return nextId++;
  },
  glLinkProgram: (id) => {
    const program = programs[id];
    gl.linkProgram(program);
    // NOTE TEMP
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
    }
  },
  glUseProgram: (id) => {
    const program = programs[id];
    gl.useProgram(program)
  },
  glCreateShader: (type) => {
    const shader = gl.createShader(type);
    shaders[nextId] = shader;
    return nextId++;
  },
  glShaderSource: (id, count, ptr, lenPtr) => {
    const shader = shaders[id];
    let source = '';

    for (let i = 0; i < count; i++) {
      const strPtr = memory.u32[(ptr >> 2) + i];
      const length = lenPtr ? memory.u32[(lenPtr >> 2) + i] : undefined;
      source += ptrToString(strPtr, length);
    }

    // console.log(source); // TODO rm
    gl.shaderSource(shader, source);
  },
  glAttachShader: (programId, shaderId) => {
    const program = programs[programId];
    const shader = shaders[shaderId];
    gl.attachShader(program, shader);
  },
  glCompileShader: (id) => {
    const shader = shaders[id];
    gl.compileShader(shader);
    // NOTE TEMP
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    }
  },
  glGetShaderParameter: (id, name) => {
    const shader = shaders[id];
    console.log(gl.getShaderParameter(shader, name));
  },
  glGetShaderInfoLog: (id) => {
    const shader = shaders[id];
    console.log(gl.getShaderInfoLog(shader));
  },
  glGenVertexArrays: (n, ptr) => {
    glGenObjects(n, ptr, "createVertexArray", vaos);
  },
  glBindVertexArray: (id) => {
    gl.bindVertexArray(vaos[id]);
  },
  glGenBuffers: (n, ptr) => {
    glGenObjects(n, ptr, "createBuffer", vbos);
  },
  glBindBuffer: (target, id) => {
    const vbo = vbos[id];
    gl.bindBuffer(target, vbo);
  },
  glBufferData: (target, size, ptr, usage) => {
    if (ptr) {
      const data = memory.u8.subarray(ptr, ptr + size);
      gl.bufferData(target, data, usage);
    } else {
      gl.bufferData(target, size, usage);
    }
  },
  glGetAttribLocation: (id, ptr) => {
    const name = ptrToString(ptr);
    const program = programs[id];
    return gl.getAttribLocation(program, name);
  },
  glEnableVertexAttribArray: (idx) => gl.enableVertexAttribArray(idx),
  glVertexAttribPointer: (idx, size, type, normalized, stride, offset) => gl.vertexAttribPointer(idx, size, type, normalized, stride, offset),
  glDrawArrays: (mode, first, count) => gl.drawArrays(mode, first, count),

  glDisable: (cap) => gl.disable(cap),
  glEnable: (cap) => gl.enable(cap),
  glBlendFunc: (sfactor, dfactor) => gl.blendFunc(sfactor, dfactor),
  glBlendFuncSeparate: (sfactorRGB, dfactorRGB, sfactorAlpha, dfactorAlpha) => gl.blendFuncSeparate(sfactorRGB, dfactorRGB, sfactorAlpha, dfactorAlpha),
  glDepthFunc: (func) => gl.depthFunc(func),
  glCullFace: (mode) => gl.cullFace(mode),
  glDrawElements: (mode, count, type, indices) => {
    gl.drawElements(mode, count, type, indices);
  },
  glBindAttribLocation: (id, index, name) => {
    const program = programs[id];
    gl.bindAttribLocation(program, index, ptrToString(name));
  },
  glGetProgramiv: (id, pname, params) => {
    const program = programs[id];
    gl.getProgramParameter(program, pname);
    // TODO
    if (params) {
      memory.u32[params >> 2] = 1;
    }
  },
  glGetProgramInfoLog: (id, bufSize, length, infoLog) => {
    const program = programs[id];
    gl.getProgramInfoLog(program);
    // TODO
  },
  glGetShaderiv: (id, pname, params) => {
    const program = shaders[id];
    gl.getShaderParameter(program, pname);
    // TODO
    if (params) {
      memory.u32[params >> 2] = 1;
    }
  },
  glDeleteProgram: (id) => {
    const program = programs[id];
    gl.deleteProgram(program);
    programs[id] = null;
  },
  glDeleteShader: (id) => {
    const program = shaders[id];
    gl.deleteShader(program);
    shaders[id] = null;
  },
  glGetUniformLocation: (id, ptr) => {
    const program = programs[id];
    if (!program) return null;
    const name = ptrToString(ptr);

    for (const [uid, loc] of uniforms) {
      if (loc.id === id && loc.name === name) return uid;
    }

    const location = gl.getUniformLocation(program, name);
    uniforms.set(nextId, { id, name, location });
    return nextId++;
  },
  glUniformMatrix4fv: (id, count, transpose, value) => {
    const uniform = uniforms.get(id) || null;
    const value32 = value >> 2;
    gl.uniformMatrix4fv(uniform.location, transpose, memory.f32.subarray(value32, value32 + count * 16));
  },
  glActiveTexture: (texture) => gl.activeTexture(texture),
  glUniform1i: (id, v0) => {
    const uniform = uniforms.get(id) || null;
    gl.uniform1i(uniform.location, v0);
  },
  glUniform1f: (id, v0) => {
    const uniform = uniforms.get(id) || null;
    gl.uniform1f(uniform.location, v0);
  },
  glUniform2f: (id, v0, v1) => {
    const uniform = uniforms.get(id) || null;
    gl.uniform2f(uniform.location, v0, v1);
  },
  glUniform4f: (id, v0, v1, v2, v3) => {
    const uniform = uniforms.get(id) || null;
    gl.uniform4f(uniform.location, v0, v1, v2, v3);
  },
  glGenTextures: (n, ptr) => {
    glGenObjects(n, ptr, "createTexture", textures);
  },
  glBindTexture: (target, id) => gl.bindTexture(target, textures[id]),
  glTexParameteri: (target, pname, param) => gl.texParameteri(target, pname, param),
  glTexImage2D: (target, level, internalformat, width, height, border, format, type, pixelsPtr) => {
    if (pixelsPtr) {
      const pixels = memory.u8.subarray(pixelsPtr, pixelsPtr + width * height * 4);
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels);
    } else {
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, null);
    }
  },
  glDeleteTextures: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = memory.u32[(ptr >> 2) + i];
      const tex = textures[id];
      gl.deleteTexture(tex);
      textures[id] = null;
    }
  },
  glDeleteVertexArrays: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = memory.u32[(ptr >> 2) + i];
      gl.deleteVertexArray(vaos[id]);
      vaos[id] = null;
    }
  },
  glVertexAttribIPointer: (index, size, type, stride, pointer) => {
    gl.vertexAttribIPointer(index, size, type, stride, pointer);
  },
  glDeleteBuffers: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = memory.u32[(ptr >> 2) + i];
      gl.deleteBuffer(vbos[id]);
      vbos[id] = null;
    }
  },
  glDepthMask: (flag) => gl.depthMask(flag),
  glGenerateMipmap: (target) => gl.generateMipmap(target),
  glBindBufferBase: (target, index, id) => {
    const vbo = vbos[id];
    gl.bindBufferBase(target, index, vbo);
  },
  glGenFramebuffers: (n, ptr) => {
    glGenObjects(n, ptr, "createFramebuffer", framebuffers);
  },
  glBindFramebuffer: (target, id) => {
    const framebuffer = framebuffers[id];
    gl.bindFramebuffer(target, framebuffer);
  },
  glFramebufferTexture2D: (target, attachment, textarget, id, level) => {
    const texture = textures[id];
    gl.framebufferTexture2D(target, attachment, textarget, texture, level);
  },
  glDeleteFramebuffers: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = memory.u32[(ptr >> 2) + i];
      const framebuffer = framebuffers[id];
      gl.deleteFramebuffer(framebuffer);
      framebuffers[id] = null;
    }
  },
  glColorMask: (red, green, blue, alpha) => {
    gl.colorMask(red, green, blue, alpha);
  },
  glViewport: (x, y, width, height) => {
    gl.viewport(x, y, width, height);
  },
  glBufferSubData: (target, offset, size, ptr) => {
    if (ptr) {
      const data = memory.u8.subarray(ptr, ptr + size);
      gl.bufferSubData(target, offset, data);
    } else {
      gl.bufferSubData(target, offset, null);
    }
  },
  glBlitFramebuffer: (srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter) => {
    gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
  },
  glCopyTexImage2D: (target, level, internalformat, x, y, width, height, border) => {
    gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
  },
  glStencilMask: (mask) => {
    gl.stencilMask(mask);
  },
  glClearDepthf: (d) => {
    gl.clearDepth(d);
  },
  glClearStencil: (s) => {
    gl.clearStencil(s);
  },
  glScissor: (x, y, width, height) => {
    gl.scissor(x, y, width, height);
  },
  glDepthRangef: (n, f) => {
    gl.depthRange(n, f);
  },
  glBlendEquationSeparate: (modeRGB, modeAlpha) => {
    gl.blendEquationSeparate(modeRGB, modeAlpha);
  },
  glBlendColor: (red, green, blue, alpha) => {
    gl.blendColor(red, green, blue, alpha);
  },
  glStencilFunc: (func, ref, mask) => {
    gl.stencilFunc(func, ref, mask);
  },
  glStencilOp: (fail, zfail, zpass) => {
    gl.stencilOp(fail, zfail, zpass);
  },
  glUniformBlockBinding: (id, uniformBlockIndex, uniformBlockBinding) => {
    const program = programs[id];
    gl.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
  },
  glGetUniformBlockIndex: (id, uniformBlockName) => {
    const program = programs[id];
    gl.getUniformBlockIndex(program, ptrToString(uniformBlockName));
  },
  glVertexAttrib4fv: (index, v) => {
    const v32 = v >> 2;
    gl.vertexAttrib4fv(index, memory.f32.subarray(v32, v32 + count * 16));
  },
  glDisableVertexAttribArray: (index) => {
    gl.disableVertexAttribArray(index);
  },
  glGetError: () => {
    return gl.getError();
  }
};

function glGenObjects(n, ptr, createFunction, objectTable) {
  for (let i = 0; i < n; i++) {
    const buf = gl[createFunction]();
    if (buf) {
      const id = nextId++;
      objectTable[id] = buf;
      memory.u32[(ptr >> 2) + i] = id;
    }
  }
}
