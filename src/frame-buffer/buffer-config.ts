import { createArrayBufferViews } from '@ain1084/array-buffer-partitioner'

/**
 * The default number of chunks in the frame buffer when
 * FillerFrameBufferParams.frameBufferChunks is not provided.
 * A frame buffer sufficient to hold fillInterval * frameBufferChunks of playback time is allocated.
 */
const DEFAULT_FILL_INTERVAL_MS = 20

/**
 * The default number of chunks in the frame buffer when
 * FillerFrameBufferParams.frameBufferChunks is not provided.
 * The total frame buffer size will be fillInterval * frameBufferChunks.
 */
const DEFAULT_FRAME_BUFFER_CHUNKS = 5

/**
 * The unit for rounding up the frame buffer size.
 * This value is aligned with the audio data block size used by the AudioWorkletProcessor.
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
 */
const AUDIO_WORKLET_BLOCK_SIZE = 128

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
 * Creates a FrameBufferConfig instance.
 * @param params - The parameters for the FrameBuffer.
 * @returns A new instance of FrameBufferConfig.
 */
export const createFrameBufferConfig = (params: FrameBufferParams): FrameBufferConfig => {
  return {
    ...createArrayBufferViews(SharedArrayBuffer, {
      sampleBuffer: [Float32Array, params.frameBufferSize * params.channelCount],
      usedFramesInBuffer: [Uint32Array, 1],
      totalReadFrames: [BigUint64Array, 1],
      totalWriteFrames: [BigUint64Array, 1],
    }),
    samplesPerFrame: params.channelCount,
  }
}

/**
 * Creates a FillerFrameBufferConfig instance.
 * @param params - The parameters for the FillerFrameBuffer.
 * @returns A new instance of FillerFrameBufferConfig.
 */
export const createFillerFrameBufferConfig = (params: FillerFrameBufferParams): FillerFrameBufferConfig => {
  const sampleRate = params.sampleRate
  // Check if 'sampleRate' is a positive integer
  if (sampleRate === undefined || (!Number.isInteger(sampleRate) || sampleRate <= 0)) {
    throw new Error('Invalid sampleRate: must be a positive integer.')
  }
  const intervalMillisecond = params.fillInterval ?? DEFAULT_FILL_INTERVAL_MS
  const frameBufferSize = Math.floor(
    sampleRate * intervalMillisecond / 1000 + (AUDIO_WORKLET_BLOCK_SIZE - 1),
  ) & ~(AUDIO_WORKLET_BLOCK_SIZE - 1)
  const frameBufferChunkCount = params.frameBufferChunks ?? DEFAULT_FRAME_BUFFER_CHUNKS
  const config = createFrameBufferConfig(
    { frameBufferSize: frameBufferSize * frameBufferChunkCount, channelCount: params.channelCount })
  return {
    ...config,
    sampleRate,
    fillInterval: intervalMillisecond,
  }
}
