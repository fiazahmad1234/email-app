import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const INTERVAL_MS = 30 * 1000
const EMAILJS_SERVICE_ID = 'service_bok9fkm'
const EMAILJS_TEMPLATE_ID = 'template_ly9etr2'
const EMAILJS_PUBLIC_KEY = 'wOx8A6Zo-r0PyRSVX'

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

function pickRandomSubject(subjects) {
  if (!Array.isArray(subjects) || !subjects.length) {
    return '360 Logistics LLC — Available lanes today'
  }
  return subjects[Math.floor(Math.random() * subjects.length)]
}

async function sendViaEmailJS({ toEmail, subject, message }) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: String(toEmail).trim(),
        subject: String(subject).trim(),
        message: String(message),
      },
    }),
  })

  const text = await response.text().catch(() => '')
  if (!response.ok) {
    throw new Error(text || `EmailJS HTTP ${response.status}`)
  }

  return text || `HTTP ${response.status}`
}

function emailjsQueuePlugin() {
  let queueState = {
    isRunning: false,
    emails: [],
    subjects: [],
    message: '',
    index: 0,
    nextSendAt: 0,
    logs: [],
    statusMsg: 'Idle',
  }

  let timerId = null
  let processingLock = false

  function clearQueueTimer() {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function scheduleNextStep(delayMs) {
    clearQueueTimer()
    if (!queueState.isRunning) return

    queueState.nextSendAt = Date.now() + delayMs
    timerId = setTimeout(async () => {
      await processNextRecipient()
    }, delayMs)
  }

  async function processNextRecipient() {
    if (!queueState.isRunning || processingLock) return
    processingLock = true

    try {
      const idx = queueState.index
      const total = queueState.emails.length

      if (idx >= total) {
        queueState.isRunning = false
        queueState.nextSendAt = 0
        queueState.statusMsg = `Completed: All ${total} Excel recipients processed.`
        clearQueueTimer()
        return
      }

      const recipient = queueState.emails[idx]
      const chosenSubject = pickRandomSubject(queueState.subjects)
      queueState.statusMsg = `Sending ${idx + 1} of ${total} to ${recipient}...`

      try {
        const info = await sendViaEmailJS({
          toEmail: recipient,
          subject: chosenSubject,
          message: queueState.message,
        })
        queueState.logs.push({
          email: recipient,
          subject: chosenSubject,
          ok: true,
          status: `Sent (${info})`,
          time: new Date().toLocaleTimeString(),
        })
      } catch (err) {
        queueState.logs.push({
          email: recipient,
          subject: chosenSubject,
          ok: false,
          status: `Failed: ${err?.message || 'Failed to send email'}`,
          time: new Date().toLocaleTimeString(),
        })
      }

      const nextIdx = idx + 1
      queueState.index = nextIdx

      if (!queueState.isRunning) return

      if (nextIdx >= total) {
        queueState.isRunning = false
        queueState.nextSendAt = 0
        queueState.statusMsg = `Completed: All ${total} Excel recipients processed.`
        clearQueueTimer()
      } else {
        queueState.statusMsg = `Sent ${nextIdx} of ${total}. Next in 30s...`
        scheduleNextStep(INTERVAL_MS)
      }
    } finally {
      processingLock = false
    }
  }

  return {
    name: 'emailjs-background-queue',
    configureServer(server) {
      server.middlewares.use('/api/queue/start', async (req, res) => {
        if (req.method !== 'POST') {
          return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
        }

        try {
          const { emails, subjects, message } = await readJsonBody(req)
          if (!Array.isArray(emails) || !emails.length || !message) {
            return sendJson(res, 400, {
              ok: false,
              error: 'emails list and message are required.',
            })
          }

          clearQueueTimer()
          processingLock = false

          queueState = {
            isRunning: true,
            emails,
            subjects: Array.isArray(subjects) ? subjects : [],
            message: String(message),
            index: 0,
            nextSendAt: 0,
            logs: [],
            statusMsg: `Starting EmailJS queue for ${emails.length} recipients (30s interval)...`,
          }

          processNextRecipient()
          return sendJson(res, 200, { ok: true, state: queueState })
        } catch (err) {
          return sendJson(res, 500, {
            ok: false,
            error: err?.message || 'Failed to start queue',
          })
        }
      })

      server.middlewares.use('/api/queue/stop', (req, res) => {
        if (req.method !== 'POST') {
          return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
        }
        clearQueueTimer()
        queueState.isRunning = false
        queueState.nextSendAt = 0
        queueState.statusMsg = 'Automatic sending stopped.'
        return sendJson(res, 200, { ok: true, state: queueState })
      })

      server.middlewares.use('/api/queue/status', (req, res) => {
        if (req.method !== 'GET') {
          return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
        }
        const secondsLeft =
          queueState.isRunning && queueState.nextSendAt > 0
            ? Math.max(0, Math.ceil((queueState.nextSendAt - Date.now()) / 1000))
            : 0
        return sendJson(res, 200, {
          ok: true,
          state: {
            ...queueState,
            currentNum: queueState.isRunning
              ? Math.min(queueState.index + 1, queueState.emails.length)
              : queueState.logs.length,
            secondsLeft,
          },
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), emailjsQueuePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
})