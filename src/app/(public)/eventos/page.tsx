import type { Metadata } from 'next'
import { Gift, Building2 } from 'lucide-react'
import { LeadForm } from '@/components/site/lead-form'

export const metadata: Metadata = {
  title: 'Eventos — Aniversários e Corporativo',
  description:
    'Organize seu aniversário ou evento corporativo na Drift Kart Brasil. Pista exclusiva para grupos.',
}

export default function EventosPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-20">
      <div className="mb-14 text-center">
        <h1 className="mb-3 text-4xl font-black text-white">Eventos Especiais</h1>
        <p className="text-muted-foreground">Aniversários e eventos corporativos com pista exclusiva.</p>
      </div>

      <div className="mb-14 grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <Gift className="mb-4 size-8 text-brand" />
          <h2 className="mb-3 text-xl font-bold text-white">Aniversários</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Celebre seu aniversário de um jeito diferente e inesquecível. Pista exclusiva para você
            e seus convidados, com direito a instrução e toda a estrutura da Drift Kart Brasil.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Pista exclusiva (até 10 pessoas)</li>
            <li>• 60 minutos de sessão</li>
            <li>• Instrutor dedicado</li>
            <li>• Equipamentos para todos</li>
            <li>• Orçamento personalizado</li>
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6">
          <Building2 className="mb-4 size-8 text-brand" />
          <h2 className="mb-3 text-xl font-bold text-white">Eventos Corporativos</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Confraternizações, team building e eventos de incentivo. Uma experiência única que une
            adrenalina, trabalho em equipe e muita diversão.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Sessões para grupos grandes</li>
            <li>• Pista fechada para sua empresa</li>
            <li>• Pacotes customizados</li>
            <li>• Nota fiscal disponível</li>
            <li>• Orçamento sob consulta</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-8">
        <h2 className="mb-2 text-2xl font-black text-white">Solicitar Orçamento</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Preencha o formulário e nossa equipe entrará em contato em até 24h úteis.
        </p>
        <LeadForm tipo="aniversario" />
      </div>
    </div>
  )
}
