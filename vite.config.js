import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import https from 'node:https'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  Connection: 'close',
  Referer: 'https://safer.fmcsa.dot.gov/CompanySnapshot.aspx',
}

function sendHttps({ hostname, path, method, headers = {}, body = '' }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
        timeout: 15000,
      },
      (res) => {
        let chunks = ''
        res.on('data', (d) => {
          chunks += d.toString('utf8')
        })
        res.on('end', () => {
          resolve({ status: res.statusCode || 500, body: chunks })
        })
      }
    )

    req.on('timeout', () => req.destroy(new Error('Request timeout')))
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function fmcsaPureReactPlugin() {
  return {
    name: 'fmcsa-pure-react',
    configureServer(server) {
      server.middlewares.use('/safer-api/query.asp', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let rawBody = ''
        req.on('data', (chunk) => {
          rawBody += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const upstream = await sendHttps({
              hostname: 'safer.fmcsa.dot.gov',
              path: '/query.asp',
              method: 'POST',
              headers: {
                ...HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: rawBody,
            })
            res.statusCode = upstream.status
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(upstream.body)
          } catch (err) {
            res.statusCode = 502
            res.end(err?.message || 'SAFER Fetch Error')
          }
        })
      })

      server.middlewares.use('/sms-api/SMS/Carrier', async (req, res) => {
        const subPath = req.url || ''
        try {
          const upstream = await sendHttps({
            hostname: 'ai.fmcsa.dot.gov',
            path: `/SMS/Carrier${subPath}`,
            method: 'GET',
            headers: {
              ...HEADERS,
              Referer: 'https://ai.fmcsa.dot.gov/',
            },
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(upstream.body)
        } catch (err) {
          res.statusCode = 502
          res.end(err?.message || 'SMS Fetch Error')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fmcsaPureReactPlugin()],
  server: {
    host: 'localhost',
    port: 5173,
  },
})