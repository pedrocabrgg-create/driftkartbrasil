'use client'

import { useState } from 'react'
import { REGRAS, RODAPE_REGRAS } from '@/lib/content/regras'

const PREVIEW_COUNT = 6

export function RulesSection() {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? REGRAS : REGRAS.slice(0, PREVIEW_COUNT)
  const hidden  = REGRAS.length - PREVIEW_COUNT

  return (
    <section className="px-5 py-24 md:px-10">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-14 flex flex-col items-center text-center">
          <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">
            Antes de pilotar
          </span>
          <h2 className="text-3xl uppercase text-white sm:text-4xl">
            Regras essenciais
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((regra, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/65 p-5
                         transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <span className="font-bebas flex size-6 shrink-0 items-center justify-center rounded-md bg-brand text-sm text-black">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-white/60">{regra}</p>
            </div>
          ))}
        </div>

        {expanded && (
          <p className="mt-6 text-center text-xs text-white/25 italic">
            {RODAPE_REGRAS}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="font-bebas group flex cursor-pointer select-none items-center gap-2 px-6 py-4 text-sm tracking-widest text-brand/60 transition-colors hover:text-brand"
          >
            <span
              className="inline-block transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▼
            </span>
            {expanded ? 'Recolher' : `Ver todas as regras (+${hidden})`}
          </button>
        </div>
      </div>
    </section>
  )
}
