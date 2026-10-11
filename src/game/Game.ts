import * as THREE from 'three'
import { content } from '../content'
import { AudioBus } from '../audio/AudioBus'
import { Hud } from '../ui/hud'
import { Input } from './Input'
import { Player } from './Player'
import { Obstacles } from './Obstacles'
import { Friends } from './Friends'
import { Planets } from './Planets'
import { Starfield } from './Starfield'
import { FX } from './FX'
import { Tunnel } from './Tunnel'
import { Bombs } from './Bombs'

type Phase = 'intro' | 'title' | 'play' | 'finale'

export class Game {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private phase: Phase = 'intro'
  private elapsed = 0
  private scrollSpeed = 5
  private finaleZoom = 0
  private baseFov = 60
  private streak = 0
  private bgPulse = 0

  private input = new Input()
  private audio = new AudioBus()
  private player = new Player()
  private obstacles = new Obstacles()
  private friends = new Friends()
  private bombs = new Bombs()
  private planets = new Planets()
  private stars = new Starfield()
  private fx = new FX()
  private tunnel = new Tunnel()
  private hud: Hud
  private hemi: THREE.HemisphereLight

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.camera = new THREE.PerspectiveCamera(this.baseFov, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 0.6, 7)

    this.scene.fog = new THREE.FogExp2(0x071820, 0.016)
    this.scene.background = new THREE.Color(0x071820)

    this.hemi = new THREE.HemisphereLight(0xf7efe3, 0x0e3a42, 1.15)
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(4, 8, 6)
    const rim = new THREE.DirectionalLight(0x2ec4b6, 0.7)
    rim.position.set(-6, 2, -4)
    const warm = new THREE.PointLight(0xff7a6a, 0.55, 40)
    warm.position.set(0, 2, -6)
    this.scene.add(this.hemi, key, rim, warm)

    this.scene.add(this.stars.group)
    this.scene.add(this.tunnel.group)
    this.scene.add(this.player.group)
    this.scene.add(this.obstacles.group)
    this.scene.add(this.friends.group)
    this.scene.add(this.bombs.group)
    this.scene.add(this.planets.group)
    this.scene.add(this.fx.group)

