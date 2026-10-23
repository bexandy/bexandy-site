import * as ort from 'onnxruntime-web/webgpu';
import type { Tensor } from './dsp';

// Los binarios de ONNX Runtime se copian a public/ort en el build (ver scripts/ort-copy.mjs).
ort.env.wasm.wasmPaths = '/ort/';
ort.env.logLevel = 'warning';

export type Provider = 'webgpu' | 'wasm';

export class ONNXHTDemucs {
  readonly sources = ['drums', 'bass', 'other', 'vocals'] as const;
  readonly audioChannels = 2;
  readonly samplerate = 44100;
  readonly segment = 7.8;
  session!: ort.InferenceSession;
  inputNames!: readonly string[];
  outputNames!: readonly string[];
  provider: Provider = 'wasm';

  private constructor() {}

  static async init(modelWeights: ArrayBuffer, providers: Provider[] = ['webgpu', 'wasm']): Promise<ONNXHTDemucs> {
    const instance = new ONNXHTDemucs();
    let lastError: unknown;
    for (const p of providers) {
      try {
        instance.session = await ort.InferenceSession.create(modelWeights, { executionProviders: [p] });
        instance.provider = p;
        lastError = undefined;
        break;
      } catch (e) {
        console.warn(`[demucs] proveedor ${p} falló:`, e);
        lastError = e;
      }
    }
    if (lastError) throw lastError;
    instance.inputNames = instance.session.inputNames;
    instance.outputNames = instance.session.outputNames;
    return instance;
  }

  validLength(length: number): number {
    const trainingLength = Math.floor(this.segment * this.samplerate);
    if (trainingLength < length) throw new Error(`Given length ${length} is longer than training length ${trainingLength}`);
    return trainingLength;
  }

  async forward(mix: Tensor, magspec: Tensor): Promise<{ outX: Tensor; outXt: Tensor }> {
    const feeds: Record<string, ort.Tensor> = {};
    feeds[this.inputNames[0]] = new ort.Tensor('float32', mix.data, mix.shape);
    feeds[this.inputNames[1]] = new ort.Tensor('float32', magspec.data, magspec.shape);
    const results = await this.session.run(feeds);
    const outX = results[this.outputNames[0]];
    const outXt = results[this.outputNames[1]];
    return {
      outX: { data: outX.data as Float32Array, shape: outX.dims as number[] },
      outXt: { data: outXt.data as Float32Array, shape: outXt.dims as number[] },
    };
  }
}
