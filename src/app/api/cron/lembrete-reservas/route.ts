import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { enviarEmailLembrete } from '@/lib/email'
import { formatDateTimeBr, toBrTime } from '@/lib/dates'

// Rota chamada pelo Vercel Cron diariamente às 10h.
// Envia lembrete para reservas confirmadas com sessão no dia seguinte.
export async function GET(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env['CRON_SECRET']) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createSupabaseServiceClient()

  // Janela: amanhã de 00:00 a 23:59:59 UTC (o frontend exibe em SP)
  const amanha = new Date()
  amanha.setUTCDate(amanha.getUTCDate() + 1)
  amanha.setUTCHours(0, 0, 0, 0)
  const amanhaFim = new Date(amanha)
  amanhaFim.setUTCHours(23, 59, 59, 999)

  const { data: reservas, error } = await db
    .from('reservas')
    .select(`
      id, inicio_at, fim_at, total_cents, sinal_cents,
      modalidades!modalidade_id ( nome ),
      clientes!cliente_organizador_id ( email, nome )
    `)
    .eq('status', 'confirmada')
    .gte('inicio_at', amanha.toISOString())
    .lte('inicio_at', amanhaFim.toISOString())

  if (error) {
    console.error('[cron/lembrete-reservas] query error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let enviados = 0

  for (const reserva of reservas ?? []) {
    const cliente = reserva.clientes as { email: string | null; nome: string } | null
    const modalidade = reserva.modalidades as { nome: string } | null

    if (!cliente?.email) continue

    try {
      await enviarEmailLembrete({
        toEmail: cliente.email,
        toNome: cliente.nome,
        reservaId: reserva.id,
        modalidade: modalidade?.nome ?? 'Sessão',
        dataHora: formatDateTimeBr(toBrTime(reserva.inicio_at)),
        totalCents: reserva.total_cents,
        sinalCents: reserva.sinal_cents,
      })
      enviados++
    } catch (e) {
      console.error('[cron/lembrete-reservas] email error:', e instanceof Error ? e.message : e)
    }
  }

  console.info(`[cron/lembrete-reservas] ${enviados} lembrete(s) enviado(s)`)
  return NextResponse.json({ ok: true, enviados })
}
