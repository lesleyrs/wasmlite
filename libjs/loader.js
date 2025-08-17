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

const params = new URLSearchParams(location.search);
export const args = [];
for (const key of params.keys()) {
  args.push(key);
}
console.log(args);

const { instance } = await WebAssembly.instantiateStreaming(fetch(`${args[0]}.wasm`), imports);
export const exports = instance.exports;
console.log(exports);

/** @type {WebAssembly.Memory} */
export const memory = exports.memory;
let buffer = memory.buffer;

export let u8 = new Uint8Array(buffer);
export let u32 = new Uint32Array(buffer);
export let f32 = new Float32Array(buffer);

// NOTE: this is needed as __builtin_wasm_memory_grow can be called anytime, so it can't be a callback in dlmalloc
export function refreshMemory() {
  if (buffer.byteLength === 0) {
    buffer = memory.buffer;
    u8 = new Uint8Array(buffer);
    u32 = new Uint32Array(buffer);
    f32 = new Float32Array(buffer);
  }
}

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

await WebAssembly.promising(exports._start)();
