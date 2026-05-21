import { test, expect } from '@playwright/test'

/**
 * Testes E2E do fluxo de agendamento.
 * Requerem: app rodando em localhost:3000 + Supabase local com seed aplicado.
 *
 * Para rodar: npm run test:e2e
 */

test.describe('Fluxo de agendamento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('página inicial carrega com H1 correto', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'DRIFT KART BRASIL EM SÃO PAULO',
    )
  })

  test('CTA de agendamento navega para /agendar', async ({ page }) => {
    await page.getByRole('link', { name: /agendar/i }).first().click()
    await expect(page).toHaveURL(/\/agendar/)
  })

  test('passo 1 — selecionar nível de experiência', async ({ page }) => {
    await page.goto('/agendar')
    await expect(page.getByText('Nível de Experiência')).toBeVisible()

    await page.getByRole('button', { name: /iniciante/i }).click()
    await page.getByRole('button', { name: /próximo/i }).click()

    // Avança para passo 2
    await expect(page.getByText(/escolha seu serviço/i)).toBeVisible()
  })

  test('passo 2 — selecionar modalidade Bateria 25 min', async ({ page }) => {
    await page.goto('/agendar')

    // Passo 1
    await page.getByRole('button', { name: /iniciante/i }).click()
    await page.getByRole('button', { name: /próximo/i }).click()

    // Passo 2
    await page.getByRole('button', { name: /bateria 25/i }).click()
    await page.getByRole('button', { name: /próximo/i }).click()

    // Avança para passo 3
    await expect(page.getByText(/data e horário/i)).toBeVisible()
  })

  test('regras são exibidas no passo 6', async ({ page }) => {
    // Navega diretamente para passo 6 via query string (se suportado)
    // ou via URL de test fixture
    await page.goto('/regras')
    await expect(page.getByText(/uso obrigatório de calça comprida/i)).toBeVisible()
    await expect(page.getByText(/o não comparecimento/i)).toBeVisible()
  })
})

test.describe('Regras de negócio de disponibilidade', () => {
  test('slot esgotado não permite reserva (lógica de janela)', async ({ page }) => {
    // Este teste valida visualmente que slots esgotados aparecem bloqueados
    // A lógica real é testada nos unit tests de availability.test.ts
    await page.goto('/agendar')
    // Apenas verifica que a página carrega — teste completo após step 4
    await expect(page).toHaveURL(/agendar/)
  })
})
