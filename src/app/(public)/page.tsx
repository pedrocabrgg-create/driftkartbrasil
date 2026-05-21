import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, MapPin, Calendar } from 'lucide-react'
import { ImmersiveHome, type HeroMediaSlot } from '@/components/ImmersiveHome'
import { LogoViewer3DClient } from '@/components/LogoViewer3DClient'
import { RulesSection } from '@/components/site/rules-section'
import { GallerySection } from '@/components/site/gallery-section'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getSiteConfig } from '@/lib/site-config'
import type { Modalidade, GradeHorario } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Drift Kart Brasil — Kart Elétrico em Barueri/SP',
  description:
    'Aulas, sessões, aniversários e eventos de kart elétrico indoor em Barueri/SP. A partir de R$ 80. Crianças a partir de 1,30 m.',
  openGraph: {
    title: 'Drift Kart Brasil — Kart Elétrico em Barueri/SP',
    description: 'Kart elétrico indoor em Barueri/SP. A partir de R$ 80.',
    images: [{ url: '/images/kart-02.jpg' }],
  },
}

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function formatHorario(inicio: string, fim: string) {
  return `${inicio.slice(0, 5)} – ${fim.slice(0, 5)}`
}

function formatPreco(cents: number) {
  return `R$ ${Math.round(cents / 100)}`
}

