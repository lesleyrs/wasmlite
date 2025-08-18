import { refreshMemory, exports, u8, f32 } from './loader.js'

// TODO doom wants panning, stopAudio, isPlaying, doom sound explosion caused by those missing calls?

// we can't avoid choppy audio with ScriptProcessorNode whenever main thread is busy
// we can't call wasm functions in AudioWorklet without SharedArrayBuffer + --import-memory + more changes
// instead of callbacks you have to push the buffers yourself by calling JS_streamAudio/JS_startAudio

const audioCtx = new AudioContext();
// TODO streamGain
let audioGain = audioCtx.createGain();
audioGain.connect(audioCtx.destination);

let streamTime;
const streamLatency = 0.1;
const streamLength = 1;

export const audio = {
  JS_startAudio: async (buf, len) => {
    refreshMemory();
    const audio = u8.subarray(buf, buf + len);
    // get arraybuffer slice instead of subarray view or memory will get detached
    const arrayBuffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    let source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioGain);
    source.start();
  },
  JS_setAudioVolume: (vol) => {
    audioGain.gain.value = vol;
  },
  JS_getSampleRate: () => {
    return audioCtx.sampleRate;
  },
  JS_resumeAudio: () => {
    document.addEventListener("click", () => audioCtx.resume());
  },
  JS_streamAudio: (cb, userdata, stream, samples) => {
    const now = audioCtx.currentTime;
    streamTime = streamTime || now + streamLatency; // add initial now+latency offset

    if (streamTime < now + streamLength) {
      refreshMemory();

      const channels = 2;
      const frames = samples / (channels * Float32Array.BYTES_PER_ELEMENT);
      let buffer = audioCtx.createBuffer(channels, frames, audioCtx.sampleRate);

      exports.__indirect_function_table.get(cb)(userdata, stream, samples);

      const outL = buffer.getChannelData(0);
      const outR = buffer.getChannelData(1);
      for (let i = 0; i < frames; i++) {
        const idx = (stream >> 2) + i * 2;
        outL[i] = f32[idx];
        outR[i] = f32[idx + 1];
      }

      let source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(streamTime);

      streamTime += buffer.duration;
    }
  },
  // NOTE: must only be called once
  /* JS_streamAudio: (cb, userdata, stream, samples) => {
    refreshMemory();

    const channels = 2;
    const frames = samples / (channels * Float32Array.BYTES_PER_ELEMENT);
    const processor = audioCtx.createScriptProcessor(frames, 0, channels);

    processor.onaudioprocess = (e) => {
      exports.__indirect_function_table.get(cb)(userdata, stream, samples);

      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      for (let i = 0; i < frames; i++) {
        const idx = (stream >> 2) + i * 2;
        outL[i] = f32[idx];
        outR[i] = f32[idx + 1];
      }
    };

    processor.connect(audioCtx.destination);
  }, */
}
