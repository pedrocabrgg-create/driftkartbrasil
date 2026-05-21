'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, ChevronUp, ChevronDown, Pencil, Check, X, Film, Info, LayoutTemplate, FolderOpen } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/client'
import type { Media } from '@/lib/db/types'
import { salvarMedia, excluirMedia, atualizarAlt, moverCima, moverBaixo } from './actions'
import { VisualEditor } from './visual-editor'

type Categoria = 'galeria' | 'hero' | 'video_intro' | 'outro'

// ── Configuração de cada categoria ────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Categoria, {
  label: string
  description: string
  hint: string
  /** Para hero: 5 slots rotulados mostrando o padrão atual */
  slots?: { label: string; fallbackImg: string }[]
  /** Para galeria: fotos padrão sendo usadas quando não há uploads */
  fallbacks?: { src: string; label: string }[]
}> = {
  galeria: {
    label: 'Galeria',
    description: 'Fotos exibidas na seção "Conheça a pista" da homepage — grid de 4 colunas com lightbox.',
    hint: 'Envie fotos da pista, karts e eventos. A ordem controla a sequência no site.',
    fallbacks: [
      { src: '/images/kart-02.jpg',        label: 'Kart #05 na pista' },
      { src: '/images/kart-01.jpg',         label: 'Karts na pista' },
      { src: '/images/kart-bateria.jpg',    label: 'Bateria elétrica' },
      { src: '/images/pista-track.jpg',     label: 'Vista da pista' },
      { src: '/images/pista-panoramica.jpg',label: 'Pista panorâmica' },
      { src: '/images/evento-grupo.jpg',    label: 'Evento em grupo' },
      { src: '/images/kart-motor.jpg',      label: 'Motor do kart' },
      { src: '/images/funcionarios.jpg',    label: 'Equipe' },
    ],
  },
  hero: {
    label: 'Cards da Intro',
    description: 'Mídia dos 5 cards da tela inicial animada. A 1ª mídia vai pro 1º card, a 2ª pro 2º e assim por diante.',
    hint: 'Vídeos .mp4 são recomendados para os 2 primeiros cards. Fotos para os demais.',
    slots: [
      { label: 'Card 1 — Sessão Rápida',       fallbackImg: '/images/kart-02.jpg' },
      { label: 'Card 2 — Sessão Completa',      fallbackImg: '/images/piloto-capacete.png' },
      { label: 'Card 3 — Pista Exclusiva',      fallbackImg: '/images/evento-grupo.jpg' },
      { label: 'Card 4 — Aniversário',          fallbackImg: '/images/pista-track.jpg' },
      { label: 'Card 5 — Evento Corporativo',   fallbackImg: '/images/funcionarios.jpg' },
    ],
  },
  video_intro: {
    label: 'Vídeo de Fundo',
    description: 'Vídeo exibido como background em seções do site. Use apenas 1 arquivo .mp4.',
    hint: 'Recomendado: vídeo horizontal, 10–30 segundos, comprimido para web (<30 MB).',
    fallbacks: [
      { src: '/images/kart-02.jpg', label: 'hero.mp4 (padrão — arquivo em /videos/)' },
    ],
  },
  outro: {
    label: 'Outros',
    description: 'Arquivos de mídia auxiliares sem posição fixa no site.',
    hint: 'Use para logos, imagens de email, banners de redes sociais, etc.',
  },
}

