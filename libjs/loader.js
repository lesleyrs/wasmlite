import * as syscalls from './syscalls.js'
import { glue } from './glue.js'

const params = new URLSearchParams(location.search);
export const args = [];
for (const key of params.keys()) {
  args.push(key);
}
console.log(args);

const { instance } = await WebAssembly.instantiateStreaming(fetch(`${args[0]}.wasm`), { env: { ...syscalls, ...glue, } });
export const exports = instance.exports;
console.log(exports);

/** @type {WebAssembly.Memory} */
export const memory = exports.memory;

export let buffer = memory.buffer;
export let u8 = new Uint8Array(buffer);
export let u32 = new Uint32Array(buffer);

// NOTE: this is needed as __builtin_wasm_memory_grow can be called anytime
export function refreshMemory() {
  if (buffer.byteLength === 0) {
    buffer = memory.buffer;
    u8 = new Uint8Array(buffer);
    u32 = new Uint32Array(buffer);
  }
}

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

await WebAssembly.promising(exports._start)();
