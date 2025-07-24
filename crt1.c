// https://github.com/emscripten-core/emscripten/blob/main/system/lib/standalone/__main_void.c
// https://github.com/WebAssembly/wasi-libc/blob/main/libc-bottom-half/sources/__main_void.c

#include <stddef.h>

void exit(int status);
/* Use alloca() to avoid including malloc in all programs. */
void *alloca(size_t size);

// If the application's `main` does not uses argc/argv, then it will be defined
// (by llvm) with an __main_void alias, and therefore this function will not
// be included, and `_start` will call the application's `__main_void` directly.
//
// If the application's `main` does use argc/argv, then _start will call this
// function which which loads argv values and sends them to to the
// application's `main` which gets mangled to `__main_argc_argv` by llvm.

int __main_void(void);
int __main_argc_argv(int argc, char **argv);

__attribute__((import_module("env"), import_name("JS_getArgsSizes")))
extern void JS_getArgsSizes(int* argc, int* argv_buf_size);
__attribute__((import_module("env"), import_name("JS_getArgs")))
extern void JS_getArgs(char** argv, char* argv_buf);

void _start(void) {
    int rc = __main_void();
    exit(rc);
}

__attribute__((weak))
int __main_void(void) {
    /* Fill in the arguments from JS syscalls. */
    int argc;
    int argv_buf_size;
    /* Get the sizes of the arrays we'll have to create to copy in the args. */
    JS_getArgsSizes(&argc, &argv_buf_size);

    char **argv = NULL;
    if (argc) {
        /* Allocate memory for the array of pointers, adding null terminator. */
        argv = alloca(sizeof(char*) * (argc + 1));
        /* Allocate memory for storing the argument chars. */
        char *argv_buf = alloca(argv_buf_size);
        /* Make sure the last pointer in the array is NULL. */
        argv[argc] = NULL;
        /* Fill the argument chars, and the argv array with pointers into those chars. */
        JS_getArgs(argv, argv_buf);
    }

    return __main_argc_argv(argc, argv);
}
