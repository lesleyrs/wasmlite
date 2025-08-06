import { u8, refreshMemory } from './loader.js'

const audioCtx = new AudioContext();
let audioGain = audioCtx.createGain();
audioGain.connect(audioCtx.destination);

export const audio = {
  JS_startAudio: async (buf, len) => {
    refreshMemory();
    const audio = u8.subarray(buf, buf + len);
    // get sliced arraybuffer instead of the entire arraybuffer or memory will get detached
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
}
