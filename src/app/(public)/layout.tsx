import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { WhatsAppButton } from '@/components/site/whatsapp-button'
import { PageBackground } from '@/components/PageBackground'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageBackground />
      <SiteHeader />
      <main className="flex-1 pt-14">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  )
}
