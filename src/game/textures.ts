import * as THREE from 'three'

function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function placeholderFaceTexture(label = 'ANGIE'): THREE.CanvasTexture {
  return canvasTexture((ctx, size) => {
    const g = ctx.createLinearGradient(0, 0, size, size)
    g.addColorStop(0, '#ffb087')
    g.addColorStop(1, '#ff7a6a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#f7efe3'
    ctx.beginPath()
    ctx.arc(size * 0.5, size * 0.42, size * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#102428'
    ctx.beginPath()
    ctx.arc(size * 0.42, size * 0.4, size * 0.03, 0, Math.PI * 2)
    ctx.arc(size * 0.58, size * 0.4, size * 0.03, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#102428'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(size * 0.5, size * 0.48, size * 0.08, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
    ctx.font = `bold ${size * 0.12}px sans-serif`
    ctx.fillStyle = '#102428'
    ctx.textAlign = 'center'
    ctx.fillText(label, size * 0.5, size * 0.82)
  })
}

export function cakeTexture(flavor: 'coral' | 'teal' | 'cream'): THREE.CanvasTexture {
  const colors = {
    coral: ['#ff7a6a', '#ffb087'],
    teal: ['#2ec4b6', '#7de2d1'],
    cream: ['#f7efe3', '#e8d9c0'],
  }[flavor]
  return canvasTexture((ctx, size) => {
    ctx.fillStyle = colors[0]
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = colors[1]
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(((i * 37) % size), ((i * 53) % size), 18, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffffffaa'
    ctx.fillRect(0, size * 0.35, size, size * 0.12)
  })
}

export function starFieldTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, size) => {
    ctx.fillStyle = '#071820'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const r = Math.random() * 1.8 + 0.4
      ctx.fillStyle = `rgba(247,239,227,${0.4 + Math.random() * 0.6})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }, 512)
}

export function loadTextureOrFallback(
  url: string,
  fallback: () => THREE.Texture,
): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const tex = new THREE.Texture(img)
      tex.needsUpdate = true
      tex.colorSpace = THREE.SRGBColorSpace
      resolve(tex)
    }
    img.onerror = () => resolve(fallback())
    img.src = url
  })
}
