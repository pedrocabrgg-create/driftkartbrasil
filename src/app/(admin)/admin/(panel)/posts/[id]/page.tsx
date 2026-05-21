import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { atualizarPost, publicarPost, despublicarPost } from '../actions'
import type { Post } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

export default async function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createSupabaseServiceClient()
  const { data: post } = await db.from('posts').select('*').eq('id', id).single()

  if (!post) notFound()

  const p = post as Post
  const atualizar = atualizarPost.bind(null, p.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            <Link href="/admin/posts">
              <ArrowLeft className="mr-1.5 size-4" />
              Posts
            </Link>
          </Button>
          <h1 className="text-xl font-black tracking-tight text-white">Editar Post</h1>
        </div>

        <div className="flex items-center gap-3">
          {p.status === 'publicado' ? (
            <Badge className="bg-brand/20 text-brand">Publicado</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Rascunho</Badge>
          )}

          {p.status === 'rascunho' ? (
            <form action={publicarPost.bind(null, p.id)}>
              <Button size="sm" className="bg-brand text-black hover:bg-brand/90">
                Publicar
              </Button>
            </form>
          ) : (
            <form action={despublicarPost.bind(null, p.id)}>
              <Button size="sm" variant="outline">
                Despublicar
              </Button>
            </form>
          )}
        </div>
      </div>

      <form action={atualizar} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Conteúdo</h2>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" required defaultValue={p.titulo} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" required defaultValue={p.slug} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo">Resumo *</Label>
            <Textarea id="resumo" name="resumo" required rows={3} defaultValue={p.resumo} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea id="conteudo" name="conteudo" required rows={14} defaultValue={p.conteudo} className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capa_url">URL da imagem de capa</Label>
            <Input id="capa_url" name="capa_url" type="url" defaultValue={p.capa_url ?? ''} placeholder="https://..." />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">SEO</h2>

          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta title</Label>
            <Input id="meta_title" name="meta_title" maxLength={60} defaultValue={p.meta_title ?? ''} placeholder="Título para Google (max 60 chars)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea id="meta_description" name="meta_description" rows={2} maxLength={160} defaultValue={p.meta_description ?? ''} placeholder="Descrição para Google (max 160 chars)" />
          </div>
        </div>

        {p.carrossel_urls.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-black/40 p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Carrossel Instagram ({p.carrossel_urls.length} imagens)
            </h2>
            <div className="flex flex-wrap gap-2">
              {p.carrossel_urls.map((url, i) => (
                <img key={i} src={url} alt={`Slide ${i + 1}`} className="h-20 w-20 rounded object-cover" />
              ))}
            </div>
            {p.instagram_post_id ? (
              <p className="text-xs text-brand">Carrossel já publicado no Instagram.</p>
            ) : (
              <p className="text-xs text-yellow-400">Carrossel pronto — publique o post para postar no Instagram.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/posts">Cancelar</Link>
          </Button>
          <Button type="submit" className="bg-brand text-black hover:bg-brand/90">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
