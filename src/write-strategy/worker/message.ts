import type { FillerFrameBufferContext } from '../../filler-frame-buffer-context'

/**
 * Message sent from the main thread to the worker.
 *
 * @typeParam FillerParams - The type of the parameters for the FrameBufferFiller.
 *
 * For 'init' messages:
 * @property context - The context for the filler frame buffer.
 * @property fillerParams - The parameters for the FrameBufferFiller.
 *
 * For 'start' messages:
 *
 * For 'stop' messages:
 *
 * Example:
 * ```typescript
 * const message: MessageToWorker<YourFillerParams> = {
 *   type: 'init',
 *   config: yourConfig,
 *   fillerParams: yourFillerParams,
 * };
 * ```
 */
export type MessageToWorker<FillerParams> =
  | { type: 'init', config: FillerFrameBufferContext, fillerParams: FillerParams }
  | { type: 'start' }
  | { type: 'stop' }

/**
 * Message sent from the worker to the main thread.
 *
 * For 'init-done' messages:
 *
 * For 'stop' messages:
 * @property stopFrames - The position in frames to stop at.
 *
 * Example:
 * ```typescript
 * const message: MessageToStrategy = {
 *   type: 'stop',
 *   stopFrames: 1000n,
 * };
 * ```
 */
export type MessageToStrategy =
  | { type: 'init-done' }
  | { type: 'stop', stopFrames: bigint }