export function MediaManager({ initialItems }: { initialItems: Media[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Media[]>(initialItems)
  const [viewMode, setViewMode] = useState<'visual' | 'arquivos'>('visual')
  const [activeTab, setActiveTab] = useState<Categoria>('galeria')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAlt, setEditingAlt] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setItems(initialItems) }, [initialItems])

  const filtered = items
    .filter((m) => m.categoria === activeTab)
    .sort((a, b) => a.posicao - b.posicao)

  const cfg = CATEGORY_CONFIG[activeTab]

  async function handleUpload(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const path = `${activeTab}/${Date.now()}_${safeName}.${ext}`

      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      const tipo: 'imagem' | 'video' = file.type.startsWith('video/') ? 'video' : 'imagem'

      await salvarMedia({
        nome: file.name,
        tipo,
        url: publicUrl,
        storage_path: path,
        alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        categoria: activeTab,
        tamanho_bytes: file.size,
      })

      router.refresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(id: string, storagePath: string | null) {
    if (!confirm('Excluir esta mídia permanentemente?')) return
    startTransition(async () => {
      await excluirMedia(id, storagePath)
      setItems((prev) => prev.filter((m) => m.id !== id))
    })
  }

  function handleEditSave(id: string) {
    startTransition(async () => {
      await atualizarAlt(id, editingAlt)
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, alt: editingAlt } : m)))
      setEditingId(null)
    })
  }

  function handleMove(id: string, dir: 'up' | 'down') {
    startTransition(async () => {
      if (dir === 'up') await moverCima(id, activeTab)
      else await moverBaixo(id, activeTab)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Gerenciar Mídia</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-white/10 bg-card p-0.5">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'visual' ? 'bg-brand/20 text-brand' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <LayoutTemplate className="size-3.5" />
              Editor Visual
            </button>
            <button
              onClick={() => setViewMode('arquivos')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'arquivos' ? 'bg-brand/20 text-brand' : 'text-muted-foreground hover:text-white'
              }`}
            >
              <FolderOpen className="size-3.5" />
              Arquivos
            </button>
          </div>

          {viewMode === 'arquivos' && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Upload className="size-4" />
              {uploading ? 'Enviando…' : 'Upload'}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {uploadError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {uploadError}
        </div>
      )}

      {/* ── Editor Visual ── */}
      {viewMode === 'visual' && (
        <VisualEditor initialItems={items} />
      )}

      {/* ── Gerenciador de Arquivos ── */}
      {viewMode === 'arquivos' && (
      <>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-card p-1">
        {(Object.entries(CATEGORY_CONFIG) as [Categoria, typeof cfg][]).map(([value, c]) => {
          const count = items.filter((m) => m.categoria === value).length
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                activeTab === value
                  ? 'bg-brand/20 font-medium text-brand'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              {c.label}
              <span className="ml-1.5 text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Descrição da categoria */}
      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm text-white/80">{cfg.description}</p>
          {cfg.hint && <p className="mt-1 text-xs text-white/40">{cfg.hint}</p>}
        </div>
      </div>

      {/* ── HERO: Visualização por slots ── */}
      {activeTab === 'hero' && cfg.slots && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Em uso no site agora
          </p>
          <div className="grid gap-3 sm:grid-cols-5">
            {cfg.slots.map((slot, idx) => {
              const dbItem = filtered[idx]
              return (
                <div key={idx} className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card">
                  <div className="relative h-28 bg-black/40">
                    {dbItem ? (
                      dbItem.tipo === 'video' ? (
                        <div className="flex h-full flex-col items-center justify-center gap-1 text-brand">
                          <Film className="size-6" />
                          <span className="px-2 text-center text-xs text-white/60 truncate max-w-full">{dbItem.nome}</span>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dbItem.url} alt={dbItem.alt} className="h-full w-full object-cover" loading="lazy" />
                      )
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slot.fallbackImg} alt={slot.label} className="h-full w-full object-cover opacity-40" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="rounded bg-black/70 px-2 py-1 text-xs text-white/50">padrão</span>
                        </div>
                      </>
                    )}
                    {dbItem && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-brand/90 px-1.5 py-0.5 text-xs font-bold text-black">
                        ativo
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-white/70">{slot.label}</p>
                    {!dbItem && (
                      <p className="mt-0.5 text-xs text-white/30">Sem upload — usando padrão</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} arquivo{filtered.length !== 1 ? 's' : ''} enviado{filtered.length !== 1 ? 's' : ''}.
              {filtered.length < (cfg.slots?.length ?? 5) && ` Slots sem upload usam a mídia padrão.`}
            </p>
          )}
        </div>
      )}

      {/* ── GALERIA / VIDEO_INTRO: Preview do padrão quando vazio ── */}
      {activeTab !== 'hero' && filtered.length === 0 && cfg.fallbacks && cfg.fallbacks.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Em uso no site agora (arquivos padrão)
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {cfg.fallbacks.map((fb, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-white/10">
                <div className="relative h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fb.src} alt={fb.label} className="h-full w-full object-cover opacity-60" loading="lazy" />
                  <div className="absolute inset-0 flex items-end justify-center pb-1">
                    <span className="rounded bg-black/70 px-1 py-0.5 text-xs text-white/50">padrão</span>
                  </div>
                </div>
                <p className="truncate px-1.5 py-1 text-xs text-white/40">{fb.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30">
            Faça upload de novas imagens para substituir os arquivos padrão acima.
          </p>
        </div>
      )}

      {/* ── Grid de mídias enviadas ── */}
      {filtered.length === 0 ? (
        <div
          className="flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-8" />
          <p className="text-sm">Clique para fazer upload nesta categoria</p>
        </div>
      ) : (
        <>
          {activeTab !== 'hero' && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Suas mídias enviadas
            </p>
          )}
          <div className={`grid gap-4 ${activeTab === 'hero' ? 'sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
            {filtered.map((item, idx) => (
              <MediaCard
                key={item.id}
                item={item}
                slotLabel={activeTab === 'hero' ? (cfg.slots?.[idx]?.label ?? `Slot ${idx + 1}`) : undefined}
                isFirst={idx === 0}
                isLast={idx === filtered.length - 1}
                isEditing={editingId === item.id}
                editingAlt={editingAlt}
                isPending={isPending}
                onEditStart={() => { setEditingId(item.id); setEditingAlt(item.alt) }}
                onEditSave={() => handleEditSave(item.id)}
                onEditCancel={() => setEditingId(null)}
                onAltChange={setEditingAlt}
                onDelete={() => handleDelete(item.id, item.storage_path)}
                onMove={(dir) => handleMove(item.id, dir)}
              />
            ))}

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-40"
            >
              <Upload className="size-6" />
              <span className="text-xs">Adicionar</span>
            </button>
          </div>
        </>
      )}

      </>
      )}
    </div>
  )
}

