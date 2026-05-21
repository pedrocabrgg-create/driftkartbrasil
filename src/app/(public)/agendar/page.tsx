import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { BookingWizard } from './booking-wizard'

export const metadata: Metadata = {
  title: 'Agendar Sessão',
  description:
    'Agende sua sessão de kart elétrico na Drift Kart Brasil. Fácil, rápido e seguro.',
}

export const dynamic = 'force-dynamic'

export default async function AgendarPage() {
  const db = createSupabaseServiceClient()
  const { data: modalidades } = await db
    .from('modalidades')
    .select('*')
    .eq('ativa', true)
    .order('duracao_min')

  return (
    <div className="min-h-screen bg-background">
      <BookingWizard modalidades={modalidades ?? []} />
    </div>
  )
}
