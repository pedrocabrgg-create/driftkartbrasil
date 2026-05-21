'use client'

import { useState } from 'react'
import { Globe, Copy, Check, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { salvarDominio } from './actions'

const DNS_RECORDS = [
  { tipo: 'A',     nome: '@',   valor: '76.76.21.21',          desc: 'Domínio principal (ex: seusite.com.br)' },
  { tipo: 'CNAME', nome: 'www', valor: 'cname.vercel-dns.com', desc: 'Subdomínio www (ex: www.seusite.com.br)' },
]

export function DominioSection({ savedDomain }: { savedDomain: string | null }) {
  const [domain, setDomain] = useState(savedDomain ?? '')
  const [registered, setRegistered] = useState(!!savedDomain)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ativo' | 'pendente'>(savedDomain ? 'pendente' : 'idle')
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleConectar(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      await salvarDominio(formData)
      const d = (formData.get('dominio') as string).trim().toLowerCase()
      setDomain(d)

      // Registra no Vercel (se VERCEL_API_TOKEN configurado)
      await fetch('/api/admin/dominio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })

      setRegistered(true)
      setStatus('pendente')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao conectar domínio.')
    } finally {
      setLoading(false)
    }
  }

  async function verificar() {
    if (!domain) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/admin/dominio?domain=${encodeURIComponent(domain)}`)
      const json = (await res.json()) as { ativo: boolean }
      setStatus(json.ativo ? 'ativo' : 'pendente')
    } finally {
      setVerifying(false)
    }
  }

  function copiar(valor: string) {
    void navigator.clipboard.writeText(valor)
    setCopied(valor)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10">
          <Globe className="size-5 text-brand" />
        </div>
        <div>
          <h2 className="font-bold text-white">Domínio Próprio</h2>
          <p className="text-xs text-white/40">Conecte seu domínio para o site aparecer no endereço da sua marca</p>
        </div>
        {status === 'ativo' && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
            <span className="size-1.5 rounded-full bg-green-400" />
            Ativo
          </span>
        )}
        {status === 'pendente' && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            <span className="size-1.5 rounded-full bg-yellow-400" />
            Aguardando DNS
          </span>
        )}
      </div>

      {/* Input do domínio */}
      <form action={handleConectar} className="flex gap-2">
        <input
          name="dominio"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="seudominio.com.br"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !domain}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
          {registered ? 'Atualizar' : 'Conectar'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Registros DNS */}
      {registered && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            Configure estes registros no painel do seu domínio (GoDaddy, Registro.br, etc.)
          </p>

          {DNS_RECORDS.map((rec) => (
            <div key={rec.tipo + rec.nome} className="rounded-xl border border-white/8 bg-black/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand">{rec.tipo}</span>
                <span className="text-xs text-white/40">{rec.desc}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-white/30">Nome / Host</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <code className="flex-1 text-sm text-white">{rec.nome}</code>
                    <button onClick={() => copiar(rec.nome)} className="text-white/30 hover:text-brand transition-colors">
                      {copied === rec.nome ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-white/30">Valor / Destino</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <code className="flex-1 truncate text-sm text-white">{rec.valor}</code>
                    <button onClick={() => copiar(rec.valor)} className="text-white/30 hover:text-brand transition-colors">
                      {copied === rec.valor ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2.5 text-xs text-white/30">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            Após configurar os registros acima, aguarde até 24h para a propagação do DNS.
            Clique em &quot;Verificar&quot; para checar se já está ativo.
          </div>

          <button
            onClick={verificar}
            disabled={verifying}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            {verifying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Verificar propagação
          </button>

          {status === 'ativo' && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="size-4" />
              Domínio ativo! Seu site já está acessível em <strong>{domain}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
