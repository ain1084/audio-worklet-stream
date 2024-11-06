import { FrameBufferReader, type FrameBufferContext } from '@ain1084/audio-frame-buffer'
import { PROCESSOR_NAME } from './constants'
import type { MessageToAudioNode, MessageToProcessor } from './output-message'

/**
 * OutputStreamProcessor class
 * This class extends AudioWorkletProcessor to process audio data.
 * It uses a FrameBufferReader instance to read from a shared buffer and manage the audio data.
 */
class OutputStreamProcessor extends AudioWorkletProcessor {
  private readonly _frameReader: FrameBufferReader
  private _shouldStop = false
  private _stopFramePosition: bigint | undefined
  private _underrunFrameCount = 0

  /**
   * Creates an instance of OutputStreamProcessor.
   * @param options - The options for the processor, including shared buffers.
   */
  constructor(options: AudioWorkletNodeOptions) {
    super()
    this._frameReader = new FrameBufferReader(options.processorOptions as FrameBufferContext)
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
    const framePosition = event.data.framePosition
    if (framePosition <= 0) {
      this._shouldStop = true
    }
    else {
      this._stopFramePosition = framePosition
    }
  }

  /**
   * Updates the underrun frame count.
   * If underrunFrames is provided and not zero, it adds to the current underrun frame count.
   * If underrunFrames is 0, it indicates that the underrun state has been resolved,
   * and the total underrun frame count is sent to the main thread before being reset.
   * @param underrunFrameCount - The number of underrun frames to add (default is 0).
   */
  private updateUnderrun(underrunFrameCount: number = 0): void {
    if (underrunFrameCount !== 0) {
      this._underrunFrameCount += underrunFrameCount
      return
    }
    if (this._underrunFrameCount === 0) {
      return
    }
    this.port.postMessage({ type: 'underrun', underrunFrameCount: this._underrunFrameCount } as MessageToAudioNode)
    this._underrunFrameCount = 0
  }

  /**
   * Checks the stop condition.
   * @param totalFrames - The total number of frames processed so far.
   */
  private checkStopCondition(totalFrames: bigint) {
    if (this._stopFramePosition !== undefined && totalFrames >= this._stopFramePosition) {
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
    const samplesPerFrame = output.length
    const readFrames = this._frameReader.read((segment, offset) => {
      const bufferFrameCount = segment.frameCount
      const frameCount = Math.min(bufferFrameCount, output[0].length - offset)
      // Deinterleaves interleaved audio frame data and writes it to the output.
      output.forEach((outputChannel, channelIndex) => {
        for (let i = channelIndex, j = 0; j < frameCount; i += samplesPerFrame, ++j) {
          outputChannel[offset + j] = segment.samples[i]
        }
      })
      return frameCount
    })
    const totalFrames = this._frameReader.totalFrames
    this.checkStopCondition(totalFrames)
    if (this._shouldStop) {
      this.updateUnderrun()
      this.port.postMessage({ type: 'stop', totalProcessedFrames: totalFrames } as MessageToAudioNode)
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
