import { exports, encoder, u8, u32, refreshMemory } from './loader.js'
import { ptrToString } from './utils.js'

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
    refreshMemory();
    const sub = u8.subarray(bufPtr, bufPtr + len);
    const blob = new Blob([sub], { type: 'application/octet-stream' });
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
        const filepicker = document.createElement('input');
        filepicker.type = 'file';
        filepicker.onchange = e => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result, name: file.name });
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
          canvas.onclick = null;
        };
        filepicker.click();
      };
    });

    let enc, str;
    if (namePtr) {
      enc = encoder.encode(name);
      str = exports.malloc(enc.length + 1);
      if (!str) return 0;
    }
    const ptr = exports.malloc(data.byteLength);
    if (!ptr) return 0;

    refreshMemory();
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
  JS_DateNow: () => Date.now(),
  JS_performanceNow: () => performance.now(),
  JS_setPixels: (ptr) => {
    refreshMemory();
    const pixels32 = u32.subarray(ptr, canvas.width * canvas.height + ptr);
    for (let i = 0; i < pixels32.length; i++) {
      pixels32[i] |= 0xff000000;
    }
    const pixels = new Uint8ClampedArray(pixels32.buffer, pixels32.byteOffset, pixels32.byteLength);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  },
  JS_setPixelsAlpha: (ptr) => {
    refreshMemory();
    const pixels = u8.subarray(ptr, canvas.width * canvas.height * 4 + ptr);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  },
  JS_setTitle: (title) => { document.title = ptrToString(title) },
  JS_createCanvas: (width, height) => {
    canvas = document.createElement('canvas');
    // const canvas = document.getElementById('canvas');
    // canvas.id = 'canvas';
    canvas.width = width;
    canvas.height = height;
    canvas.tabIndex = -1;
    canvas.style.outline = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    canvas.style.touchAction = 'manipulation';
    canvas.style.imageRendering = 'pixelated'; // TODO only looks good at integer multiples, allow changing it

    // NOTE: 0 pixel margin at top or not? or better way to do this
    // canvas.style.position = 'absolute';
    // canvas.style.left = '50%';
    // canvas.style.top = 0;
    // canvas.style.transform = 'translate(-50%, 0)';

    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d', { alpha: false });
    imageData = ctx.createImageData(canvas.width, canvas.height);

    canvas.addEventListener('touchstart', () => {
      if (!document.fullscreenElement) {
        canvas.requestFullscreen();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.altKey && e.key === "Enter") {
        if (!document.fullscreenElement) {
          canvas.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    document.addEventListener('contextmenu', e => e.preventDefault());
  },
  JS_setFont: (font) => ctx.font = ptrToString(font),
  JS_measureTextWidth: (text) => ctx.measureText(ptrToString(text)).width,
  JS_fillStyle: (color) => ctx.fillStyle = ptrToString(color),
  JS_fillText: (str, x, y) => ctx.fillText(ptrToString(str), x, y),
  JS_fillRect: (x, y, w, h) => ctx.fillRect(x, y, w, h),
  JS_strokeStyle: (color) => ctx.strokeStyle = ptrToString(color),
  JS_strokeRect: (x, y, w, h) => ctx.strokeRect(x, y, w, h),

  // TODO https://developer.mozilla.org/en-US/docs/Web/Events
  JS_requestPointerLock: () => {
    pointerlock = true;
    if (!document.pointerLockElement) {
      canvas.requestPointerLock({unadjustedMovement: true});
    }
  },
  JS_addPointerLockChangeEventListener: (cb) => {
    document.addEventListener('pointerlockchange', () => {
        exports.__indirect_function_table.get(cb)(!!document.pointerLockElement);
    })
  },
  JS_addBlurEventListener: (cb) => {
    canvas.addEventListener('blur', () => exports.__indirect_function_table.get(cb)());
  },
  JS_addMouseMoveEventListener: (userData, cb) => {
    setMouseMoveCB('mousemove', userData, cb);
  },
  JS_addMouseEventListener: (userData, cb) => {
    setMouseCB('mousedown', userData, cb);
    setMouseCB('mouseup', userData, cb);
  },
  JS_addKeyEventListener: (userData, cb) => {
    setKeyCB('keydown', userData, cb);
    setKeyCB('keyup', userData, cb);
  }
  // JS_addWheelEventListener: (userData, cb) => {
  // },
};

function setMouseMoveCB(name, userData, cb) {
  canvas.addEventListener(name, /** @param {MouseEvent} e */ e => {
    // create fresh rect to not worry about resize/scroll/orientationchange/fullscreenchange etc callbacks
    const rect = canvas.getBoundingClientRect();
    let rc;
    if (pointerlock) {
      rc = exports.__indirect_function_table.get(cb)(userData, e.movementX, e.movementY);
    } else {
      rc = exports.__indirect_function_table.get(cb)(userData, e.x - rect.left, e.y - rect.top);
    }
    if (rc) {
      e.preventDefault();
    }
  });
}

function setMouseCB(name, userData, cb) {
  canvas.addEventListener(name, /** @param {MouseEvent} e */ e => {
    let rc = exports.__indirect_function_table.get(cb)(userData, e.type === 'mousedown', e.button);
    if (rc) {
      e.preventDefault();
    }
  });
}

function setKeyCB(name, userData, cb) {
  canvas.addEventListener(name, /** @param {KeyboardEvent} e */ e => {
    // e.keyCode avoids key mapping but varies between browsers/kb layout + no separate value for each keyboard location (unused)
    const rc = exports.__indirect_function_table.get(cb)(userData, e.type === 'keydown', getKey(e.key), getCode(e.code), e.ctrlKey << 0 | e.shiftKey << 1 | e.altKey << 2 | e.metaKey << 3);
    if (rc) {
      e.preventDefault();
    }
  });
}

function getKey(key) {
  if (key.length === 1) return key.charCodeAt(0);
  // console.warn(`Unhandled key event:`, key);
  return -1;
}

function getCode(code) {
  if (codeMap[code] !== undefined) return codeMap[code];
  console.warn(`Unhandled code event:`, code);
  return -1;
}

// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values#code_values_on_windows
const codeMap = {
  "Unidentified": 0x0000,
  "Escape": 0x0001,
  "Digit1": 0x0002,
  "Digit2": 0x0003,
  "Digit3": 0x0004,
  "Digit4": 0x0005,
  "Digit5": 0x0006,
  "Digit6": 0x0007,
  "Digit7": 0x0008,
  "Digit8": 0x0009,
  "Digit9": 0x000A,
  "Digit0": 0x000B,
  "Minus": 0x000C,
  "Equal": 0x000D,
  "Backspace": 0x000E,
  "Tab": 0x000F,
  "KeyQ": 0x0010,
  "KeyW": 0x0011,
  "KeyE": 0x0012,
  "KeyR": 0x0013,
  "KeyT": 0x0014,
  "KeyY": 0x0015,
  "KeyU": 0x0016,
  "KeyI": 0x0017,
  "KeyO": 0x0018,
  "KeyP": 0x0019,
  "BracketLeft": 0x001A,
  "BracketRight": 0x001B,
  "Enter": 0x001C,
  "ControlLeft": 0x001D,
  "KeyA": 0x001E,
  "KeyS": 0x001F,
  "KeyD": 0x0020,
  "KeyF": 0x0021,
  "KeyG": 0x0022,
  "KeyH": 0x0023,
  "KeyJ": 0x0024,
  "KeyK": 0x0025,
  "KeyL": 0x0026,
  "Semicolon": 0x0027,
  "Quote": 0x0028,
  "Backquote": 0x0029,
  "ShiftLeft": 0x002A,
  "Backslash": 0x002B,
  "KeyZ": 0x002C,
  "KeyX": 0x002D,
  "KeyC": 0x002E,
  "KeyV": 0x002F,
  "KeyB": 0x0030,
  "KeyN": 0x0031,
  "KeyM": 0x0032,
  "Comma": 0x0033,
  "Period": 0x0034,
  "Slash": 0x0035,
  "ShiftRight": 0x0036,
  "NumpadMultiply": 0x0037,
  "AltLeft": 0x0038,
  "Space": 0x0039,
  "CapsLock": 0x003A,
  "F1": 0x003B,
  "F2": 0x003C,
  "F3": 0x003D,
  "F4": 0x003E,
  "F5": 0x003F,
  "F6": 0x0040,
  "F7": 0x0041,
  "F8": 0x0042,
  "F9": 0x0043,
  "F10": 0x0044,
  "Pause": 0x0045,
  "ScrollLock": 0x0046,
  "Numpad7": 0x0047,
  "Numpad8": 0x0048,
  "Numpad9": 0x0049,
  "NumpadSubtract": 0x004A,
  "Numpad4": 0x004B,
  "Numpad5": 0x004C,
  "Numpad6": 0x004D,
  "NumpadAdd": 0x004E,
  "Numpad1": 0x004F,
  "Numpad2": 0x0050,
  "Numpad3": 0x0051,
  "Numpad0": 0x0052,
  "NumpadDecimal": 0x0053,
  // 0x0054 (Alt + PrintScreen) 	"PrintScreen" (⚠️ Not the same on Chrome) 	"" (❌ Missing)
  "IntlBackslash": 0x0056,
  "F11": 0x0057,
  "F12": 0x0058,
  "NumpadEqual": 0x0059,
  "F13": 0x0064,
  "F14": 0x0065,
  "F15": 0x0066,
  "F16": 0x0067,
  "F17": 0x0068,
  "F18": 0x0069,
  "F19": 0x006A,
  "F20": 0x006B,
  "F21": 0x006C,
  "F22": 0x006D,
  "F23": 0x006E,
  "KanaMode": 0x0070,
  "Lang2": 0x0071, // (Hanja key without Korean keyboard layout)
  "Lang1": 0x0072, // (Han/Yeong key without Korean keyboard layout)
  "IntlRo": 0x0073,
  "F24": 0x0076,
  // 0x0077 	"Unidentified" (❌ Missing) 	"Lang4" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
  // 0x0078 	"Unidentified" (❌ Missing) 	"Lang3" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
  "Convert": 0x0079,
  "NonConvert": 0x007B,
  "IntlYen": 0x007D,
  "NumpadComma": 0x007E,
  // 0xE008 	"Unidentified" (❌ Missing) 	"Undo" (⚠️ Not the same on Firefox)
  // 0xE00A 	"" (❌ Missing) 	"Paste" (⚠️ Not the same on Firefox)
  "MediaTrackPrevious": 0xE010,
  // 0xE017 	"Unidentified" (❌ Missing) 	"Cut" (⚠️ Not the same on Firefox)
  // 0xE018 	"Unidentified" (❌ Missing) 	"Copy" (⚠️ Not the same on Firefox)
  "MediaTrackNext": 0xE019,
  "NumpadEnter": 0xE01C,
  "ControlRight": 0xE01D,
  "AudioVolumeMute": 0xE020,
  "LaunchApp2": 0xE021,
  "MediaPlayPause": 0xE022,
  "MediaStop": 0xE024,
  // 0xE02C 	"Unidentified" (❌ Missing) 	"Eject" (⚠️ Not the same on Firefox)
  // 0xE02E 	"VolumeDown" (⚠️ Not the same on Chrome) 	"AudioVolumeDown" (was "VolumeDown" prior to Chrome 52) (⚠️ Not the same on Firefox)
  // 0xE030 	"VolumeUp" (⚠️ Not the same on Chrome) 	"AudioVolumeUp" (was "VolumeUp" prior to Chrome 52) (⚠️ Not the same on Firefox)
  "BrowserHome": 0xE032,
  "NumpadDivide": 0xE035,
  "PrintScreen": 0xE037,
  "AltRight": 0xE038,
  // 0xE03B 	"Unidentified" (❌ Missing) 	"Help" (⚠️ Not the same on Firefox)
  "NumLock": 0xE045,
  // "Pause": 0xE046, // (Ctrl + Pause)
  "Home": 0xE047,
  "ArrowUp": 0xE048,
  "PageUp": 0xE049,
  "ArrowLeft": 0xE04B,
  "ArrowRight": 0xE04D,
  "End": 0xE04F,
  "ArrowDown": 0xE050,
  "PageDown": 0xE051,
  "Insert": 0xE052,
  "Delete": 0xE053,
  "MetaLeft": 0xE05B,
  "MetaRight": 0xE05C,
  "ContextMenu": 0xE05D,
  "Power": 0xE05E,
  // 0xE05F 	"Unidentified" (❌ Missing) 	"Sleep" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
  // 0xE063 	"Unidentified" (❌ Missing) 	"WakeUp" (was "" prior to Chrome 48) (⚠️ Not the same on Firefox)
  "BrowserSearch": 0xE065,
  "BrowserFavorites": 0xE066,
  "BrowserRefresh": 0xE067,
  "BrowserStop": 0xE068,
  "BrowserForward": 0xE069,
  "BrowserBack": 0xE06A,
  "LaunchApp1": 0xE06B,
  "LaunchMail": 0xE06C,
  "MediaSelect": 0xE06D,
  // 0xE0F1 (Hanja key with Korean keyboard layout) 	"Lang2" (⚠️ Not the same on Chrome) 	"" (❌ Missing)
  // 0xE0F2 (Han/Yeong key with Korean keyboard layout) 	"Lang1" (⚠️ Not the same on Chrome) 	"" (❌ Missing)
}
