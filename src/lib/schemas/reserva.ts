import { z } from 'zod'

export const pilotoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido — use o formato (11) 99999-9999'),
})

export const pilotoOrganizadorSchema = pilotoSchema.extend({
  email: z.string().email('E-mail inválido'),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido — use o formato 000.000.000-00')
    .optional()
    .or(z.literal('')),
})

export const reservaFormSchema = z.object({
  nivelExperiencia: z.enum(['iniciante', 'ja_tive_contato'], {
    message: 'Selecione seu nível de experiência',
  }),
  modalidadeId: z.string().uuid('Selecione uma modalidade'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  inicioAt: z.string().datetime({ offset: true, message: 'Horário inválido' }),
  pilotosCount: z.number().int().min(1).max(10),
  pilotos: z.array(pilotoSchema).min(1),
  organizador: pilotoOrganizadorSchema,
  termoAceito: z.literal(true, { message: 'Você precisa aceitar as Regras e Orientações' }),
  cienteSinalNaoReembolsavel: z.literal(true, {
    message: 'Você precisa confirmar o acordo sobre o sinal',
  }),
})

export type ReservaFormData = z.infer<typeof reservaFormSchema>

export const telefoneRaw = (masked: string) => masked.replace(/\D/g, '')
export const cpfRaw      = (masked: string) => masked.replace(/\D/g, '')
