import type { BufferWriteStrategy } from './strategy'
import type { FillerFrameBufferConfig } from '../frame-buffer/buffer-config'
import type { MessageToStrategy, MessageToWorker } from './worker/message'
import type { OutputStreamNode } from '../output-stream-node'

/**
 * Parameters for creating a PlayContext.
 * @property node - The OutputStreamNode instance.
 * @property config - The FillerFrameBufferConfig instance.
 * @property workerConstructor - The constructor for the Worker.
 * @property fillerParam - The parameters for the FrameBufferFiller.
 */
type PlayerContextParams<FillerParams> = Readonly<{
  node: OutputStreamNode
  config: FillerFrameBufferConfig
  workerConstructor: new () => Worker
  fillerParam: FillerParams
}>

/**
 * PlayContext class
 * Manages the buffer filling process within a web worker.
 */
class Context<FillerParams> {
  private readonly _node: OutputStreamNode
  private readonly _config: FillerFrameBufferConfig
  private readonly _fillerParam: FillerParams
  private readonly _worker: Worker

  /**
   * Creates an instance of PlayContext.
   * @param params - The parameters for the PlayContext.
   */
  private constructor(params: PlayerContextParams<FillerParams>) {
    this._node = params.node
    this._config = params.config
    this._worker = new params.workerConstructor()
    this._fillerParam = params.fillerParam
    this._worker.onmessage = this.handleWorkerMessage.bind(this)
  }

  /**
   * Creates and initializes an instance of PlayContext.
   * @param params - The parameters for the PlayContext.
   * @returns A promise that resolves to an instance of PlayContext.
   */
  public static async create<FillerParams>(params: PlayerContextParams<FillerParams>) {
    const instance = new Context(params)
    await instance.init()
    return instance
  }

  /**
   * Handles messages from the worker.
   * @param ev - The message event from the worker.
   */
  private handleWorkerMessage(ev: MessageEvent<MessageToStrategy>): void {
    if (ev.data.type === 'stop') {
      this._node.stop(ev.data.stopFrames)
    }
  }

  /**
   * Initializes the PlayContext by sending the 'init' message to the worker.
   * @returns A promise that resolves when initialization is complete.
   */
  private init() {
    return new Promise<void>((resolve) => {
      const message: MessageToWorker<FillerParams> = {
        type: 'init',
        config: this._config,
        fillerParams: this._fillerParam,
      }
      this._worker.postMessage(message)
      const listener = (ev: MessageEvent<MessageToStrategy>) => {
        if (ev.data.type === 'init-done') {
          this._worker.removeEventListener('message', listener)
          resolve()
        }
      }
      this._worker.addEventListener('message', listener)
    })
  }

  /**
   * Starts the buffer filling process by sending the 'start' message to the worker.
   */
  public start() {
    const message: MessageToWorker<FillerParams> = {
      type: 'start',
    }
    this._worker.postMessage(message)
  }

  /**
   * Stops the worker and terminates it.
   */
  public stopped() {
    this._worker.onmessage = null
    this._worker.terminate()
  }
}

/**
 * WorkerBufferWriteStrategy class
 * Implements the BufferWriteStrategy interface using a web worker to manage buffer filling.
 */
export class WorkerBufferWriteStrategy<FillerParam> implements BufferWriteStrategy {
  private readonly _createPlayContext: (node: OutputStreamNode) => Promise<Context<FillerParam>>
  private _context: Context<FillerParam> | null = null

  /**
   * Creates an instance of WorkerBufferWriteStrategy.
   * @param config - The configuration for the filler frame buffer.
   * @param workerConstructor - The constructor for the Worker.
   * @param fillerParam - The parameters for the FrameBufferFiller.
   */
  constructor(config: FillerFrameBufferConfig, workerConstructor: new () => Worker, fillerParam: FillerParam) {
    this._createPlayContext = (node: OutputStreamNode) => Context.create<FillerParam>({ node, config, workerConstructor, fillerParam })
  }

  /**
   * Initializes the strategy.
   * @param node - The OutputStreamNode instance.
   * @returns A promise that resolves to true when initialization is complete.
   */
  async onInit(node: OutputStreamNode): Promise<boolean> {
    this._context = await this._createPlayContext(node)
    return true
  }

  /**
   * Starts the strategy.
   * @param node - The OutputStreamNode instance.
   * @returns A boolean indicating whether the strategy started successfully.
   */
  onStart(/* node: OutputStreamNode */): boolean {
    if (!this._context) {
      throw new Error('Invalid state: context is null.')
    }
    this._context.start()
    return true
  }

  /**
   * Stops the strategy.
   */
  onStopped(): void {
    if (!this._context) {
      throw new Error('Invalid state: context is null.')
    }
    this._context.stopped()
  }
}
