#pragma once
#include <stdint.h>

#include "wasm.h"

typedef void (*JS_onopen)(void *userdata);
typedef void (*JS_onmessage)(void *userdata);
typedef void (*JS_onerror)(void *userdata);
typedef void (*JS_onclose)(void *userdata);

WASM_IMPORT(int, socket, void);
WASM_IMPORT(int, connect, int fd, const char* url, void* userdata, JS_onopen, JS_onmessage, JS_onerror, JS_onclose);
WASM_IMPORT(void, closesocket, int fd);
WASM_IMPORT(int, recv, int fd, void *buf, int len, int flags);
WASM_IMPORT(int, send, int fd, const void *buf, int len, int flags);
