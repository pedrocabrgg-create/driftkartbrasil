import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'Admin — Login',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-black">
            <span className="text-brand">DRIFT KART</span>{' '}
            <span className="text-white">BRASIL</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Painel Administrativo</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
