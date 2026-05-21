import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { MediaManager } from './media-manager'

export const metadata: Metadata = {
  title: 'Mídia — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const db = createSupabaseServiceClient()
  const { data } = await db
    .from('media')
    .select('*')
    .order('categoria', { ascending: true })
    .order('posicao', { ascending: true })

  return <MediaManager initialItems={data ?? []} />
}
