import { args, decoder, encoder, u8, u32, refreshMemory } from './loader.js'
import { ptrToString } from './utils.js';

export function JS_getArgsSizes(argcPtr, argvSizePtr) {
  refreshMemory();

  let totalLength = 0;
  for (const s of args) totalLength += encoder.encode(s).length + 1;

  u32[argcPtr >> 2] = args.length;
  u32[argvSizePtr >> 2] = totalLength;
}

export function JS_getArgs(argvPtr, argvBufPtr) {
  refreshMemory();

  const argvBase = argvPtr >> 2;
  let argvBufOffset = argvBufPtr;

  // copy each arg to crt1 argv buffer with null terminator
  for (let i = 0; i < args.length; i++) {
    const strBytes = encoder.encode(args[i]);
    u32[argvBase + i] = argvBufOffset;
    u8.set(strBytes, argvBufOffset);
    u8[argvBufOffset + strBytes.length] = 0;
    argvBufOffset += strBytes.length + 1;
  }
}

const EOF = -1;

const SEEK_SET = 0;
const SEEK_CUR = 1;
const SEEK_END = 2;

// const stdin = 0;
const stdout = 1;
const stderr = 2;

const fileSystem = {
  /** @type {Object<number, { buf: Uint8Array, pos: bigint }>} */
  fds: {},
  /** @type {number} */
  nextFd: 3,
};

export function _exit(status) {
  // TODO maybe some clean up? remove eventhandlers, canvas etc
  throw new WebAssembly.RuntimeError(`Program exited with status: ${status}`);
}

export function write(fd, buf, count) {
  refreshMemory();
  const sub = u8.subarray(buf, buf + count)
  if (fd === stdout) {
    const str = decoder.decode(sub);
    console.log(str);
    return count;
  } else if (fd === stderr) {
    const str = decoder.decode(sub);
    console.error(str);
    return count;
  } else {
    console.warn("[stub] write: ", fd)
  }
  return EOF;
}

export function read(fd, buf, count) {
  refreshMemory();
  const file = fileSystem.fds[fd];
  if (!file) return EOF;

  const start = Number(file.pos);
  const data = file.buf.subarray(start, start + count);
  file.pos += BigInt(data.length);

  const sub = u8.subarray(buf, buf + count);
  sub.set(data);
  return data.length;
}

export const open = new WebAssembly.Suspending(async function(pathPtr, flags, mode) {
  const path = ptrToString(pathPtr);
  const url = (typeof BUNDLER !== 'undefined' || path.startsWith('http')) ? path : `ports/${path}`;
  try {
    // const response = await fetch(url, { cache: 'no-cache' });
    const response = await fetch(url, { cache: 'no-store' });
    console.log(response);
    if (!response.ok) return -1;
    const buffer = new Uint8Array(await response.arrayBuffer());

    const fd = fileSystem.nextFd++;
    fileSystem.fds[fd] = { buf: buffer, pos: 0n };
    return fd;
  } catch (e) {
    return -1;
  }
});

export function lseek64(fd, offset, whence) {
  const file = fileSystem.fds[fd];
  if (!file) return BigInt(-1);
  if (whence == SEEK_SET) {
    file.pos = offset;
  } else if (whence == SEEK_CUR) {
    file.pos += offset;
  } else if (whence == SEEK_END) {
    file.pos = BigInt(file.buf.length) - offset;
  }
  return file.pos;
}

export function close(fd) {
  delete fileSystem.fds[fd];
  return 0;
}
