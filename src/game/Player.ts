import * as THREE from 'three'
import { loadTextureOrFallback, placeholderFaceTexture } from './textures'
import { content } from '../content'

export class Player {
  readonly group = new THREE.Group()
  private body: THREE.Mesh
  private helmet: THREE.Mesh
  private thruster: THREE.Mesh
  private trail: THREE.Points
  private trailPos: Float32Array
  private bob = 0
  private speedBoost = 0
  private shieldTime = 0
  private stunTime = 0
  private shieldRing: THREE.Mesh
  bounds = { x: 6.5, y: 3.8 }

  constructor() {
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xf7efe3,
      roughness: 0.45,
      metalness: 0.15,
    })
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x2ec4b6,
      roughness: 0.4,
      metalness: 0.2,
    })

    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 6, 12), suitMat)
    this.body.position.y = -0.15
    this.group.add(this.body)

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.25), accentMat)
    pack.position.set(0, -0.1, -0.45)
    this.group.add(pack)

    this.helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xd9e8e6,
        roughness: 0.2,
        metalness: 0.35,
        transparent: true,
        opacity: 0.55,
      }),
    )
    this.helmet.position.y = 0.72
    this.group.add(this.helmet)

    const visor = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 28),
      new THREE.MeshStandardMaterial({ color: 0x0e3a42, roughness: 0.2, metalness: 0.5 }),
    )
    visor.position.set(0, 0.72, 0.36)
    this.group.add(visor)

    this.thruster = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.45, 10),
      new THREE.MeshBasicMaterial({ color: 0xff7a6a }),
    )
    this.thruster.rotation.x = Math.PI
    this.thruster.position.set(0, -0.85, -0.35)
    this.group.add(this.thruster)

    this.shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x2ec4b6, transparent: true, opacity: 0.75 }),
    )
    this.shieldRing.visible = false
    this.group.add(this.shieldRing)

    this.trailPos = new Float32Array(48 * 3)
    const trailGeo = new THREE.BufferGeometry()
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3))
    this.trail = new THREE.Points(
      trailGeo,
      new THREE.PointsMaterial({
        color: 0xff7a6a,
        size: 0.12,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    )
    this.group.add(this.trail)

    this.group.position.set(0, 0, 0)
    void this.loadFace()
  }

  private async loadFace() {
    const tex = await loadTextureOrFallback(content.helmetPhoto, () => placeholderFaceTexture())
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 28),
      new THREE.MeshBasicMaterial({ map: tex }),
    )
    face.position.set(0, 0.72, 0.38)
    this.group.add(face)
  }

  get position() {
    return this.group.position
  }

  get hasShield() {
    return this.shieldTime > 0
  }

  get isBoosted() {
    return this.speedBoost > 0
  }

  applySpeed(duration = 3) {
    this.speedBoost = Math.max(this.speedBoost, duration)
  }

  applyShield(duration = 4) {
    this.shieldTime = Math.max(this.shieldTime, duration)
  }

  consumeShieldHit() {
    if (this.shieldTime <= 0) return false
    this.shieldTime = 0
    return true
  }

  applyStun(duration = 0.7) {
    this.stunTime = Math.max(this.stunTime, duration)
  }

  reset() {
    this.group.position.set(0, 0, 0)
    this.group.rotation.set(0, 0, 0)
    this.body.position.y = -0.15
    this.speedBoost = 0
    this.shieldTime = 0
    this.stunTime = 0
    this.bob = 0
    this.shieldRing.visible = false
  }

  update(dt: number, inputX: number, inputY: number) {
    this.speedBoost = Math.max(0, this.speedBoost - dt)
    this.shieldTime = Math.max(0, this.shieldTime - dt)
    this.stunTime = Math.max(0, this.stunTime - dt)
    this.shieldRing.visible = this.shieldTime > 0
    if (this.shieldRing.visible) this.shieldRing.rotation.z += dt * 2.5

    const control = this.stunTime > 0 ? 0.2 : 1
    // Fast steering vs slow world scroll = easy to chase or dodge friends
    const speed = (11 + (this.speedBoost > 0 ? 3 : 0)) * control
    inputX *= control
    inputY *= control
    this.group.position.x = THREE.MathUtils.clamp(
      this.group.position.x + inputX * speed * dt,
      -this.bounds.x,
      this.bounds.x,
    )
    this.group.position.y = THREE.MathUtils.clamp(
      this.group.position.y + inputY * speed * dt,
      -this.bounds.y,
      this.bounds.y,
    )

    this.bob += dt * (8 + (this.speedBoost > 0 ? 4 : 0))
    this.group.rotation.z = -inputX * 0.35
    this.group.rotation.x = inputY * 0.2
    this.body.position.y = -0.15 + Math.sin(this.bob) * 0.06
    this.thruster.scale.y = 0.85 + Math.sin(this.bob * 2) * 0.25 + (this.speedBoost > 0 ? 0.35 : 0)
    this.thruster.material = this.thruster.material as THREE.MeshBasicMaterial
    ;(this.thruster.material as THREE.MeshBasicMaterial).color.setHex(
      this.speedBoost > 0 ? 0x7de2d1 : 0xff7a6a,
    )

    // Local-space thruster sparkle trail
    for (let i = this.trailPos.length / 3 - 1; i > 0; i--) {
      this.trailPos[i * 3] = this.trailPos[(i - 1) * 3] * 0.92
      this.trailPos[i * 3 + 1] = this.trailPos[(i - 1) * 3 + 1] * 0.92 - 0.02
      this.trailPos[i * 3 + 2] = this.trailPos[(i - 1) * 3 + 2] - 0.08
    }
    this.trailPos[0] = (Math.random() - 0.5) * 0.15
    this.trailPos[1] = -0.9 + (Math.random() - 0.5) * 0.1
    this.trailPos[2] = -0.45
    ;(this.trail.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    ;(this.trail.material as THREE.PointsMaterial).color.setHex(
      this.speedBoost > 0 ? 0x7de2d1 : 0xff7a6a,
    )
  }
}
