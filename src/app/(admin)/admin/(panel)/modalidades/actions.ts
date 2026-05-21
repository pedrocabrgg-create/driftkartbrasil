'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

export async function toggleModalidadeAtiva(modalidadeId: string, ativa: boolean) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('modalidades').update({ ativa }).eq('id', modalidadeId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/modalidades')
}

export async function salvarModalidade(formData: FormData) {
  const id = formData.get('id') as string | null
  const nome = formData.get('nome') as string
  const duracao_min = Number(formData.get('duracao_min'))
  const capacidade_max = Number(formData.get('capacidade_max'))
  const preco_cheio_cents = Math.round(Number(formData.get('preco_cheio')) * 100)
  const sinal_percent = Number(formData.get('sinal_percent'))
  const exclusiva = formData.get('exclusiva') === 'true'
  const descricao = (formData.get('descricao') as string | null) ?? ''
  const destaque = (formData.get('destaque') as string | null) || null

  const db = createSupabaseServiceClient()

  if (id) {
    const { error } = await db
      .from('modalidades')
      .update({ nome, duracao_min, capacidade_max, preco_cheio_cents, sinal_percent, exclusiva, descricao, destaque })
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await db
      .from('modalidades')
      .insert({ nome, duracao_min, capacidade_max, preco_cheio_cents, sinal_percent, exclusiva, descricao, destaque })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/modalidades')
}
