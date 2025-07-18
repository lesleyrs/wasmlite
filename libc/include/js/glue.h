#pragma once
#include <stdbool.h>
#include <stdint.h>

#define WASM_IMPORT(ret, name, ...) \
    __attribute__((import_module("env"), import_name(#name))) \
    extern ret name(__VA_ARGS__)

// UTIL:
WASM_IMPORT(void, JS_logFloat, float); // printf doesn't support float formatting for now
WASM_IMPORT(void, JS_alert, const char* msg);
WASM_IMPORT(void, JS_saveFile, const char* name, uint8_t *buf, int len);
WASM_IMPORT(uint8_t*, JS_openFilePicker, int* len, char** str); // requires -Wl,--export=malloc, you have to free both buf + str

// INIT:
WASM_IMPORT(void, JS_setTitle, const char *title);
WASM_IMPORT(void, JS_createCanvas, int width, int height);

// TIMING:
WASM_IMPORT(void, JS_setTimeout, float ms);
WASM_IMPORT(void, JS_requestAnimationFrame, void);

WASM_IMPORT(uint64_t, JS_DateNow, void);
WASM_IMPORT(uint64_t, JS_performanceNow, void);

// DRAW: setPixels draws the entire canvas and wipes the other funcs
WASM_IMPORT(void, JS_setPixels, uint32_t *pixels);
WASM_IMPORT(void, JS_setPixelsAlpha, uint32_t *pixels);

WASM_IMPORT(void, JS_setFont, const char *font);
WASM_IMPORT(int, JS_measureTextWidth, const char *text);
WASM_IMPORT(void, JS_fillStyle, const char *color);
WASM_IMPORT(void, JS_fillText, const char *str, int x, int y);
WASM_IMPORT(void, JS_fillRect, int x, int y, int w, int h);
WASM_IMPORT(void, JS_strokeStyle, const char *color);
WASM_IMPORT(void, JS_strokeRect, int x, int y, int w, int h);

// EVENTS: return 1 inside the callbacks to call preventDefault()
#define KMOD_CTRL (1 << 0)
#define KMOD_SHIFT (1 << 1)
#define KMOD_ALT (1 << 2)
#define KMOD_META (1 << 3)

#define MBTN_LEFT 0
#define MBTN_MIDDLE 1
#define MBTN_RIGHT 2

// no event types in callbacks avoids exporting malloc or create mappings as they are js strings, but could be done
typedef bool (*JS_MouseCallback)(void *userData, int button, int x, int y);
typedef bool (*JS_KeyboardCallback)(void *userData, int key, int code, int modifiers);
// typedef bool (*JS_WheelCallback)(void* userData, TODO);
// TODO: add focus event?

WASM_IMPORT(void, JS_requestPointerLock, void);
WASM_IMPORT(void, JS_addPointerLockChangeEventListener, void (*cb)(bool locked));
// visibilitychange didn't run on alt-tab so we use blur to release keys for example
WASM_IMPORT(void, JS_addBlurEventListener, void (*cb)(void));
// pointerup didn't release mouse buttons if multiple were pressed at once so we use mouse events
WASM_IMPORT(void, JS_addMouseMoveEventListener, void *userData, JS_MouseCallback);
WASM_IMPORT(void, JS_addMouseDownEventListener, void *userData, JS_MouseCallback);
WASM_IMPORT(void, JS_addMouseUpEventListener, void *userData, JS_MouseCallback);
WASM_IMPORT(void, JS_addKeyDownEventListener, void *userData, JS_KeyboardCallback);
WASM_IMPORT(void, JS_addKeyUpEventListener, void *userData, JS_KeyboardCallback);
// WASM_IMPORT(void, JS_addWheelEventListener, void* userData, JS_WheelCallback);
