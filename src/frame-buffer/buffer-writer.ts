import { enumFrames, type FrameCallback } from './buffer-utils'
import { FrameBuffer } from './buffer'

/**
 * FrameBufferWriter class
 * This class writes audio frame data to a shared Float32Array buffer.
 * The buffer usage is tracked using a Uint32Array.
 */
export class FrameBufferWriter {
  private readonly _frameBuffer: FrameBuffer
  private readonly _usedFrameInBuffer: Uint32Array
  private readonly _totalFrames: BigUint64Array
  private _index: number = 0

  /**
   * Creates an instance of FrameBufferWriter.
   * @param frameBuffer - The shared buffer to write to.
   * @param usedFrameInBuffer - The Uint32Array tracking the usage of the buffer.
   * @param totalFrames - The BigUint64Array tracking the total frames written to the buffer.
   */
  constructor(frameBuffer: FrameBuffer, usedFrameInBuffer: Uint32Array, totalFrames: BigUint64Array) {
    this._frameBuffer = frameBuffer
    this._usedFrameInBuffer = usedFrameInBuffer
    this._totalFrames = totalFrames
  }

  /**
   * Get the number of available spaces in the buffer.
   * @returns The number of available spaces in the buffer.
   */
  public get available(): number {
    return this._frameBuffer.length - Atomics.load(this._usedFrameInBuffer, 0)
  }

  /**
   * Get the total number of frames written to the buffer.
   * @returns The total number of frames written.
   */
  public get totalFrames(): bigint {
    return this._totalFrames[0]
  }

  /**
   * Write audio frame data to the buffer using the provided frameCallback.
   * @param frameCallback - The frameCallback function to process each section of the buffer.
   * @returns The number of frames processed.
   * @throws RangeError - If the processed length exceeds the part length.
   */
  public write(frameCallback: FrameCallback): number {
    const result = enumFrames(this._frameBuffer, this._index, this.available, frameCallback)
    this._index = result.nextIndex
    Atomics.add(this._usedFrameInBuffer, 0, result.frames)
    Atomics.add(this._totalFrames, 0, BigInt(result.frames))
    return result.frames
  }
}
