import * as THREE from 'three'

type Bomb = {
  mesh: THREE.Group
  bob: number
  hit: boolean
}

function bombLabel(): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(40, 8, 8, 0.85)'
  ctx.beginPath()
  ctx.roundRect(16, 10, 224, 44, 14)
  ctx.fill()
  ctx.fillStyle = '#ff7a6a'
  ctx.font = 'bold 30px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BOMB', 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  sprite.scale.set(1.6, 0.4, 1)
  sprite.position.y = 1.0
  return sprite
}

export class Bombs {
  readonly group = new THREE.Group()
  private items: Bomb[] = []
  private spawnTimer = 2.2

  reset() {
    for (const b of this.items) this.group.remove(b.mesh)
    this.items = []
    this.spawnTimer = 2.0
  }

  private spawn(z: number) {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 18, 18),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.55,
        emissive: 0xff3b2f,
        emissiveIntensity: 0.35,
      }),
    )
    const fuse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xf7efe3 }),
    )
    fuse.position.y = 0.65
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb087 }),
    )
    spark.position.y = 0.88

    const mesh = new THREE.Group()
    mesh.add(body, fuse, spark, bombLabel())

    // Mix center and side lanes so she has to react
    const lanesX = [-3.4, -1.5, 0, 1.5, 3.4]
    const lanesY = [-1.0, 0, 1.1]
    mesh.position.set(
      lanesX[Math.floor(Math.random() * lanesX.length)],
      lanesY[Math.floor(Math.random() * lanesY.length)],
      z,
    )
    this.group.add(mesh)
    this.items.push({ mesh, bob: Math.random() * Math.PI, hit: false })
  }

  update(
    dt: number,
    scrollSpeed: number,
    playerPos: THREE.Vector3,
  ): { hit: true; position: THREE.Vector3 } | null {
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(-30 - Math.random() * 6)
      // Sometimes a second bomb right after for spice
      if (Math.random() > 0.65) this.spawn(-34 - Math.random() * 4)
      this.spawnTimer = 1.6 + Math.random() * 1.4
    }

    let result: { hit: true; position: THREE.Vector3 } | null = null

    for (let i = this.items.length - 1; i >= 0; i--) {
      const bomb = this.items[i]
      bomb.mesh.position.z += scrollSpeed * dt * 1.15
      bomb.bob += dt * 5
      bomb.mesh.rotation.y += dt * 2
      bomb.mesh.position.y += Math.sin(bomb.bob) * 0.01
      const pulse = 1 + Math.sin(bomb.bob * 4) * 0.08
      bomb.mesh.scale.setScalar(pulse)

      if (!bomb.hit && bomb.mesh.position.distanceTo(playerPos) < 1.25) {
        bomb.hit = true
        result = { hit: true, position: bomb.mesh.position.clone() }
        this.group.remove(bomb.mesh)
        this.items.splice(i, 1)
        continue
      }

      if (bomb.mesh.position.z > 9) {
        this.group.remove(bomb.mesh)
        this.items.splice(i, 1)
      }
    }

    return result
  }
}
