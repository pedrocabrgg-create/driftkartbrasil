'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/db/server'
import { enviarEmailReservaRecebida } from '@/lib/email'
import { formatDateTimeBr, toBrTime } from '@/lib/dates'
import type { Json } from '@/lib/db/types'

async function getActorId(): Promise<string | null> {
  try {
    const db = await createSupabaseServerClient()
    const {
      data: { user },
    } = await db.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

async function audit(action: string, entityId: string, diff?: Json) {
  const db = createSupabaseServiceClient()
  const actorId = await getActorId()
  await db.from('audit_log').insert({
    actor_user_id: actorId,
    action,
    entity: 'reservas',
    entity_id: entityId,
    diff: diff ?? null,
  })
}

export async function marcarSinalPago(reservaId: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('reservas')
    .update({ status: 'confirmada', sinal_pago_at: new Date().toISOString() })
    .eq('id', reservaId)
    .eq('status', 'aguardando_sinal')

  if (error) throw new Error(error.message)
  await audit('sinal_confirmado', reservaId, { novo_status: 'confirmada' })
  revalidatePath(`/admin/reservas/${reservaId}`)
  revalidatePath('/admin/reservas')
  revalidatePath('/admin')
}

export async function cancelarReserva(reservaId: string, formData: FormData) {
  const motivo = (formData.get('motivo') as string | null) ?? ''
  const db = createSupabaseServiceClient()
  const actorId = await getActorId()

  const { error } = await db
    .from('reservas')
    .update({
      status: 'cancelada',
      motivo_cancelamento: motivo || null,
      cancelado_por: actorId ?? 'admin',
    })
    .eq('id', reservaId)
    .in('status', ['aguardando_sinal', 'confirmada'])

  if (error) throw new Error(error.message)
  await audit('cancelada', reservaId, { motivo })
  revalidatePath(`/admin/reservas/${reservaId}`)
  revalidatePath('/admin/reservas')
  revalidatePath('/admin')
}

export async function marcarConcluida(reservaId: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('reservas')
    .update({ status: 'concluida' })
    .eq('id', reservaId)
    .eq('status', 'confirmada')

  if (error) throw new Error(error.message)
  await audit('concluida', reservaId)
  revalidatePath(`/admin/reservas/${reservaId}`)
  revalidatePath('/admin/reservas')
  revalidatePath('/admin')
}

export async function marcarPresenca(formData: FormData) {
  const pilotoId = formData.get('pilotoId') as string
  const presenca = formData.get('presenca') as 'presente' | 'no_show'
  const reservaId = formData.get('reservaId') as string

  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('reserva_pilotos')
    .update({ presenca })
    .eq('id', pilotoId)

  if (error) throw new Error(error.message)
  await audit('presenca_atualizada', reservaId, { pilotoId, presenca })
  revalidatePath(`/admin/reservas/${reservaId}`)
}

export async function reenviarEmail(reservaId: string) {
  const db = createSupabaseServiceClient()
  const { data: reserva, error } = await db
    .from('reservas')
    .select(`
      id, inicio_at, pilotos_count, total_cents, sinal_cents,
      modalidades!modalidade_id ( nome, sinal_percent ),
      clientes!cliente_organizador_id ( nome, email )
    `)
    .eq('id', reservaId)
    .single()

  if (error || !reserva) throw new Error('Reserva não encontrada')

  const cliente = reserva.clientes as { nome: string; email: string | null } | null
  const mod = reserva.modalidades as { nome: string; sinal_percent: number } | null

  if (!cliente?.email) throw new Error('Cliente sem e-mail cadastrado')

  await enviarEmailReservaRecebida({
    toEmail: cliente.email,
    toNome: cliente.nome,
    reservaId,
    modalidade: mod?.nome ?? '',
    dataHora: formatDateTimeBr(toBrTime(reserva.inicio_at)),
    pilotos: reserva.pilotos_count,
    totalCents: reserva.total_cents,
    sinalCents: reserva.sinal_cents,
    sinalPct: mod?.sinal_percent ?? 30,
  })

  await audit('email_reenviado', reservaId)
  revalidatePath(`/admin/reservas/${reservaId}`)
}
