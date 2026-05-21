'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

export async function atualizarConfiguracao(chave: string, formData: FormData) {
  const valor = (formData.get('valor') as string | null) ?? ''
  const db = createSupabaseServiceClient()
  const { error } = await db.from('configuracoes').update({ valor }).eq('chave', chave)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function salvarAnthropicKey(formData: FormData) {
  const chave = (formData.get('api_key') as string | null)?.trim() ?? ''
  if (!chave.startsWith('sk-ant-')) throw new Error('Chave inválida. Deve começar com sk-ant-')
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('configuracoes')
    .upsert({ chave: 'anthropic_api_key', valor: chave }, { onConflict: 'chave' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function removerAnthropicKey() {
  const db = createSupabaseServiceClient()
  await db.from('configuracoes').delete().eq('chave', 'anthropic_api_key')
  revalidatePath('/admin/configuracoes')
}

export async function salvarDominio(formData: FormData) {
  const dominio = (formData.get('dominio') as string | null)?.trim().toLowerCase() ?? ''
  if (!dominio) throw new Error('Domínio inválido.')
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('configuracoes')
    .upsert({ chave: 'dominio_proprio', valor: dominio }, { onConflict: 'chave' })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}
