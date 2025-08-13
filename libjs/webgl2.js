import { memory, refreshMemory, u8, u32 } from './loader.js'
import { ptrToString, allocString } from './utils.js'
import { ctx as gl } from './glue.js'

let nextId = 1;
const shaders = new Map();
const programs = new Map();
const VAOs = new Map();
const VBOs = new Map();
/** @type {Map<number, {id: number, name: string, location: WebGLUniformLocation}>} */
const uniforms = new Map();
const textures = new Map();
const framebuffers = new Map();

// TODO consistent naming for args use Ptr suffix and maybe change global map names?
// TODO check return values + improve nextId usage, add missing gl funcs
export const webgl2 = {
  glGetString: (name) => {
    const str = gl.getParameter(name);
    return allocString(str);
  },
  glClearColor: (r, g, b, a) => gl.clearColor(r, g, b, a),
  glClear: (mask) => gl.clear(mask),
  glCreateProgram: () => {
    const program = gl.createProgram();
    programs.set(nextId, program);
    return nextId++;
  },
  glLinkProgram: (id) => {
    const program = programs.get(id) || null;
    gl.linkProgram(program);
    // NOTE TEMP
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
    }
  },
  glUseProgram: (id) => {
    const program = programs.get(id) || null;
    gl.useProgram(program)
  },
  glCreateShader: (type) => {
    const shader = gl.createShader(type);
    shaders.set(nextId, shader);
    return nextId++;
  },
  glShaderSource: (id, count, ptr, lenPtr) => {
    refreshMemory();
    const shader = shaders.get(id) || null;
    let sources = [];

    for (let i = 0; i < count; i++) {
      const strPtr = u32[(ptr >> 2) + i];
      const length = lenPtr ? u32[(lenPtr >> 2) + i] : undefined;
      const str = ptrToString(strPtr, length);
      sources.push(str);
    }

    // console.log(sources.join('')); // TODO rm
    gl.shaderSource(shader, sources.join(''));
  },
  glAttachShader: (programId, shaderId) => {
    const program = programs.get(programId);
    const shader = shaders.get(shaderId);
    gl.attachShader(program, shader);
  },
  glCompileShader: (id) => {
    const shader = shaders.get(id) || null;
    gl.compileShader(shader);
    // NOTE TEMP
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    }
  },
  glGetShaderParameter: (id, name) => {
    const shader = shaders.get(id) || null;
    console.log(gl.getShaderParameter(shader, name));
  },
  glGetShaderInfoLog: (id) => {
    const shader = shaders.get(id) || null;
    console.log(gl.getShaderInfoLog(shader));
  },
  glGenVertexArrays: (n, ptr) => {
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const vao = gl.createVertexArray();
      VAOs.set(nextId, vao);
      u32[(ptr >> 2) + i] = nextId++;
    }
  },
  glBindVertexArray: (id) => {
    const vao = VAOs.get(id) || null;
    gl.bindVertexArray(vao);
  },
  glGenBuffers: (n, ptr) => {
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const vbo = gl.createBuffer();
      VBOs.set(nextId, vbo);
      u32[(ptr >> 2) + i] = nextId++;
    }
  },
  glBindBuffer: (target, id) => {
    const vbo = VBOs.get(id) || null;
    gl.bindBuffer(target, vbo);
  },
  glBufferData: (target, size, ptr, usage) => {
    if (ptr) {
      refreshMemory();
      const data = u8.subarray(ptr, ptr + size);
      gl.bufferData(target, data, usage);
    } else {
      // TODO check this
      gl.bufferData(target, size, usage);
    }
  },
  glGetAttribLocation: (id, ptr) => {
    const name = ptrToString(ptr);
    const program = programs.get(id) || null;
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
    refreshMemory();
    gl.drawElements(mode, count, type, indices, indices);
  },
  glBindAttribLocation: (id, index, name) => {
    const program = programs.get(id) || null;
    gl.bindAttribLocation(program, index, ptrToString(name));
  },
  glGetProgramiv: (id, pname, params) => {
    refreshMemory();
    const program = programs.get(id) || null;
    gl.getProgramParameter(program, pname);
    // TODO
    if (params) {
      u32[params >> 2] = 1;
    }
  },
  glGetProgramInfoLog: (id, bufSize, length, infoLog) => {
    refreshMemory();
    const program = programs.get(id) || null;
    gl.getProgramInfoLog(program);
    // TODO
  },
  glGetShaderiv: (id, pname, params) => {
    refreshMemory();
    const program = shaders.get(id) || null;
    gl.getShaderParameter(program, pname);
    // TODO
    if (params) {
      u32[params >> 2] = 1;
    }
  },
  glDeleteProgram: (id) => {
    const program = programs.get(id) || null;
    gl.deleteProgram(program);
    programs.delete(id);
  },
  glDeleteShader: (id) => {
    const program = shaders.get(id) || null;
    gl.deleteShader(program);
    shaders.delete(id);
  },
  glGetUniformLocation: (id, ptr) => {
    const program = programs.get(id) || null;
    const name = ptrToString(ptr);

    for (const [uid, loc] of uniforms) {
      if (loc.id === id && loc.name === name) return uid;
    }

    const location = gl.getUniformLocation(program, name);
    uniforms.set(nextId, { id, name, location });
    return nextId++;
  },
  glUniformMatrix4fv: (id, count, transpose, value) => {
    refreshMemory();
    const uniform = uniforms.get(id) || null;
    const floatValues = new Float32Array(memory.buffer, value, count * 16); // TODO f32 in loader?
    gl.uniformMatrix4fv(uniform.location, transpose, floatValues);
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
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const tex = gl.createTexture();
      const id = nextId++;
      textures.set(id, tex);
      u32[(ptr >> 2) + i] = id;
    }
  },
  glBindTexture: (target, id) => gl.bindTexture(target, textures.get(id) || null),
  glTexParameteri: (target, pname, param) => gl.texParameteri(target, pname, param),
  glTexImage2D: (target, level, internalformat, width, height, border, format, type, pixelsPtr) => {
    if (pixelsPtr) {
      refreshMemory();
      const pixels = u8.subarray(pixelsPtr, pixelsPtr + width * height * 4);
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels);
    } else {
      gl.texImage2D(target, level, internalformat, width, height, border, format, type, null);
    }
  },
  glDeleteTextures: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = u32[(ptr >> 2) + i];
      const tex = textures.get(id) || null;
      gl.deleteTexture(tex);
      textures.delete(id);
    }
  },
  glDeleteVertexArrays: (n, ptr) => {
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const id = u32[(ptr >> 2) + i];
      gl.deleteVertexArray(VAOs.get(id) || null);
      VAOs.delete(id);
    }
  },
  glVertexAttribIPointer: (index, size, type, stride, pointer) => {
    gl.vertexAttribIPointer(index, size, type, stride, pointer);
  },
  glDeleteBuffers: (n, ptr) => {
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const id = u32[(ptr >> 2) + i];
      gl.deleteBuffer(VBOs.get(id) || null);
      VBOs.delete(id);
    }
  },
  glDepthMask: (flag) => gl.depthMask(flag),
  glGenerateMipmap: (target) => gl.generateMipmap(target),
  glBindBufferBase: (target, index, id) => {
    const vbo = VBOs.get(id) || null;
    gl.bindBufferBase(target, index, vbo);
  },
  glGenFramebuffers: (n, ptr) => {
    refreshMemory();
    for (let i = 0; i < n; i++) {
      const tex = gl.createFramebuffer();
      const id = nextId++;
      framebuffers.set(id, tex);
      u32[(ptr >> 2) + i] = id;
    }
  },
  glBindFramebuffer: (target, id) => {
    const framebuffer = framebuffers.get(id) || null;
    gl.bindFramebuffer(target, framebuffer);
  },
  glFramebufferTexture2D: (target, attachment, textarget, id, level) => {
    const texture = textures.get(id) || null;
    gl.framebufferTexture2D(target, attachment, textarget, texture, level);
  },
  glDeleteFramebuffers: (n, ptr) => {
    for (let i = 0; i < n; i++) {
      const id = u32[(ptr >> 2) + i];
      const framebuffer = framebuffers.get(id) || null;
      gl.deleteFramebuffer(framebuffer);
      framebuffers.delete(id);
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
      refreshMemory();
      const data = u8.subarray(ptr, ptr + size);
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
    const program = programs.get(id) || null;
    gl.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
  },
  glGetUniformBlockIndex: (id, uniformBlockName) => {
    const program = programs.get(id) || null;
    gl.getUniformBlockIndex(program, ptrToString(uniformBlockName));
  },
  glVertexAttrib4fv: (index, v) => {
    refreshMemory();
    const floatValues = new Float32Array(memory.buffer, v, count * 16); // TODO f32 in loader?
    gl.vertexAttrib4fv(index, floatValues);
  },
  glDisableVertexAttribArray: (index) => {
    gl.disableVertexAttribArray(index);
  },




};
