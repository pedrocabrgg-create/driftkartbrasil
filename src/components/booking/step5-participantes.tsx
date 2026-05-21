'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface Props {
  form: UseFormReturn<ReservaFormData>
  onNext: () => void
  onPrev: () => void
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function Step5Participantes({ form, onNext, onPrev }: Props) {
  const pilotosCount = form.watch('pilotosCount')

  async function handleNext() {
    // Valida organizador + pilotos
    const isValid = await form.trigger(['organizador', 'pilotos'])
    if (isValid) onNext()
  }

  return (
    <Form {...form}>
      <div>
        <h2 className="mb-2 text-2xl font-black text-white">Dados dos Participantes</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          O primeiro participante é o organizador da reserva.
        </p>

        <div className="space-y-8">
          {/* Organizador */}
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
            <p className="mb-4 text-sm font-semibold text-brand">Organizador (Participante 1)</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="organizador.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizador.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        onChange={(e) => field.onChange(maskTelefone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizador.email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizador.cpf"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>CPF <span className="text-muted-foreground">(opcional — para consultar reservas depois)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => field.onChange(maskCpf(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Demais pilotos */}
          {Array.from({ length: pilotosCount - 1 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-card p-5">
              <p className="mb-4 text-sm font-semibold text-white">Participante {idx + 2}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`pilotos.${idx + 1}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`pilotos.${idx + 1}.telefone`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          {...field}
                          onChange={(e) => field.onChange(maskTelefone(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={onPrev}>
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="bg-brand font-bold text-brand-foreground hover:bg-brand/90"
          >
            Próximo
          </Button>
        </div>
      </div>
    </Form>
  )
}
