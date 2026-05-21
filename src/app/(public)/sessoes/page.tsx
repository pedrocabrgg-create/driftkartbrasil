import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Sessões e Modalidades',
  description:
    'Conheça as modalidades de kart elétrico da Drift Kart Brasil: Bateria 25 min, 40 min e 60 min Grupo.',
}

const modalidades = [
  {
    nome: 'Bateria 25 minutos',
    preco: 'R$ 80',
    precoSinal: 'R$ 24',
    duracao: '25 minutos',
    capacidade: 'Até 4 pilotos simultâneos',
    descricao:
      'A sessão ideal para quem quer ter o primeiro contato com o drift ou treinar em pouco tempo. Aula de técnica inclusa.',
    inclusos: [
      'Briefing de segurança',
      'Capacete e equipamentos',
      'Instrução do piloto',
      'Aula de técnica de drift',
    ],
    exclusiva: false,
    destaque: false,
  },
  {
    nome: 'Bateria 40 minutos',
    preco: 'R$ 120',
    precoSinal: 'R$ 36',
    duracao: '40 minutos',
    capacidade: 'Até 4 pilotos simultâneos',
    descricao:
      'Mais tempo na pista para evoluir na técnica, experimentar diferentes linhas e aproveitar ao máximo a experiência.',
    inclusos: [
      'Briefing de segurança',
      'Capacete e equipamentos',
      'Instrução do piloto',
      'Aula de técnica de drift',
    ],
    exclusiva: false,
    destaque: true,
  },
  {
    nome: 'Bateria 60 min — Grupo',
    preco: 'R$ 250',
    precoSinal: 'R$ 75',
    duracao: '60 minutos',
    capacidade: 'Até 10 pessoas',
    descricao:
      'Pista exclusiva para o seu grupo. A melhor opção para aniversários, confraternizações e eventos corporativos. Sessão fechada, sem outros visitantes na pista.',
    inclusos: [
      'Pista exclusiva',
      'Briefing de segurança',
      'Capacetes e equipamentos',
      'Instrutor dedicado',
      'Aula de técnica de drift',
    ],
    exclusiva: true,
    destaque: false,
  },
]

export default function SessoesPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-20">
      <div className="mb-14 text-center">
        <h1 className="mb-3 text-4xl font-black text-white">Sessões e Modalidades</h1>
        <p className="text-muted-foreground">
          Crianças a partir de 1,30m já conseguem pilotar e ter aula conosco.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {modalidades.map((mod) => (
          <div
            key={mod.nome}
            className={`relative flex flex-col rounded-xl border p-6 ${
              mod.destaque ? 'border-brand/50 bg-brand/5' : 'border-white/10 bg-card'
            }`}
          >
            {mod.destaque && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-brand-foreground">
                MAIS POPULAR
              </span>
            )}
            {mod.exclusiva && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-0.5 text-xs font-bold text-white">
                PISTA EXCLUSIVA
              </span>
            )}

            <h2 className="mb-1 text-xl font-bold text-white">{mod.nome}</h2>
            <p className="mb-1 text-3xl font-black text-brand">{mod.preco}</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Sinal: {mod.precoSinal} (30%, não reembolsável)
            </p>

            <p className="mb-5 flex-1 text-sm text-muted-foreground">{mod.descricao}</p>

            <ul className="mb-5 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 text-brand" /> {mod.duracao}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 text-brand" /> {mod.capacidade}
              </li>
            </ul>

            <ul className="mb-6 space-y-2">
              {mod.inclusos.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={`w-full font-bold ${
                mod.destaque
                  ? 'bg-brand text-brand-foreground hover:bg-brand/90'
                  : 'bg-brand text-brand-foreground hover:bg-brand/90'
              }`}
            >
              <Link href="/agendar">Agendar</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-brand/20 bg-brand/5 p-8 text-center">
        <p className="mb-2 text-lg font-bold text-white">
          Recomendamos reservar com antecedência para garantir seu horário
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          O sinal de 30% reserva sua vaga. Os 70% restantes são pagos no local antes da sessão.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-brand font-bold text-brand-foreground hover:bg-brand/90"
        >
          <Link href="/agendar">Agendar agora</Link>
        </Button>
      </div>
    </div>
  )
}
