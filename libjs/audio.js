import { refreshMemory, exports, u8, f32 } from './loader.js'

// TODO doom wants panning, stopAudio, isPlaying, doom sound explosion caused by those missing calls?
// NOTE we can't call wasm functions in AudioWorklet without SharedArrayBuffer + --import-memory, so unused

const audioCtx = new AudioContext();
// TODO streamGain
let audioGain = audioCtx.createGain();
audioGain.connect(audioCtx.destination);

export const audio = {
  JS_startAudio: async (buf, len) => {
    refreshMemory();
    const audio = u8.subarray(buf, buf + len);
    // get arraybuffer slice instead of subarray view or memory will get detached
    const arrayBuffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    let bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(audioGain);
    bufferSource.start();
  },
  JS_setAudioVolume: (vol) => {
    audioGain.gain.value = vol;
  },
  JS_getSampleRate: () => {
    return audioCtx.sampleRate;
  },
  JS_streamAudio: (cb, userdata, stream, samples) => {
    document.addEventListener("click", () => audioCtx.resume());

    const channels = 2;
    const frames = samples / (channels * Float32Array.BYTES_PER_ELEMENT);
    const processor = audioCtx.createScriptProcessor(frames, 0, channels);

    processor.onaudioprocess = (e) => {
      refreshMemory();
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
  },
}
