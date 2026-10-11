import * as THREE from 'three'
import { cakeTexture } from './textures'
import { content } from '../content'

export type AsteroidHit = { roast: string }

type Cake = {
  mesh: THREE.Mesh
  radius: number
  spin: THREE.Vector3
  hit: boolean
}

export class Obstacles {
  readonly group = new THREE.Group()
  private cakes: Cake[] = []
  private textures: THREE.CanvasTexture[]
  private spawnTimer = 0
  private roastIndex = 0

  constructor() {
    this.textures = [cakeTexture('coral'), cakeTexture('teal'), cakeTexture('cream')]
  }

  reset() {
    for (const c of this.cakes) this.group.remove(c.mesh)
    this.cakes = []
    this.spawnTimer = 0
    this.roastIndex = 0
  }

  private spawn(z: number) {
    const radius = 0.3 + Math.random() * 0.28
    const geo = new THREE.IcosahedronGeometry(radius, 0)
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures[Math.floor(Math.random() * this.textures.length)],
      roughness: 0.55,
      metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    // Keep cakes toward the edges so friend lanes stay clear
    const side = Math.random() > 0.5 ? 1 : -1
    mesh.position.set(
      side * (4.5 + Math.random() * 2.2),
      (Math.random() - 0.5) * 5,
      z,
    )
    this.group.add(mesh)
    this.cakes.push({
      mesh,
      radius,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ),
      hit: false,
    })
  }

  update(dt: number, scrollSpeed: number, playerPos: THREE.Vector3): AsteroidHit | null {
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(-40 - Math.random() * 8)
      this.spawnTimer = 3.2 + Math.random() * 1.8
    }

    let hit: AsteroidHit | null = null

    for (let i = this.cakes.length - 1; i >= 0; i--) {
      const cake = this.cakes[i]
      cake.mesh.position.z += scrollSpeed * dt
      cake.mesh.rotation.x += cake.spin.x * dt
      cake.mesh.rotation.y += cake.spin.y * dt

      if (cake.mesh.position.z > 8) {
        this.group.remove(cake.mesh)
        this.cakes.splice(i, 1)
        continue
      }

      if (!cake.hit) {
        const dist = cake.mesh.position.distanceTo(playerPos)
        if (dist < cake.radius + 0.65) {
          cake.hit = true
          const roast = content.roasts[this.roastIndex % content.roasts.length]
          this.roastIndex++
          hit = { roast }
          cake.mesh.scale.multiplyScalar(1.25)
        }
      }
    }

    return hit
  }
}
