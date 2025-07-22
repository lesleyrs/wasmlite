import { exports, decoder, u8, refreshMemory } from './loader.js'

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
  refreshMemory();
  const ptr = exports.malloc(str.length + 1);
  if (!ptr) return 0;
  for (let i = 0; i < str.length; i++) {
    u8[ptr + i] = str.charCodeAt(i);
  }
  u8[ptr + str.length] = 0;
  return ptr;
}
