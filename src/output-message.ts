/**
 * Messages sent from the processor to the main thread.
 *
 * @typeParam type - The type of message. Can be 'stop' or 'underrun'.
 *
 * For 'stop' messages:
 * @property totalProcessedFrames - The total frames processed when stopped.
 *
 * For 'underrun' messages:
 * @property underrunFrameCount - The number of frames that have been underrun.
 *
 * Example:
 * ```typescript
 * const message: MessageToAudioNode = { type: 'stop', totalProcessedFrames: 1000n };
 * // or
 * const message: MessageToAudioNode = { type: 'underrun', underrunFrameCount: 256 };
 * ```
 */
export type MessageToAudioNode =
  | { type: 'stop', totalProcessedFrames: bigint }
  | { type: 'underrun', underrunFrameCount: number }

/**
 * Messages sent from the main thread to the processor.
 *
 * @typeParam type - The type of message. Can be 'stop'.
 *
 * For 'stop' messages:
 * @property framePosition - The position in frames to stop at.
 *
 * Example:
 * ```typescript
 * const message: MessageToProcessor = { type: 'stop', framePosition: 1000n };
 * ```
 */
export type MessageToProcessor =
  | { type: 'stop', framePosition: bigint }
