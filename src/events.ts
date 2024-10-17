import { STOP_EVENT_TYPE, UNDERRUN_EVENT_TYPE } from './constants'

/**
 * Represents a custom event indicating that the audio processing has stopped.
 * This event is dispatched when the audio processing stops.
 */
export class StopEvent extends Event {
  public static readonly type = STOP_EVENT_TYPE
  /**
   * Creates an instance of StopEvent.
   * @param stoppedAtFrame - The position in the audio stream where the stop occurred.
   */
  public constructor(readonly stoppedAtFrame: bigint) {
    super(StopEvent.type)
  }
}

/**
 * Represents a custom event indicating that an underrun occurred in the audio processing.
 * UnderrunEvent is triggered not at the moment the underrun occurs, but when the underrun is resolved
 * or just before the node stops.
 */
export class UnderrunEvent extends Event {
  public static readonly type = UNDERRUN_EVENT_TYPE
  /**
   * Creates an instance of UnderrunEvent.
   * @param frameCount - The number of frames that were not processed due to the underrun.
   */
  public constructor(readonly frameCount: number) {
    super(UnderrunEvent.type)
  }
}

/**
 * Extends the AudioWorkletNodeEventMap interface to include the custom events.
 * This allows the custom events to be used in the context of AudioWorkletNode.
 */
declare global {
  interface AudioWorkletNodeEventMap {
    [StopEvent.type]: StopEvent
    [UnderrunEvent.type]: UnderrunEvent
  }
}
