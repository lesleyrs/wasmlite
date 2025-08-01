#pragma once

#define WASM_IMPORT(ret, name, args) \
    __attribute__((import_module("env"), import_name(#name))) \
    ret name args
