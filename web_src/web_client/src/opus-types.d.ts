// opus-types.d.ts
// Place this file in your src/ directory or types/ directory

declare module 'opus-recorder' {
  interface RecorderConfig {
    encoderPath: string;
    encoderSampleRate?: number;
    numberOfChannels?: number;
    streamPages?: boolean;
    leaveStreamOpen?: boolean;
    maxFramesPerPage?: number;
    encoderApplication?: number;
    encoderFrameSize?: number;
    streamOptions?: {
      objectMode?: boolean;
      writableHighWaterMark?: number;
    };
  }

  class Recorder {
    constructor(config: RecorderConfig);

    ondataavailable: ((data: ArrayBuffer) => void) | null;

    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): void;
    resume(): void;

    isRecording(): boolean;
    setConfig(config: Partial<RecorderConfig>): void;
  }

  export default Recorder;
}

declare module 'opus-decoder' {
  interface DecodedAudio {
    channelData: Float32Array[];
    samplesDecoded: number;
  }

  class OpusDecoder {
    constructor(sampleRate: number, channels?: number);

    ready: Promise<void>;

    decodeFrame(frame: Uint8Array): DecodedAudio;
    free?(): void;
  }

  export { OpusDecoder };
}
