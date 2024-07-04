import { BufferFillWorker } from '@ain1084/audio-worklet-stream'
import { FillerParameters, SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler'

new BufferFillWorker<FillerParameters>(SineWaveFrameBufferFiller)
