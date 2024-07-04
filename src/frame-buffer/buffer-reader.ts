import { enumFrames, type FrameCallback } from './buffer-utils'
import { FrameBuffer } from './buffer'

/**
 * FrameBufferReader class
 * This class reads audio frame data from a shared Float32Array buffer and processes it.
 * The buffer usage is tracked using a Uint32Array.
 */
export class FrameBufferReader {
  private readonly _frameBuffer: FrameBuffer
  private readonly _usedFrameInBuffer: Uint32Array
  private readonly _totalFrames: BigUint64Array
  private _index: number = 0

  /**
   * Creates an instance of FrameBufferReader.
   * @param frameBuffer - The shared buffer to read from.
   * @param usedFrameInBuffer - The Uint32Array tracking the usage of the buffer.
   * @param totalFrames - The BigUint64Array tracking the total frames read from the buffer.
   */
  constructor(frameBuffer: FrameBuffer, usedFrameInBuffer: Uint32Array, totalFrames: BigUint64Array) {
    this._frameBuffer = frameBuffer
    this._usedFrameInBuffer = usedFrameInBuffer
    this._totalFrames = totalFrames
  }

  /**
   * Get the number of available frames in the buffer.
   * @returns The number of available frames in the buffer.
   */
  public get available(): number {
    return Atomics.load(this._usedFrameInBuffer, 0)
  }

  /**
   * Get the total number of frames read from the buffer.
   * @returns The total number of frames read.
   */
  public get totalFrames(): bigint {
    return this._totalFrames[0]
  }

  /**
   * Reads audio frame data from the buffer and processes it using the provided callback.
   * @param frameCallback - The callback function to process each section of the buffer.
   * @returns The number of frames processed.
   * @throws RangeError - If the processed length exceeds the part length.
   */
  public read(frameCallback: FrameCallback): number {
    const result = enumFrames(this._frameBuffer, this._index, this.available, frameCallback)
    this._index = result.nextIndex
    Atomics.sub(this._usedFrameInBuffer, 0, result.frames)
    Atomics.add(this._totalFrames, 0, BigInt(result.frames))
    return result.frames
  }
}