    this.hud = new Hud(
      () => {
        this.phase = 'title'
      },
      () => void this.start(),
      () => this.replay(),
      () => {
        const next = !this.audio.isMuted()
        this.audio.setMuted(next)
        return next
      },
    )
    window.addEventListener('resize', () => this.onResize())
    void this.planets.init()
    this.tick()
  }

  private onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private async start() {
    await this.audio.unlock()
    await this.input.requestTiltPermission()
    this.audio.whoosh()
    this.audio.startMusic()
    this.resetRun()
    this.phase = 'play'
    this.hud.showPlaying()
    const touch = window.matchMedia('(hover: none), (max-width: 720px)').matches
    this.input.showTouch(touch)
  }

  private replay() {
    this.audio.stopMusic()
    this.phase = 'intro'
    this.input.showTouch(false)
    this.hud.showIntro()
    this.player.reset()
    this.camera.position.set(0, 0.6, 7)
    this.camera.lookAt(0, 0, 0)
  }

  private resetRun() {
    this.elapsed = 0
    this.scrollSpeed = content.scrollSpeed
    this.finaleZoom = 0
    this.streak = 0
    this.player.reset()
    this.obstacles.reset()
    this.friends.reset()
    this.bombs.reset()
    this.planets.reset()
    this.fx.reset()
    this.hud.setScore(0)
    this.hud.setStreak(0)
    this.hud.clearRoster()
    this.hud.setStatus(false, false)
    this.hud.hideIncoming()
    this.camera.position.set(0, 0.6, 7)
    this.camera.fov = this.baseFov
    this.camera.updateProjectionMatrix()
    this.camera.lookAt(0, 0, 0)
  }

  private enterFinale() {
    this.phase = 'finale'
    this.audio.stopMusic()
    this.audio.fanfare()
    this.input.showTouch(false)
    this.hud.hideIncoming()
    const forgotten = this.friends.getForgotten()
    this.hud.showFinale(this.friends.collectedCount, forgotten)
  }

  private lineFrom(list: readonly string[]) {
    return list[Math.floor(Math.random() * list.length)]
  }

  private tick = () => {
    requestAnimationFrame(this.tick)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.hud.update(dt)
    this.bgPulse += dt

    if (this.phase === 'intro' || this.phase === 'title') {
      this.stars.update(dt, 4)
      this.tunnel.update(dt, 3)
      this.player.group.rotation.set(0.15, this.player.group.rotation.y + dt * 0.55, 0)
      this.player.group.position.set(0, Math.sin(performance.now() * 0.002) * 0.25, 0)
      this.renderer.render(this.scene, this.camera)
      return
    }

    if (this.phase === 'finale') {
      this.finaleZoom += dt
      const birth = this.planets.birthdayPlanet
      if (birth) {
        this.camera.position.lerp(
          new THREE.Vector3(birth.position.x, birth.position.y + 1.2, birth.position.z + 8),
          1 - Math.exp(-dt * 2),
        )
        this.camera.lookAt(birth.position)
        birth.rotation.y += dt * 0.35
      }
      this.stars.update(dt, 2)
      this.fx.update(dt, 2)
      this.hud.setFlash(this.fx.getFlash())
      this.renderer.render(this.scene, this.camera)
      return
    }

    this.input.update()
    this.elapsed += dt
    this.scrollSpeed = content.scrollSpeed + this.elapsed * content.scrollAccel
    this.player.update(dt, this.input.axes.x, this.input.axes.y)
    this.stars.update(dt, this.scrollSpeed)
    this.tunnel.update(dt, this.scrollSpeed)
    this.fx.update(dt, this.scrollSpeed)

    // Living background hue shift
    const bg = this.scene.background as THREE.Color
    bg.setHSL(0.48 + Math.sin(this.bgPulse * 0.25) * 0.04, 0.55, 0.08 + Math.sin(this.bgPulse * 0.4) * 0.015)
    this.hemi.intensity = 1.05 + Math.sin(this.bgPulse * 2) * 0.12

    const hit = this.obstacles.update(dt, this.scrollSpeed, this.player.position)
    if (hit) {
      this.fx.softPunch()
      if (this.player.consumeShieldHit()) {
        this.hud.toast('shield saved you')
        this.audio.bump()
      } else {
        this.hud.toast(hit.roast)
        this.audio.bump()
      }
    }

    const bombHit = this.bombs.update(dt, this.scrollSpeed, this.player.position)
    if (bombHit) {
      this.fx.burst(bombHit.position, 0xff3b2f, 55)
      this.fx.punch(0.65)
      this.audio.bump()
      this.streak = 0
      this.hud.setStreak(0)
      if (this.player.consumeShieldHit()) {
        this.hud.toast('shield ate the bomb')
      } else {
        this.player.applyStun(0.85)
        const lost = this.friends.blastRandomCollected()
        if (lost) {
          this.hud.removeFromRoster(lost.name)
          this.hud.toast(`${this.lineFrom(content.bombLines)} ${lost.name} got blasted out`, 2200)
        } else {
          this.hud.toast(this.lineFrom(content.bombLines), 1800)
        }
        this.hud.showBigCallout('BOOM')
      }
    }

    const friendEvent = this.friends.update(dt, this.scrollSpeed, this.player.position)
    if (friendEvent?.type === 'spawned') {
      this.audio.whoosh()
      this.hud.showIncoming(friendEvent.friend.name)
    } else if (friendEvent?.type === 'collected') {
      this.streak++
      this.audio.collect()
      this.fx.burst(friendEvent.position, friendEvent.color, 40)
      this.fx.punch(0.4)
      this.hud.hideIncoming()
      this.hud.addToRoster(friendEvent.friend.name)
      this.hud.toast(`${friendEvent.friend.name}: ${this.lineFrom(content.pickupLines)}`, 1600)
      this.hud.showBigCallout(friendEvent.friend.name)
      this.hud.setStreak(this.streak)
    } else if (friendEvent?.type === 'missed') {
      this.streak = 0
      this.fx.softPunch()
      this.hud.hideIncoming()
      this.hud.toast(`${this.lineFrom(content.skipLines)} (${friendEvent.friend.name})`, 2000)
      this.hud.setStreak(0)
    }

    const planetInfo = this.planets.update(dt, this.scrollSpeed, this.player.position)
    if (planetInfo.label) {
      this.hud.showPlanet(planetInfo.label)
      this.audio.whoosh()
    }

    this.hud.setScore(this.friends.collectedCount)
    this.hud.setStatus(this.player.hasShield, this.player.isBoosted)
    this.hud.setFlash(this.fx.getFlash())

    const camX = this.player.position.x * 0.22
    const camY = 0.6 + this.player.position.y * 0.18
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, 0.1)
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camY, 0.1)
    this.camera.lookAt(this.player.position.x * 0.2, this.player.position.y * 0.12, -4)
    this.fx.applyCamera(this.camera, this.baseFov, dt)

    if (this.friends.spawnDone || planetInfo.birthdayReached || this.elapsed >= content.runDuration) {
      this.enterFinale()
    }

    this.renderer.render(this.scene, this.camera)
  }
}
