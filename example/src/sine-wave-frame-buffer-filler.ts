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
    writer.write((segment) => {
      for (let i = 0; i < segment.frameCount; i++) {
        this._generators.forEach((generator, channelIndex) => {
          segment.set(i, channelIndex, generator.nextValue() * 0.3)
        })
      }
      return segment.frameCount
    })
    return true
  }
}
