import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

export const metadata: Metadata = {
  title: 'Grade de Horários — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const DIAS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

async function criarSlot(formData: FormData) {
  'use server'
  const dia_semana = formData.get('dia_semana')
  const data_excecao = (formData.get('data_excecao') as string | null) || null
  const hora_inicio = formData.get('hora_inicio') as string
  const hora_fim = formData.get('hora_fim') as string

  const db = createSupabaseServiceClient()
  await db.from('grade_horarios').insert({
    dia_semana: dia_semana ? Number(dia_semana) : null,
    data_excecao,
    hora_inicio,
    hora_fim,
  })
  revalidatePath('/admin/grade')
}

export default async function GradePage() {
  const db = createSupabaseServiceClient()
  const { data: slots } = await db
    .from('grade_horarios')
    .select('*')
    .order('dia_semana', { ascending: true, nullsFirst: false })
    .order('hora_inicio')

  const regulares = (slots ?? []).filter((s) => s.dia_semana !== null)
  const excecoes = (slots ?? []).filter((s) => s.data_excecao !== null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Grade de Horários</h1>

      {/* Horários regulares por dia da semana */}
      <section>
        <h2 className="mb-4 font-semibold text-white">Horários Regulares</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-card">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Início</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fim</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody>
              {regulares.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum horário regular configurado.
                  </td>
                </tr>
              )}
              {regulares.map((s) => {
                async function toggleSlot() {
                  'use server'
                  const db2 = createSupabaseServiceClient()
                  await db2.from('grade_horarios').update({ ativo: !s.ativo }).eq('id', s.id)
                  revalidatePath('/admin/grade')
                }
                return (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">
                      {DIAS[s.dia_semana ?? 0] ?? `Dia ${s.dia_semana}`}
                    </td>
                    <td className="px-4 py-3 font-mono text-white">{s.hora_inicio}</td>
                    <td className="px-4 py-3 font-mono text-white">{s.hora_fim}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${s.ativo ? 'text-brand' : 'text-muted-foreground'}`}
                      >
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleSlot}>
                        <button
                          type="submit"
                          className={`text-xs hover:underline ${s.ativo ? 'text-destructive' : 'text-brand'}`}
                        >
                          {s.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Exceções */}
      {excecoes.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-white">Exceções de Data</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-card">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Início</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fim</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {excecoes.map((s) => {
                  async function toggleExcecao() {
                    'use server'
                    const db2 = createSupabaseServiceClient()
                    await db2.from('grade_horarios').update({ ativo: !s.ativo }).eq('id', s.id)
                    revalidatePath('/admin/grade')
                  }
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white">{s.data_excecao}</td>
                      <td className="px-4 py-3 font-mono text-white">{s.hora_inicio}</td>
                      <td className="px-4 py-3 font-mono text-white">{s.hora_fim}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${s.ativo ? 'text-brand' : 'text-muted-foreground'}`}
                        >
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleExcecao}>
                          <button
                            type="submit"
                            className={`text-xs hover:underline ${s.ativo ? 'text-destructive' : 'text-brand'}`}
                          >
                            {s.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Adicionar slot */}
      <section className="rounded-xl border border-white/10 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Adicionar Horário</h2>
        <form action={criarSlot} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Dia da semana</label>
            <select
              name="dia_semana"
              className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            >
              <option value="">— Exceção de data —</option>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {DIAS[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data exceção (se aplicável)</label>
            <input
              name="data_excecao"
              type="date"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Horário início</label>
            <input
              name="hora_inicio"
              type="time"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Horário fim</label>
            <input
              name="hora_fim"
              type="time"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-black hover:bg-brand/90"
            >
              Adicionar
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
