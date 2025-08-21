#pragma once
#include <stddef.h>
#include <stdbool.h>
#include <stdint.h>

#include "wasm.h"

/* UTIL: */
WASM_IMPORT(void, JS_logFloat, (float)); /* printf doesn't support float formatting for now */
WASM_IMPORT(void, JS_alert, (const char* msg));
WASM_IMPORT(void, JS_saveFile, (const char* name, uint8_t *buf, int len));
WASM_IMPORT(uint8_t*, JS_openFilePicker, (char** filename, size_t* len, const char* extensions)); /* requires -Wl,--export=malloc, you have to free both buffer + filename, pass comma separated extensions or NULL */

/* INIT: */
WASM_IMPORT(void, JS_setTitle, (const char *title));
WASM_IMPORT(void, JS_createCanvas, (int width, int height, const char* context));

/* TIMING: */
WASM_IMPORT(void, JS_setTimeout, (int ms));
WASM_IMPORT(void, JS_requestAnimationFrame, (void));

WASM_IMPORT(double, JS_DateNow, (void));
WASM_IMPORT(double, JS_performanceNow, (void));

/* DRAW: setPixels draws the entire canvas and wipes the other funcs */
WASM_IMPORT(void, JS_setPixels, (uint32_t *pixels));
WASM_IMPORT(void, JS_setPixelsAlpha, (uint32_t *pixels));

WASM_IMPORT(void, JS_setFont, (const char *font));
WASM_IMPORT(double, JS_measureTextWidth, (const char *text));
WASM_IMPORT(void, JS_fillStyle, (const char *color));
WASM_IMPORT(void, JS_fillText, (const char *str, double x, double y));
WASM_IMPORT(void, JS_fillRect, (double x, double y, double w, double h));
WASM_IMPORT(void, JS_strokeStyle, (const char *color));
WASM_IMPORT(void, JS_strokeRect, (double x, double y, double w, double h));

/* EVENTS: return 1 inside the callbacks to call preventDefault() */
#define KMOD_CTRL (1 << 0)
#define KMOD_SHIFT (1 << 1)
#define KMOD_ALT (1 << 2)
#define KMOD_META (1 << 3)

#define MBTN_LEFT 0
#define MBTN_MIDDLE 1
#define MBTN_RIGHT 2

typedef bool (*JS_KeyCallback)(void *userdata, bool pressed, int key, int code, int modifiers);
typedef void (*JS_MouseCallback)(void *userdata, bool pressed, int button);
typedef bool (*JS_MouseMoveCallback)(void *userdata, int x, int y);
typedef bool (*JS_WheelCallback)(void* userdata, double delta);
/* TODO: add focus event + framebuffer resize if added */

WASM_IMPORT(void, JS_requestPointerLock, (void));
WASM_IMPORT(void, JS_addPointerLockChangeEventListener, (void (*cb)(bool locked)));
/* visibilitychange didn't run on alt-tab so we use blur to release keys for example */
WASM_IMPORT(void, JS_addBlurEventListener, (void *userdata, void (*cb)(void *userdata)));
WASM_IMPORT(void, JS_addKeyEventListener, (void *userdata, JS_KeyCallback));
/* pointerup didn't release mouse buttons if multiple were pressed at once so we use mouse events */
WASM_IMPORT(void, JS_addMouseEventListener, (void *userdata, JS_MouseCallback, JS_MouseMoveCallback, JS_WheelCallback));
