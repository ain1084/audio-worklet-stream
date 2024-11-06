import { StopEvent, StreamNodeFactory,
  type OutputStreamNode,
} from '@ain1084/audio-worklet-stream'
import worker from './worker?worker'
import type { FillerParameters } from './sine-wave-frame-buffer-filler'
import { SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler'
import { SineWaveGenerator } from './sine-wave-generator'

class Main {
  private factory: StreamNodeFactory | null = null
  private streamNode: OutputStreamNode | null = null
  private outputDiv: Element

  constructor() {
    this.outputDiv = document.getElementById('output')!

    this.addCommand('startManualButton', async () => {
      const frequencies = [440]
      const sampleRate = this.factory!.audioContext.sampleRate
      const generators = frequencies.map((frequency) => {
        return new SineWaveGenerator({ frequency, sampleRate })
      })
      const frameBufferSize = this.factory!.audioContext.sampleRate
      const [node, writer] = await this.factory!.createManualBufferNode({
        channelCount: frequencies.length, frameBufferSize })
      writer.write((segment) => {
        for (let i = 0; i < segment.frameCount; ++i) {
          generators.forEach((generator, channelIndex) => {
            segment.set(i, channelIndex, generator.nextValue() * 0.3)
          })
        }
        return segment.frameCount
      })
      return node
    })

    this.addCommand('startTimerButton', async () => {
      const frequencies = [440]
      return this.factory!.createTimedBufferNode(
        new SineWaveFrameBufferFiller(
          { sampleRate: this.factory!.audioContext.sampleRate, frequencies },
        ),
        { channelCount: frequencies.length },
      )
    })

    this.addCommand('startWorkerButton', async () => {
      const frequencies = [440, 431]
      return this.factory!.createWorkerBufferNode<FillerParameters>(
        worker,
        { channelCount: frequencies.length,
          fillerParams: { sampleRate: this.factory!.audioContext.sampleRate, frequencies },
        },
      )
    })

    const stopButton = document.getElementById('stopButton')!
    stopButton.addEventListener('click', async () => {
      await this.streamNode?.stop()
      this.streamNode = null
    })
  }

  private addCommand(id: string, commandProc: () => Promise<OutputStreamNode | null>) {
    document.getElementById(id)!.addEventListener('click', async () => {
      await this.streamNode?.stop()
      this.streamNode = null
      await this.prepareStreamFactory()
      if (!this.factory) {
        throw new Error('Invalid factory state')
      }
      this.streamNode = await commandProc()
      this.startStreamNode()
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
    this.streamNode.addEventListener(StopEvent.type, (ev) => {
      this.outputDiv.textContent = `Stopped (${ev.stoppedAtFrame} frames)`
      this.streamNode = null
    }, { once: true })
    this.streamNode.connect(this.streamNode.context.destination)
    this.streamNode.start()
    this.outputDiv.textContent = 'Started'
  }
}

export default new Main()
