export class Input {
  readonly axes = { x: 0, y: 0 }
  private keys = new Set<string>()
  private stickActive = false
  private tiltEnabled = false
  private tilt = { x: 0, y: 0 }
  private stickEl: HTMLElement | null
  private knobEl: HTMLElement | null

  constructor() {
    this.stickEl = document.getElementById('touch-stick')
    this.knobEl = document.getElementById('stick-knob')

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))

    this.bindStick()
    this.tryTilt()
  }

  showTouch(show: boolean) {
    if (!this.stickEl) return
    this.stickEl.classList.toggle('hidden', !show)
  }

  private bindStick() {
    if (!this.stickEl || !this.knobEl) return
    const base = this.stickEl.querySelector('.stick-base') as HTMLElement
    const max = 34

    const setFromPoint = (clientX: number, clientY: number) => {
      const rect = base.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = clientX - cx
      let dy = clientY - cy
      const len = Math.hypot(dx, dy) || 1
      const clamped = Math.min(len, max)
      dx = (dx / len) * clamped
      dy = (dy / len) * clamped
      this.knobEl!.style.transform = `translate(${dx}px, ${dy}px)`
      this.axes.x = dx / max
      this.axes.y = -dy / max
      this.stickActive = true
    }

    const end = () => {
      this.stickActive = false
      this.knobEl!.style.transform = 'translate(0, 0)'
      if (!this.keys.size) {
        this.axes.x = 0
        this.axes.y = 0
      }
    }

    const onPointer = (e: PointerEvent) => {
      e.preventDefault()
      base.setPointerCapture(e.pointerId)
      setFromPoint(e.clientX, e.clientY)
    }

    base.addEventListener('pointerdown', onPointer)
    base.addEventListener('pointermove', (e) => {
      if (!base.hasPointerCapture(e.pointerId)) return
      setFromPoint(e.clientX, e.clientY)
    })
    base.addEventListener('pointerup', end)
    base.addEventListener('pointercancel', end)
  }

  private tryTilt() {
    const touchy = window.matchMedia('(hover: none), (max-width: 720px)').matches
    if (!touchy) return

    const handler = (e: DeviceOrientationEvent) => {
      if (this.stickActive) return
      if (e.gamma == null || e.beta == null) return
      this.tilt.x = THREEClamp(e.gamma / 25, -1, 1)
      this.tilt.y = THREEClamp(-(e.beta - 45) / 25, -1, 1)
      this.tiltEnabled = true
    }
    window.addEventListener('deviceorientation', handler)
  }

  async requestTiltPermission() {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DOE.requestPermission === 'function') {
      try {
        await DOE.requestPermission()
      } catch {
        /* ignore */
      }
    }
  }

  update() {
    let x = 0
    let y = 0
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y += 1
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y -= 1

    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y) || 1
      this.axes.x = x / len
      this.axes.y = y / len
      return
    }

    if (this.stickActive) return

    if (this.tiltEnabled) {
      this.axes.x = this.tilt.x
      this.axes.y = this.tilt.y
      return
    }

    this.axes.x = 0
    this.axes.y = 0
  }
}

function THREEClamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
