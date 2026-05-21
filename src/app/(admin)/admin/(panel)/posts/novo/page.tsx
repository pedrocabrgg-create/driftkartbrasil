import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { criarPost } from '../actions'

export default function NovoPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
          <Link href="/admin/posts">
            <ArrowLeft className="mr-1.5 size-4" />
            Posts
          </Link>
        </Button>
        <h1 className="text-xl font-black tracking-tight text-white">Novo Post</h1>
      </div>

      <form action={criarPost} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Conteúdo</h2>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" required placeholder="Ex: Como aprender a pilotar kart em Barueri" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" placeholder="gerado-automaticamente-do-titulo" />
            <p className="text-xs text-muted-foreground">Deixe em branco para gerar automaticamente.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo">Resumo *</Label>
            <Textarea id="resumo" name="resumo" required rows={3} placeholder="Breve descrição exibida na listagem do blog (1–2 frases)." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea id="conteudo" name="conteudo" required rows={14} placeholder="Escreva o conteúdo completo do post. Suporta Markdown." className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capa_url">URL da imagem de capa</Label>
            <Input id="capa_url" name="capa_url" type="url" placeholder="https://..." />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">SEO</h2>

          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta title</Label>
            <Input id="meta_title" name="meta_title" placeholder="Título para Google (max 60 chars)" maxLength={60} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea id="meta_description" name="meta_description" rows={2} placeholder="Descrição para Google (max 160 chars)" maxLength={160} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/posts">Cancelar</Link>
          </Button>
          <Button type="submit" className="bg-brand text-black hover:bg-brand/90">
            Salvar Rascunho
          </Button>
        </div>
      </form>
    </div>
  )
}
