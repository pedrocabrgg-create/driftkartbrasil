import type { Metadata } from 'next'
import { Geist, Geist_Mono, Bebas_Neue } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://www.driftkartbrasil.com.br'),
  title: {
    default: 'Drift Kart Brasil — Kart Elétrico em Barueri/SP',
    template: '%s | Drift Kart Brasil',
  },
  description:
    'Aulas, sessões, aniversários e eventos corporativos de kart elétrico indoor em Barueri/SP. Crianças a partir de 1,30 m.',
  keywords: ['kart elétrico', 'drift kart', 'barueri', 'são paulo', 'kart indoor', 'aniversário'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Drift Kart Brasil',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Desabilita scroll restoration do browser — página sempre inicia no topo */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';window.scrollTo(0,0);" }} />
        {children}
      </body>
    </html>
  )
}
