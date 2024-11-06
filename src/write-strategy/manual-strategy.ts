import type { BufferWriteStrategy } from './strategy'
import { type FrameBufferContext, FrameBufferWriter } from '@ain1084/audio-frame-buffer'

/**
  * ManualBufferWriteStrategy class
  * Implements the BufferWriteStrategy interface for manually writing to the buffer.
  */
export class ManualBufferWriteStrategy implements BufferWriteStrategy {
  private readonly _writer: FrameBufferWriter

  /**
   * Creates an instance of ManualBufferWriteStrategy.
   * @param bufferContext - The configuration for the frame buffer.
   */
  constructor(bufferContext: FrameBufferContext) {
    this._writer = new FrameBufferWriter(bufferContext)
  }

  /**
   * Gets the FrameBufferWriter instance.
   * @returns The FrameBufferWriter instance.
   */
  public get writer(): FrameBufferWriter {
    return this._writer
  }

  /**
   * Initializes the strategy.
   * @param node - The OutputStreamNode instance.
   * @returns A promise that resolves to true when initialization is complete.
   */
  async onInit(/* node: OutputStreamNode */): Promise<boolean> {
    return true
  }

  /**
   * Starts the strategy.
   * @param node - The OutputStreamNode instance.
   * @returns A boolean indicating whether the strategy started successfully.
   */
  onStart(/* node: OutputStreamNode */): boolean {
    return true
  }

  /**
   * Stops the strategy.
   */
  onStopped(): void {}
}
