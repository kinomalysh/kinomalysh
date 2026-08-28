import { promises as dns } from 'node:dns'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../env.js'

type TransportOptions = Parameters<typeof nodemailer.createTransport>[0]

const CONNECTION_TIMEOUT_MS = 10_000
const GREETING_TIMEOUT_MS = 10_000
const SOCKET_TIMEOUT_MS = 20_000

let transporter: Transporter | null = null

async function buildTransportOptions(): Promise<TransportOptions> {
  const options: Record<string, unknown> = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT !== 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
  }

  if (env.SMTP_IPV6) {
    const [address] = await dns.resolve6(env.SMTP_HOST)
    if (!address) throw new Error(`у ${env.SMTP_HOST} нет AAAA-записи`)
    options.host = address
    options.tls = { servername: env.SMTP_HOST }
  }

  return options as TransportOptions
}

async function getTransporter(): Promise<Transporter | null> {
  if (!env.SMTP_HOST) return null
  if (!transporter) {
    transporter = nodemailer.createTransport(await buildTransportOptions())
  }
  return transporter
}

export async function sendOtpEmail(to: string, name: string, code: string) {
  const mailer = await getTransporter()
  if (!mailer) {
    console.log(`[mailer] SMTP не настроен - код для ${to}: ${code}`)
    return
  }
  try {
    await deliver(mailer, to, name, code)
  } catch (error) {
    transporter = null
    throw error
  }
}

async function deliver(mailer: Transporter, to: string, name: string, code: string) {
  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: `${code} - ваш код для входа в Киномалыш`,
    text: `Здравствуйте, ${name}!\n\nВаш код подтверждения: ${code}\nОн действует 10 минут.\n\nЕсли вы не регистрировались в Киномалыше - просто проигнорируйте это письмо.`,
    html: renderOtpEmail(name, code),
  })
}

export function renderOtpEmail(name: string, code: string): string {
  const digits = code
    .split('')
    .map(
      (d) => `
        <td style="padding:0 5px;">
          <div style="width:56px;height:72px;line-height:72px;text-align:center;
            background:#1a2350;border:2px solid #f2ead6;border-radius:16px;
            font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:bold;
            color:#fcf6ea;box-shadow:3px 4px 0 rgba(0,0,0,0.45);">${d}</div>
        </td>`,
    )
    .join('')

  return `<!doctype html>
<html lang="ru">
<body style="margin:0;padding:0;background:#111838;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111838;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="font-family:Georgia,serif;font-size:28px;color:#fcf6ea;">
            &#128294; Киномалыш
          </div>
          <div style="font-family:'Comic Sans MS',cursive;font-size:14px;color:#9a99b5;margin-top:4px;">
            сказки на ночь
          </div>
        </td></tr>
        <tr><td style="background:#1a2350;border:2px solid #f2ead6;border-radius:24px;padding:32px 28px;box-shadow:3px 4px 0 rgba(0,0,0,0.45);">
          <div style="font-family:Georgia,serif;font-size:22px;color:#fcf6ea;text-align:center;">
            Здравствуйте, ${escapeHtml(name)}!
          </div>
          <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#cec9b9;text-align:center;margin-top:12px;">
            Ваш код для входа в мир сказок:
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto;">
            <tr>${digits}</tr>
          </table>
          <div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9a99b5;text-align:center;">
            Код действует 10 минут.<br/>
            Если вы не регистрировались в Киномалыше - просто закройте это письмо,
            ничего не произойдёт.
          </div>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <div style="font-family:'Comic Sans MS',cursive;font-size:14px;color:#9a99b5;">
            - сегодня вечером сказка может быть про вашего ребёнка -
          </div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#6b7190;margin-top:12px;">
            © Киномалыш · Поддержка: @kinomalysh_help
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
