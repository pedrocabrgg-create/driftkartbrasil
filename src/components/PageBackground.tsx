'use client'

import { useEffect, useRef } from 'react'

const COLORS = [
  ...Array<string>(60).fill('#c6f135'),
  ...Array<string>(36).fill('#ffffff'),
  ...Array<string>(24).fill('#4ade80'),
]

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number; color: string; a: number
}

export function PageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = COLORS.map((color) => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  0.5 + Math.random() * 3,
      color,
      a: 0.15 + Math.random() * 0.5,
    }))

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // radial glow bottom-left
      const g1 = ctx.createRadialGradient(0, canvas.height, 0, 0, canvas.height, canvas.width * 0.65)
      g1.addColorStop(0, 'rgba(198,241,53,0.11)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // radial glow top-right
      const g2 = ctx.createRadialGradient(canvas.width, 0, 0, canvas.width, 0, canvas.width * 0.5)
      g2.addColorStop(0, 'rgba(74,222,128,0.08)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // glow central sutil para preencher a transição
      const g3 = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.4)
      g3.addColorStop(0, 'rgba(198,241,53,0.04)')
      g3.addColorStop(1, 'transparent')
      ctx.fillStyle = g3
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width)  p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle   = p.color
        ctx.globalAlpha = p.a
        ctx.fill()
        ctx.globalAlpha = 1
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      {/* Base sólida */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -3, background: '#0a0a0a', pointerEvents: 'none' }} />
      {/* Particle canvas — mesmos parâmetros do immersive */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none' }} />
    </>
  )
}
