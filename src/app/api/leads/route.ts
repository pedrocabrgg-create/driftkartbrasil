import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { z } from 'zod'

const schema = z.object({
  tipo: z.enum(['aula', 'aniversario', 'corporativo']),
  nome: z.string().min(2),
  telefone: z.string().min(8),
  email: z.string().email().optional().or(z.literal('')),
  participantes: z.number().int().min(1).optional(),
  mensagem: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const data = schema.parse(body)

    const supabase = createSupabaseServiceClient()

    const { error } = await supabase.from('leads').insert({
      tipo: data.tipo,
      nome: data.nome,
      telefone: data.telefone.replace(/\D/g, ''),
      email: data.email || null,
      participantes: data.participantes ?? null,
      mensagem: data.mensagem ?? null,
      status: 'novo',
    })

    if (error) {
      console.error('[leads] insert error:', error.message)
      return NextResponse.json({ error: 'Erro ao salvar lead' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
