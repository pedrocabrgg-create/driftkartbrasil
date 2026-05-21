import { AdminSidebar } from '@/components/admin/admin-sidebar'

// Auth é tratada no middleware (src/middleware.ts)
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  )
}
