import { exports, encoder, decoder, memory } from './loader.js'

export function ptrToString(ptr, len) {
  if (len === undefined) {
    len = strlen(ptr, memory.u8);
  }
  const bytes = memory.u8.subarray(ptr, ptr + len);
  const str = decoder.decode(bytes);
  return str;
}

function strlen(ptr, buf) {
  let end = ptr;
  while (buf[end] !== 0) end++;
  return end - ptr;
}

export function allocString(str) {
  const bytes = encoder.encode(str);
  const ptr = exports.malloc(bytes.length + 1);
  if (!ptr) return 0;
  memory.u8.set(bytes, ptr);
  memory.u8[ptr + bytes.length] = 0;
  return ptr;
}
