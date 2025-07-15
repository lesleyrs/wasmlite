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

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

await WebAssembly.promising(exports._start)();
