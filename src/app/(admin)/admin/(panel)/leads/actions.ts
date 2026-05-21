'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'
import type { LeadStatus } from '@/lib/db/types'

export async function atualizarStatusLead(leadId: string, status: LeadStatus) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('leads').update({ status }).eq('id', leadId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}
