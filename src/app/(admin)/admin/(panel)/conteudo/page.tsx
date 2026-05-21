import type { Metadata } from 'next'
import { getSiteConfig } from '@/lib/site-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { salvarConteudo } from './actions'

export const metadata: Metadata = { title: 'Conteúdo do Site — Admin' }
export const dynamic = 'force-dynamic'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, name, value, placeholder, type = 'text' }: {
  label: string; name: string; value: string; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={value} placeholder={placeholder} type={type} />
    </div>
  )
}

function TextareaField({ label, name, value, placeholder, rows = 3 }: {
  label: string; name: string; value: string; placeholder?: string; rows?: number
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={value} placeholder={placeholder} rows={rows} />
    </div>
  )
}

export default async function ConteudoPage() {
  const cfg = await getSiteConfig()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Conteúdo do Site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite textos, contato e informações exibidas no site. As alterações ficam visíveis imediatamente.
        </p>
      </div>

      <form action={salvarConteudo} className="space-y-6">

        <Section title="Contato & Redes Sociais">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp (número, só dígitos)" name="whatsapp_numero" value={cfg.whatsapp_numero} placeholder="5511976626414" />
            <Field label="WhatsApp (exibição no site)" name="site_whatsapp_display" value={cfg.whatsapp_display} placeholder="(11) 97662-6414" />
          </div>
          <Field label="Instagram (sem @)" name="site_instagram" value={cfg.instagram} placeholder="driftkartbrasil" />
        </Section>

        <Section title="Endereço">
          <Field label="Rua / Número" name="site_endereco_rua" value={cfg.endereco_rua} placeholder="Estr. Dr. Cícero Borges de Morais, 100 B" />
          <Field label="Bairro / Cidade / Estado" name="site_endereco_complemento" value={cfg.endereco_complemento} placeholder="Jardim Regina Alice — Barueri/SP" />
          <Field label="CEP" name="site_endereco_cep" value={cfg.endereco_cep} placeholder="06407-000" />
          <Field label="Descrição no rodapé" name="site_descricao_footer" value={cfg.descricao_footer} />
        </Section>

        <Section title='Seção "Quem Somos"'>
          <Field label="Título" name="site_sobre_titulo" value={cfg.sobre_titulo} />
          <TextareaField label="Parágrafo 1" name="site_sobre_texto_1" value={cfg.sobre_texto_1} rows={4} />
          <TextareaField label="Parágrafo 2" name="site_sobre_texto_2" value={cfg.sobre_texto_2} rows={3} />
        </Section>

        <Section title="Números & Horários">
          <Field label="Quantidade de karts (exibida na home)" name="site_numeros_karts" value={cfg.numeros_karts} placeholder="5" />
          <Field label="Nota de dias fechados" name="site_nota_fechamento" value={cfg.nota_fechamento} placeholder="Segunda, terça e quarta: fechado." />
          <p className="text-xs text-muted-foreground">
            Os horários de funcionamento são editados em{' '}
            <a href="/admin/grade" className="text-brand underline-offset-2 hover:underline">Grade de Horários</a>.
          </p>
        </Section>

        <Section title="CTA Final (botão de reserva)">
          <Field label="Título" name="site_cta_titulo" value={cfg.cta_titulo} />
          <TextareaField label="Subtítulo" name="site_cta_subtitulo" value={cfg.cta_subtitulo} rows={2} />
        </Section>

        <div className="flex justify-end">
          <Button type="submit" className="bg-brand text-black hover:bg-brand/90 px-8">
            Salvar tudo
          </Button>
        </div>
      </form>
    </div>
  )
}
