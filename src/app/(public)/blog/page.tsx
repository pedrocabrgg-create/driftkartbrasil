import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServiceClient } from '@/lib/db/server'
import type { Post } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Blog — Drift Kart Brasil',
  description: 'Dicas de pilotagem, novidades e conteúdo sobre kart elétrico em Barueri/SP.',
  openGraph: {
    title: 'Blog — Drift Kart Brasil',
    description: 'Dicas de pilotagem, novidades e conteúdo sobre kart elétrico em Barueri/SP.',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function BlogPage() {
  const db = createSupabaseServiceClient()
  const { data: posts } = await db
    .from('posts')
    .select('id, titulo, slug, resumo, capa_url, publicado_at')
    .eq('status', 'publicado')
    .order('publicado_at', { ascending: false })

  return (
    <div className="mx-auto max-w-screen-xl px-5 py-24 md:px-10">
      <div className="mb-14 flex flex-col items-center text-center">
        <span className="font-bebas mb-3 text-sm tracking-[0.25em] text-brand">Conteúdo</span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Blog</h1>
        <p className="mt-3 max-w-md text-sm text-white/50">
          Dicas de pilotagem, notícias e tudo sobre kart elétrico em Barueri/SP.
        </p>
      </div>

      {!posts?.length ? (
        <p className="text-center text-sm text-muted-foreground">Nenhum artigo publicado ainda. Volte em breve!</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(posts as Pick<Post, 'id' | 'titulo' | 'slug' | 'resumo' | 'capa_url' | 'publicado_at'>[]).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 transition-all hover:border-brand/30 hover:shadow-[0_0_30px_-10px_rgba(198,241,53,0.15)]"
            >
              {post.capa_url ? (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.capa_url}
                    alt={post.titulo}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-brand/10 to-black/80" />
              )}

              <div className="flex flex-1 flex-col p-6">
                {post.publicado_at && (
                  <p className="mb-2 text-xs text-muted-foreground">{formatDate(post.publicado_at)}</p>
                )}
                <h2 className="mb-2 text-base font-bold leading-snug text-white group-hover:text-brand transition-colors">
                  {post.titulo}
                </h2>
                <p className="text-sm leading-relaxed text-white/50 line-clamp-3">{post.resumo}</p>
                <span className="font-bebas mt-4 text-sm tracking-widest text-brand">Ler artigo →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
