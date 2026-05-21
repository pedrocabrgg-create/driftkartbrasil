import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env['RESEND_API_KEY'] ?? 'placeholder')
}

const FROM = process.env['RESEND_FROM_EMAIL'] ?? 'noreply@driftkartbrasil.com.br'
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://www.driftkartbrasil.com.br'
const WHATSAPP = process.env['NEXT_PUBLIC_WHATSAPP_NUMBER'] ?? '5511976626414'

export interface EmailReservaParams {
  toEmail: string
  toNome: string
  reservaId: string
  modalidade: string
  dataHora: string
  pilotos: number
  totalCents: number
  sinalCents: number
  sinalPct: number
}

export async function enviarEmailReservaRecebida(params: EmailReservaParams) {
  const { toEmail, toNome, reservaId, modalidade, dataHora, pilotos, totalCents, sinalCents, sinalPct } = params

  const brl = (c: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100)

  const idCurto = reservaId.slice(0, 8).toUpperCase()

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Reserva Recebida</title></head>
<body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f0f0f0; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #141414; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">

    <div style="background: #c6f135; padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0a0a0a; letter-spacing: -0.5px;">
        DRIFT KART BRASIL
      </h1>
    </div>

    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 8px;">
        Reserva Recebida!
      </h2>
      <p style="color: #888; margin: 0 0 24px; font-size: 14px;">Olá, ${toNome}! Sua reserva foi registrada com sucesso.</p>

      <div style="background: #1e1e1e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">ID da reserva</td>
            <td style="color: #c6f135; font-size: 13px; text-align: right; font-family: monospace;">#${idCurto}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Modalidade</td>
            <td style="color: #fff; font-size: 13px; text-align: right;">${modalidade}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Data e Hora</td>
            <td style="color: #fff; font-size: 13px; text-align: right;">${dataHora}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Participantes</td>
            <td style="color: #fff; font-size: 13px; text-align: right;">${pilotos} pessoa(s)</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Valor total</td>
            <td style="color: #fff; font-size: 13px; text-align: right;">${brl(totalCents)}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Sinal (${sinalPct}% — não reembolsável)</td>
            <td style="color: #c6f135; font-size: 14px; font-weight: 700; text-align: right;">${brl(sinalCents)}</td>
          </tr>
        </table>
      </div>

      <div style="background: rgba(198, 241, 53, 0.08); border: 1px solid rgba(198, 241, 53, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #c6f135; margin: 0 0 12px;">
          Próximo passo: pague o sinal de ${brl(sinalCents)}
        </h3>
        <p style="color: #888; font-size: 13px; margin: 0 0 12px;">
          Para confirmar sua vaga, entre em contato pelo WhatsApp para receber os dados do Pix:
        </p>
        <a href="https://wa.me/${WHATSAPP}?text=Ol%C3%A1%21+Reserva+%23${idCurto}+-+quero+pagar+o+sinal"
           style="display: inline-block; background: #c6f135; color: #0a0a0a; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Falar no WhatsApp
        </a>
      </div>

      <p style="color: #666; font-size: 12px; margin: 0 0 8px;">
        Sua vaga fica reservada por 24 horas. Após esse prazo sem confirmação do sinal, a reserva será cancelada automaticamente.
      </p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        Os 70% restantes (${brl(totalCents - sinalCents)}) são pagos no local antes da sessão.
      </p>
    </div>

    <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
      <p style="color: #444; font-size: 11px; margin: 0;">
        Drift Kart Brasil — Estr. Dr. Cícero Borges de Morais, 100 B, Barueri/SP<br>
        <a href="${APP_URL}" style="color: #666;">driftkartbrasil.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>`

  return getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `🏁 Reserva recebida #${idCurto} — ${modalidade}`,
    html,
  })
}

export async function enviarEmailLembrete(params: {
  toEmail: string
  toNome: string
  reservaId: string
  modalidade: string
  dataHora: string
  totalCents: number
  sinalCents: number
}) {
  const { toEmail, toNome, reservaId, modalidade, dataHora, totalCents, sinalCents } = params
  const idCurto = reservaId.slice(0, 8).toUpperCase()
  const brl = (c: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100)

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #f0f0f0; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #141414; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
    <div style="background: #c6f135; padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0a0a0a;">DRIFT KART BRASIL</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 8px;">Sua sessão é amanhã!</h2>
      <p style="color: #888; margin: 0 0 24px; font-size: 14px;">Olá, ${toNome}! Lembre-se da sua sessão confirmada.</p>

      <div style="background: #1e1e1e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Reserva</td>
            <td style="color: #c6f135; font-size: 13px; text-align: right; font-family: monospace;">#${idCurto}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Modalidade</td>
            <td style="color: #fff; font-size: 13px; text-align: right;">${modalidade}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">Data e Hora</td>
            <td style="color: #fff; font-size: 13px; text-align: right; font-weight: 700;">${dataHora}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 4px 0;">A pagar no local</td>
            <td style="color: #c6f135; font-size: 14px; font-weight: 700; text-align: right;">${brl(totalCents - sinalCents)}</td>
          </tr>
        </table>
      </div>

      <div style="background: rgba(198, 241, 53, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #c6f135; font-size: 14px; font-weight: 700; margin: 0 0 8px;">Chegue 15 minutos antes</p>
        <p style="color: #888; font-size: 13px; margin: 0;">Traga calça comprida e sapato fechado. Capacete é fornecido pela equipe.</p>
      </div>

      <a href="${APP_URL}/regras" style="color: #666; font-size: 12px;">Ver todas as regras →</a>
    </div>
    <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
      <p style="color: #444; font-size: 11px; margin: 0;">Drift Kart Brasil — Estr. Dr. Cícero Borges de Morais, 100 B, Barueri/SP</p>
    </div>
  </div>
</body>
</html>`

  return getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `⏰ Lembrete: sua sessão de kart é amanhã! #${idCurto}`,
    html,
  })
}
