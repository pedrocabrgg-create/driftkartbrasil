import { createSupabaseServiceClient } from '@/lib/db/server'
import { GallerySectionClient } from './gallery-section-client'
import type { LightboxPhoto } from './photo-lightbox'

const STATIC_FALLBACK: LightboxPhoto[] = [
  { src: '/images/kart-02.jpg', alt: 'Kart elétrico Drift #05 na pista', caption: 'Kart Drift #05' },
  { src: '/images/kart-01.jpg', alt: 'Karts elétricos na pista' },
  { src: '/images/kart-bateria.jpg', alt: 'Sistema de bateria elétrica' },
  { src: '/images/pista-track.jpg', alt: 'Vista panorâmica da pista indoor' },
  { src: '/images/pista-panoramica.jpg', alt: 'Pista panorâmica Drift Kart Brasil' },
  { src: '/images/evento-grupo.jpg', alt: 'Evento em grupo na pista' },
  { src: '/images/kart-motor.jpg', alt: 'Motor e transmissão do kart elétrico' },
  { src: '/images/funcionarios.jpg', alt: 'Equipe Drift Kart Brasil' },
]

export async function GallerySection() {
  let photos: LightboxPhoto[] = []

  try {
    const db = createSupabaseServiceClient()
    const { data } = await db
      .from('media')
      .select('url, alt, nome, tipo')
      .eq('categoria', 'galeria')
      .eq('ativo', true)
      .order('posicao', { ascending: true })

    if (data && data.length > 0) {
      photos = data.map((m) => ({ src: m.url, alt: m.alt, tipo: m.tipo as 'imagem' | 'video' }))
    }
  } catch {
    // DB not ready yet — fall through to static fallback
  }

  if (photos.length === 0) {
    photos = STATIC_FALLBACK
  }

  return <GallerySectionClient photos={photos} />
}
