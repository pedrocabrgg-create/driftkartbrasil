import { createSupabaseServiceClient } from './db/server'

export type SiteConfig = {
  whatsapp_numero: string
  whatsapp_display: string
  instagram: string
  endereco_rua: string
  endereco_complemento: string
  endereco_cep: string
  descricao_footer: string
  sobre_titulo: string
  sobre_texto_1: string
  sobre_texto_2: string
  numeros_karts: string
  nota_fechamento: string
  cta_titulo: string
  cta_subtitulo: string
  altura_min_cm: string
}

const DEFAULTS: SiteConfig = {
  whatsapp_numero: '5511976626414',
  whatsapp_display: '(11) 97662-6414',
  instagram: 'driftkartbrasil',
  endereco_rua: 'Estr. Dr. Cícero Borges de Morais, 100 B',
  endereco_complemento: 'Jardim Regina Alice — Barueri/SP',
  endereco_cep: '06407-000',
  descricao_footer: 'Kart elétrico indoor em Barueri/SP. Aulas, sessões, aniversários e eventos.',
  sobre_titulo: 'Apaixonados por kart desde sempre',
  sobre_texto_1: 'Nossa equipe é formada por instrutores experientes e amantes do automobilismo. Estamos aqui para garantir que você viva a melhor experiência possível na pista — com segurança, técnica e muita adrenalina.',
  sobre_texto_2: 'Crianças, adultos, iniciantes ou experientes: temos a sessão certa para você.',
  numeros_karts: '5',
  nota_fechamento: 'Segunda, terça e quarta: fechado. Reserve com antecedência.',
  cta_titulo: 'Pronto para acelerar?',
  cta_subtitulo: 'Garanta seu horário antes que esgote. Capacete e instrução inclusos em todas as sessões.',
  altura_min_cm: '130',
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const db = createSupabaseServiceClient()
  const { data } = await db.from('configuracoes').select('chave, valor')

  const m: Record<string, string> = {}
  for (const row of data ?? []) m[row.chave] = row.valor

  return {
    whatsapp_numero:      m['whatsapp_numero']           ?? DEFAULTS.whatsapp_numero,
    whatsapp_display:     m['site_whatsapp_display']     ?? DEFAULTS.whatsapp_display,
    instagram:            m['site_instagram']            ?? DEFAULTS.instagram,
    endereco_rua:         m['site_endereco_rua']         ?? DEFAULTS.endereco_rua,
    endereco_complemento: m['site_endereco_complemento'] ?? DEFAULTS.endereco_complemento,
    endereco_cep:         m['site_endereco_cep']         ?? DEFAULTS.endereco_cep,
    descricao_footer:     m['site_descricao_footer']     ?? DEFAULTS.descricao_footer,
    sobre_titulo:         m['site_sobre_titulo']         ?? DEFAULTS.sobre_titulo,
    sobre_texto_1:        m['site_sobre_texto_1']        ?? DEFAULTS.sobre_texto_1,
    sobre_texto_2:        m['site_sobre_texto_2']        ?? DEFAULTS.sobre_texto_2,
    numeros_karts:        m['site_numeros_karts']        ?? DEFAULTS.numeros_karts,
    nota_fechamento:      m['site_nota_fechamento']      ?? DEFAULTS.nota_fechamento,
    cta_titulo:           m['site_cta_titulo']           ?? DEFAULTS.cta_titulo,
    cta_subtitulo:        m['site_cta_subtitulo']        ?? DEFAULTS.cta_subtitulo,
    altura_min_cm:        m['altura_min_cm']             ?? DEFAULTS.altura_min_cm,
  }
}
