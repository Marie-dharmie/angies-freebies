import * as THREE from 'three'
import { content } from '../content'
import { loadTextureOrFallback, placeholderFaceTexture } from './textures'

type Planet = {
  mesh: THREE.Mesh
  name: string
  announced: boolean
  radius: number
}

export class Planets {
  readonly group = new THREE.Group()
  private planets: Planet[] = []
  private birthday: THREE.Mesh | null = null
  private ready = false

  async init() {
    const spacing = -40
    for (let i = 0; i < content.planetPhotos.length; i++) {
      const info = content.planetPhotos[i]
      const tex = await loadTextureOrFallback(info.src, () =>
        placeholderFaceTexture(info.name.replace('Planet ', '').slice(0, 6).toUpperCase()),
      )
      const radius = 1.6 + i * 0.15
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }),
      )
      mesh.position.set(i % 2 === 0 ? -7.5 : 7.5, (i - 1) * 1.2, spacing * (i + 1) - 20)
      this.group.add(mesh)
      this.planets.push({ mesh, name: info.name, announced: false, radius })
    }

    const birthTex = await loadTextureOrFallback(content.helmetPhoto, () =>
      placeholderFaceTexture('BDAY'),
    )
    this.birthday = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 40, 40),
      new THREE.MeshStandardMaterial({
        map: birthTex,
        emissive: 0xff7a6a,
        emissiveIntensity: 0.15,
        roughness: 0.7,
      }),
    )
    // Far enough that all friends can appear before the finale
    this.birthday.position.set(0, 0, -560)
    this.group.add(this.birthday)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.12, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0x2ec4b6, roughness: 0.4 }),
    )
    ring.rotation.x = Math.PI / 2.6
    this.birthday.add(ring)
    this.ready = true
  }

  reset() {
    for (const p of this.planets) {
      p.announced = false
    }
    if (this.birthday) this.birthday.position.z = -560
    const spacing = -40
    this.planets.forEach((p, i) => {
      p.mesh.position.z = spacing * (i + 1) - 20
      p.announced = false
    })
  }

  get birthdayPlanet() {
    return this.birthday
  }

  update(
    dt: number,
    scrollSpeed: number,
    playerPos: THREE.Vector3,
  ): { label: string | null; birthdayReached: boolean } {
    if (!this.ready) return { label: null, birthdayReached: false }

    let label: string | null = null

    for (const p of this.planets) {
      p.mesh.position.z += scrollSpeed * dt
      p.mesh.rotation.y += dt * 0.25
      if (!p.announced && Math.abs(p.mesh.position.z - playerPos.z) < 4) {
        const lateral = Math.hypot(p.mesh.position.x - playerPos.x, p.mesh.position.y - playerPos.y)
        if (lateral < 10) {
          p.announced = true
          label = p.name
        }
      }
    }

    if (this.birthday) {
      this.birthday.position.z += scrollSpeed * dt * 0.85
      this.birthday.rotation.y += dt * 0.2
      if (this.birthday.position.z > -6) {
        return { label, birthdayReached: true }
      }
    }

    return { label, birthdayReached: false }
  }
}
