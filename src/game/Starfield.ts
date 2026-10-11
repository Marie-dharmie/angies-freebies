import * as THREE from 'three'

export class Starfield {
  readonly group = new THREE.Group()
  /** @deprecated use group — kept for compatibility */
  get points() {
    return this.group
  }

  private near: THREE.Points
  private far: THREE.Points
  private twinkle = 0

  constructor() {
    this.near = this.makeLayer(1100, 0.07, 40, 24, 90, 0xf7efe3)
    this.far = this.makeLayer(500, 0.14, 55, 30, 120, 0x2ec4b6)
    this.group.add(this.near, this.far)
  }

  private makeLayer(
    count: number,
    size: number,
    spreadX: number,
    spreadY: number,
    depth: number,
    color: number,
  ) {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX
      positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY
      positions[i * 3 + 2] = -Math.random() * depth
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })
    return new THREE.Points(geo, mat)
  }

  update(dt: number, speed: number) {
    this.twinkle += dt
    this.scroll(this.near, dt, speed * 1.55, 90)
    this.scroll(this.far, dt, speed * 0.75, 120)
    const nearMat = this.near.material as THREE.PointsMaterial
    nearMat.opacity = 0.72 + Math.sin(this.twinkle * 3.2) * 0.22
  }

  private scroll(points: THREE.Points, dt: number, speed: number, reset: number) {
    const pos = points.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      let z = pos.getZ(i) + speed * dt
      if (z > 5) z = -reset
      pos.setZ(i, z)
    }
    pos.needsUpdate = true
  }
}
