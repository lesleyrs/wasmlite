#pragma once
#include <stdint.h>

#include "wasm.h"

WASM_IMPORT(void, JS_startAudio, (uint8_t *buf, int len));
WASM_IMPORT(void, JS_setAudioVolume, (double vol));

WASM_IMPORT(double, JS_getSampleRate, (void));
WASM_IMPORT(void, JS_resumeAudio, (double freq));

WASM_IMPORT(int, JS_getQueuedAudioSize, (void));
WASM_IMPORT(void, JS_queueAudio, (void *stream, int bytes));

typedef void (*JS_AudioCallback)(void *userdata, uint8_t *stream, int samples);
WASM_IMPORT(void, JS_setAudioCallback, (JS_AudioCallback, void *userdata, void *stream, int bytes));
