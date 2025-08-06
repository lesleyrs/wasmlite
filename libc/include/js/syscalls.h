#pragma once
#include <stdint.h>
#include <stddef.h>

#include "wasm.h"

typedef long ssize_t;
WASM_IMPORT(ssize_t, read, (int fd, void* buf, size_t count));
WASM_IMPORT(ssize_t, write, (int fd, const void* buf, size_t count));
WASM_IMPORT(ssize_t, open, (const char*, unsigned int mode, ...));
WASM_IMPORT(int, close, (int fd));
WASM_IMPORT(int64_t, lseek64, (int fd, _PDCLIB_int_least64_t offset, int whence));
WASM_IMPORT(_PDCLIB_Noreturn void, _exit, (int status)) _PDCLIB_NORETURN;
