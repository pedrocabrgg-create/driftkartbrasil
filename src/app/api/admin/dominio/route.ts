import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT = process.env.VERCEL_PROJECT_ID

// POST /api/admin/dominio — registra o domínio no projeto Vercel
export async function POST(req: NextRequest) {
  const { domain } = (await req.json()) as { domain: string }
  if (!domain) return NextResponse.json({ error: 'Domínio inválido.' }, { status: 400 })

  if (!VERCEL_TOKEN || !VERCEL_PROJECT) {
    // Sem integração Vercel — retorna só as instruções padrão
    return NextResponse.json({ manual: true, domain })
  }

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    },
  )

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = (data.error as { message?: string } | undefined)?.message ?? 'Erro ao registrar domínio.'
    return NextResponse.json({ error: err }, { status: res.status })
  }

  return NextResponse.json({ ok: true, domain, data })
}

// GET /api/admin/dominio?domain=xxx — verifica status via DNS do Google
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'Domínio não informado.' }, { status: 400 })

  // Apex: checa se A record aponta para IP do Vercel
  const apexDomain = domain.replace(/^www\./, '')

  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(apexDomain)}&type=A`,
      { next: { revalidate: 0 } },
    )
    const json = (await res.json()) as { Answer?: { data: string }[] }
    const aRecords = json.Answer?.map((r) => r.data) ?? []
    const apontaVercel = aRecords.includes('76.76.21.21')

    return NextResponse.json({ ativo: apontaVercel, aRecords, domain })
  } catch {
    return NextResponse.json({ ativo: false, aRecords: [], domain })
  }
}