export default async function HomePage() {
  const db = createSupabaseServiceClient()

  const [{ data: modalidades }, { data: grade }, { data: heroRaw }, { data: introRaw }, cfg] = await Promise.all([
    db.from('modalidades').select('*').eq('ativa', true).order('duracao_min'),
    db.from('grade_horarios').select('*').eq('ativo', true).is('data_excecao', null).order('dia_semana'),
    db.from('media').select('url, tipo').eq('categoria', 'hero').eq('ativo', true).order('posicao'),
    db.from('media').select('url').eq('categoria', 'video_intro').eq('ativo', true).order('posicao').limit(1),
    getSiteConfig(),
  ])

  const heroMedia: HeroMediaSlot[] = Array.from({ length: 5 }, (_, i) => {
    const item = heroRaw?.[i]
    return item ? { url: item.url, tipo: item.tipo as 'imagem' | 'video' } : null
  })

  const introVideoUrl = introRaw?.[0]?.url ?? null

  const whatsapp = cfg.whatsapp_numero
  const alturaMin = `${cfg.altura_min_cm} m`.replace('130', '1,30').replace('140', '1,40')

  const horarios = (grade ?? [])
    .filter((h: GradeHorario) => h.dia_semana !== null)
    .map((h: GradeHorario) => ({
      dia: DIAS[h.dia_semana!] ?? 'Dia',
      horario: formatHorario(h.hora_inicio, h.hora_fim),
    }))

  const diaInicio = horarios[0]?.dia.slice(0, 3) ?? 'Qui'
  const diaFim = horarios[horarios.length - 1]?.dia.slice(0, 3) ?? 'Dom'
  const labelFuncionamento = horarios.length >= 2 ? `${diaInicio} – ${diaFim}` : 'Qui – Dom'

  return (
    <>
      {/* ── IMMERSIVE INTRO ─────────────── */}
      <ImmersiveHome heroMedia={heroMedia} introVideo={introVideoUrl} />

      {/* ═══════════════════════════════════════════════
          NÚMEROS
      ═══════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto grid max-w-screen-xl grid-cols-2 divide-x divide-white/8 md:grid-cols-4">
          {[
            { valor: modalidades?.[0] ? formatPreco(modalidades[0].preco_cheio_cents) : 'R$ 80', label: 'a partir de / sessão' },
            { valor: cfg.numeros_karts, label: 'karts elétricos' },
            { valor: alturaMin, label: 'altura mínima' },
            { valor: labelFuncionamento, label: 'funcionamento' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center py-6 px-4 text-center">
              <span className="font-bebas text-3xl tracking-wide text-brand">{item.valor}</span>
              <span className="font-bebas mt-1 text-xs uppercase tracking-widest text-white/40">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MODALIDADES
      ═══════════════════════════════════════════════ */}
      <section className="px-5 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 flex flex-col items-center text-center">
            <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">Modalidades</span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Escolha sua sessão
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/50">
              Briefing de segurança, capacete e instrução inclusos em todas as opções.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(modalidades as Modalidade[] ?? []).map((mod) => (
              <div
                key={mod.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-7 transition-all hover:border-brand/40 hover:shadow-[0_0_40px_-10px_rgba(198,241,53,0.2)]"
              >
                {mod.destaque && (
                  <span className="font-bebas mb-5 self-start bg-brand px-3 py-1 text-sm tracking-widest text-black">
                    {mod.destaque}
                  </span>
                )}

                <p className="font-bebas text-sm tracking-widest text-white/40">{mod.nome}</p>
                <p className="font-bebas mt-1 mb-4 text-6xl text-brand">
                  {formatPreco(mod.preco_cheio_cents)}
                </p>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-white/60">
                  {mod.descricao || mod.nome}
                </p>

                <div className="mb-7 flex gap-5 text-xs text-white/30">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-brand/50" />
                    {mod.duracao_min} minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-brand/50" />
                    Até {mod.capacidade_max} pilotos
                  </span>
                </div>

                <Link
                  href="/agendar"
                  className="font-bebas flex items-center justify-center bg-brand py-3.5 text-base tracking-widest text-black transition-all hover:bg-brand/90 hover:shadow-[0_0_20px_rgba(198,241,53,0.3)]"
                >
                  Reservar Horário
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          GALERIA
      ═══════════════════════════════════════════════ */}
      <section className="px-5 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 flex flex-col items-center text-center">
            <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">Estrutura</span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Conheça a pista
            </h2>
          </div>
          <GallerySection />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          QUEM SOMOS
      ═══════════════════════════════════════════════ */}
      <section id="equipe" className="px-5 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/images/funcionarios.jpg"
                alt="Equipe Drift Kart Brasil"
                width={700}
                height={500}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="font-bebas text-sm tracking-widest text-brand">Nossa Equipe</p>
                <p className="font-bebas text-2xl text-white">Drift Kart Brasil</p>
              </div>
            </div>

            <div>
              <span className="font-bebas mb-4 block text-sm tracking-[0.25em] text-brand">
                Quem somos
              </span>
              <h2 className="mb-5 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
                {cfg.sobre_titulo}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-white/60">{cfg.sobre_texto_1}</p>
              <p className="mb-8 text-sm leading-relaxed text-white/50">{cfg.sobre_texto_2}</p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/agendar"
                  className="font-bebas animate-glow inline-flex items-center justify-center bg-brand px-8 py-3.5 text-base tracking-widest text-black transition-all hover:bg-brand/90"
                >
                  Reservar Horário
                </Link>
                <a
                  href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de saber mais sobre o Drift Kart Brasil.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bebas inline-flex items-center justify-center border border-white/20 px-8 py-3.5 text-base tracking-widest text-white/60 transition-all hover:border-white/40 hover:text-white"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HORÁRIOS
      ═══════════════════════════════════════════════ */}
      <section className="px-5 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 flex flex-col items-center text-center">
            <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">Funcionamento</span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Quando estamos abertos
            </h2>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {horarios.map((h) => (
              <div
                key={h.dia}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/65 p-6"
              >
                <Calendar className="mb-2 size-5 text-brand" />
                <p className="font-bebas text-lg text-white">{h.dia}</p>
                <p className="font-bebas text-xl text-brand">{h.horario}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-white/30">{cfg.nota_fechamento}</p>

          <div className="mt-10 flex justify-center">
            <Link
              href="/agendar"
              className="font-bebas animate-glow inline-flex items-center gap-2 bg-brand px-10 py-4 text-lg tracking-widest text-black transition-all hover:bg-brand/90"
            >
              Reservar Horário Agora
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          REGRAS
      ═══════════════════════════════════════════════ */}
      <RulesSection />

      {/* ═══════════════════════════════════════════════
          MAPA
      ═══════════════════════════════════════════════ */}
      <section className="px-5 py-24 md:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 flex flex-col items-center text-center">
            <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">Localização</span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Como chegar
            </h2>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="space-y-5 md:w-72 md:shrink-0">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="mb-1 font-semibold text-white">Drift Kart Brasil</p>
                  <p className="text-sm leading-relaxed text-white/50">
                    {cfg.endereco_rua}<br />
                    {cfg.endereco_complemento}<br />
                    CEP {cfg.endereco_cep}
                  </p>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(cfg.endereco_rua + ', ' + cfg.endereco_complemento)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bebas inline-flex items-center gap-2 border border-brand/40 px-5 py-2.5 text-base tracking-widest text-brand transition-all hover:bg-brand/10"
              >
                Abrir no Google Maps
              </a>
            </div>

            <div className="h-72 flex-1 overflow-hidden rounded-2xl">
              <iframe
                title="Localização Drift Kart Brasil"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(cfg.endereco_rua + ', ' + cfg.endereco_complemento)}&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 py-28 text-center md:px-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-65">
          <div className="h-[560px] w-[560px]">
            <LogoViewer3DClient />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.75) 100%)' }}
        />

        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="font-bebas mb-3 text-sm tracking-[0.3em] text-brand/70">Reserve agora</p>
          <h2 className="mb-4 text-5xl leading-none text-white sm:text-7xl">
            {cfg.cta_titulo}
          </h2>
          <p className="mb-10 text-sm text-white/40">{cfg.cta_subtitulo}</p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/agendar"
              className="font-bebas inline-flex items-center justify-center bg-brand px-12 py-5 text-xl tracking-widest text-black shadow-xl transition-all hover:scale-105 hover:bg-brand/90"
            >
              Reservar Horário
            </Link>
            <a
              href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de reservar um horário no Drift Kart Brasil.`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas inline-flex items-center justify-center border border-white/20 px-10 py-5 text-xl tracking-widest text-white/60 transition-all hover:border-brand/60 hover:text-brand"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
