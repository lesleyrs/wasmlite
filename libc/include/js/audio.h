#pragma once
#include <stdint.h>

#include "wasm.h"

WASM_IMPORT(void, JS_startAudio, (uint8_t *buf, int len));
WASM_IMPORT(void, JS_setAudioVolume, (float vol));
