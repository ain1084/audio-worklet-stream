import type { FrameBufferWriter } from '@ain1084/audio-frame-buffer'

/**
 * FrameBufferFiller interface
 * This interface defines a method to fill audio frames into a buffer.
 */
export interface FrameBufferFiller {
  /**
   * Fill the buffer with audio frames using the provided writer.
   * @param writer - An instance of {@link https://ain1084.github.io/audio-frame-buffer/classes/FrameBufferWriter.html | FrameBufferWriter} used to write audio frames to the buffer.
   * @returns A boolean indicating whether to continue playback.
   */
  fill(writer: FrameBufferWriter): boolean
}
