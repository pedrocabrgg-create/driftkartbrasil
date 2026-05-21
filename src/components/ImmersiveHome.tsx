'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import styles from './ImmersiveHome.module.css'

const KartViewer3D = dynamic(
  () => import('./KartViewer3D').then((m) => m.KartViewer3D),
  { ssr: false }
)

// ─── constants ───────────────────────────────────────────────────────────────
const BRAND = '#c6f135'
// Each group has 3 phases: enter → dwell → exit. Groups are back-to-back with zero overlap.
const CARD_OFFSET  = 380   // px before first group starts
const ENTER_RANGE  = 200   // enter animation duration
const DWELL        = 350   // fully-visible window
const EXIT_RANGE   = 200   // exit animation duration
const GROUP_SCROLL = ENTER_RANGE + DWELL + EXIT_RANGE  // 750 px — one full group cycle

const PARTICLE_COLORS = [
  ...Array<string>(60).fill(BRAND),
  ...Array<string>(36).fill('#ffffff'),
  ...Array<string>(24).fill('#4ade80'),
]

const SIDEBAR_LINKS = [
  { href: '/sessoes', label: 'SESSÕES' },
  { href: '/eventos', label: 'EVENTOS CORPORATIVOS' },
  { href: '/eventos', label: 'ANIVERSÁRIOS' },
  { href: '/agendar', label: 'RESERVAR HORÁRIO' },
]

interface CardData {
  id: number
  title: string
  sub: string
  price: string
  duration: string
  desc: string
  cta: string
  highlight?: boolean
  side: 'left' | 'right'
  type: 'video' | 'image'
  src: string
  fallback?: string
  objectPosition?: string
  href: string
}

const CARDS: CardData[] = [
  {
    id: 0,
    title: 'SESSÃO RÁPIDA',
    sub: 'PARA INICIANTES',
    price: 'R$ 80',
    duration: '25 MIN',
    desc: 'Briefing + capacete + instrução inclusos. Ideal para a primeira vez na pista.',
    cta: 'RESERVAR AGORA',
    side: 'right',
    type: 'video',
    src: '/videos/hero.mp4',
    fallback: '/images/kart-02.jpg',
    objectPosition: 'center center',
    href: '/agendar',
  },
  {
    id: 1,
    title: 'SESSÃO COMPLETA',
    sub: 'MAIS ESCOLHIDA',
    price: 'R$ 120',
    duration: '40 MIN',
    desc: 'Mais tempo para evoluir a técnica e disputar com amigos. A favorita da galera.',
    cta: 'RESERVAR AGORA',
    highlight: true,
    side: 'left',
    type: 'video',
    src: '/videos/hero2.mp4',
    fallback: '/images/piloto-capacete.png',
    objectPosition: 'center 30%',
    href: '/agendar',
  },
  {
    id: 2,
    title: 'PISTA EXCLUSIVA',
    sub: 'GRUPOS',
    price: 'R$ 250',
    duration: '60 MIN',
    desc: 'Pista reservada só para o seu grupo. Até 10 pessoas. Perfeito para aniversários.',
    cta: 'RESERVAR GRUPO',
    side: 'right',
    type: 'image',
    src: '/images/evento-grupo.jpg',
    href: '/agendar',
  },
  {
    id: 3,
    title: 'ANIVERSÁRIO',
    sub: 'EVENTOS ESPECIAIS',
    price: 'CONSULTAR',
    duration: 'PERSONALIZADO',
    desc: 'Comemore na pista com pista exclusiva, decoração e muito drift. Inesquecível.',
    cta: 'FAZER ORÇAMENTO',
    side: 'left',
    type: 'image',
    src: '/images/pista-track.jpg',
    href: '/eventos',
  },
  {
    id: 4,
    title: 'EVENTO CORPORATIVO',
    sub: 'EMPRESAS',
    price: 'CONSULTAR',
    duration: 'PERSONALIZADO',
    desc: 'Team building com adrenalina. Integração garantida dentro e fora da pista.',
    cta: 'FAZER ORÇAMENTO',
    side: 'right',
    type: 'image',
    src: '/images/funcionarios.jpg',
    href: '/eventos',
  },
]

// Cards grouped in pairs: 0+1 together, 2+3 together, 4 solo (special)
// pairId drives scroll timing so paired cards animate simultaneously
function getCardPairId(cardId: number): number {
  if (cardId <= 1) return 0
  if (cardId <= 3) return 1
  return 2
}

const NUM_GROUPS     = 3
const LAST_GROUP_END = CARD_OFFSET + NUM_GROUPS * GROUP_SCROLL  // 380 + 2250 = 2630 px

