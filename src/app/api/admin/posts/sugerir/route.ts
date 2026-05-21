import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { getAnthropicKey } from '@/lib/get-anthropic-key'

const TEMAS = [
  'dicas para iniciantes no kart elétrico',
  'diferenças entre kart a gasolina e kart elétrico',
  'como melhorar sua técnica de pilotagem no kart',
  'kart drift: o que é e como praticar',
  'kart indoor vs kart outdoor: vantagens e desvantagens',
  'benefícios do kart elétrico para o meio ambiente',
  'como preparar seu filho para a primeira experiência no kart',
  'segurança no kart: equipamentos e cuidados essenciais',
  'kart como esporte corporativo: team building na pista',
  'como organizar uma festa de aniversário na pista de kart',
  'a adrenalina do kart elétrico em Barueri',
  'evolução do kart elétrico no Brasil',
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST() {
  const apiKey = await getAnthropicKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key da Anthropic não configurada. Acesse Configurações no painel para adicionar.' }, { status: 400 })
  }

  const tema = TEMAS[Math.floor(Math.random() * TEMAS.length)]

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: `Você é um redator especializado em conteúdo para uma pista de kart elétrico indoor chamada Drift Kart Brasil, localizada em Barueri/SP.
Escreva posts de blog envolventes, em português brasileiro, com tom animado e acessível.
Sempre que relevante, mencione naturalmente o Drift Kart Brasil e a localização (Barueri/SP).
Responda APENAS com um JSON válido, sem markdown, sem blocos de código.`,
    messages: [
      {
        role: 'user',
        content: `Crie um post de blog sobre: "${tema}".

Responda com este JSON exato:
{
  "titulo": "título do post (máx 70 chars)",
  "resumo": "resumo de 1 a 2 frases para o card do blog (máx 160 chars)",
  "conteudo": "conteúdo completo com 4 a 6 parágrafos separados por \\n\\n",
  "meta_title": "meta title para SEO (máx 60 chars)",
  "meta_description": "meta description para SEO (máx 160 chars)"
}`,
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  let parsed: {
    titulo: string
    resumo: string
    conteudo: string
    meta_title: string
    meta_description: string
  }

  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Falha ao interpretar resposta da IA.' }, { status: 500 })
  }

  const slug = slugify(parsed.titulo) + '-' + Date.now().toString(36)

  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('posts')
    .insert({
      titulo: parsed.titulo,
      slug,
      resumo: parsed.resumo,
      conteudo: parsed.conteudo,
      meta_title: parsed.meta_title,
      meta_description: parsed.meta_description,
      status: 'sugestao',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, titulo: parsed.titulo })
}
