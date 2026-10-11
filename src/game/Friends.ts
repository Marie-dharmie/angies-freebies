import * as THREE from 'three'
import { content, type FriendDef } from '../content'

export type FriendEvent =
  | { type: 'spawned'; friend: FriendDef; color: number; position: THREE.Vector3 }
  | { type: 'collected'; friend: FriendDef; color: number; position: THREE.Vector3 }
  | { type: 'missed'; friend: FriendDef; color: number; position: THREE.Vector3 }

type FloatingFriend = {
  mesh: THREE.Group
  body: THREE.Mesh
  friend: FriendDef
  color: number
  bob: number
  resolved: boolean
  spawnScale: number
}

const PALETTE = [0xff7a6a, 0x2ec4b6, 0xffb087, 0x7de2d1, 0xf7efe3, 0xe8a598]

function nameSprite(name: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 96)
  ctx.fillStyle = 'rgba(7, 24, 32, 0.82)'
  ctx.beginPath()
  ctx.roundRect(12, 16, 488, 64, 20)
  ctx.fill()
  ctx.fillStyle = '#f7efe3'
  const size = name.length > 14 ? 26 : name.length > 10 ? 30 : 34
  ctx.font = `bold ${size}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 256, 50)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.6, 0.5, 1)
  sprite.position.y = 1.15
  return sprite
}

export class Friends {
  readonly group = new THREE.Group()
  private items: FloatingFriend[] = []
  private queue: FriendDef[] = []
  private collected = new Set<string>()
  private missed = new Set<string>()
  private spawnIndex = 0
  private spawnTimer = 1.2
  private lane = 0

  reset() {
    for (const item of this.items) this.group.remove(item.mesh)
    this.items = []
    this.queue = [...content.friends]
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]]
    }
    this.collected.clear()
    this.missed.clear()
    this.spawnIndex = 0
    this.spawnTimer = 1.5
    this.lane = 0
  }

  get collectedCount() {
    return this.collected.size
  }

  get totalCount() {
    return content.friends.length
  }

  /** Blow someone out of the haul (bomb penalty). Returns the name if any. */
  blastRandomCollected(): FriendDef | null {
    const ids = [...this.collected]
    if (ids.length === 0) return null
    const id = ids[Math.floor(Math.random() * ids.length)]
    this.collected.delete(id)
    this.missed.add(id)
    return content.friends.find((f) => f.id === id) ?? null
  }

  get spawnDone() {
    return this.spawnIndex >= this.queue.length && this.items.length === 0
  }

  getForgotten(): FriendDef[] {
    for (const item of this.items) {
      if (!item.resolved) {
        item.resolved = true
        this.missed.add(item.friend.id)
      }
    }
    for (let i = this.spawnIndex; i < this.queue.length; i++) {
      this.missed.add(this.queue[i].id)
    }
    return content.friends.filter((f) => !this.collected.has(f.id))
  }

  private spawn(friend: FriendDef, z: number) {
    const color = PALETTE[Math.abs(hash(friend.id)) % PALETTE.length]
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 24, 24),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.35,
        metalness: 0.2,
      }),
    )
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.06, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xf7efe3 }),
    )
    ring.rotation.x = Math.PI / 2

    const mesh = new THREE.Group()
    mesh.add(body, ring, nameSprite(friend.name))
    mesh.scale.setScalar(0.2)

    // Cycle through clear lanes — easy to reach OR dodge on purpose
    const lanesX = [-3.2, 0, 3.2, -2, 2]
    const lanesY = [0, 1.2, -1.2, 0.6, -0.6]
    const x = lanesX[this.lane % lanesX.length]
    const y = lanesY[this.lane % lanesY.length]
    this.lane++

    mesh.position.set(x, y, z)
    this.group.add(mesh)
    this.items.push({
      mesh,
      body,
      friend,
      color,
      bob: Math.random() * Math.PI,
      resolved: false,
      spawnScale: 0.2,
    })
  }

  update(dt: number, scrollSpeed: number, playerPos: THREE.Vector3): FriendEvent | null {
    // Only one friend in play at a time — clear choice
    this.spawnTimer -= dt
    let event: FriendEvent | null = null

    if (
      this.spawnTimer <= 0 &&
      this.spawnIndex < this.queue.length &&
      this.items.length === 0
    ) {
      const friend = this.queue[this.spawnIndex]
      this.spawn(friend, -32)
      this.spawnIndex++
      this.spawnTimer = content.friendGap
      const just = this.items[this.items.length - 1]
      event = {
        type: 'spawned',
        friend,
        color: just.color,
        position: just.mesh.position.clone(),
      }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      item.mesh.position.z += scrollSpeed * dt
      item.bob += dt * 2.2
      item.mesh.position.y += Math.sin(item.bob) * 0.008
      item.mesh.rotation.y += dt * 1.4
      item.spawnScale = THREE.MathUtils.lerp(item.spawnScale, 1, 1 - Math.exp(-dt * 6))
      const pulse = 1 + Math.sin(item.bob * 3) * 0.06
      item.mesh.scale.setScalar(item.spawnScale * pulse)
      const mat = item.body.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.35 + Math.sin(item.bob * 4) * 0.25

      // Generous pickup radius so grabbing is easy when she aims
      if (!item.resolved && item.mesh.position.distanceTo(playerPos) < 1.55) {
        item.resolved = true
        this.collected.add(item.friend.id)
        this.missed.delete(item.friend.id)
        event = {
          type: 'collected',
          friend: item.friend,
          color: item.color,
          position: item.mesh.position.clone(),
        }
        this.group.remove(item.mesh)
        this.items.splice(i, 1)
        this.spawnTimer = Math.max(this.spawnTimer, 1.2)
        continue
      }

      if (!item.resolved && item.mesh.position.z > 8) {
        item.resolved = true
        if (!this.collected.has(item.friend.id)) {
          this.missed.add(item.friend.id)
          event = {
            type: 'missed',
            friend: item.friend,
            color: item.color,
            position: item.mesh.position.clone(),
          }
        }
        this.group.remove(item.mesh)
        this.items.splice(i, 1)
        this.spawnTimer = Math.max(this.spawnTimer, 1.0)
      }
    }

    return event
  }
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
