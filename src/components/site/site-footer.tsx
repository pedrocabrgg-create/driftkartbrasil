import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { getSiteConfig } from '@/lib/site-config'

const footerLinks: { href: '/' | '/sessoes' | '/eventos' | '/blog' | '/contato' | '/consultar'; label: string }[] = [
  { href: '/', label: 'Início' },
  { href: '/sessoes', label: 'Sessões' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
  { href: '/consultar', label: 'Minha Reserva' },
]

export async function SiteFooter() {
  const cfg = await getSiteConfig()

  return (
    <footer
      className="relative bg-[#0a0a0a]"
      style={{ boxShadow: '0 -80px 80px 40px #0a0a0a' }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Marca */}
          <div>
            <p className="font-bebas mb-3 text-2xl tracking-wide">
              <span className="text-brand">DRIFT KART</span>{' '}
              <span className="text-white">BRASIL</span>
            </p>
            <p className="text-sm text-muted-foreground">{cfg.descricao_footer}</p>
          </div>

          {/* Links */}
          <div>
            <p className="font-bebas mb-3 text-base tracking-wider text-brand">Navegação</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="font-bebas text-sm tracking-wide hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <p className="font-bebas mb-3 text-base tracking-wider text-brand">Contato</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  {cfg.endereco_rua}<br />
                  {cfg.endereco_complemento}<br />
                  CEP {cfg.endereco_cep}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-brand" />
                <a
                  href={`https://wa.me/${cfg.whatsapp_numero}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {cfg.whatsapp_display}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-brand">IG</span>
                <a
                  href={`https://instagram.com/${cfg.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  @{cfg.instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Drift Kart Brasil — CNPJ 58.527.924/0001-20. Todos os
            direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
