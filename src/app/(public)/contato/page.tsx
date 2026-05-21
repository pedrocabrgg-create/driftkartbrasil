import type { Metadata } from 'next'
import { MapPin, Phone, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Entre em contato com a Drift Kart Brasil. Endereço, WhatsApp e horários de funcionamento.',
}

const WHATSAPP = process.env['NEXT_PUBLIC_WHATSAPP_NUMBER'] ?? '5511976626414'

const horarios = [
  { dia: 'Quinta-feira', horario: '16:00 — 23:00' },
  { dia: 'Sexta-feira', horario: '16:00 — 23:00' },
  { dia: 'Sábado', horario: '09:00 — 21:00' },
  { dia: 'Domingo', horario: '12:00 — 21:00' },
  { dia: 'Seg / Ter / Qua', horario: 'Fechado' },
]

export default function ContatoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-20">
      <div className="mb-14 text-center">
        <h1 className="mb-3 text-4xl font-black text-white">Contato</h1>
        <p className="text-muted-foreground">Estamos aqui para ajudar.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Informações */}
        <div className="space-y-8">
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-brand" />
              <div>
                <p className="mb-1 font-semibold text-white">Endereço</p>
                <p className="text-sm text-muted-foreground">
                  Estr. Dr. Cícero Borges de Morais, 100 B
                  <br />
                  Jardim Regina Alice — Barueri/SP
                  <br />
                  CEP 06407-000
                </p>
                <a
                  href="https://maps.google.com/?q=Estr.+Dr.+Cícero+Borges+de+Morais,+100+B,+Jardim+Regina+Alice,+Barueri,+SP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-brand hover:underline"
                >
                  Abrir no Google Maps →
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="flex items-center gap-3">
              <Phone className="size-5 shrink-0 text-brand" />
              <div>
                <p className="mb-1 font-semibold text-white">WhatsApp</p>
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand hover:underline"
                >
                  (11) 97662-6414
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="flex items-start gap-3">
              <Clock className="mt-1 size-5 shrink-0 text-brand" />
              <div className="w-full">
                <p className="mb-3 font-semibold text-white">Horários</p>
                <ul className="space-y-2">
                  {horarios.map((h) => (
                    <li key={h.dia} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{h.dia}</span>
                      <span
                        className={h.horario === 'Fechado' ? 'text-muted-foreground' : 'text-white'}
                      >
                        {h.horario}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="overflow-hidden rounded-xl border border-white/10">
          <iframe
            title="Localização Drift Kart Brasil"
            src="https://maps.google.com/maps?q=Estr.+Dr.+Cícero+Borges+de+Morais,+100+B,+Jardim+Regina+Alice,+Barueri,+SP&output=embed"
            className="h-full min-h-[400px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}
