'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'

const GUIAS = [
  {
    titulo: 'Como trocar fotos e vídeos do site',
    passos: [
      'Acesse o menu "Mídia" na barra lateral.',
      'Você verá o "Editor Visual" — ele mostra exatamente o que está no site.',
      'Passe o mouse sobre qualquer card ou foto e clique em "Trocar mídia".',
      'Selecione o arquivo no seu computador (foto .jpg ou vídeo .mp4).',
      'O site atualiza automaticamente em segundos.',
      'Para voltar ao padrão original, clique no ícone de seta (↺) no card.',
    ],
  },
  {
    titulo: 'Como criar e publicar um post no Blog',
    passos: [
      'Acesse o menu "Blog / Posts" na barra lateral.',
      'Clique em "Gerar Sugestão" para a IA criar um post sobre kart automaticamente.',
      'Leia o post gerado. Se gostar, clique em "Aprovar e publicar".',
      'Se quiser editar antes, clique em "Editar" — ajuste o texto e depois publique.',
      'Posts publicados aparecem automaticamente na seção /blog do site.',
      'Para despublicar, clique no botão de status no post.',
    ],
  },
  {
    titulo: 'Como editar textos e informações do site',
    passos: [
      'Acesse o menu "Conteúdo do Site" na barra lateral.',
      'Você verá seções como: Contato, Endereço, Quem Somos, Horários, CTA.',
      'Edite o texto desejado diretamente no campo e clique em "Salvar".',
      'As mudanças aparecem no site em segundos.',
      'Para editar WhatsApp, Instagram e endereço, use a seção "Contato & Redes".',
    ],
  },
  {
    titulo: 'Como editar horários de funcionamento',
    passos: [
      'Acesse o menu "Grade Horários" na barra lateral.',
      'Você verá os dias e horários cadastrados.',
      'Para adicionar um horário, clique em "Novo Horário" e preencha o dia e horário.',
      'Para remover, clique no botão de exclusão ao lado do horário.',
      'Os horários aparecem automaticamente na seção "Quando estamos abertos" do site.',
    ],
  },
  {
    titulo: 'Como editar as sessões e preços',
    passos: [
      'Acesse o menu "Modalidades" na barra lateral.',
      'Você verá as sessões cadastradas (Sessão Rápida, Completa, etc.).',
      'Clique em "Editar" em qualquer sessão para alterar nome, preço, duração e descrição.',
      'O campo "Destaque" (ex: "Mais Escolhida") aparece como badge no card do site.',
      'Salve e as mudanças aparecem na seção de modalidades da homepage.',
    ],
  },
  {
    titulo: 'Como conectar seu domínio próprio',
    passos: [
      'Nesta mesma página (Configurações), localize o card "Domínio Próprio" acima.',
      'Digite seu domínio (ex: driftkartbrasil.com.br) e clique em "Conectar".',
      'Você verá dois registros DNS aparecerem: um tipo A e um CNAME.',
      'Acesse o painel do seu domínio (onde comprou o domínio: GoDaddy, Registro.br, etc.).',
      'Adicione os dois registros DNS exatamente como mostrado — use o botão "Copiar".',
      'Aguarde até 24h para propagação. Clique em "Verificar" para checar o status.',
      'Quando aparecer "Ativo" em verde, seu site está no ar no domínio próprio.',
    ],
  },
]

export function AjudaSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10">
          <BookOpen className="size-5 text-brand" />
        </div>
        <div>
          <h2 className="font-bold text-white">Guia de Uso do Painel</h2>
          <p className="text-xs text-white/40">Passo a passo para cada funcionalidade do site</p>
        </div>
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        {GUIAS.map((guia, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-white/8">
            <button
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/3"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-sm font-medium text-white">{guia.titulo}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-white/40 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>

            {open === i && (
              <div className="border-t border-white/5 bg-black/20 px-4 py-4">
                <ol className="space-y-2">
                  {guia.passos.map((passo, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">
                        {j + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-white/60">{passo}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
