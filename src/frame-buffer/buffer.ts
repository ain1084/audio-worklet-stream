/**
 * FrameBuffer class
 * This class manages a buffer of audio frames.
 */
export class FrameBuffer {
  private readonly _buffer: Float32Array
  private readonly _samplesPerFrame: number
  private readonly _frameCount: number

  /**
   * Creates an instance of FrameBuffer.
   * @param buffer - The Float32Array buffer to manage.
   * @param samplesPerFrame - The number of samples per frame.
   */
  public constructor(buffer: Float32Array, samplesPerFrame: number) {
    this._buffer = buffer
    this._samplesPerFrame = samplesPerFrame
    this._frameCount = Math.floor(buffer.length / samplesPerFrame)
  }

  /**
   * Gets the count of the buffer in frames.
   * @returns The count of the buffer in frames.
   */
  public get frameCount(): number {
    return this._frameCount
  }

  private getFrames(index: number, count: number): Float32Array {
    return this._buffer.subarray(index * this._samplesPerFrame, (index + count) * this._samplesPerFrame)
  }

  /**
   * Processes sections of a Float32Array buffer using a callback function.
   * This function handles one or more segments within the ring buffer and invokes
   * the provided callback for each segment. It is intended for internal use only.
   *
   * @param startIndex - The starting index in the buffer from where processing should begin.
   * @param availableFrames - The total number of frames available to process in the buffer.
   * @param processFrameSegment - The callback function invoked for each segment
   *   of the ring buffer during enumeration. It receives:
   *   1. `buffer`: A Float32Array representing the segment to process. The buffer is an array
   *      of samples but is always provided in frame-sized segments.
   *   2. `offset`: The cumulative number of frames processed so far, used as the starting index
   *      for the current segment relative to the entire data.
   *   The callback must return the number of frames it successfully processed.
   *   If the callback processes fewer frames than available in the current segment,
   *   processing will stop early.
   *
   * @returns An object containing:
   *          - totalProcessedFrames: The number of frames successfully processed.
   *          - nextIndex: The index in the buffer for the next processing cycle.
   *
   * @throws RangeError - If the processFrameSegment callback returns a processed length greater than the available section length.
   *
   * @remarks The buffer is always provided in frame-sized segments, meaning that the buffer contains complete frames.
   * You must process the buffer in frame-sized chunks based on the structure of the frames.
   */
  public enumFrameSegments(startIndex: number, availableFrames: number,
    processFrameSegment: (buffer: Float32Array, offset: number) => number): { totalProcessedFrames: number, nextIndex: number } {
    let totalProcessedFrames = 0
    while (totalProcessedFrames < availableFrames) {
      // Determine the length of the current section to process
      const sectionFrames = Math.min(this.frameCount - startIndex, availableFrames - totalProcessedFrames)
      // Process the current section using the frameCallback function
      const processedFrames = processFrameSegment(this.getFrames(startIndex, sectionFrames), totalProcessedFrames)
      // Ensure the processed length does not exceed the section length
      if (processedFrames > sectionFrames) {
        throw new RangeError(`Processed frames (${processedFrames}) exceeds section frames (${sectionFrames})`)
      }
      totalProcessedFrames += processedFrames
      startIndex = (startIndex + processedFrames) % this.frameCount
      if (processedFrames < sectionFrames) {
        break
      }
    }
    return { totalProcessedFrames, nextIndex: startIndex }
  }
}
