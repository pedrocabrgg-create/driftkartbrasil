'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/sessoes', label: 'Sessões' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
]

const consultarLink = { href: '/consultar', label: 'Minha Reserva' }

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-5 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo.png"
            alt="Drift Kart Brasil"
            width={38}
            height={38}
            className="rounded-full"
          />
          <span className="font-bebas hidden text-lg tracking-widest text-white sm:block">
            Drift Kart <span className="text-brand">Brasil</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-bebas text-sm tracking-widest transition-colors',
                  active ? 'text-brand' : 'text-white/50 hover:text-white',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href={consultarLink.href}
            className="font-bebas hidden items-center gap-1.5 border border-white/20 px-4 py-2 text-sm tracking-widest text-white/60 transition-all hover:border-white/40 hover:text-white md:inline-flex"
          >
            {consultarLink.label}
          </Link>
          <Link
            href="/agendar"
            className="font-bebas hidden items-center gap-1.5 bg-brand px-5 py-2.5 text-base tracking-widest text-black transition-all hover:bg-brand/90 md:inline-flex"
          >
            Reservar Horário
          </Link>

          <button
            className="text-white/60 transition-colors hover:text-white md:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-black/95 px-5 pb-8 pt-6 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bebas text-base tracking-widest text-white/60 transition-colors hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={consultarLink.href}
              className="font-bebas border border-white/20 inline-flex items-center justify-center py-3.5 text-base tracking-widest text-white/60"
              onClick={() => setOpen(false)}
            >
              {consultarLink.label}
            </Link>
            <Link
              href="/agendar"
              className="font-bebas inline-flex items-center justify-center bg-brand py-4 text-lg tracking-widest text-black"
              onClick={() => setOpen(false)}
            >
              Reservar Horário
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
