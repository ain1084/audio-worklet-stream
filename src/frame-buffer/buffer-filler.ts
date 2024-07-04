import type { FrameBufferWriter } from './buffer-writer'

/**
 * FrameBufferFiller interface
 * This interface defines a method to fill audio frames into a buffer.
 */
export interface FrameBufferFiller {
  /**
   * Fill the buffer with audio frames using the provided writer.
   * @param writer - An instance of FrameBufferWriter used to write audio frames to the buffer.
   * @returns A boolean indicating whether to continue playback.
   */
  fill(writer: FrameBufferWriter): boolean
}
