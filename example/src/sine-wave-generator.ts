/**
 * SineWaveGenerator class
 * This class generates sine wave values.
 */
export class SineWaveGenerator {
  private readonly _phaseIncrement: number
  private _phase: number = 0

  /**
     * Creates an instance of SineWaveGenerator.
     * @param frequency - The frequency of the sine wave
     * @param sampleRate - The sample rate of the audio context
     */
  constructor(params: { frequency: number, sampleRate: number }) {
    this._phaseIncrement = (2 * Math.PI * params.frequency) / params.sampleRate
  }

  /**
     * Generates the next value of the sine wave.
     * @returns The next sine wave value
     */
  public nextValue(): number {
    const value = Math.sin(this._phase)
    this._phase += this._phaseIncrement
    if (this._phase >= 2 * Math.PI) {
      this._phase -= 2 * Math.PI
    }
    return value
  }
}
