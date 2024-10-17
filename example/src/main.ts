import { StopEvent, StreamNodeFactory,
  type OutputStreamNode,
} from '@ain1084/audio-worklet-stream'
import worker from './worker?worker'
import type { FillerParameters } from './sine-wave-frame-buffer-filler'
import { SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler'

class Main {
  private factory: StreamNodeFactory | null = null
  private streamNode: OutputStreamNode | null = null
  private outputDiv: Element

  constructor() {
    this.outputDiv = document.getElementById('output')!

    document.getElementById('startTimerButton')!.addEventListener('click', async () => {
      await this.streamNode?.stop()
      this.streamNode = null
      await this.prepareStreamFactory()
      if (!this.factory) {
        throw new Error('Invalid factory state')
      }
      const frequencies = [440]
      this.streamNode = await this.factory.createTimedBufferNode(
        new SineWaveFrameBufferFiller(
          { sampleRate: this.factory.audioContext.sampleRate, frequencies },
        ),
        { channelCount: frequencies.length },
      )
      this.startStreamNode()
    })

    document.getElementById('startWorkerButton')!.addEventListener('click', async () => {
      await this.streamNode?.stop()
      this.streamNode = null
      await this.prepareStreamFactory()
      if (!this.factory) {
        throw new Error('Invalid factory state')
      }
      const frequencies = [440, 431]
      this.streamNode = await this.factory.createWorkerBufferNode<FillerParameters>(
        worker,
        { channelCount: frequencies.length,
          fillerParams: { sampleRate: this.factory.audioContext.sampleRate, frequencies },
        },
      )
      this.startStreamNode()
    })

    const stopButton = document.getElementById('stopButton')!
    stopButton.addEventListener('click', async () => {
      await this.streamNode?.stop()
      this.streamNode = null
    })
  }

  private async prepareStreamFactory() {
    if (!this.factory) {
      this.factory = await StreamNodeFactory.create(new AudioContext())
    }
    return this.factory
  }

  private startStreamNode() {
    if (!this.streamNode) {
      throw new Error('Invalid streamNode state')
    }
    this.streamNode.addEventListener(StopEvent.type, () => {
      this.outputDiv.textContent = 'Stopped'
      this.streamNode = null
    }, { once: true })
    this.streamNode.connect(this.streamNode.context.destination)
    this.streamNode.start()
    this.outputDiv.textContent = 'Started'
  }
}

export default new Main()
