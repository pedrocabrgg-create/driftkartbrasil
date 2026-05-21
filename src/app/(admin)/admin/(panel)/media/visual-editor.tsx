'use client'

import { useRef, useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Film, Loader2, Plus, Trash2, RefreshCw, Pencil, Check, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/db/client'
import { substituirSlot, excluirMedia, atualizarAlt } from './actions'
import type { Media } from '@/lib/db/types'

// Mapeamento exato dos CARDS em ImmersiveHome.tsx
const HERO_SLOTS = [
  { posicao: 1, label: 'Sessão Rápida',       sub: 'Card 1 · 25 MIN · lado direito',   fallbackSrc: '/videos/hero.mp4',             fallbackType: 'video' as const },
  { posicao: 2, label: 'Sessão Completa',      sub: 'Card 2 · 40 MIN · lado esquerdo',  fallbackSrc: '/videos/hero2.mp4',            fallbackType: 'video' as const },
  { posicao: 3, label: 'Pista Exclusiva',      sub: 'Card 3 · Grupo · lado direito',    fallbackSrc: '/images/evento-grupo.jpg',     fallbackType: 'image' as const },
  { posicao: 4, label: 'Aniversário',          sub: 'Card 4 · Especial · lado esquerdo',fallbackSrc: '/images/pista-track.jpg',      fallbackType: 'image' as const },
  { posicao: 5, label: 'Evento Corporativo',   sub: 'Card 5 · Empresa · centralizado',  fallbackSrc: '/images/funcionarios.jpg',     fallbackType: 'image' as const },
]

type Categoria = 'galeria' | 'hero' | 'video_intro'
type SlotKey = `${Categoria}:${number}`

function slotKey(cat: Categoria, pos: number): SlotKey { return `${cat}:${pos}` }

// ── Estado de edição de texto ─────────────────────────────────────────────────
type EditState = { id: string; value: string } | null

export function VisualEditor({ initialItems }: { initialItems: Media[] }) {
  const router = useRouter()
  const [items, setItems]     = useState<Media[]>(initialItems)
  const [uploading, setUploading] = useState<SlotKey | null>(null)
  const [editState, setEditState] = useState<EditState>(null)
  const [, startTransition]   = useTransition()
  const fileRefs = useRef<Map<SlotKey, HTMLInputElement>>(new Map())

  // Sincroniza quando o servidor retorna dados novos após router.refresh()
  useEffect(() => { setItems(initialItems) }, [initialItems])

  function getSlotItem(cat: Categoria, pos: number) {
    return items.find((m) => m.categoria === cat && m.posicao === pos) ?? null
  }
  function getGaleria() {
    return items.filter((m) => m.categoria === 'galeria').sort((a, b) => a.posicao - b.posicao)
  }
  function getVideoFundo() {
    return items.find((m) => m.categoria === 'video_intro') ?? null
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  async function handleFileChange(cat: Categoria, pos: number, file: File) {
    const key = slotKey(cat, pos)
    setUploading(key)
    try {
      const supabase = createSupabaseBrowserClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const path = `${cat}/${Date.now()}_${safeName}.${ext}`

      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      const tipo: 'imagem' | 'video' = file.type.startsWith('video/') ? 'video' : 'imagem'

      await substituirSlot({
        categoria: cat, posicao: pos,
        nome: file.name, tipo, url: publicUrl, storage_path: path,
        alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        tamanho_bytes: file.size,
      })

      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(null)
    }
  }

  // ── Excluir ─────────────────────────────────────────────────────────────────
  function handleDelete(id: string, storagePath: string | null, confirm_msg = 'Remover esta mídia? O site voltará a usar o arquivo padrão.') {
    if (!confirm(confirm_msg)) return
    startTransition(async () => {
      await excluirMedia(id, storagePath)
      setItems((prev) => prev.filter((m) => m.id !== id))
    })
  }

  // ── Editar texto/alt ────────────────────────────────────────────────────────
  function startEdit(item: Media) {
    setEditState({ id: item.id, value: item.alt })
  }
  function saveEdit() {
    if (!editState) return
    const { id, value } = editState
    startTransition(async () => {
      await atualizarAlt(id, value)
      setItems((prev) => prev.map((m) => m.id === id ? { ...m, alt: value } : m))
      setEditState(null)
    })
  }

  function triggerUpload(cat: Categoria, pos: number) {
    fileRefs.current.get(slotKey(cat, pos))?.click()
  }
  function setRef(cat: Categoria, pos: number, el: HTMLInputElement | null) {
    const key = slotKey(cat, pos)
    if (el) fileRefs.current.set(key, el)
    else fileRefs.current.delete(key)
  }

  const galeria = getGaleria()
  const proximaPosGaleria = (galeria.at(-1)?.posicao ?? 0) + 1

  return (
    <div className="space-y-12">

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 1 — CARDS DA TELA INICIAL
      ════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader
          number="1"
          title="Tela Inicial — Cards de Sessão"
          description="5 cards animados quando o visitante rola a página. Clique em qualquer card para trocar o vídeo ou foto."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {HERO_SLOTS.map((slot) => {
            const item        = getSlotItem('hero', slot.posicao)
            const key         = slotKey('hero', slot.posicao)
            const isUploading = uploading === key
            const activeSrc   = item ? item.url       : slot.fallbackSrc
            const activeType  = item ? item.tipo       : slot.fallbackType
            const isCustom    = !!item
            const isEditing   = editState?.id === item?.id

            return (
              <div key={slot.posicao} className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60 transition-all hover:border-brand/30">

                {/* Área de mídia */}
                <div
                  className="relative h-44 cursor-pointer overflow-hidden bg-black"
                  onClick={() => !isUploading && !isEditing && triggerUpload('hero', slot.posicao)}
                >
                  {activeType === 'video' ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video key={activeSrc} autoPlay muted loop playsInline
                      className={`h-full w-full object-cover transition-opacity duration-300 ${isCustom ? 'opacity-100' : 'opacity-50'}`}>
                      <source src={activeSrc} type="video/mp4" />
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeSrc} alt={slot.label}
                      className={`h-full w-full object-cover transition-opacity duration-300 ${isCustom ? 'opacity-100' : 'opacity-50'}`}
                      loading="lazy" />
                  )}

                  {/* Overlay trocar */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUploading ? (
                      <><Loader2 className="size-7 animate-spin text-brand" /><span className="text-xs text-white/70">Enviando…</span></>
                    ) : (
                      <><Camera className="size-7 text-brand" /><span className="text-sm font-semibold text-white">Trocar mídia</span><span className="text-xs text-white/40">foto ou vídeo .mp4</span></>
                    )}
                  </div>

                  {/* Badge status */}
                  {!isUploading && (
                    <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-xs font-bold ${isCustom ? 'bg-brand text-black' : 'bg-white/10 text-white/50'}`}>
                      {isCustom ? 'personalizado' : `padrão · ${activeType === 'video' ? 'vídeo' : 'foto'}`}
                    </span>
                  )}
                </div>

                {/* Info + edição de texto */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{slot.label}</p>
                      <p className="truncate text-xs text-white/30">{slot.sub}</p>
                    </div>
                    {isCustom && (
                      <button onClick={() => handleDelete(item!.id, item!.storage_path)}
                        className="shrink-0 rounded p-1 text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Voltar ao padrão">
                        <RefreshCw className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Edição de descrição/alt */}
                  {isCustom && (
                    isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editState!.value}
                          onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditState(null) }}
                          placeholder="Descrição da mídia…"
                          className="min-w-0 flex-1 rounded border border-brand/40 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button onClick={saveEdit} className="rounded p-1 text-brand hover:bg-brand/10"><Check className="size-3.5" /></button>
                        <button onClick={() => setEditState(null)} className="rounded p-1 text-white/30 hover:text-white"><X className="size-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(item!)}
                        className="flex items-center gap-1.5 text-left text-xs text-white/30 hover:text-white/60 transition-colors">
                        <Pencil className="size-3 shrink-0" />
                        <span className="truncate">{item!.alt || 'Adicionar descrição…'}</span>
                      </button>
                    )
                  )}
                </div>

                <input ref={(el) => setRef('hero', slot.posicao, el)} type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileChange('hero', slot.posicao, f); e.target.value = '' }} />
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 2 — GALERIA "CONHEÇA A PISTA"
      ════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader
          number="2"
          title='Galeria — "Conheça a Pista"'
          description='Fotos e vídeos exibidos na homepage. Aceita imagens ou .mp4. A ordem aqui é a mesma ordem do site.'
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {galeria.map((item, idx) => {
            const key         = slotKey('galeria', item.posicao)
            const isUploading = uploading === key
            const isVideo     = item.tipo === 'video'
            const isEditing   = editState?.id === item.id

            return (
              <div key={item.id} className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60 transition-all hover:border-brand/30">

                {/* Área de mídia */}
                <div className="relative h-40 cursor-pointer overflow-hidden"
                  onClick={() => !isUploading && !isEditing && triggerUpload('galeria', item.posicao)}>
                  {isVideo ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video key={item.url} autoPlay muted loop playsInline className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105">
                      <source src={item.url} type="video/mp4" />
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  )}

                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUploading ? <Loader2 className="size-6 animate-spin text-brand" /> : <><Camera className="size-5 text-brand" /><span className="text-xs font-semibold text-white">Trocar mídia</span></>}
                  </div>

                  <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white/50">{idx + 1}°</span>
                  {isVideo && <span className="absolute right-2 top-2 rounded bg-brand/80 px-1.5 py-0.5 text-xs font-bold text-black">MP4</span>}
                </div>

                {/* Texto/alt editável */}
                <div className="flex flex-1 flex-col gap-1 px-3 py-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={editState!.value}
                        onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditState(null) }}
                        placeholder="Descrição da foto…"
                        className="min-w-0 flex-1 rounded border border-brand/40 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <button onClick={saveEdit} className="rounded p-1 text-brand hover:bg-brand/10"><Check className="size-3.5" /></button>
                      <button onClick={() => setEditState(null)} className="rounded p-1 text-white/30 hover:text-white"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)}
                      className="flex items-center gap-1.5 text-left text-xs text-white/30 hover:text-white/60 transition-colors">
                      <Pencil className="size-3 shrink-0" />
                      <span className="truncate">{item.alt || 'Adicionar descrição…'}</span>
                    </button>
                  )}

                  <div className="flex items-center justify-end">
                    <button onClick={() => handleDelete(item.id, item.storage_path, 'Remover esta mídia da galeria?')}
                      className="rounded p-1 text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Remover">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <input ref={(el) => setRef('galeria', item.posicao, el)} type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileChange('galeria', item.posicao, f); e.target.value = '' }} />
              </div>
            )
          })}

          <AddSlot onFile={(f) => handleFileChange('galeria', proximaPosGaleria, f)}
            uploading={uploading === slotKey('galeria', proximaPosGaleria)}
            accept="image/*,video/*" label="Adicionar mídia" />
        </div>

        {galeria.length === 0 && (
          <p className="text-sm text-white/30">Nenhuma mídia enviada ainda — o site usa as fotos padrão da galeria.</p>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════
          SEÇÃO 3 — VÍDEO DE ABERTURA
      ════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader
          number="3"
          title="Vídeo de Abertura"
          description="Animação que toca automaticamente quando alguém abre o site pela primeira vez. Clique para trocar."
        />

        {(() => {
          const item        = getVideoFundo()
          const key         = slotKey('video_intro', 1)
          const isUploading = uploading === key
          const isEditing   = editState?.id === item?.id

          return (
            <div className="group overflow-hidden rounded-xl border border-white/10 bg-black/60 transition-all hover:border-brand/30">
              <div className="relative flex h-52 cursor-pointer items-center justify-center overflow-hidden"
                onClick={() => !isUploading && !isEditing && triggerUpload('video_intro', 1)}>
                {item ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video key={item.url} autoPlay muted loop playsInline className="h-full w-full object-cover">
                    <source src={item.url} type="video/mp4" />
                  </video>
                ) : (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-40">
                    <source src="/videos/logo-intro.mp4" type="video/mp4" />
                  </video>
                )}

                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploading
                    ? <><Loader2 className="size-8 animate-spin text-brand" /><span className="text-sm text-white/70">Enviando…</span></>
                    : <><Film className="size-8 text-brand" /><span className="text-sm font-semibold text-white">Trocar vídeo de abertura</span><span className="text-xs text-white/40">arquivo .mp4</span></>
                  }
                </div>

                <span className={`absolute left-3 top-3 rounded px-2 py-0.5 text-xs font-bold ${item ? 'bg-brand text-black' : 'bg-white/10 text-white/50'}`}>
                  {item ? 'personalizado' : 'padrão · abertura'}
                </span>
              </div>

              {item && (
                <div className="flex flex-col gap-2 px-4 py-3">
                  {/* Texto editável */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus value={editState!.value}
                        onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditState(null) }}
                        placeholder="Descrição do vídeo…"
                        className="min-w-0 flex-1 rounded border border-brand/40 bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <button onClick={saveEdit} className="rounded p-1 text-brand hover:bg-brand/10"><Check className="size-3.5" /></button>
                      <button onClick={() => setEditState(null)} className="rounded p-1 text-white/30 hover:text-white"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)}
                      className="flex items-center gap-1.5 text-left text-xs text-white/30 hover:text-white/60 transition-colors">
                      <Pencil className="size-3 shrink-0" />
                      <span className="truncate">{item.alt || 'Adicionar descrição…'}</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">{item.nome}</p>
                      {item.tamanho_bytes && (
                        <p className="text-xs text-white/30">{(item.tamanho_bytes / 1024 / 1024).toFixed(1)} MB</p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id, item.storage_path, 'Remover este vídeo? O site voltará a usar o vídeo padrão.')}
                      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-red-400/50 transition-colors hover:bg-red-500/10 hover:text-red-400">
                      <RefreshCw className="size-3.5" />
                      Voltar ao padrão
                    </button>
                  </div>
                </div>
              )}

              <input ref={(el) => setRef('video_intro', 1, el)} type="file" accept="video/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileChange('video_intro', 1, f); e.target.value = '' }} />
            </div>
          )
        })()}
      </section>

    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SectionHeader({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-black">{number}</span>
      <div>
        <h2 className="font-bold text-white">{title}</h2>
        <p className="text-sm text-white/40">{description}</p>
      </div>
    </div>
  )
}

function AddSlot({ onFile, uploading, accept, label }: { onFile: (f: File) => void; uploading: boolean; accept: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-white/30 transition-colors hover:border-brand/40 hover:text-brand"
      onClick={() => ref.current?.click()}>
      {uploading ? <Loader2 className="size-6 animate-spin text-brand" /> : <><Plus className="size-6" /><span className="text-xs">{label}</span></>}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
    </div>
  )
}