function MediaCard({
  item, slotLabel, isFirst, isLast, isEditing, editingAlt, isPending,
  onEditStart, onEditSave, onEditCancel, onAltChange, onDelete, onMove,
}: {
  item: Media
  slotLabel?: string
  isFirst: boolean
  isLast: boolean
  isEditing: boolean
  editingAlt: string
  isPending: boolean
  onEditStart: () => void
  onEditSave: () => void
  onEditCancel: () => void
  onAltChange: (v: string) => void
  onDelete: () => void
  onMove: (dir: 'up' | 'down') => void
}) {
  const isVideo = item.tipo === 'video'
  const sizeKb = item.tamanho_bytes ? Math.round(item.tamanho_bytes / 1024) : null

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card">
      <div className="relative flex h-36 items-center justify-center bg-black/40">
        {isVideo ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Film className="size-8" />
            <span className="max-w-[90%] truncate px-2 text-center text-xs">{item.nome}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt} className="h-full w-full object-cover" loading="lazy" />
        )}
        {slotLabel && (
          <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded bg-black/80 px-1.5 py-0.5 text-center text-xs text-brand">
            {slotLabel}
          </span>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white/60">
          #{item.posicao}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs text-muted-foreground">{item.nome}</p>
        {isEditing ? (
          <div className="flex gap-1">
            <input
              autoFocus
              value={editingAlt}
              onChange={(e) => onAltChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel() }}
              className="min-w-0 flex-1 rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white focus:border-brand focus:outline-none"
            />
            <button onClick={onEditSave} disabled={isPending} className="rounded p-1 text-brand hover:bg-brand/10">
              <Check className="size-3.5" />
            </button>
            <button onClick={onEditCancel} className="rounded p-1 text-muted-foreground hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onEditStart}
            className="flex items-start gap-1.5 text-left text-xs text-muted-foreground hover:text-white"
            title="Editar descrição"
          >
            <Pencil className="mt-0.5 size-3 shrink-0 opacity-50" />
            <span className="line-clamp-2 leading-relaxed">{item.alt || '(sem descrição)'}</span>
          </button>
        )}
        {sizeKb && <p className="text-xs text-muted-foreground/50">{sizeKb} KB</p>}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 px-2 py-1.5">
        <div className="flex gap-0.5">
          <button
            onClick={() => onMove('up')}
            disabled={isFirst || isPending}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            title="Mover para cima"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={isLast || isPending}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            title="Mover para baixo"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
          title="Excluir"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
