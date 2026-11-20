import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodemailer from 'nodemailer'
import { defineConfig } from 'vite'

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue

    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawBody = ''
    req.on('data', (chunk) => {
      rawBody += chunk.toString('utf8')
    })
    req.on('end', () => {
      if (!rawBody) return resolve({})
      try {
        resolve(JSON.parse(rawBody))
      } catch {
        reject(new Error('Invalid JSON request body'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function mailerDevPlugin() {
  return {
    name: 'mailer-dev-route',
    configureServer(server) {
      loadLocalEnv()

      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
        }

        try {
          const { to_email, subject, message, senderName, fromEmail } =
            await readJsonBody(req)
          if (!to_email || !subject || !message) {
            return sendJson(res, 400, {
              ok: false,
              error: 'to_email, subject, and message are required.',
            })
          }

          const smtpHost = 'mail.kayadevelopmentserver.com'
          const smtpPort = 465
          const smtpUser = 'dispatch@kayadevelopmentserver.com'
          const smtpPass = '0AlT$VIAX~}h,AVN'
          const fromName = String(senderName || 'John Smith').trim()
          const displayFromEmail = String(
            fromEmail || 'johnsmith13072@gmail.com',
          ).trim()

          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: true,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          })

          const info = await transporter.sendMail({
            from: `"${fromName}" <${displayFromEmail}>`,
            to: String(to_email).trim(),
            replyTo: displayFromEmail,
            subject: String(subject).trim(),
            text: String(message),
          })

          return sendJson(res, 200, { ok: true, messageId: info.messageId })
        } catch (err) {
          return sendJson(res, 500, {
            ok: false,
            error: err?.message || 'Failed to send email',
          })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mailerDevPlugin()],
  server: {
    host: 'localhost',
    port: 5173,
  },
})