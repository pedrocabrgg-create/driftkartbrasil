'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

export async function toggleKartAtivo(kartId: number, ativo: boolean) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('karts').update({ ativo }).eq('id', kartId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/karts')
}

export async function atualizarKart(formData: FormData) {
  const id = Number(formData.get('id'))
  const apelido = (formData.get('apelido') as string | null) || null
  const observacao = (formData.get('observacao') as string | null) || null

  const db = createSupabaseServiceClient()
  const { error } = await db.from('karts').update({ apelido, observacao }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/karts')
}
