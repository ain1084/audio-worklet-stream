/**
 * Messages sent from the processor to the main thread.
 *
 * @typeParam type - The type of message. Can be 'stop' or 'underrun'.
 *
 * For 'stop' messages:
 * @property frames - The total frames processed when stopped.
 *
 * For 'underrun' messages:
 * @property frames - The number of frames that have been underrun.
 *
 * Example:
 * ```typescript
 * const message: MessageToAudioNode = { type: 'stop', frames: 1000n };
 * // or
 * const message: MessageToAudioNode = { type: 'underrun', frames: 256 };
 * ```
 */
export type MessageToAudioNode =
  | { type: 'stop', frames: bigint }
  | { type: 'underrun', frames: number }

/**
 * Messages sent from the main thread to the processor.
 *
 * @typeParam type - The type of message. Can be 'stop'.
 *
 * For 'stop' messages:
 * @property frames - The position in frames to stop at.
 *
 * Example:
 * ```typescript
 * const message: MessageToProcessor = { type: 'stop', frames: 1000n };
 * ```
 */
export type MessageToProcessor =
  | { type: 'stop', frames: bigint }
