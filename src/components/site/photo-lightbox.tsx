'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export interface LightboxPhoto {
  src: string
  alt: string
  caption?: string
  tipo?: 'imagem' | 'video'
}

interface Props {
  photos: LightboxPhoto[]
  index: number | null
  onClose: () => void
  onChange: (index: number) => void
}

export function PhotoLightbox({ photos, index, onClose, onChange }: Props) {
  const prev = useCallback(() => {
    if (index === null) return
    onChange((index - 1 + photos.length) % photos.length)
  }, [index, photos.length, onChange])

  const next = useCallback(() => {
    if (index === null) return
    onChange((index + 1) % photos.length)
  }, [index, photos.length, onChange])

  useEffect(() => {
    if (index === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [index, onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = index !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [index])

  if (index === null) return null

  const photo = photos[index]
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Fechar */}
      <button
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X className="size-5" />
      </button>

      {/* Anterior */}
      {photos.length > 1 && (
        <button
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          onClick={(e) => { e.stopPropagation(); prev() }}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {/* Mídia */}
      <div
        className="relative mx-16 max-h-[88vh] max-w-[88vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.tipo === 'video' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={photo.src}
            controls
            autoPlay
            loop
            className="max-h-[82vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
          />
        ) : (
          <Image
            src={photo.src}
            alt={photo.alt}
            width={1400}
            height={1050}
            className="max-h-[82vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
            priority
          />
        )}
        {photo.caption && (
          <p className="mt-3 text-center text-sm text-white/50">{photo.caption}</p>
        )}
      </div>

      {/* Próxima */}
      {photos.length > 1 && (
        <button
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          onClick={(e) => { e.stopPropagation(); next() }}
          aria-label="Próxima"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      {/* Contador */}
      <p className="font-bebas absolute bottom-5 left-1/2 -translate-x-1/2 text-sm tracking-[0.2em] text-white/40">
        {index + 1} / {photos.length}
      </p>
    </div>
  )
}
