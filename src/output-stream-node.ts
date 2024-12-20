import type { MessageToProcessor, MessageToAudioNode } from './output-message'
import { PROCESSOR_NAME } from './constants'
import { StopEvent, UnderrunEvent } from './events'
import { BufferWriteStrategy } from './write-strategy/strategy'
import { FrameBufferContext } from '@ain1084/audio-frame-buffer'

/**
 * Stream state
 * Represents the different states of the stream.
 */
export type StreamState =
  // Initial state where playback can start
  | 'ready'
    // State where playback has started
  | 'started'
   // State where playback is stopping
  | 'stopping'
    // State where playback has stopped
  | 'stopped'

/**
 * OutputStreamNode class
 * This class extends AudioWorkletNode to handle audio processing.
 * It manages a buffer using a FrameBufferWriter instance and tracks the current frame position.
 */
export class OutputStreamNode extends AudioWorkletNode {
  private readonly _totalWriteFrames: BigUint64Array
  private readonly _totalReadFrames: BigUint64Array
  private readonly _strategy: BufferWriteStrategy
  private _state: StreamState = 'ready'

  /**
   * Creates an instance of OutputStreamNode.
   * @param baseAudioContext - The audio context to use.
   * @param bufferContext - The context for the audio frame buffer.
   * @param strategy - The strategy for writing to the buffer.
   */
  private constructor(
    baseAudioContext: BaseAudioContext,
    bufferContext: FrameBufferContext,
    strategy: BufferWriteStrategy,
  ) {
    super(baseAudioContext, PROCESSOR_NAME, {
      outputChannelCount: [bufferContext.samplesPerFrame],
      processorOptions: bufferContext,
    })
    this._strategy = strategy
    this._totalWriteFrames = bufferContext.totalWriteFrames
    this._totalReadFrames = bufferContext.totalReadFrames
    this.port.onmessage = this.handleMessage.bind(this)
  }

  /**
   * @internal
   * Creates an instance of OutputStreamNode.
   * @param audioContext - The audio context to use.
   * @param context - The context for the audio frame buffer.
   * @param strategy - The strategy for writing to the buffer.
   * @returns A promise that resolves to an instance of OutputStreamNode.
   */
  public static async create(audioContext: BaseAudioContext, context: FrameBufferContext, strategy: BufferWriteStrategy): Promise<OutputStreamNode> {
    const node = new OutputStreamNode(audioContext, context, strategy)
    if (!(await strategy.onInit(node))) {
      throw new Error('Failed to onInit.')
    }
    return node
  }

  /**
   * Start playback.
   * The node must be connected before starting playback using connect() method.
   * Output samples must be written to the buffer before starting.
   * Playback can only be started once. Once stopped, it cannot be restarted.
   * @returns A boolean indicating whether the playback started successfully.
   */
  public start(): boolean {
    if (this.numberOfOutputs === 0) {
      throw new Error('Cannot start playback. Node is not connected.')
    }
    switch (this._state) {
      case 'ready':
        this._state = 'started'
        if (!this._strategy.onStart(this)) {
          this.stop(this.totalWriteFrames)
        }
        return true
      case 'started':
        return false
      default:
        throw new Error(`Cannot start playback. Current state: ${this._state}`)
    }
  }

  /**
   * Stop the node processing at a given frame position.
   * Returns a Promise that resolves when the node has completely stopped.
   * The node is disconnected once stopping is complete.
   * @param framePosition - The frame position at which to stop the processing, in frames.
   *                   If framePosition is 0 or if the current playback frame position has already passed the specified value,
   *                   the node will stop immediately.
   * @returns A promise that resolves when the node has stopped.
   */
  public stop(framePosition: bigint = BigInt(0)): Promise<void> {
    switch (this._state) {
      case 'started':
        return new Promise((resolve) => {
          this._state = 'stopping'
          const message: MessageToProcessor = { type: 'stop', framePosition: framePosition }
          this.port.postMessage(message)
          this.addEventListener(StopEvent.type, () => {
            resolve()
          }, { once: true })
        })
      case 'ready':
        this.handleStopped()
        break
      case 'stopped':
        break
      case 'stopping':
        break
      default:
        throw new Error(`Cannot stop playback. Current state: ${this._state}`)
    }
    return Promise.resolve()
  }

  /**
   * Handles incoming messages from the audio processor.
   * @param event - The message event from the processor.
   */
  private handleMessage(event: MessageEvent<MessageToAudioNode>): void {
    switch (event.data.type) {
      case 'stop':
        this.handleStopped()
        this.dispatchEvent(new StopEvent(event.data.totalProcessedFrames))
        break
      case 'underrun':
        this.dispatchEvent(new UnderrunEvent(event.data.underrunFrameCount))
        break
      default:
        throw new Error(`Unexpected event value: ${event.data}`)
    }
  }

  /**
   * Handles the stopping of the node.
   * Disconnects the node and closes the port.
   */
  private handleStopped() {
    this._strategy.onStopped()
    this.disconnect()
    this.port.close()
    this.port.onmessage = null
    this._state = 'stopped'
  }

  /**
   * Checks if playback has started.
   * @returns A boolean indicating if playback has started.
   */
  public get isStart(): boolean {
    return this._state === 'started'
  }

  /**
   * Get the current frame position since the start of playback.
   * The position is in frames and increases by 1 for each frame.
   * It represents the total number of frames processed by the AudioWorkletProcessor.
   * - AudioWorkletProcessor has read this total number of frames from the buffer.
   *   It closely indicates the playback position in frames.
   * - totalReadFrames will never exceed the number of frames written to the buffer,
   *   ensuring it is always less than or equal to totalWriteFrames.
   * - The difference between totalWriteFrames and totalReadFrames represents the delay
   *   in samples before playback (excluding processing beyond the AudioNode).
   * @returns The current frame position as a bigint.
   */
  public get totalReadFrames(): bigint {
    return Atomics.load(this._totalReadFrames, 0)
  }

  /**
   * Get the total number of frames written to the buffer.
   * This reflects the total frames written by the BufferWriteStrategy.
   * Note: The method of writing to the buffer is implemented by the BufferWriteStrategy.
   * The OutputStreamNode itself does not modify this value.
   * @returns The total number of frames written as a bigint.
   */
  public get totalWriteFrames(): bigint {
    return Atomics.load(this._totalWriteFrames, 0)
  }
}
