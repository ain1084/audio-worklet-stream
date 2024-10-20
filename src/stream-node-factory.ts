import processor from './output-stream-processor?worker&url'
import { ManualBufferWriteStrategy } from './write-strategy/manual'
import { createFillerFrameBufferConfig, createFrameBufferConfig } from './frame-buffer/buffer-config'
import type { OutputStreamNode } from './output-stream-node'
import { TimedBufferWriteStrategy } from './write-strategy/timed'
import type { FrameBufferFiller } from './frame-buffer/buffer-filler'
import { FrameBufferWriter } from './frame-buffer/buffer-writer'
import { WorkerBufferWriteStrategy } from './write-strategy/worker/strategy'

/**
 * Parameters for creating a manual buffer node.
 */
export type ManualBufferNodeParams = {
  /** The number of audio channels. */
  readonly channelCount: number
  /** The size of the frame buffer in frames. */
  readonly frameBufferSize: number
}

/**
 * Parameters for creating a timed buffer node.
 */
export type TimedBufferNodeParams = {
  /** The number of audio channels. */
  readonly channelCount: number
  /** Optional. The number of chunks in the frame buffer. */
  readonly frameBufferChunks?: number
  /** Optional. The interval in milliseconds for filling the buffer. */
  readonly fillInterval?: number
  /** Optional. The sample rate of the audio context. */
  readonly sampleRate?: number
}

/**
 * Parameters for creating a worker buffer node.
 *
 * @template FillerParams - The parameters used by the FrameBufferFiller in the worker.
*/
export type WorkerBufferNodeParams<FillerParams> = TimedBufferNodeParams & {
  /**
  * Parameters passed to the constructor when the Worker instantiates the FrameBufferFiller implementation class.
  * Note: The values passed as FillerParams must be serializable (e.g., primitives, arrays, objects).
  * Non-serializable values such as functions or DOM elements cannot be passed.
  */
  readonly fillerParams: FillerParams
}

/**
 * StreamNodeFactory class
 * Factory class to create instances of OutputStreamNode with specific BufferWriteStrategy.
 * This class provides methods to create different types of OutputStreamNodes,
 * such as those using manual, timed, or worker-based buffer writing strategies.
 */
export class StreamNodeFactory {
  private _audioContext: AudioContext
  private readonly _outputStreamNodeFactory: typeof OutputStreamNode

  /**
   * Constructor for StreamNodeFactory.
   * @param context - The AudioContext to use.
   * @param outputStreamNodeFactory - The factory for creating OutputStreamNode instances.
   */
  private constructor(context: AudioContext, outputStreamNodeFactory: typeof OutputStreamNode) {
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
      return new StreamNodeFactory(context, loadResults[1].OutputStreamNode)
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
    const config = createFrameBufferConfig({ ...params })
    const strategy = new ManualBufferWriteStrategy(config)
    return [await this._outputStreamNodeFactory.create(this.audioContext, config, strategy), strategy.writer]
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
    if (typeof frameFiller !== 'object' || frameFiller === null) {
      throw new Error('Invalid frameFiller: must be an object.')
    }
    StreamNodeFactory.validateTimedBufferNodeParams(params)
    const paramsWithSampleRate = StreamNodeFactory.applySampleRateToParams(params, this._audioContext.sampleRate)
    const config = createFillerFrameBufferConfig(paramsWithSampleRate)
    return this._outputStreamNodeFactory.create(this.audioContext, config,
      new TimedBufferWriteStrategy(config, frameFiller))
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
    const paramsWithSampleRate = StreamNodeFactory.applySampleRateToParams(params, this._audioContext.sampleRate)
    const config = createFillerFrameBufferConfig(paramsWithSampleRate)
    return this._outputStreamNodeFactory.create(this._audioContext, config,
      new WorkerBufferWriteStrategy<FillerParams>(config, worker, params.fillerParams))
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
   * Applies a default sample rate to the given parameters if the sampleRate is undefined.
   * This function creates a new TimedBufferNodeParams object with the specified sampleRate,
   * while keeping other properties unchanged.
   *
   * @param params - The original parameters for the TimedBufferNode.
   * @param defaultSampleRate - The default sample rate to use if params.sampleRate is undefined.
   * @returns A new TimedBufferNodeParams object with the sample rate applied.
   */
  private static applySampleRateToParams(params: TimedBufferNodeParams, defaultSampleRate: number): TimedBufferNodeParams {
    return {
      ...params,
      sampleRate: params.sampleRate ?? defaultSampleRate,
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
