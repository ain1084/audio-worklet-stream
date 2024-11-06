import { type FrameBufferContext, createFrameBufferContext } from '@ain1084/audio-frame-buffer'

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
 * Configuration for a FillerFrameBuffer.
 * This configuration is returned by the createFillerFrameBufferConfig function.
 * @property sampleRate - The sample rate of the audio context.
 * @property fillInterval - The interval in milliseconds for filling the buffer.
 */
export type FillerFrameBufferContext = FrameBufferContext & Readonly<{
  sampleRate: number
  fillInterval: number
}>

/**
 * Creates a FillerFrameBufferConfig instance.
 * @param params - The parameters for the FillerFrameBuffer.
 * @returns A new instance of FillerFrameBufferConfig.
 */
export const createFillerFrameBufferContext = (params: FillerFrameBufferParams): FillerFrameBufferContext => {
  const sampleRate = params.sampleRate
  // Check if 'sampleRate' is a positive integer
  if (sampleRate === undefined || (!Number.isInteger(sampleRate) || sampleRate <= 0)) {
    throw new Error('Invalid sampleRate: must be a positive integer.')
  }
  const intervalMillisecond = params.fillInterval ?? DEFAULT_FILL_INTERVAL_MS
  const frameCount = Math.floor(
    sampleRate * intervalMillisecond / 1000 + (AUDIO_WORKLET_BLOCK_SIZE - 1),
  ) & ~(AUDIO_WORKLET_BLOCK_SIZE - 1)
  const frameBufferChunkCount = params.frameBufferChunks ?? DEFAULT_FRAME_BUFFER_CHUNKS
  const config = createFrameBufferContext(
    { frameCount: frameCount * frameBufferChunkCount, channelCount: params.channelCount })
  return {
    ...config,
    sampleRate,
    fillInterval: intervalMillisecond,
  }
}
