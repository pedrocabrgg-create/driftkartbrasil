import type { Metadata } from 'next'
import { ConsultarClient } from './consultar-client'

export const metadata: Metadata = {
  title: 'Consultar Agendamento — Drift Kart Brasil',
  description: 'Consulte seus agendamentos pelo CPF.',
}

export default function ConsultarPage() {
  return <ConsultarClient />
}
