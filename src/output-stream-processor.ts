import { FrameBufferReader } from './frame-buffer/buffer-reader'
import { PROCESSOR_NAME } from './constants'
import type { MessageToAudioNode, MessageToProcessor } from './output-message'
import { FrameBuffer } from './frame-buffer/buffer'

/**
 * Options for the OutputStreamProcessor
 * @property sampleBuffer - The shared buffer for audio data frames.
 * @property samplesPerFrame - The number of samples per frame.
 * @property usedFramesInBuffer - The usage count of the frames in the buffer.
 * @property totalFrames - The current position in the buffer, in frames.
 */
export type OutputStreamProcessorOptions = Readonly<{
  sampleBuffer: Float32Array
  samplesPerFrame: number
  usedFramesInBuffer: Uint32Array
  totalFrames: BigUint64Array
}>

const createFrameBufferReader = (options: OutputStreamProcessorOptions) => {
  return new FrameBufferReader(
    new FrameBuffer(options.sampleBuffer, options.samplesPerFrame),
    options.usedFramesInBuffer, options.totalFrames,
  )
}

/**
 * OutputStreamProcessor class
 * This class extends AudioWorkletProcessor to process audio data.
 * It uses a FrameBufferReader instance to read from a shared buffer and manage the audio data.
 */
class OutputStreamProcessor extends AudioWorkletProcessor {
  private readonly _frameReader: FrameBufferReader
  private _shouldStop = false
  private _stopFrames: bigint | undefined
  private _underrunFrames = 0

  /**
   * Creates an instance of OutputStreamProcessor.
   * @param options - The options for the processor, including shared buffers.
   */
  constructor(options: AudioWorkletNodeOptions) {
    super()
    this._frameReader = createFrameBufferReader(options.processorOptions as OutputStreamProcessorOptions)
    this.port.onmessage = this.handleMessage.bind(this)
  }

  /**
   * Handles incoming messages from the audio node.
   * @param event - The message event from the audio node.
   */
  private handleMessage(event: MessageEvent<MessageToProcessor>): void {
    if (event.data.type !== 'stop') {
      throw new Error(`Unexpected message type: ${event.data.type}`)
    }
    const frames = event.data.frames
    if (frames <= 0) {
      this._shouldStop = true
    }
    else {
      this._stopFrames = frames
    }
  }

  /**
   * Updates the underrun frame count.
   * If underrunFrames is provided and not zero, it adds to the current underrun frame count.
   * If underrunFrames is 0, it indicates that the underrun state has been resolved,
   * and the total underrun frame count is sent to the main thread before being reset.
   * @param underrunFrames - The number of underrun frames to add (default is 0).
   */
  private updateUnderrun(underrunFrames: number = 0): void {
    if (underrunFrames !== 0) {
      this._underrunFrames += underrunFrames
      return
    }
    if (this._underrunFrames === 0) {
      return
    }
    this.port.postMessage({ type: 'underrun', frames: this._underrunFrames } as MessageToAudioNode)
    this._underrunFrames = 0
  }

  /**
   * Checks the stop condition.
   * @param totalFrames - The total number of frames processed so far.
   */
  private checkStopCondition(totalFrames: bigint) {
    if (this._stopFrames !== undefined && totalFrames >= this._stopFrames) {
      this._shouldStop = true
    }
  }

  /**
   * Processes the audio data.
   * @param _inputs - The input audio data.
   * @param outputs - The output audio data.
   * @returns A boolean indicating whether to continue processing.
   */
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0]
    const readFrames = this._frameReader.read((frame, offset) => {
      const frames = Math.min(frame.frames, output[0].length - offset)
      frame.buffer.convertToOutput(frame.index, frames, output, offset)
      return frames
    })
    const totalFrames = this._frameReader.totalFrames
    this.checkStopCondition(totalFrames)
    if (this._shouldStop) {
      this.updateUnderrun()
      this.port.postMessage({ type: 'stop', frames: totalFrames } as MessageToAudioNode)
      this.port.close()
      return false
    }
    const underrunFrames = output[0].length - readFrames
    // It seems process may be called before connect?
    if (totalFrames !== BigInt(0)) {
      this.updateUnderrun(underrunFrames)
    }
    return true
  }
}

registerProcessor(PROCESSOR_NAME, OutputStreamProcessor)
