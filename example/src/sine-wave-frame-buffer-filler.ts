import type { FrameBufferFiller, FrameBufferWriter } from '@ain1084/audio-worklet-stream'
import { SineWaveGenerator } from './sine-wave-generator'

export type FillerParameters = Readonly<{
  sampleRate: number
  frequencies: number[]
}>

export class SineWaveFrameBufferFiller implements FrameBufferFiller {
  private readonly _generators: SineWaveGenerator[]
  constructor(params: FillerParameters) {
    this._generators = params.frequencies.map((frequency) => {
      return new SineWaveGenerator({ ...params, frequency })
    })
  }

  fill(writer: FrameBufferWriter): boolean {
    const samplesPerFrame = this._generators.length
    writer.write((buffer) => {
      for (let i = 0; i < buffer.length; i += samplesPerFrame) {
        this._generators.forEach((generator, channelIndex) => {
          buffer[i + channelIndex] = generator.nextValue() * 0.3
        })
      }
      return buffer.length / samplesPerFrame
    })
    return true
  }
}
