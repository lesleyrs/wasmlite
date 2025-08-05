import { exports, u8 } from './loader.js'
import { ptrToString } from './utils.js'
import { refreshMemory } from './loader.js'

class SocketBuffer {
  queue = [];
  totalLength = 0;

  push(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    this.queue.push(data);
    this.totalLength += data.length;
  }

  available(len) {
    return this.totalLength >= len;
  }

  read(len) {
    if (!this.available(len)) return null;

    const result = new Uint8Array(len);
    let offset = 0;

    while (offset < len) {
      const chunk = this.queue[0];
      const copyLen = Math.min(chunk.length, len - offset);
      result.set(chunk.subarray(0, copyLen), offset);
      offset += copyLen;

      if (copyLen < chunk.length) {
        this.queue[0] = chunk.subarray(copyLen);
      } else {
        this.queue.shift();
      }
    }

    this.totalLength -= len;
    return result;
  }
}

let fd = 0;
/** @type {Map<number, WebSocket>} */
const sockets = new Map();
/** @type {Map<number, SocketBuffer>} */
const socketBuffers = new Map();

export const websocket = {
  socket: () => {
    return fd++;
  },
  connect: new WebAssembly.Suspending(async (fd, url, userdata, onopen, onmessage, onerror, onclose) => await new Promise((resolve) => {
    const ws = new WebSocket(ptrToString(url));
    ws.binaryType = 'arraybuffer';
    sockets.set(fd, ws);
    socketBuffers.set(fd, new SocketBuffer());

    ws.addEventListener('open', () => {
      if (onopen) {
        exports.__indirect_function_table.get(onopen)(userdata);
      }
      resolve(fd);
    }),
    ws.addEventListener('message', (e) => {
      const buf = new Uint8Array(e.data);
      socketBuffers.get(fd).push(buf);
      if (onmessage) {
        exports.__indirect_function_table.get(onmessage)(userdata);
      }
    });
    ws.addEventListener('error', () => {
      if (onerror) {
        exports.__indirect_function_table.get(onerror)(userdata);
      }
      resolve(-1);
    }),
    ws.addEventListener('close', () => {
      if (onclose) {
        exports.__indirect_function_table.get(onclose)(userdata);
      }
    });
  })),
  // NOTE separate func from close() to keep websockets standalone
  closesocket: (fd) => {
    sockets.get(fd).close();
  },
  send: (fd, data, len) => {
    refreshMemory();
    const buf = u8.subarray(data, data + len);
    sockets.get(fd).send(buf);
    return len;
  },
  // NOTE: always nonblocking
  // recv: new WebAssembly.Suspending(async (fd, buf, len, flags) => await new Promise((resolve, reject) => {
  recv: (fd, buf, len, flags) => {
    refreshMemory();
    const bytes = socketBuffers.get(fd).read(len);
    if (!bytes) {
      return -1;
    }
    u8.set(bytes, buf);
    return bytes.length;
  },
}
