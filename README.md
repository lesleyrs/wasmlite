# wasmlite - like emscripten but less magical

This project makes use of [JSPI](https://v8.dev/blog/jspi) which is able to suspend/resume wasm execution which avoids the need to export functions to call them from JS. Combined with [pdclib](https://github.com/lesleyrs/pdclib) allows for porting some desktop programs to run in the browser with [little changes](#Ports).

This requires a modern chrome release or `javascript.options.wasm_js_promise_integration` enabled in firefox.

## Usage
```
CC = clang --target=wasm32 --sysroot=/path/to/wasm/libc
CFLAGS += -fno-builtin # fixes math.h undefined symbols, but also disables other builtins (specific -fno-builtin-X might break as later clang versions have more builtins) TODO a proper libm would fix this, but openlibm gave wrong results.
LDFLAGS += -nodefaultlibs -lc -lm # avoids system path libclang_rt.builtins-wasm32.a, or `-nostdlib -Dmain=_start -lc -lm` for no crt1 as well
LDFLAGS += -Wl,--export-table # for function pointers access in JS, such as for event listeners
LDFLAGS += -Wl,--export=malloc # for JS functions that allocate internally (JS_openFilePicker/glGetString)
LDFLAGS += -Wl,--stack-first # to fail fast on stack overflow, else it will quietly overwrite data
LDFLAGS += -Wl,-z,stack-size=value # increase stack size
```
more options: https://lld.llvm.org/WebAssembly.html

To have clangd work create a compile_flags.txt file with the same flags as CC

1. run `make html > /path/to/project/index.html` (or `make js`) to bundle/minify libjs
2. run a http server `esbuild --servedir=.` and pass program name + args similar to CLI `/?program&arg 1&arg 2` in the url.

## Porting C programs
1. add wasm platform to the codebase or just replace SDL, use `#include <js/glue.h>` to have access to JS functions
3. pdclib doesn't implement posix, see [musl](https://git.musl-libc.org/cgit/musl/tree/src) for implementations
4. call JS_setTimeout(ms) or JS_requestAnimationFrame() in any long running loops (main loop, ones waiting for input or http requests)

## wasm sourcemaps (chrome only):
https://medium.com/oasislabs/webassembly-debugging-bec0aa93f8c6

build your program with -g -O0 and optionally -lc-dbg instead of -lc for better stack traces
```
git clone https://github.com/emscripten-core/emscripten.git
```
```
../emscripten/tools/wasm-sourcemap.py out.wasm -w out.wasm -p $(CURDIR) -s -u ./out.wasm.map -o out.wasm.map --dwarfdump=/usr/bin/llvm-dwarfdump
```
or
```
llvm-dwarfdump -a out.wasm > out.wasm.dwarf
../emscripten/tools/wasm-sourcemap.py out.wasm -w out.wasm -p $(CURDIR) -s -u ./out.wasm.map -o out.wasm.map --dwarfdump-output=out.wasm.dwarf
```
after this chrome will automatically load the sourcemap linked in the modified wasm file.

Optional:
- bundler/minifier/http server: [esbuild](https://esbuild.github.io/getting-started/#other-ways-to-install), npm/node are not needed!
- emscriptens [wasm-sourcemap.py](https://github.com/emscripten-core/emscripten)
- [wasm-strip](https://github.com/WebAssembly/wabt)
- [wasm-opt](https://github.com/WebAssembly/binaryen): this one doesn't appear to do much if already using clang optimizations
- compiler-rt (maybe wasi?): If you provide this to clang you won't need to pass -nodefaultlibs -lc but it has to be placed in system path? Without this you may get undefined symbol errors especially with `-lc-dbg` due to use of long doubles, which have to be stubbed out like __unordtf2
- [wcc](https://github.com/tyfkda/xcc): build with `make wcc`, alternative to clang but lacking goto and may have other issues compiling. use `/path/to/wcc -isystem=/path/to/libc/include -L/path/to/libc/lib -Wl,--export-table --stack-size=amount`.

## Limitations
- no proper file modes for writing/appending files etc, use JS_saveFile(). For sockets you have to use the functions in websocket.h not syscalls.
- pdclib can't format floats yet causing issues with EG quake options/keys (use JS_logFloat, [stb_sprintf](https://github.com/nothings/stb/blob/master/stb_sprintf.h) or [nanoprintf](https://github.com/charlesnicholson/nanoprintf)
- missing JS apis: audio/touch/gamepad/webgl/webgpu/webworker etc
- Chrome kills fps with dev console open, and has other lag/timing problems (see doom debug build), temp fix: changing compile flags, enabling profiler

## Ports
In some forks the non-wasm targets haven't been kept in a working state, emulators don't support saves load/download yet
- [Client3](https://github.com/lesleyrs/Client3)
- [PL3D-KC](https://github.com/lesleyrs/PL3D-KC)
- [doomgeneric](https://github.com/lesleyrs/doomgeneric)
- [quakegeneric](https://github.com/lesleyrs/quakegeneric)
- [agbemu](https://github.com/lesleyrs/agbemu)
- [ntremu](https://github.com/lesleyrs/ntremu) - seems to only run decrypted roms, need to provide firmware.bin or touch won't work

These emulators are not so accurate but still serve as examples
- [gdkGBA](https://github.com/lesleyrs/gdkGBA)
- [LakeSnes](https://github.com/lesleyrs/LakeSnes)
- [agnes](https://github.com/lesleyrs/agnes)
- [Peanut-GB](https://github.com/lesleyrs/Peanut-GB)
