#pragma once

#define WASM_IMPORT(ret, name, ...) \
    __attribute__((import_module("env"), import_name(#name))) \
    extern ret name(__VA_ARGS__)
