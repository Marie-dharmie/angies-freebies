type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number }

export class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private muted = false
  private musicTimer: number | null = null
  private unlocked = false

  async unlock() {
    if (this.unlocked) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.35
    this.master.connect(this.ctx.destination)
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.unlocked = true
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.master) this.master.gain.value = muted ? 0 : 0.35
  }

  isMuted() {
    return this.muted
  }

  private beep(tones: Tone[]) {
    if (!this.ctx || !this.master || this.muted) return
    let t = this.ctx.currentTime
    for (const tone of tones) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = tone.type ?? 'square'
      osc.frequency.value = tone.freq
      gain.gain.setValueAtTime(tone.gain ?? 0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + tone.dur)
      osc.connect(gain)
      gain.connect(this.master)
      osc.start(t)
      osc.stop(t + tone.dur)
      t += tone.dur * 0.85
    }
  }

  whoosh() {
    this.beep([
      { freq: 220, dur: 0.08, type: 'sawtooth', gain: 0.04 },
      { freq: 440, dur: 0.1, type: 'triangle', gain: 0.05 },
    ])
  }

  collect() {
    this.beep([
      { freq: 523, dur: 0.07, type: 'triangle' },
      { freq: 784, dur: 0.1, type: 'triangle' },
    ])
  }

  bump() {
    this.beep([
      { freq: 120, dur: 0.08, type: 'square', gain: 0.06 },
      { freq: 90, dur: 0.12, type: 'sawtooth', gain: 0.05 },
    ])
  }

  fanfare() {
    this.beep([
      { freq: 392, dur: 0.12, type: 'triangle' },
      { freq: 523, dur: 0.12, type: 'triangle' },
      { freq: 659, dur: 0.12, type: 'triangle' },
      { freq: 784, dur: 0.22, type: 'triangle', gain: 0.1 },
    ])
  }

  startMusic() {
    if (!this.ctx || !this.master || this.musicTimer !== null) return
    const notes = [392, 440, 494, 523, 494, 440]
    let i = 0
    const tick = () => {
      if (!this.ctx || !this.master || this.muted) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = notes[i % notes.length]
      const t = this.ctx.currentTime
      gain.gain.setValueAtTime(0.03, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(this.master)
      osc.start(t)
      osc.stop(t + 0.2)
      i++
    }
    tick()
    this.musicTimer = window.setInterval(tick, 280)
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }
}
