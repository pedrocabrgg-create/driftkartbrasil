'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Car,
  Grid3X3,
  Clock,
  Inbox,
  Settings,
  LogOut,
  Images,
  FileText,
  PenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/db/client'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/calendario', label: 'Calendário', icon: CalendarDays, exact: false },
  { href: '/admin/reservas', label: 'Reservas', icon: ClipboardList, exact: false },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
  { href: '/admin/modalidades', label: 'Modalidades', icon: Grid3X3, exact: false },
  { href: '/admin/karts', label: 'Karts', icon: Car, exact: false },
  { href: '/admin/grade', label: 'Grade Horários', icon: Clock, exact: false },
  { href: '/admin/leads', label: 'Leads', icon: Inbox, exact: false },
  { href: '/admin/media', label: 'Mídia', icon: Images, exact: false },
  { href: '/admin/conteudo', label: 'Conteúdo do Site', icon: PenLine, exact: false },
  { href: '/admin/posts', label: 'Blog / Posts', icon: FileText, exact: false },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="flex w-56 flex-col border-r border-white/10 bg-sidebar">
      <div className="border-b border-white/10 p-4">
        <p className="text-sm font-black">
          <span className="text-brand">DRIFT KART</span>{' '}
          <span className="text-white">BRASIL</span>
        </p>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-brand/10 font-medium text-brand'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
