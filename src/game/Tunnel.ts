import * as THREE from 'three'

/** Moving neon rings that sell the “flying through space” feeling */
export class Tunnel {
  readonly group = new THREE.Group()
  private rings: THREE.Mesh[] = []

  constructor() {
    for (let i = 0; i < 10; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(9 + (i % 3) * 0.4, 0.06, 8, 48),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x2ec4b6 : 0xff7a6a,
          transparent: true,
          opacity: 0.22,
        }),
      )
      ring.position.z = -i * 12
      ring.rotation.x = Math.PI / 2
      this.group.add(ring)
      this.rings.push(ring)
    }
  }

  update(dt: number, scrollSpeed: number) {
    for (const ring of this.rings) {
      ring.position.z += scrollSpeed * dt
      ring.rotation.z += dt * 0.15
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + (Math.sin(performance.now() * 0.002 + ring.position.z) + 1) * 0.08
      if (ring.position.z > 12) ring.position.z -= 120
    }
  }
}
