import { exports, memory, encoder } from './loader.js'
import { ptrToString, getKey, getCode } from './utils.js'

/** @type {HTMLCanvasElement} */
let canvas;
/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {ImageData} */
let imageData;
/** @type {boolean} */
let pointerlock;

export const glue = {
  // NOTE: temp convenience function while pdclib doesn't support float formatting
  JS_logFloat: (args) => console.log(args),

  JS_alert: (ptr) => alert(ptrToString(ptr)),
  JS_saveFile: (namePtr, bufPtr, len) => {
    const u8 = new Uint8Array(memory.buffer, bufPtr, len)
    const blob = new Blob([u8], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ptrToString(namePtr);
    a.click();
    URL.revokeObjectURL(url);
  },
  JS_openFilePicker: new WebAssembly.Suspending(async (lenPtr, namePtr) => {
    const { data, name } = await new Promise((resolve, reject) => {
      canvas.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result, name: file.name });
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
          canvas.onclick = null;
        };
        input.click();
      };
    });

    let enc, str;
    if (namePtr) {
      enc = encoder.encode(name);
      str = exports.malloc(enc.length + 1);
    }
    const ptr = exports.malloc(data.byteLength);

    const u8 = new Uint8Array(memory.buffer);
    const u32 = new Uint32Array(memory.buffer);

    u8.set(new Uint8Array(data), ptr);
    u32[lenPtr >> 2] = data.byteLength;

    if (namePtr) {
      u8.set(enc, str);
      u8[str + enc.length] = 0;
      u32[namePtr >> 2] = str;
    }
    return ptr;
  }),
  JS_setTimeout: new WebAssembly.Suspending(async (ms) => await new Promise(resolve => setTimeout(resolve, ms))),
  JS_requestAnimationFrame: new WebAssembly.Suspending(async () => await new Promise(resolve => requestAnimationFrame(resolve))),
  JS_DateNow: () => BigInt(Math.floor(Date.now())),
  JS_performanceNow: () => BigInt(Math.floor(performance.now())),
  JS_setPixels: (ptr) => {
    const pixels32 = new Uint32Array(memory.buffer, ptr, canvas.width * canvas.height);
    for (let i = 0; i < pixels32.length; i++) {
      pixels32[i] |= 0xff000000;
    }
    const pixels = new Uint8ClampedArray(pixels32.buffer, pixels32.byteOffset, pixels32.byteLength);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  },
  JS_setPixelsAlpha: (ptr) => {
    const pixels = new Uint8Array(memory.buffer, ptr, canvas.width * canvas.height * 4);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  },
  JS_setTitle: (title) => { document.title = ptrToString(title) },
  JS_createCanvas: (width, height) => {
    canvas = document.createElement('canvas');
    // const canvas = document.getElementById('canvas');
    // canvas.id = 'canvas';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    canvas.width = width;
    canvas.height = height;
    canvas.tabIndex = -1;

    // NOTE: 0 pixel margin at top or not?
    // canvas.style.position = 'absolute';
    // canvas.style.left = '50%';
    // canvas.style.top = 0;
    // canvas.style.transform = 'translate(-50%, 0)';

    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: false });
    imageData = ctx.createImageData(canvas.width, canvas.height);

    window.addEventListener('contextmenu', e => e.preventDefault());
  },
  JS_setFont: (font) => ctx.font = ptrToString(font),
  JS_measureTextWidth: (text) => ctx.measureText(ptrToString(text)).width,
  JS_fillStyle: (color) => ctx.fillStyle = ptrToString(color),
  JS_fillText: (str, x, y) => ctx.fillText(ptrToString(str), x, y),
  JS_fillRect: (x, y, w, h) => ctx.fillRect(x, y, w, h),
  JS_strokeStyle: (color) => ctx.strokeStyle = ptrToString(color),
  JS_strokeRect: (x, y, w, h) => ctx.strokeRect(x, y, w, h),

  // TODO https://developer.mozilla.org/en-US/docs/Web/Events
  // should we also add removeListener?
  // change this into function per callback type and pass event name?
  JS_addBlurEventListener: (cb) => {
    canvas.addEventListener('blur', () => exports.__indirect_function_table.get(cb)());
  },
  JS_requestPointerLock: () => {
    pointerlock = true;
    canvas.addEventListener('click', () => canvas.requestPointerLock())
  },
  JS_addMouseMoveEventListener: (userData, cb) => {
    setMouseEventCallback('mousemove', userData, cb);
  },
  JS_addMouseDownEventListener: (userData, cb) => {
    setMouseEventCallback('mousedown', userData, cb);
  },
  JS_addMouseUpEventListener: (userData, cb) => {
    setMouseEventCallback('mouseup', userData, cb);
  },
  JS_addKeyDownEventListener: (userData, cb) => {
    setKeyboardEventCallback('keydown', userData, cb);
  },
  JS_addKeyUpEventListener: (userData, cb) => {
    setKeyboardEventCallback('keyup', userData, cb);
  }
  // JS_addWheelEventListener: (userData, cb) => {
  // },
};

function setMouseEventCallback(name, userData, cb) {
  canvas.addEventListener(name, /** @param {MouseEvent} e */ e => {
    // create fresh rect to not worry about resize/scroll/orientationchange/fullscreenchange etc callbacks
    const rect = canvas.getBoundingClientRect();
    let rc;
    if (pointerlock) {
      rc = exports.__indirect_function_table.get(cb)(userData, e.button, e.movementX, e.movementY);
    } else {
      rc = exports.__indirect_function_table.get(cb)(userData, e.button, e.x - rect.left, e.y - rect.top);
    }
    if (rc) {
      e.preventDefault();
    }
  });
}

function setKeyboardEventCallback(name, userData, cb) {
  canvas.addEventListener(name, /** @param {KeyboardEvent} e */ e => {
    // e.keyCode avoids key mapping but varies between browsers/kb layout + no separate value for each keyboard location
    const rc = exports.__indirect_function_table.get(cb)(userData, getKey(e.key), getCode(e.code), e.ctrlKey << 0 | e.shiftKey << 1 | e.altKey << 2 | e.metaKey << 3);
    if (rc) {
      e.preventDefault();
    }
  });
}
