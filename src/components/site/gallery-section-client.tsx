'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { PhotoLightbox, type LightboxPhoto } from './photo-lightbox'

function MediaCard({
  item,
  index,
  className,
  imgClassName,
  onOpen,
}: {
  item: LightboxPhoto
  index: number
  className?: string
  imgClassName?: string
  onOpen: (i: number) => void
}) {
  const isVideo = item.tipo === 'video'

  return (
    <div className={`group relative overflow-hidden rounded-xl ${className ?? ''}`}>
      {isVideo ? (
        <div className={`flex h-full w-full items-center justify-center bg-black/80 ${imgClassName ?? ''}`}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={item.src}
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-70 transition-opacity duration-700 group-hover:opacity-90"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="size-5 fill-brand text-brand" />
            </div>
          </div>
        </div>
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          width={900}
          height={700}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-103 ${imgClassName ?? ''}`}
        />
      )}
      <button
        type="button"
        aria-label={isVideo ? `Reproduzir vídeo: ${item.alt}` : `Ampliar foto: ${item.alt}`}
        onClick={() => onOpen(index)}
        className="absolute inset-0 cursor-zoom-in bg-transparent"
      />
      {item.caption && (
        <div className="font-bebas pointer-events-none absolute bottom-4 left-4 rounded bg-black/70 px-3 py-1.5 text-sm tracking-wider text-white">
          {item.caption}
        </div>
      )}
    </div>
  )
}

export function GallerySectionClient({ photos }: { photos: LightboxPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const preview = photos.slice(0, 3)
  const [first, second, third] = preview

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:h-[440px] md:grid-cols-12 md:grid-rows-2">
        {first && (
          <MediaCard
            item={first}
            index={0}
            className="col-span-2 md:col-span-7 md:row-span-2"
            onOpen={setLightboxIndex}
          />
        )}
        {second && (
          <MediaCard
            item={second}
            index={1}
            className="md:col-span-5"
            imgClassName="min-h-[120px]"
            onOpen={setLightboxIndex}
          />
        )}
        {third && (
          <MediaCard
            item={third}
            index={2}
            className="md:col-span-5"
            imgClassName="min-h-[120px]"
            onOpen={setLightboxIndex}
          />
        )}
      </div>

      {photos.length > 3 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="font-bebas cursor-pointer border border-white/40 bg-white/5 px-8 py-3.5 text-base tracking-widest text-white transition-colors hover:border-white/70 hover:bg-white/10"
          >
            Ver Galeria Completa ({photos.length} {photos.every(p => p.tipo !== 'video') ? 'fotos' : 'mídias'})
          </button>
        </div>
      )}

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </>
  )
}
