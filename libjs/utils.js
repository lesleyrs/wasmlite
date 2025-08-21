import { exports, encoder, decoder, u8, refreshMemory } from './loader.js'

export function ptrToString(ptr, len) {
  refreshMemory();
  if (len === undefined) {
    len = strlen(ptr, u8);
  }
  const bytes = u8.subarray(ptr, ptr + len);
  const str = decoder.decode(bytes);
  return str;
}

function strlen(ptr, u8) {
  let end = ptr;
  while (u8[end] !== 0) end++;
  return end - ptr;
}

export function allocString(str) {
  const bytes = encoder.encode(str);
  const ptr = exports.malloc(bytes.length + 1);
  if (!ptr) return 0;
  refreshMemory();
  u8.set(bytes, ptr);
  u8[ptr + bytes.length] = 0;
  return ptr;
}
