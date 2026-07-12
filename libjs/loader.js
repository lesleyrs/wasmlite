import * as syscalls from './syscalls.js'
import { glue } from './glue.js'
import { math } from './math.js'
import { websocket } from './websocket.js'
import { audio } from './audio.js'
import { webgl2 } from './webgl2.js'
import { rsaCrypt } from './rsa.js'

const imports = {
  env: {
    ...syscalls, ...glue, ...math, ...websocket, ...audio, ...webgl2, rsaCrypt
  }
};

export const args = [...new URLSearchParams(location.search).keys()];
console.log(args);

const { instance } = await WebAssembly.instantiateStreaming(fetch(`${args[0]}.wasm`), imports);
export const exports = instance.exports;
console.log(exports);

/** @type {WebAssembly.Memory} */
const mem = exports.memory;
let u8 = new Uint8Array(mem.buffer);
let u32 = new Uint32Array(mem.buffer);
let f32 = new Float32Array(mem.buffer);
let f64 = new Float64Array(mem.buffer);

// NOTE: this is needed as __builtin_wasm_memory_grow/exports.memory.grow() can be called anytime, so it can't be a callback in dlmalloc
export const memory = {
  get u8() {
    if (u8.buffer !== mem.buffer) u8 = new Uint8Array(mem.buffer);
    return u8;
  },
  get u32() {
    if (u32.buffer !== mem.buffer) u32 = new Uint32Array(mem.buffer);
    return u32;
  },
  get f32() {
    if (f32.buffer !== mem.buffer) f32 = new Float32Array(mem.buffer);
    return f32;
  },
  get f64() {
    if (f64.buffer !== mem.buffer) f64 = new Float64Array(mem.buffer);
    return f64;
  },
}

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

await WebAssembly.promising(exports._start)();
