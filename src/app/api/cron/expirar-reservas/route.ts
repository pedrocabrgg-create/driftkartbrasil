import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/db/server'

// Rota chamada pelo Vercel Cron a cada hora.
// Cancela reservas aguardando_sinal cujo expires_at já passou.
export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env['CRON_SECRET']) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createSupabaseServiceClient()
  const agora = new Date().toISOString()

  const { data: expiradas, error } = await db
    .from('reservas')
    .select('id')
    .eq('status', 'aguardando_sinal')
    .lt('expires_at', agora)

  if (error) {
    console.error('[cron/expirar-reservas] query error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!expiradas || expiradas.length === 0) {
    return NextResponse.json({ ok: true, canceladas: 0 })
  }

  const ids = expiradas.map((r) => r.id)

  // Atualiza status → cancelada (o trigger sync_kart_alocacao_status
  // atualiza kart_alocacoes.status_reserva automaticamente, liberando as vagas)
  const { error: updateError } = await db
    .from('reservas')
    .update({ status: 'cancelada', motivo_cancelamento: 'TTL expirado — sinal não confirmado' })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/expirar-reservas] update error:', updateError.message)
    return NextResponse.json({ error: 'Update error' }, { status: 500 })
  }

  console.info(`[cron/expirar-reservas] ${ids.length} reserva(s) cancelada(s)`)
  return NextResponse.json({ ok: true, canceladas: ids.length })
}
