/**
 * FrameBuffer class
 * This class manages a buffer of audio frames.
 */
export class FrameBuffer {
  private readonly _buffer: Float32Array
  private readonly _samplesPerFrame: number
  private readonly _length: number

  /**
   * Creates an instance of FrameBuffer.
   * @param buffer - The Float32Array buffer to manage.
   * @param samplesPerFrame - The number of samples per frame.
   */
  public constructor(buffer: Float32Array, samplesPerFrame: number) {
    this._buffer = buffer
    this._samplesPerFrame = samplesPerFrame
    this._length = Math.floor(buffer.length / samplesPerFrame)
  }

  /**
   * Sets the frame data in the buffer.
   * @param index - The starting index in the buffer.
   * @param samples - The samples to set in the buffer.
   * @param sampleStart - The starting position in the samples array (default is 0).
   * @param sampleCount - The number of samples to set (default is the length of the samples array).
   * @returns A number of written frames.
   * @throws Error - If the number of samples per frame does not match the specified number of samples.
   */
  public setFrames(index: number, samples: Float32Array, sampleStart: number = 0, sampleCount?: number): number {
    index *= this._samplesPerFrame
    const sampleEnd = Math.min((sampleCount !== undefined) ? (sampleStart + sampleCount) : samples.length, samples.length)
    const frames = (sampleEnd - sampleStart) / this._samplesPerFrame
    if (!Number.isInteger(frames)) {
      throw new Error(`Error: The number of samples per frame does not match the specified number of samples. Expected samples per frame: ${this._samplesPerFrame}, but got: ${sampleEnd - sampleStart}.`)
    }
    for (let sampleIndex = sampleStart; sampleIndex < sampleEnd; ++sampleIndex, ++index) {
      this._buffer[index] = samples[sampleIndex]
    }
    return frames
  }

  /**
   * Converts the frame data to output.
   * This method is intended to be called from within the process method of the AudioWorkletProcessor.
   * It converts the interleaved frame data to the structure expected by the process method's outputs.
   * @param frameIndex - The index of the frame to convert.
   * @param frames - The number of frames to convert.
   * @param output - The output array to store the converted data.
   * @param outputOffset - The offset in the output array at which to start storing the data.
   */
  public convertToOutput(frameIndex: number, frames: number, output: Float32Array[], outputOffset: number): void {
    const samplesPerFrame = this._samplesPerFrame
    output.forEach((outputChannel, channelNumber) => {
      for (let i = channelNumber, j = 0; j < frames; i += samplesPerFrame, ++j) {
        outputChannel[outputOffset + j] = this._buffer[frameIndex + i]
      }
    })
  }

  /**
   * Gets the length of the buffer in frames.
   * @returns The length of the buffer in frames.
   */
  public get length(): number {
    return this._length
  }
}
