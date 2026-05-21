import Link from 'next/link'
import { Plus, Pencil, Globe, EyeOff, Sparkles } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { publicarPost, despublicarPost, excluirPost, aprovarSugestao, descartarSugestao } from './actions'
import { GerarSugestaoButton } from './gerar-sugestao-button'
import type { Post } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function PostsPage() {
  const db = createSupabaseServiceClient()
  const { data: todos } = await db
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const sugestoes = (todos ?? []).filter((p) => p.status === 'sugestao') as Post[]
  const posts = (todos ?? []).filter((p) => p.status !== 'sugestao') as Post[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Blog / Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os artigos do blog e carrosseis de Instagram
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GerarSugestaoButton />
          <Button asChild className="bg-brand text-black hover:bg-brand/90">
            <Link href="/admin/posts/novo">
              <Plus className="mr-2 size-4" />
              Novo Post
            </Link>
          </Button>
        </div>
      </div>

      {/* ── SUGESTÕES DA IA ── */}
      {sugestoes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-brand">
              Sugestões geradas pela IA ({sugestoes.length})
            </h2>
          </div>

          <div className="space-y-3">
            {sugestoes.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-4 rounded-xl border border-brand/20 bg-brand/5 p-5 sm:flex-row sm:items-start"
              >
                <div className="flex-1">
                  <p className="font-bold text-white">{post.titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{post.resumo}</p>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/30">
                    {post.conteudo}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                  <form action={aprovarSugestao.bind(null, post.id)} className="flex-1 sm:flex-none">
                    <Button className="w-full bg-brand text-black hover:bg-brand/90 sm:w-auto">
                      Aprovar e publicar
                    </Button>
                  </form>
                  <Button asChild variant="outline" className="flex-1 sm:flex-none sm:w-auto">
                    <Link href={`/admin/posts/${post.id}`}>Editar antes</Link>
                  </Button>
                  <form action={descartarSugestao.bind(null, post.id)} className="flex-1 sm:flex-none">
                    <Button
                      variant="ghost"
                      className="w-full text-red-400/60 hover:bg-red-900/20 hover:text-red-400 sm:w-auto"
                    >
                      Descartar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── POSTS PUBLICADOS / RASCUNHOS ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Seus posts
        </h2>

        {!posts.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Clique em &quot;Gerar Sugestão&quot; e a IA cria um post sobre kart para você aprovar.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Publicado em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="bg-black/30 transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{post.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {post.status === 'publicado' ? (
                        <Badge className="bg-brand/20 text-brand hover:bg-brand/20">Publicado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Rascunho</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(post.publicado_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-white">
                          <Link href={`/admin/posts/${post.id}`}>
                            <Pencil className="size-3.5" />
                          </Link>
                        </Button>

                        {post.status === 'rascunho' ? (
                          <form action={publicarPost.bind(null, post.id)}>
                            <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-brand hover:bg-brand/10 hover:text-brand">
                              <Globe className="size-3.5" />
                              Publicar
                            </Button>
                          </form>
                        ) : (
                          <form action={despublicarPost.bind(null, post.id)}>
                            <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-white">
                              <EyeOff className="size-3.5" />
                              Despublicar
                            </Button>
                          </form>
                        )}

                        <form action={excluirPost.bind(null, post.id)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-red-400/60 hover:bg-red-900/20 hover:text-red-400"
                          >
                            Excluir
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
