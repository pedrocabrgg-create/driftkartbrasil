import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/db/server'
import type { Post } from '@/lib/db/types'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const db = createSupabaseServiceClient()
  const { data: post } = await db
    .from('posts')
    .select('titulo, resumo, meta_title, meta_description, capa_url')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single()

  if (!post) return { title: 'Post não encontrado' }

  const title = post.meta_title ?? post.titulo
  const description = post.meta_description ?? post.resumo

  return {
    title: `${title} — Drift Kart Brasil`,
    description,
    openGraph: {
      title,
      description,
      ...(post.capa_url ? { images: [{ url: post.capa_url }] } : {}),
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const db = createSupabaseServiceClient()
  const { data: post } = await db
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single()

  if (!post) notFound()

  const p = post as Post

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 md:px-10">
      <Link
        href="/blog"
        className="font-bebas mb-8 inline-flex items-center gap-1.5 text-sm tracking-widest text-muted-foreground transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Blog
      </Link>

      {p.capa_url && (
        <div className="relative mb-10 h-64 overflow-hidden rounded-2xl sm:h-80">
          <Image src={p.capa_url} alt={p.titulo} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <header className="mb-10">
        {p.publicado_at && (
          <p className="mb-3 text-xs text-muted-foreground">{formatDate(p.publicado_at)}</p>
        )}
        <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
          {p.titulo}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/50">{p.resumo}</p>
      </header>

      <article className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-brand prose-strong:text-white">
        {p.conteudo.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>

      <div className="mt-16 border-t border-white/10 pt-8 text-center">
        <p className="mb-5 text-sm text-white/50">Pronto para acelerar?</p>
        <Link
          href="/agendar"
          className="font-bebas inline-flex items-center justify-center bg-brand px-10 py-4 text-lg tracking-widest text-black transition-all hover:bg-brand/90"
        >
          Reservar Horário
        </Link>
      </div>
    </div>
  )
}
