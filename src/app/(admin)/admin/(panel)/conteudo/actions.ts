'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/db/server'

async function upsertConfig(chave: string, valor: string) {
  const db = createSupabaseServiceClient()
  await db
    .from('configuracoes')
    .upsert({ chave, valor }, { onConflict: 'chave' })
}

export async function salvarConteudo(formData: FormData) {
  const campos = [
    'site_whatsapp_display',
    'whatsapp_numero',
    'site_instagram',
    'site_endereco_rua',
    'site_endereco_complemento',
    'site_endereco_cep',
    'site_descricao_footer',
    'site_sobre_titulo',
    'site_sobre_texto_1',
    'site_sobre_texto_2',
    'site_numeros_karts',
    'site_nota_fechamento',
    'site_cta_titulo',
    'site_cta_subtitulo',
  ]

  await Promise.all(
    campos.map((chave) => {
      const valor = (formData.get(chave) as string | null) ?? ''
      return upsertConfig(chave, valor)
    }),
  )

  revalidatePath('/')
  revalidatePath('/admin/conteudo')
}
