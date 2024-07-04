import { FrameBuffer } from './buffer'
import { FrameBufferWriter } from './buffer-writer'

/**
 * Parameters for creating a FrameBuffer.
 * @property frameBufferSize - The size of the frame buffer.
 * @property channelCount - The number of audio channels.
 */
export type FrameBufferParams = Readonly<{
  frameBufferSize: number
  channelCount: number
}>

/**
 * Parameters for creating a FillerFrameBuffer.
 * @property channelCount - The number of audio channels.
 * @property fillInterval - The interval in milliseconds for filling the buffer.
 * @property sampleRate - The sample rate of the audio context.
 * @property frameBufferChunks - The number of chunks in the frame buffer.
 */
export type FillerFrameBufferParams = Readonly<{
  channelCount: number
  fillInterval?: number
  sampleRate?: number
  frameBufferChunks?: number
}>

/**
 * Configuration for a FrameBuffer.
 * This configuration is returned by the createFrameBufferConfig function.
 * @property sampleBuffer - The shared buffer for audio data frames.
 * @property samplesPerFrame - The number of samples per frame.
 * @property usedFramesInBuffer - The usage count of the frames in the buffer.
 * @property totalReadFrames - The total frames read from the buffer.
 * @property totalWriteFrames - The total frames written to the buffer.
 */
export type FrameBufferConfig = Readonly<{
  sampleBuffer: Float32Array
  samplesPerFrame: number
  usedFramesInBuffer: Uint32Array
  totalReadFrames: BigUint64Array
  totalWriteFrames: BigUint64Array
}>

/**
 * Configuration for a FillerFrameBuffer.
 * This configuration is returned by the createFillerFrameBufferConfig function.
 * @property sampleRate - The sample rate of the audio context.
 * @property fillInterval - The interval in milliseconds for filling the buffer.
 */
export type FillerFrameBufferConfig = FrameBufferConfig & Readonly<{
  sampleRate: number
  fillInterval: number
}>

/**
 * Creates a FrameBufferWriter instance.
 * @param config - The configuration for the FrameBuffer.
 * @returns A new instance of FrameBufferWriter.
 */
export const createFrameBufferWriter = (config: FrameBufferConfig): FrameBufferWriter => {
  return new FrameBufferWriter(
    new FrameBuffer(config.sampleBuffer, config.samplesPerFrame),
    config.usedFramesInBuffer, config.totalWriteFrames,
  )
}

/**
 * FrameBufferFactory class
 * Provides static methods to create frame buffer configurations and writers.
 */
export class FrameBufferFactory {
  public static readonly DEFAULT_FILL_INTERVAL_MS = 20
  public static readonly DEFAULT_FRAME_BUFFER_CHUNKS = 5
  public static readonly PROCESS_UNIT = 128

  /**
   * Creates a FrameBufferConfig instance.
   * @param params - The parameters for the FrameBuffer.
   * @returns A new instance of FrameBufferConfig.
   */
  public static createFrameBufferConfig(params: FrameBufferParams): FrameBufferConfig {
    return {
      sampleBuffer: new Float32Array(
        new SharedArrayBuffer(params.frameBufferSize * params.channelCount * Float32Array.BYTES_PER_ELEMENT),
      ),
      samplesPerFrame: params.channelCount,
      usedFramesInBuffer: new Uint32Array(new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)),
      totalReadFrames: new BigUint64Array(new SharedArrayBuffer(BigUint64Array.BYTES_PER_ELEMENT)),
      totalWriteFrames: new BigUint64Array(new SharedArrayBuffer(BigUint64Array.BYTES_PER_ELEMENT)),
    }
  }

  /**
   * Creates a FillerFrameBufferConfig instance.
   * @param defaultSampleRate - The sample rate of the audio context.
   * @param params - The parameters for the FillerFrameBuffer.
   * @returns A new instance of FillerFrameBufferConfig.
   */
  public static createFillerFrameBufferConfig(defaultSampleRate: number, params: FillerFrameBufferParams): FillerFrameBufferConfig {
    const sampleRate = params.sampleRate ?? defaultSampleRate
    const intervalMillisecond = params.fillInterval ?? FrameBufferFactory.DEFAULT_FILL_INTERVAL_MS
    const frameBufferSize = Math.floor(
      sampleRate * intervalMillisecond / 1000 + (FrameBufferFactory.PROCESS_UNIT - 1),
    ) & ~(FrameBufferFactory.PROCESS_UNIT - 1)
    const frameBufferChunkCount = params.frameBufferChunks ?? FrameBufferFactory.DEFAULT_FRAME_BUFFER_CHUNKS
    const config = FrameBufferFactory.createFrameBufferConfig(
      { frameBufferSize: frameBufferSize * frameBufferChunkCount, channelCount: params.channelCount })
    return {
      ...config,
      sampleRate,
      fillInterval: intervalMillisecond,
    }
  }
}
