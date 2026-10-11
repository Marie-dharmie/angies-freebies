import * as THREE from 'three'

type Burst = {
  points: THREE.Points
  velocities: Float32Array
  life: number
  maxLife: number
}

type Streak = {
  mesh: THREE.Mesh
  life: number
}

export class FX {
  readonly group = new THREE.Group()
  private bursts: Burst[] = []
  private streaks: Streak[] = []
  private shake = 0
  private fovPunch = 0
  private flash = 0

  burst(pos: THREE.Vector3, color: number, count = 28) {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
      const dir = new THREE.Vector3().randomDirection()
      const speed = 2 + Math.random() * 6
      velocities[i * 3] = dir.x * speed
      velocities[i * 3 + 1] = dir.y * speed
      velocities[i * 3 + 2] = dir.z * speed
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.16,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    })
    const points = new THREE.Points(geo, mat)
    this.group.add(points)
    this.bursts.push({ points, velocities, life: 0.7, maxLife: 0.7 })
  }

  speedStreak(x: number, y: number) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 1.8 + Math.random() * 2),
      new THREE.MeshBasicMaterial({
        color: 0xf7efe3,
        transparent: true,
        opacity: 0.35,
      }),
    )
    mesh.position.set(x, y, -8 - Math.random() * 20)
    this.group.add(mesh)
    this.streaks.push({ mesh, life: 0.8 + Math.random() * 0.6 })
  }

  punch(amount = 0.35) {
    this.shake = Math.max(this.shake, amount)
    this.fovPunch = Math.max(this.fovPunch, 8)
    this.flash = Math.max(this.flash, 0.55)
  }

  softPunch() {
    this.shake = Math.max(this.shake, 0.12)
    this.flash = Math.max(this.flash, 0.2)
  }

  getFlash() {
    return this.flash
  }

  applyCamera(camera: THREE.PerspectiveCamera, baseFov: number, dt: number) {
    if (this.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * this.shake
      camera.position.y += (Math.random() - 0.5) * this.shake
      this.shake = Math.max(0, this.shake - dt * 1.8)
    }
    if (this.fovPunch > 0) {
      camera.fov = baseFov + this.fovPunch
      camera.updateProjectionMatrix()
      this.fovPunch = Math.max(0, this.fovPunch - dt * 28)
    } else if (camera.fov !== baseFov) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, baseFov, 1 - Math.exp(-dt * 10))
      camera.updateProjectionMatrix()
    }
    this.flash = Math.max(0, this.flash - dt * 1.6)
  }

  update(dt: number, scrollSpeed: number) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]
      b.life -= dt
      const pos = b.points.geometry.attributes.position as THREE.BufferAttribute
      for (let p = 0; p < pos.count; p++) {
        pos.setX(p, pos.getX(p) + b.velocities[p * 3] * dt)
        pos.setY(p, pos.getY(p) + b.velocities[p * 3 + 1] * dt)
        pos.setZ(p, pos.getZ(p) + b.velocities[p * 3 + 2] * dt)
        b.velocities[p * 3 + 1] -= 2 * dt
      }
      pos.needsUpdate = true
      const mat = b.points.material as THREE.PointsMaterial
      mat.opacity = Math.max(0, b.life / b.maxLife)
      if (b.life <= 0) {
        this.group.remove(b.points)
        b.points.geometry.dispose()
        mat.dispose()
        this.bursts.splice(i, 1)
      }
    }

    if (Math.random() < dt * scrollSpeed * 0.35) {
      this.speedStreak((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8)
    }

    for (let i = this.streaks.length - 1; i >= 0; i--) {
      const s = this.streaks[i]
      s.life -= dt
      s.mesh.position.z += scrollSpeed * dt * 1.8
      const mat = s.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, s.life * 0.4)
      if (s.life <= 0 || s.mesh.position.z > 10) {
        this.group.remove(s.mesh)
        s.mesh.geometry.dispose()
        mat.dispose()
        this.streaks.splice(i, 1)
      }
    }
  }

  reset() {
    for (const b of this.bursts) {
      this.group.remove(b.points)
      b.points.geometry.dispose()
      ;(b.points.material as THREE.Material).dispose()
    }
    for (const s of this.streaks) {
      this.group.remove(s.mesh)
      s.mesh.geometry.dispose()
      ;(s.mesh.material as THREE.Material).dispose()
    }
    this.bursts = []
    this.streaks = []
    this.shake = 0
    this.fovPunch = 0
    this.flash = 0
  }
}
