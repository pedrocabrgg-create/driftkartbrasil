'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/db/server'

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

export async function criarPost(formData: FormData) {
  const titulo = formData.get('titulo') as string
  const slug = (formData.get('slug') as string) || slugify(titulo)
  const resumo = formData.get('resumo') as string
  const conteudo = formData.get('conteudo') as string
  const capa_url = (formData.get('capa_url') as string) || null
  const meta_title = (formData.get('meta_title') as string) || null
  const meta_description = (formData.get('meta_description') as string) || null

  const db = createSupabaseServiceClient()
  const { error } = await db.from('posts').insert({
    titulo,
    slug,
    resumo,
    conteudo,
    capa_url,
    meta_title,
    meta_description,
    status: 'rascunho',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  redirect('/admin/posts')
}

export async function atualizarPost(id: string, formData: FormData) {
  const titulo = formData.get('titulo') as string
  const slug = formData.get('slug') as string
  const resumo = formData.get('resumo') as string
  const conteudo = formData.get('conteudo') as string
  const capa_url = (formData.get('capa_url') as string) || null
  const meta_title = (formData.get('meta_title') as string) || null
  const meta_description = (formData.get('meta_description') as string) || null

  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('posts')
    .update({ titulo, slug, resumo, conteudo, capa_url, meta_title, meta_description })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  revalidatePath(`/admin/posts/${id}`)
  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  redirect('/admin/posts')
}

export async function publicarPost(id: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('posts')
    .update({ status: 'publicado', publicado_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['rascunho', 'sugestao'])

  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}

export async function aprovarSugestao(id: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('posts')
    .update({ status: 'publicado', publicado_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'sugestao')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}

export async function descartarSugestao(id: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('posts').delete().eq('id', id).eq('status', 'sugestao')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
}

export async function despublicarPost(id: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db
    .from('posts')
    .update({ status: 'rascunho', publicado_at: null })
    .eq('id', id)
    .eq('status', 'publicado')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}

export async function excluirPost(id: string) {
  const db = createSupabaseServiceClient()
  const { error } = await db.from('posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/posts')
  revalidatePath('/blog')
}