const FADE_START = LAST_GROUP_END               // 2630 px
const FADE_END   = FADE_START + 160             // 2790 px

const BG_FADE_START = FADE_START
const BG_FADE_END   = FADE_END

const SCROLL_SPACE = FADE_END + 120             // 2910 px

// ─── types ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  a: number
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

function getCardAnim(card: CardData, scrollY: number) {
  // Each group occupies GROUP_SCROLL px and is strictly sequential — no overlap between groups.
  const groupStart = CARD_OFFSET + getCardPairId(card.id) * GROUP_SCROLL
  const rel = scrollY - groupStart
  const dir = card.side === 'right' ? 1 : -1

  // Phase 1: not yet entered
  if (rel < 0) return { opacity: 0, tx: dir * 200 }

  // Phase 2: entering
  if (rel < ENTER_RANGE) {
    const t = rel / ENTER_RANGE
    return { opacity: t, tx: lerp(dir * 200, 0, t) }
  }

  // Phase 3: fully visible
  if (rel < ENTER_RANGE + DWELL) return { opacity: 1, tx: 0 }

  // Phase 4: exiting
  if (rel < ENTER_RANGE + DWELL + EXIT_RANGE) {
    const t = (rel - ENTER_RANGE - DWELL) / EXIT_RANGE
    return { opacity: 1 - t, tx: lerp(0, dir * 200, t) }
  }

  // Phase 5: gone
  return { opacity: 0, tx: dir * 200 }
}

// Animação exclusiva do card 4 (Evento Corporativo): surge do centro com fade + escala
function getCard4Anim(scrollY: number) {
  const groupStart = CARD_OFFSET + getCardPairId(4) * GROUP_SCROLL
  const rel = scrollY - groupStart

  if (rel < 0)
    return { opacity: 0, scale: 0.92, ty: 28 }

  if (rel < ENTER_RANGE) {
    const t = rel / ENTER_RANGE
    return { opacity: t, scale: lerp(0.92, 1, t), ty: lerp(28, 0, t) }
  }

  if (rel < ENTER_RANGE + DWELL)
    return { opacity: 1, scale: 1, ty: 0 }

  if (rel < ENTER_RANGE + DWELL + EXIT_RANGE) {
    const t = (rel - ENTER_RANGE - DWELL) / EXIT_RANGE
    return { opacity: 1 - t, scale: lerp(1, 0.92, t), ty: lerp(0, 28, t) }
  }

  return { opacity: 0, scale: 0.92, ty: 28 }
}

// ─── component ───────────────────────────────────────────────────────────────
export type HeroMediaSlot = { url: string; tipo: 'imagem' | 'video' } | null

