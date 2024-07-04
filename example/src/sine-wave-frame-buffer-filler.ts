import type { FrameBufferFiller, FrameBufferWriter } from '@ain1084/audio-worklet-stream'
import { SineWaveGenerator } from './sine-wave-generator'

export type FillerParameters = Readonly<{
  frequency: number
  sampleRate: number
}>

export class SineWaveFrameBufferFiller implements FrameBufferFiller {
  private readonly _generator: SineWaveGenerator
  private readonly _tempBuffer = new Float32Array(128)
  constructor(params: FillerParameters) {
    this._generator = new SineWaveGenerator({ frequency: params.frequency, sampleRate: params.sampleRate })
  }

  fill(writer: FrameBufferWriter): boolean {
    writer.write((frame) => {
      let totalFrames = 0
      while (totalFrames < frame.frames) {
        const sectionFrames = Math.min(this._tempBuffer.length, frame.frames - totalFrames)
        for (let i = 0; i < sectionFrames; ++i) {
          this._tempBuffer[i] = this._generator.nextValue() * 0.3
        }
        frame.buffer.setFrames(frame.index + totalFrames, this._tempBuffer, 0, sectionFrames)
        totalFrames += sectionFrames
      }
      return frame.frames
    })
    return true
  }
}
