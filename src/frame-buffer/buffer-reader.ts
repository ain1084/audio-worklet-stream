import { FrameBuffer } from './buffer'
import { FrameBufferConfig } from './buffer-config'

/**
 * FrameBufferReader class
 * This class reads audio frame data from a shared Float32Array buffer and processes it.
 * The buffer usage is tracked using a Uint32Array.
 */
export class FrameBufferReader {
  private readonly _frameBuffer: FrameBuffer
  private readonly _usedFramesInBuffer: Uint32Array
  private readonly _totalFrames: BigUint64Array
  private _index: number = 0

  /**
   * @internal
   * Creates an instance of FrameBufferReader.
   * @param config - The configuration object containing:
   *   - `sampleBuffer`: The shared buffer to read audio data frames from.
   *   - `samplesPerFrame`: The number of samples per frame.
   *   - `usedFramesInBuffer`: A Uint32Array tracking the usage of frames in the buffer.
   *   - `totalReadFrames`: A BigUint64Array tracking the total frames read from the buffer.
   */
  constructor(config: FrameBufferConfig) {
    this._frameBuffer = new FrameBuffer(config.sampleBuffer, config.samplesPerFrame)
    this._usedFramesInBuffer = config.usedFramesInBuffer
    this._totalFrames = config.totalReadFrames
  }

  /**
   * Get the number of available frames in the buffer.
   * @returns The number of available frames in the buffer.
   */
  public get availableFrames(): number {
    return Atomics.load(this._usedFramesInBuffer, 0)
  }

  /**
   * Get the total number of frames read from the buffer.
   *
   * @returns The total number of frames read.
   */
  public get totalFrames(): bigint {
    // This class is not used concurrently by multiple threads,
    // so `Atomics` is not necessary when reading `totalFrames`.
    return this._totalFrames[0]
  }

  /**
   * Reads audio frame data from the buffer using the provided callback.
   * This method handles one or more readable segments within the ring buffer
   * and invokes the callback for each segment.
   *
   * @param processFrameSegment - The callback function invoked for each readable segment
   *   of the ring buffer. It receives:
   *   1. `buffer`: A Float32Array representing the readable segment of the buffer.
   *   2. `offset`: The cumulative number of frames processed so far, used as the starting index
   *      for the current segment relative to the entire data.
   *
   *   The callback must return the number of frames it successfully processed.
   *   If the callback processes fewer frames than available in the current segment,
   *   processing will stop early.
   *
   * @returns The total number of frames processed across all segments.
   *   Note: The return value is in frames, not in samples.
   *
   * @throws RangeError - If the processFrameSegment callback returns a processed length greater than the available frames in the current segment.
   *
   * @remarks The buffer is an array of samples, but it is always provided in frame-sized segments.
   * Each frame consists of multiple samples (e.g., for stereo, a frame contains a sample for the left channel
   * and one for the right channel). You must access and process the buffer in frame-sized chunks,
   * based on the structure of the frames.
   *
   */
  public read(processFrameSegment: (buffer: Float32Array, offset: number) => number): number {
    const result = this._frameBuffer.enumFrameSegments(this._index, this.availableFrames, processFrameSegment)
    this._index = result.nextIndex
    Atomics.sub(this._usedFramesInBuffer, 0, result.totalProcessedFrames)
    Atomics.add(this._totalFrames, 0, BigInt(result.totalProcessedFrames))
    return result.totalProcessedFrames
  }
}