export function ImmersiveHome({ heroMedia, introVideo }: { heroMedia?: HeroMediaSlot[]; introVideo?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  const [scrollY, setScrollY] = useState(0)
  // bgOpacity: controls only the dark #0a0a0a background layer
  const [bgOpacity, setBgOpacity] = useState(1)
  // contentOpacity: controls everything visible (cards, kart, particles, nav)
  const [contentOpacity, setContentOpacity] = useState(1)
  const [introHidden, setIntroHidden] = useState(false)
  const [introGone, setIntroGone] = useState(false)
  const introVideoRef = useRef<HTMLVideoElement>(null)

  // ── intro: wait for animation to end, then fade out ───────────────────────
  useEffect(() => {
    const video = introVideoRef.current
    let fallback: ReturnType<typeof setTimeout>

    const dismiss = () => {
      setIntroHidden(true)
      setTimeout(() => setIntroGone(true), 900)
    }

    if (video) {
      video.addEventListener('ended', dismiss, { once: true })
      // Fallback if video fails to load or play
      fallback = setTimeout(dismiss, 5000)
    } else {
      fallback = setTimeout(dismiss, 3000)
    }

    return () => {
      video?.removeEventListener('ended', dismiss)
      clearTimeout(fallback)
    }
  }, [])

  // ── scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrollY(y)

      // Single unified fade — content + background disappear together, no dark gap
      const op = y <= FADE_START ? 1
        : y >= FADE_END ? 0
        : 1 - (y - FADE_START) / (FADE_END - FADE_START)

      setContentOpacity(op)

      if (y <= BG_FADE_START) {
        setBgOpacity(1)
      } else if (y < BG_FADE_END) {
        setBgOpacity(1 - (y - BG_FADE_START) / (BG_FADE_END - BG_FADE_START))
      } else {
        setBgOpacity(0)
      }
    }
    onScroll() // sync estado com a posição atual ao montar (ex: aba restaurada, back do browser)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── canvas particles ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    particlesRef.current = PARTICLE_COLORS.map((color) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 0.5 + Math.random() * 3,
      color,
      a: 0.15 + Math.random() * 0.5,
    }))

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const g1 = ctx.createRadialGradient(0, canvas.height, 0, 0, canvas.height, canvas.width * 0.65)
      g1.addColorStop(0, 'rgba(198,241,53,0.08)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const g2 = ctx.createRadialGradient(canvas.width, 0, 0, canvas.width, 0, canvas.width * 0.5)
      g2.addColorStop(0, 'rgba(74,222,128,0.06)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
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

  // ── derived ────────────────────────────────────────────────────────────────
  const mono: React.CSSProperties  = { fontFamily: 'var(--font-geist-mono, monospace)' }
  const bebas: React.CSSProperties = { fontFamily: 'var(--font-bebas, var(--font-geist-mono, monospace))' }

  // Hero text: visible at start, fades from scroll 80→200
  const heroOpacity = scrollY < 80 ? 1 : Math.max(0, 1 - (scrollY - 80) / 120)

  // Kart 3D: aparece após hero fades, some enquanto card 4 (Evento Corporativo) entra
  const card4Start = CARD_OFFSET + getCardPairId(4) * GROUP_SCROLL // 1880
  const logoOpacity = scrollY < 100
    ? 0
    : scrollY < 220
      ? lerp(0, 1, (scrollY - 100) / 120)
      : scrollY < card4Start
        ? 1
        : scrollY < card4Start + ENTER_RANGE
          ? lerp(1, 0, (scrollY - card4Start) / ENTER_RANGE)
          : 0

  // Retorna src/tipo efetivo: DB se disponível, fallback hardcoded caso contrário
  function cardMedia(card: CardData) {
    const slot = heroMedia?.[card.id]
    if (!slot) return { src: card.src, type: card.type, fallback: card.fallback }
    return {
      src: slot.url,
      type: slot.tipo === 'video' ? 'video' as const : 'image' as const,
      fallback: card.fallback,
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── INTRO ─────────────────────────────────────────────────── */}
      {!introGone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: introHidden ? 0 : 1,
            transition: 'opacity 0.9s ease',
            pointerEvents: introHidden ? 'none' : 'all',
          }}
        >
          <video
            ref={introVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: 'clamp(320px, 52vw, 720px)',
              height: 'auto',
              mixBlendMode: 'screen',
              filter: 'contrast(1.5) brightness(0.9)',
              WebkitMaskImage: 'radial-gradient(ellipse 62% 58% at 50% 50%, black 10%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.45) 52%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse 62% 58% at 50% 50%, black 10%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.45) 52%, transparent 70%)',
            }}
          >
            <source src={introVideo ?? '/videos/logo-intro.mp4'} type="video/mp4" />
          </video>
        </div>
      )}

      {/* ── FIXED OVERLAY ─────────────────────────────────────────── */}
      {/* Outer wrapper: only controls pointer events */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          pointerEvents: bgOpacity < 0.05 ? 'none' : 'all',
          visibility: bgOpacity < 0.02 && contentOpacity < 0.02 ? 'hidden' : undefined,
        }}
      >
        {/* ── BACKGROUND LAYER — fades last, after content is gone ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0a0a',
            opacity: bgOpacity,
            transition: 'opacity 0.15s linear',
          }}
        />

        {/* ── CONTENT LAYER — fades first ───────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            opacity: contentOpacity,
            pointerEvents: contentOpacity < 0.05 ? 'none' : undefined,
            transition: 'opacity 0.15s linear',
          }}
        >
          {/* CANVAS */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          />

          {/* ── SIDEBAR ─────────────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              left: 32,
              bottom: 88,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                marginBottom: 10,
              }}
            >
              O QUE VOCÊ BUSCA?
            </p>
            {SIDEBAR_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  ...mono,
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <span style={{ color: BRAND }}>→</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── CTA PILL ────────────────────────────────────────────── */}
          <Link href="/agendar" className={styles.ctaPill} style={{ position: 'absolute', left: 32, bottom: 32, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/images/logo.png" alt="" width={16} height={16} style={{ borderRadius: '50%', opacity: 0.85 }} />
            RESERVAR HORÁRIO
          </Link>

          {/* ── SCROLL INDICATOR ────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              right: 32,
              bottom: 32,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <p style={{ ...mono, fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', writingMode: 'vertical-rl' }}>
              ROLE
            </p>
            <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
              <div
                className={styles.scrollBar}
                style={{ position: 'absolute', inset: 0, background: BRAND }}
              />
            </div>
          </div>

          {/* ── MAIN SCENE ──────────────────────────────────────────── */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>

            {/* ── HERO TEXT — visível em scroll=0, some ao rolar ──────── */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                transform: 'translateY(-55%)',
                textAlign: 'center',
                opacity: heroOpacity,
                transition: 'opacity 0.3s ease',
                pointerEvents: heroOpacity < 0.1 ? 'none' : 'all',
                zIndex: 5,
              }}
            >
              <p
                style={{
                  ...mono,
                  color: BRAND,
                  fontSize: 11,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                KART ELÉTRICO INDOOR · BARUERI / SP
              </p>
              <h1
                style={{
                  ...bebas,
                  fontSize: 'clamp(56px, 11vw, 112px)',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  lineHeight: 0.95,
                  letterSpacing: '0.04em',
                  color: '#fff',
                  margin: 0,
                }}
              >
                SINTA A
                <br />
                <span style={{ color: BRAND }}>ADRENALINA</span>
                <br />
                DO DRIFT
              </h1>
            </div>

            {/* ── KART 3D — aparece após hero desaparecer ──────────────── */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Glow radial atrás do kart */}
              <div
                className="animate-pulse"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 460,
                  height: 460,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(198,241,53,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Kart 3D */}
              <KartViewer3D opacity={logoOpacity} />

              {/* Label abaixo */}
              <div
                style={{
                  opacity: logoOpacity,
                  transition: 'opacity 0.4s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: -8,
                }}
              >
                <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(198,241,53,0.4), transparent)' }} />
                <span style={{
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'rgba(198,241,53,0.5)',
                }}>
                  KART ELÉTRICO
                </span>
              </div>
            </div>

            {/* ── CARDS ─────────────────────────────────────────────── */}
            {CARDS.map((card) => {
              const { opacity, tx } = getCardAnim(card, scrollY)
              const isRight = card.side === 'right'

              // ── CARD 4 — grand finale, surge do centro sem slide lateral ──
              if (card.id === 4) {
                const { opacity: op4, scale: sc4, ty: ty4 } = getCard4Anim(scrollY)
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    className={styles.cardWrap}
                    style={{
                      position: 'absolute',
                      top: '62%',
                      left: '50%',
                      width: 700,
                      height: 290,
                      opacity: op4,
                      pointerEvents: op4 < 0.05 ? 'none' : 'auto',
                      transform: `translateX(-50%) translateY(calc(-50% + ${ty4}px)) scale(${sc4})`,
                      transition: 'opacity 0.3s ease',
                      cursor: 'pointer',
                      zIndex: 12,
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    <div
                      className={styles.cardInner}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 16,
                        border: '1px solid rgba(198,241,53,0.35)',
                        boxShadow: '0 0 60px rgba(198,241,53,0.12), 0 0 120px rgba(0,0,0,0.9)',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      {/* Left: imagem (55%) */}
                      <div style={{ flex: '0 0 55%', position: 'relative' }}>
                        <Image src={cardMedia(card).src} alt={card.title} fill style={{ objectFit: 'cover', objectPosition: 'center' }} sizes="385px" />
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
                        }} />
                        {/* Badge EMPRESAS top-left */}
                        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                          <span style={{
                            ...mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: '#0a0a0a',
                            background: BRAND, borderRadius: 4, padding: '4px 10px',
                          }}>
                            EMPRESAS
                          </span>
                        </div>
                      </div>

                      {/* Right: content panel (45%) */}
                      <div style={{
                        flex: 1,
                        background: 'rgba(8,8,8,0.96)',
                        padding: '28px 26px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 12,
                      }}>
                        <div>
                          <p style={{ ...mono, color: BRAND, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>
                            PERSONALIZADO
                          </p>
                          <p
                            className={styles.cardTitle}
                            style={{ ...bebas, color: '#fff', fontSize: 32, fontWeight: 400, textTransform: 'uppercase', lineHeight: 1.0, letterSpacing: '0.04em', marginBottom: 10 }}
                          >
                            EVENTO<br />CORPORATIVO
                          </p>
                          <p style={{ ...mono, color: 'rgba(255,255,255,0.45)', fontSize: 10, lineHeight: 1.6, letterSpacing: '0.03em' }}>
                            {card.desc}
                          </p>
                        </div>

                        <div style={{
                          background: 'rgba(198,241,53,0.1)',
                          border: `1px solid ${BRAND}`,
                          color: BRAND,
                          ...mono, fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.2em', textTransform: 'uppercase',
                          padding: '10px 0', textAlign: 'center', borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        }}>
                          <Image src="/images/logo.png" alt="" width={14} height={14} style={{ borderRadius: '50%', opacity: 0.6 }} />
                          {card.cta} →
                        </div>

                        {/* Preço / duração */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          <span style={{
                            ...mono, fontSize: 9, color: BRAND, letterSpacing: '0.15em',
                            textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(198,241,53,0.2)', borderRadius: 5, padding: '4px 10px',
                          }}>CONSULTAR</span>
                          <span style={{
                            ...mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em',
                            textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '4px 10px',
                          }}>PERSONALIZADO</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              }

              // ── CARDS 0–3 — layout padrão (pares) ─────────────────
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className={styles.cardWrap}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    ...(isRight
                      ? { left: 'calc(50% + 150px)' }
                      : { right: 'calc(50% + 150px)' }),
                    width: 400,
                    height: 310,
                    opacity,
                    pointerEvents: opacity < 0.05 ? 'none' : 'auto',
                    transform: `translateX(${tx}px) translateY(-50%)`,
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer',
                    zIndex: 12,
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  <div
                    className={styles.cardInner}
                    style={{
                      borderRadius: 14,
                      border: card.highlight
                        ? '1px solid rgba(198,241,53,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: card.highlight
                        ? '0 0 40px rgba(198,241,53,0.15), 0 0 80px rgba(0,0,0,0.8)'
                        : '0 0 60px rgba(0,0,0,0.8)',
                      overflow: 'hidden',
                      position: 'relative',
                      transform: `perspective(900px) rotateY(${isRight ? '-10deg' : '10deg'})`,
                    }}
                  >
                    {(() => { const m = cardMedia(card); return m.type === 'video' ? (
                      <video autoPlay muted loop playsInline poster={m.fallback}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: card.objectPosition ?? 'center center' }}>
                        <source src={m.src} type="video/mp4" />
                      </video>
                    ) : (
                      <Image src={m.src} alt={card.title} fill style={{ objectFit: 'cover' }} sizes="400px" />
                    )})()}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.5) 100%)',
                    }} />
                    <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                      <span style={{
                        ...mono, fontSize: card.price === 'CONSULTAR' ? 9 : 17, fontWeight: 800,
                        color: BRAND, letterSpacing: card.price === 'CONSULTAR' ? '0.2em' : '0.02em',
                        textTransform: 'uppercase', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(198,241,53,0.25)', borderRadius: 6,
                        padding: card.price === 'CONSULTAR' ? '5px 10px' : '3px 10px', display: 'block', lineHeight: 1.2,
                      }}>{card.price}</span>
                    </div>
                    <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
                      <span style={{
                        ...mono, fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em',
                        textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', display: 'block',
                      }}>{card.duration}</span>
                    </div>
                    {card.highlight && (
                      <div style={{ position: 'absolute', top: 50, left: 14, zIndex: 2 }}>
                        <span style={{
                          ...mono, fontSize: 8, fontWeight: 700, color: '#0a0a0a',
                          letterSpacing: '0.15em', textTransform: 'uppercase',
                          background: BRAND, borderRadius: 4, padding: '3px 8px',
                        }}>★ MAIS ESCOLHIDA</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px', zIndex: 2 }}>
                      <p style={{ ...mono, color: BRAND, fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 4 }}>{card.sub}</p>
                      <p className={styles.cardTitle}
                        style={{ ...bebas, color: '#fff', fontSize: 26, fontWeight: 400, textTransform: 'uppercase', lineHeight: 1.0, letterSpacing: '0.04em', marginBottom: 7 }}>
                        {card.title}
                      </p>
                      <p style={{ ...mono, color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 1.5, letterSpacing: '0.04em', marginBottom: 12 }}>{card.desc}</p>
                      <div style={{
                        background: card.highlight ? BRAND : 'rgba(198,241,53,0.12)',
                        border: `1px solid ${card.highlight ? BRAND : 'rgba(198,241,53,0.35)'}`,
                        color: card.highlight ? '#0a0a0a' : BRAND,
                        ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                        padding: '9px 0', textAlign: 'center', borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      }}>
                        <Image src="/images/logo.png" alt="" width={14} height={14} style={{ borderRadius: '50%', opacity: card.highlight ? 0.7 : 0.6 }} />
                        {card.cta} →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {/* end MAIN SCENE */}

        </div>
        {/* end CONTENT LAYER */}

      </div>
      {/* end FIXED OVERLAY */}

      {/* ── SCROLL SPACE ─────────────────────────────────────────────── */}
      <div ref={scrollRef} style={{ height: SCROLL_SPACE, position: 'relative' }} />
    </>
  )
}
