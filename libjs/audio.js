import { exports, memory } from './loader.js'

const workletSource = `
class Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.pos = 0;
    this.current = null;
    this.requested = false;
    this.port.onmessage = e => {
      if (e.data.pcm) {this.queue.push(e.data.pcm); this.requested = false; };
      if (e.data.queuedAudioSize) this.port.postMessage({queuedAudioSize: this.queue.reduce((sum, buf) => sum + buf.length * 4, 0)});
    };
  }
  process(_, outputs) {
    const [outL, outR] = outputs[0];
    if (!this.current || this.pos >= this.current.length) {
      this.current = this.queue.shift() || null;
      this.pos = 0;
      if (this.queue.length <= 1 && !this.requested) { this.port.postMessage({request: true}); this.requested = true; }
    }
    for (let i = 0; i < outL.length; i++) {
      if (this.current) {
        outL[i] = this.current[this.pos++];
        outR[i] = this.current[this.pos++];
      }
    }
    return true;
  }
}
registerProcessor("processor", Processor);
`;

const audioCtx = new AudioContext();
let audioGain = audioCtx.createGain();
audioGain.connect(audioCtx.destination);

// TODO streamGain?
let streamCtx;
// let streamTime;
// const streamLatency = 0.1;
// const streamLength = 1;

let worklet;

export const audio = {
  JS_playPCM: (buf, channels, samples, samplerate) => {
    const buf32 = buf >> 2;
    const pcm = memory.f32.subarray(buf32, buf32 + samples);

    const buffer = audioCtx.createBuffer(channels, samples, samplerate);
    buffer.copyToChannel(pcm, 0);

    let source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioGain);
    source.start();
  },
  JS_startAudio: async (buf, len) => {
    const audio = memory.u8.subarray(buf, buf + len);

    // slice instead of subarray view or the memory be detached
    const arrayBuffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength);
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);

    let source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioGain);
    source.start();
  },
  JS_setAudioVolume: (vol) => {
    audioGain.gain.value = vol;
  },
  JS_getSampleRate: () => {
    return streamCtx.sampleRate;
  },
  JS_resumeAudio: new WebAssembly.Suspending(async (sampleRate) => {
    // TODO move some code out?
    streamCtx = new AudioContext({ sampleRate: sampleRate });
    document.addEventListener("click", () => streamCtx.resume());

    const blob = new Blob([workletSource], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await streamCtx.audioWorklet.addModule(url);

    worklet = new AudioWorkletNode(streamCtx, 'processor', {
      outputChannelCount: [2],
    });

    worklet.connect(streamCtx.destination);
  }),
  JS_setAudioCallback: (cb, userdata, stream, bytes) => {
    worklet.port.onmessage = (e) => {
      if (e.data.request) {
        if (cb) {
          exports.__indirect_function_table.get(cb)(userdata, stream, bytes);
        }
        const stream32 = stream >> 2, samples32 = bytes >> 2;
        const tmp = new Float32Array(memory.f32.subarray(stream32, stream32 + samples32));
        worklet.port.postMessage({pcm: tmp}, [tmp.buffer]);
      }
    };
  },
  JS_queueAudio: (stream, bytes) => {
    const stream32 = stream >> 2, samples32 = bytes >> 2;
    const tmp = new Float32Array(memory.f32.subarray(stream32, stream32 + samples32));
    worklet.port.postMessage({pcm: tmp}, [tmp.buffer]);
  },
  JS_getQueuedAudioSize: new WebAssembly.Suspending(async () => {
    // TODO: avoid recreating onmessage?
    const size = await new Promise(resolve => {
      worklet.port.onmessage = (e) => {
        if ('queuedAudioSize' in e.data) {
          resolve(e.data.queuedAudioSize);
        }
      }
      worklet.port.postMessage({queuedAudioSize: true});
    })

    return size;
  }),
  /* JS_queueAudio: (cb, userdata, stream, samples) => {
    const now = streamCtx.currentTime;
    streamTime = streamTime || now + streamLatency; // add initial now+latency offset

    if (streamTime < now) {
      console.log('Syncing audio... ' + streamTime.toFixed(2) + ' / ' + now.toFixed(2));
      streamTime = now + streamLatency;
    }

    if (streamTime < now + streamLength) {
      const channels = 2;
      const frames = samples / (channels * Float32Array.BYTES_PER_ELEMENT);
      let buffer = streamCtx.createBuffer(channels, frames, streamCtx.sampleRate);

      if (cb) {
        exports.__indirect_function_table.get(cb)(userdata, stream, samples);
      }

      const outL = buffer.getChannelData(0);
      const outR = buffer.getChannelData(1);
      for (let i = 0; i < frames; i++) {
        const idx = (stream >> 2) + i * 2;
        outL[i] = memory.f32[idx];
        outR[i] = memory.f32[idx + 1];
      }

      let source = streamCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(streamCtx.destination);
      source.start(streamTime);

      streamTime += buffer.duration;
    }
  }, */
  /* JS_setAudioCallback: (cb, userdata, stream, samples) => {
    const channels = 2;
    const frames = samples / (channels * Float32Array.BYTES_PER_ELEMENT);
    const processor = streamCtx.createScriptProcessor(frames, 0, channels);

    processor.onaudioprocess = (e) => {
      if (cb) {
        exports.__indirect_function_table.get(cb)(userdata, stream, samples);
      }

      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      for (let i = 0; i < frames; i++) {
        const idx = (stream >> 2) + i * 2;
        outL[i] = memory.f32[idx];
        outR[i] = memory.f32[idx + 1];
      }
    };

    processor.connect(streamCtx.destination);
  }, */
}
