# wasmlite (experimental) - like emscripten but with less magic

This project uses [JSPI](https://v8.dev/blog/jspi) which is able to suspend/resume wasm execution meaning we can often port programs with [little changes](#Ports) outside of platform code, and avoids the need to export functions to JS to call them from there. This requires modern chrome or enable `javascript.options.wasm_js_promise_integration` in firefox.

## Usage
```
CC = clang --target=wasm32 --sysroot=/path/to/wasm/libc
LDFLAGS = -nodefaultlibs -lc -lm
LDFLAGS += -Wl,--export-table # for function pointers access in JS, such as for event listeners
LDFLAGS += -Wl,--export=malloc # for JS functions that allocate internally (JS_openFilePicker/glGetString)
```
Other flags might be useful like -Wl,--stack-first: https://lld.llvm.org/WebAssembly.html

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
after this chrome will automatically load the sourcemap linked in the wasm file.

## Dependencies
These are stored in [libc](./libc) but have different licenses.
- [crt1](./libc/crt1.c): `make crt1`, if you don't need args you can define `-nostdlib -Dmain=_start` instead of -nodefaultlibs
- [pdclib](https://github.com/lesleyrs/pdclib) stderr is line buffered as opposed to unbuffered since you can't avoid newlines in browser
- [openlibm](https://github.com/lesleyrs/openlibm) alternative to javascript Math

Optional:
- bundler/minifier/http server: [esbuild](https://esbuild.github.io/getting-started/#other-ways-to-install), npm/node are not needed!
- emscriptens [wasm-sourcemap.py](https://github.com/emscripten-core/emscripten)
- [wasm-strip](https://github.com/WebAssembly/wabt)
- [wasm-opt](https://github.com/WebAssembly/binaryen): this one doesn't appear to do much if already using clang optimizations
- compiler-rt (maybe wasi?): If you provide this to clang you won't need to pass -nodefaultlibs -lc but it has to be placed in system path? Without this you may get undefined symbol errors especially with `-lc-dbg` due to use of long doubles, which have to be stubbed out like __unordtf2

## Limitations
- pdclib can't format floats yet causing issues with EG quake options/keys (use JS_logFloat, [stb_sprintf](https://github.com/nothings/stb/blob/master/stb_sprintf.h) or [nanoprintf](https://github.com/charlesnicholson/nanoprintf)
- pdclib for wasm has some remaining issues (like parts of fclose were giving errors and were commented out)
- Some programs such as doom debug build seem to lag, but it's a chrome browser timing issue (using profiler or changing compile flags stops the issue)
- Instead of creating new memory arrays due to them getting invalidated, would be better to only do it whenever memory grows?
- missing JS apis: audio/websockets/touch/gamepad/webgl/webgpu/webworker etc

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
