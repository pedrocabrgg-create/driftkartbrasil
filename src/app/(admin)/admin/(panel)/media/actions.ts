'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

const BUCKET = 'media'

// Salva metadata após upload client-side
export async function salvarMedia(data: {
  nome: string
  tipo: 'imagem' | 'video'
  url: string
  storage_path: string
  alt: string
  categoria: 'galeria' | 'hero' | 'video_intro' | 'outro'
  tamanho_bytes: number
}) {
  const db = createSupabaseServiceClient()

  // próxima posição nesta categoria
  const { data: last } = await db
    .from('media')
    .select('posicao')
    .eq('categoria', data.categoria)
    .order('posicao', { ascending: false })
    .limit(1)
    .single()

  const posicao = (last?.posicao ?? 0) + 1

  const { error } = await db.from('media').insert({ ...data, posicao })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/media')
  revalidatePath('/')
}

// Exclui arquivo do storage + registro do banco
export async function excluirMedia(id: string, storagePath: string | null) {
  const db = createSupabaseServiceClient()

  if (storagePath) {
    await db.storage.from(BUCKET).remove([storagePath])
  }

  const { error } = await db.from('media').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/media')
  revalidatePath('/')
}

// Atualiza alt text
export async function atualizarAlt(id: string, alt: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('media').update({ alt }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/media')
  revalidatePath('/')
}

type Categoria = 'galeria' | 'hero' | 'video_intro' | 'outro'

// Move item para cima (troca posição com o anterior)
export async function moverCima(id: string, categoria: Categoria) {
  const db = createSupabaseServiceClient()

  const { data: items } = await db
    .from('media')
    .select('id, posicao')
    .eq('categoria', categoria)
    .eq('ativo', true)
    .order('posicao', { ascending: true })

  if (!items) return
  const idx = items.findIndex((i) => i.id === id)
  if (idx <= 0) return

  const curr = items[idx]!
  const prev = items[idx - 1]!

  await db.from('media').update({ posicao: prev.posicao }).eq('id', curr.id)
  await db.from('media').update({ posicao: curr.posicao }).eq('id', prev.id)

  revalidatePath('/admin/media')
  revalidatePath('/')
}

// Move item para baixo
export async function moverBaixo(id: string, categoria: Categoria) {
  const db = createSupabaseServiceClient()

  const { data: items } = await db
    .from('media')
    .select('id, posicao')
    .eq('categoria', categoria)
    .eq('ativo', true)
    .order('posicao', { ascending: true })

  if (!items) return
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0 || idx >= items.length - 1) return

  const curr = items[idx]!
  const next = items[idx + 1]!

  await db.from('media').update({ posicao: next.posicao }).eq('id', curr.id)
  await db.from('media').update({ posicao: curr.posicao }).eq('id', next.id)

  revalidatePath('/admin/media')
  revalidatePath('/')
}

// Substitui (ou cria) a mídia de um slot específico por categoria+posicao
export async function substituirSlot(data: {
  categoria: 'galeria' | 'hero' | 'video_intro' | 'outro'
  posicao: number
  nome: string
  tipo: 'imagem' | 'video'
  url: string
  storage_path: string
  alt: string
  tamanho_bytes: number
}) {
  const db = createSupabaseServiceClient()

  // Verifica se já existe um registro neste slot
  const { data: existing } = await db
    .from('media')
    .select('id, storage_path')
    .eq('categoria', data.categoria)
    .eq('posicao', data.posicao)
    .maybeSingle()

  if (existing) {
    // Remove o arquivo antigo do storage se tiver
    if (existing.storage_path) {
      await db.storage.from(BUCKET).remove([existing.storage_path])
    }
    // Atualiza o registro existente
    const { error } = await db
      .from('media')
      .update({
        nome: data.nome,
        tipo: data.tipo,
        url: data.url,
        storage_path: data.storage_path,
        alt: data.alt,
        tamanho_bytes: data.tamanho_bytes,
        ativo: true,
      })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    // Insere novo registro neste slot
    const { error } = await db.from('media').insert({ ...data })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/media')
  revalidatePath('/')
}

// Gera URL pública do storage
export async function getStorageUrl(path: string): Promise<string> {
  const db = createSupabaseServiceClient()
  const { data } = db.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
