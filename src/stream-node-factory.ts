import processor from './output-stream-processor?worker&url'
import { ManualBufferWriteStrategy } from './write-strategy/manual'
import { FrameBufferFactory } from './frame-buffer/buffer-factory'
import type { OutputStreamNode, OutputStreamNodeFactory } from './output-stream-node'
import { TimedBufferWriteStrategy } from './write-strategy/timed'
import type { FrameBufferFiller } from './frame-buffer/buffer-filler'
import { FrameBufferWriter } from './frame-buffer/buffer-writer'
import { WorkerBufferWriteStrategy } from './write-strategy/worker/strategy'

/**
 * Parameters for creating a manual buffer node.
 */
export type ManualBufferNodeParams = Readonly<{
  /** The number of audio channels. */
  channelCount: number
  /** The size of the frame buffer in frames. */
  frameBufferSize: number
}>

/**
 * Parameters for creating a timed buffer node.
 */
export type TimedBufferNodeParams = Readonly<{
  /** The number of audio channels. */
  channelCount: number
  /** Optional. The number of chunks in the frame buffer. */
  frameBufferChunks?: number
  /** Optional. The interval in milliseconds for filling the buffer. */
  fillInterval?: number
  /** Optional. The sample rate of the audio context. */
  sampleRate?: number
}>

/**
 * Parameters for creating a worker buffer node.
 */
export type WorkerBufferNodeParams<T> = TimedBufferNodeParams & Readonly<{
  /** Parameters specific to the filler used in the worker. */
  fillerParams: T
}>

/**
 * StreamNodeFactory class
 * Factory class to create instances of OutputStreamNode with specific BufferWriteStrategy.
 * This class provides methods to create different types of OutputStreamNodes,
 * such as those using manual, timed, or worker-based buffer writing strategies.
 */
export class StreamNodeFactory {
  private _audioContext: AudioContext
  private readonly _outputStreamNodeFactory: typeof OutputStreamNodeFactory

  /**
   * Constructor for StreamNodeFactory.
   * @param context - The AudioContext to use.
   * @param outputStreamNodeFactory - The factory for creating OutputStreamNode instances.
   */
  private constructor(context: AudioContext, outputStreamNodeFactory: typeof OutputStreamNodeFactory) {
    this._audioContext = context
    this._outputStreamNodeFactory = outputStreamNodeFactory
  }

  /**
   * Create an instance of StreamNodeFactory.
   * This method loads necessary modules and creates node creators.
   * @param context - The AudioContext to use.
   * @returns A promise that resolves to an instance of StreamNodeFactory.
   * @throws Error - If module loading fails.
   */
  public static async create(context: AudioContext): Promise<StreamNodeFactory> {
    try {
      const loadResults = await Promise.all([
        context.audioWorklet.addModule(processor),
        import('./output-stream-node'),
      ])
      return new StreamNodeFactory(context, loadResults[1].OutputStreamNodeFactory)
    }
    catch (error) {
      throw new Error('Failed to load modules: ' + error)
    }
  }

  /**
   * Creates an OutputStreamNode with manual buffer writing strategy.
   * @param params - The parameters for manual buffer node creation.
   * @returns A promise that resolves to an OutputStreamNode and FrameBufferWriter instance.
   */
  public async createManualBufferNode(params: ManualBufferNodeParams): Promise<[OutputStreamNode, FrameBufferWriter]> {
    if (params.channelCount <= 0 || !Number.isInteger(params.channelCount)) {
      throw new Error('Invalid channelCount: must be a positive integer.')
    }
    if (params.frameBufferSize <= 0 || !Number.isInteger(params.frameBufferSize)) {
      throw new Error('Invalid frameBufferSize: must be a positive integer.')
    }
    const bufferConfig = FrameBufferFactory.createFrameBufferConfig({ ...params })
    const strategy = new ManualBufferWriteStrategy(bufferConfig)
    return [await this._outputStreamNodeFactory.create(this.audioContext, bufferConfig, strategy), strategy.writer]
  }

  /**
   * Creates an OutputStreamNode with timed buffer writing strategy.
   * @param frameFiller - The FrameBufferFiller instance.
   * @param params - The parameters for timed buffer node creation.
   * @returns A promise that resolves to an OutputStreamNode instance.
   */
  public async createTimedBufferNode(
    frameFiller: FrameBufferFiller, params: TimedBufferNodeParams,
  ): Promise<OutputStreamNode> {
    StreamNodeFactory.validateTimedBufferNodeParams(params)
    if (typeof frameFiller !== 'object' || frameFiller === null) {
      throw new Error('Invalid frameFiller: must be an object.')
    }
    const config = FrameBufferFactory.createFillerFrameBufferConfig(this._audioContext.sampleRate, { ...params })
    const strategy = new TimedBufferWriteStrategy(config, frameFiller)
    return this._outputStreamNodeFactory.create(this.audioContext, config, strategy)
  }

  /**
   * Creates an OutputStreamNode with worker buffer writing strategy.
   * @param worker - The worker instance.
   * @param params - The parameters for worker buffer node creation.
   * @returns A promise that resolves to an OutputStreamNode instance.
   */
  public async createWorkerBufferNode<FillerParams>(
    worker: new () => Worker, params: WorkerBufferNodeParams<FillerParams>,
  ): Promise<OutputStreamNode> {
    StreamNodeFactory.validateTimedBufferNodeParams(params)
    const config = FrameBufferFactory.createFillerFrameBufferConfig(this._audioContext.sampleRate, { ...params })
    const strategy = new WorkerBufferWriteStrategy<FillerParams>(config, worker, params.fillerParams)
    return this._outputStreamNodeFactory.create(this._audioContext, config, strategy)
  }

  /**
   * Validates the parameters for timed buffer node creation.
   * @param params - The parameters to validate.
   * @throws Error - If validation fails.
   */
  private static validateTimedBufferNodeParams(params: TimedBufferNodeParams): void {
    // Check if 'channelCount' is a positive integer
    if (!Number.isInteger(params.channelCount) || params.channelCount <= 0) {
      throw new Error('Invalid channelCount: must be a positive integer.')
    }

    // Check if 'fillInterval' is a positive number if provided
    if (params.fillInterval !== undefined && (typeof params.fillInterval !== 'number' || params.fillInterval <= 0)) {
      throw new Error('Invalid fillInterval: must be a positive number.')
    }

    // Check if 'frameBufferChunks' is a positive integer if provided
    if (params.frameBufferChunks !== undefined && (!Number.isInteger(params.frameBufferChunks) || params.frameBufferChunks <= 0)) {
      throw new Error('Invalid frameBufferChunks: must be a positive integer.')
    }
  }

  /**
   * Get the AudioContext associated with this factory.
   * @returns The AudioContext instance.
   */
  public get audioContext(): BaseAudioContext {
    return this._audioContext
  }
}
