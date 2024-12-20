import type { FillerFrameBufferContext } from '../../filler-frame-buffer-context'
import type { FrameBufferFiller } from '../../frame-buffer-filler'
import { FrameBufferWriter } from '@ain1084/audio-frame-buffer'
import { MessageToStrategy, MessageToWorker } from './message'

/**
 * Context class
 * Manages the buffer filling process within a web worker.
 */
class Context {
  private readonly _frameBufferWriter: FrameBufferWriter
  private readonly _isContinuePlayback: boolean
  private readonly _frameBufferFiller: FrameBufferFiller
  private readonly _fillInterval: number
  private _timerId: number = 0

  /**
   * Creates an instance ofContext.
   * @param context - The configuration for the filler frame buffer.
   * @param frameBufferFiller - The FrameBufferFiller instance.
   */
  constructor(context: FillerFrameBufferContext, frameBufferFiller: FrameBufferFiller) {
    this._frameBufferWriter = new FrameBufferWriter(context)
    this._frameBufferFiller = frameBufferFiller
    this._fillInterval = context.fillInterval
    this._isContinuePlayback = this.fillBuffer()
  }

  /**
   * Starts the buffer filling process.
   */
  public start() {
    if (!this._isContinuePlayback) {
      this.stopFrames()
      return
    }
    this._timerId = self.setInterval(() => {
      if (!this._frameBufferFiller.fill(this._frameBufferWriter)) {
        this.stopFrames()
        self.clearInterval(this._timerId)
        this._timerId = 0
      }
    }, this._fillInterval)
  }

  /**
   * Stops the buffer filling process.
   */
  public stopFrames() {
    const message: MessageToStrategy = {
      type: 'stop',
      stopFrames: this._frameBufferWriter.totalFrames,
    }
    self.postMessage(message)
  }

  /**
   * Stops the buffer filling process and clears the interval timer.
   */
  public stop() {
    if (this._timerId) {
      self.clearInterval(this._timerId)
      this._timerId = 0
    }
  }

  /**
   * Fill the buffer with audio frames.
   * @returns A boolean indicating whether to continue playback.
   */
  private fillBuffer(): boolean {
    return this._frameBufferFiller.fill(this._frameBufferWriter)
  }
}

/**
 * BufferFillWorker class
 * Manages the communication between the main thread and the worker.
 *
 * @template FillerParams - The parameters used by the FrameBufferFiller in the worker.
*/
export class BufferFillWorker<FillerParams> {
  private _context: Context | null = null
  private _frameBufferFillerGenerator: new (params: FillerParams) => FrameBufferFiller
  private _init?: () => Promise<void>

  /**
   * Creates an instance of BufferFillWorker.
   * @param generator - A constructor function to create an instance of the FrameBufferFiller class.
   * @param init - An optional initialization function.
   */
  constructor(generator: new (params: FillerParams) => FrameBufferFiller, init?: () => Promise<void>) {
    this._frameBufferFillerGenerator = generator
    this._init = init
    self.onmessage = this.handleMessage.bind(this)
  }

  /**
   * Handles incoming messages from the main thread.
   * @param event - The message event from the main thread.
   */
  private async handleMessage(event: MessageEvent<MessageToWorker<FillerParams>>): Promise<void> {
    switch (event.data.type) {
      case 'init':
        this.init(event.data.config, event.data.fillerParams)
        break
      case 'start':
        this.start()
        break
      case 'stop':
        this.stop()
        break
      default:
        throw new Error(`Unknown message type: ${event.data}`)
    }
  }

  /**
   * Initializes the worker context.
   * @param bufferContext - The configuration for the filler frame buffer.
   * @param params - The parameters for the FrameBufferFiller.
   */
  private async init(bufferContext: FillerFrameBufferContext, params: FillerParams) {
    if (this._context) {
      throw new Error('Error: Context is already created.')
    }
    await this._init?.()
    this._context = new Context(bufferContext, new this._frameBufferFillerGenerator(params))
    self.postMessage({ type: 'init-done' } as MessageToStrategy)
  }

  /**
   * Starts the buffer filling process.
   */
  private start(): void {
    if (!this._context) {
      throw new Error('Error: Context is not created.')
    }
    this._context.start()
  }

  /**
   * Stops the buffer filling process.
   */
  private stop(): void {
    if (!this._context) {
      throw new Error('Error: Context is not created.')
    }
    this._context.stop()
  }
}
