'use client'

import dynamic from 'next/dynamic'

const LogoViewer3D = dynamic(
  () => import('./LogoViewer3D').then((m) => m.LogoViewer3D),
  { ssr: false }
)

export function LogoViewer3DClient({ opacity }: { opacity?: number }) {
  return <LogoViewer3D opacity={opacity} />
}
