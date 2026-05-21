import { createSupabaseServiceClient } from './db/server'

export async function getAnthropicKey(): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY

  const db = createSupabaseServiceClient()
  const { data } = await db
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'anthropic_api_key')
    .maybeSingle()

  return data?.valor ?? null
}
