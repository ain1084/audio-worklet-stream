import type { FrameBuffer } from './buffer'

/**
 * Type definition for the callback function used in enumFrames.
 * The callback processes each section of the frame buffer.
 * @param frame - An object containing:
 *                - buffer: The FrameBuffer instance.
 *                - index: The starting index in the buffer.
 *                - frames: The number of frames in the section.
 * @param offset - The offset in the buffer from the start of processing.
 * @returns The number of frames processed.
 */
export type FrameCallback = (frame: { buffer: FrameBuffer, index: number, frames: number }, offset: number) => number

/**
 * Processes sections of a Float32Array buffer using a callback function.
 * This function is intended for internal use only.
 *
 * @param buffer - The FrameBuffer to process. This buffer is expected to be shared.
 * @param startIndex - The starting index in the buffer from where processing should begin.
 * @param availableFrames - The total number of frames available to process in the buffer.
 * @param frameCallback - The callback function to process each section of the buffer.
 *                          It should return the number of frames processed.
 * @returns An object containing:
 *          - frames: The number of frames successfully processed.
 *          - nextIndex: The index in the buffer for the next processing cycle.
 * @throws RangeError - If the frameCallback returns a processed length greater than the part length.
 */
export const enumFrames = (buffer: FrameBuffer, startIndex: number, availableFrames: number, frameCallback: FrameCallback):
{ frames: number, nextIndex: number } => {
  let totalFrames = 0
  while (totalFrames < availableFrames) {
    // Determine the length of the current section to process
    const sectionFrames = Math.min(buffer.length - startIndex, availableFrames - totalFrames)
    // Process the current section using the frameCallback function
    const processedFrames = frameCallback({ buffer, index: startIndex, frames: sectionFrames }, totalFrames)
    // Ensure the processed length does not exceed the section length
    if (processedFrames > sectionFrames) {
      throw new RangeError(`Processed frames (${processedFrames}) exceeds section frames (${sectionFrames})`)
    }
    totalFrames += processedFrames
    startIndex = (startIndex + processedFrames) % buffer.length
    if (processedFrames < sectionFrames) {
      break
    }
  }
  return { frames: totalFrames, nextIndex: startIndex }
}
