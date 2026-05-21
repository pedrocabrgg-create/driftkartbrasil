'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GerarSugestaoButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function gerar() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/posts/sugerir', { method: 'POST' })
      if (!res.ok) {
        const { error } = await res.json()
        alert(error ?? 'Erro ao gerar sugestão.')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={gerar}
      disabled={loading}
      className="gap-2 border-brand/30 text-brand hover:border-brand hover:bg-brand/10"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Gerando…
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          Gerar Sugestão
        </>
      )}
    </Button>
  )
}
