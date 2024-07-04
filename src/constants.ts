// Constants file

const PREFIX = '@ain1084/audio-worklet-stream'

/**
 * The name of the output stream processor, used as the name of the AudioWorkletProcessor.
 */
export const PROCESSOR_NAME = `${PREFIX}/output-stream-processor`

/**
 * The event type for the stop event.
 */
export const STOP_EVENT_TYPE = `${PREFIX}/stop`

/**
 * The event type for the underrun event.
 */
export const UNDERRUN_EVENT_TYPE = `${PREFIX}/underrun`
