const { createServer } = require('http')
const next = require('next')
const { WebSocketServer } = require('ws')
const { SpeechClient } = require('@google-cloud/speech')
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Google Cloud Speech client
let speechClient = null

function getSpeechClient() {
  if (!speechClient) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (credentialsPath) {
      const absolutePath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.join(__dirname, '..', credentialsPath)

      speechClient = new SpeechClient({
        keyFilename: absolutePath,
      })
      console.log('Google Cloud Speech client initialized with:', absolutePath)
    } else {
      // Try default credentials
      speechClient = new SpeechClient()
      console.log('Google Cloud Speech client initialized with default credentials')
    }
  }
  return speechClient
}

// Gemini AI client
let geminiClient = null

function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not set in environment')
    }
    geminiClient = new ChatGoogleGenerativeAI({
      model: 'gemini-3-flash-preview',
      apiKey: apiKey,
      streaming: true,
    })
    console.log('Gemini AI client initialized')
  }
  return geminiClient
}

// Handle AI answer requests
async function handleAIRequest(ws, transcript, question) {
  try {
    const client = getGeminiClient()

    const systemPrompt = `You are a concise meeting assistant. Give SHORT, direct answers. No preamble, no repetition, no unnecessary explanation. If asked a question, answer it directly in 1-3 sentences. If no question, give 2-3 bullet points max.`

    const userPrompt = question
      ? `Transcript: ${transcript}\n\nAnswer this briefly: ${question}`
      : `Transcript: ${transcript}\n\nBriefly answer any questions asked, or give 2-3 key points.`

    const stream = await client.stream([
      ['system', systemPrompt],
      ['human', userPrompt],
    ])

    for await (const chunk of stream) {
      const text = chunk.content
      if (text && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'ai_chunk',
          text: text,
        }))
      }
    }

    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'ai_complete' }))
    }
  } catch (err) {
    console.error('AI request error:', err.message)
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'ai_error',
        message: err.message,
      }))
    }
  }
}

// Audio processing utilities
function convertWebmToLinear16(webmBuffer) {
  // For now, we'll use a simplified approach
  // In production, you'd want to use ffmpeg or a proper audio decoder
  // The browser sends webm/opus which needs to be decoded to PCM
  return webmBuffer
}

// Streaming recognition session
class TranscriptionSession {
  constructor(ws) {
    this.ws = ws
    this.recognizeStream = null
    this.audioBuffer = Buffer.alloc(0)
    this.isActive = false
    this.restartTimeout = null
    this.streamingLimit = 290000 // ~5 minutes, restart before 305s limit
  }

  start() {
    if (this.isActive) return
    this.isActive = true
    this.createStream()
  }

  createStream() {
    try {
      const client = getSpeechClient()

      const request = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long',
        },
        interimResults: true,
      }

      this.recognizeStream = client
        .streamingRecognize(request)
        .on('error', (err) => {
          console.error('Recognition stream error:', err)
          console.error('Error details:', err.code, err.details)
          // Don't send error for expected timeouts
          if (!err.message.includes('exceeded') && this.ws.readyState === 1) {
            this.ws.send(JSON.stringify({
              type: 'error',
              message: err.message,
            }))
          }
          this.restartStream()
        })
        .on('data', (data) => {
          console.log('Recognition data received:', JSON.stringify(data, null, 2))
          if (data.results?.[0]) {
            const result = data.results[0]
            const transcript = result.alternatives?.[0]?.transcript || ''
            const isFinal = result.isFinal

            if (transcript && this.ws.readyState === 1) {
              this.ws.send(JSON.stringify({
                type: 'transcript',
                text: transcript,
                isFinal: isFinal,
                confidence: result.alternatives?.[0]?.confidence,
              }))
            }
          }
        })
        .on('end', () => {
          console.log('Recognition stream ended')
          if (this.isActive) {
            this.restartStream()
          }
        })

      console.log('Recognition stream created')

      // Set up restart timer to avoid 305s limit
      this.restartTimeout = setTimeout(() => {
        if (this.isActive) {
          console.log('Restarting stream due to time limit')
          this.restartStream()
        }
      }, this.streamingLimit)

    } catch (err) {
      console.error('Failed to create recognition stream:', err)
      if (this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to start transcription: ' + err.message,
        }))
      }
    }
  }

  restartStream() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }

    if (this.recognizeStream) {
      this.recognizeStream.end()
      this.recognizeStream = null
    }

    if (this.isActive) {
      // Small delay before restarting
      setTimeout(() => {
        if (this.isActive) {
          this.createStream()
        }
      }, 100)
    }
  }

  processAudio(audioData) {
    if (!this.isActive || !this.recognizeStream) {
      console.log('Cannot process audio: stream not active')
      return
    }

    try {
      // Write audio data to the stream
      this.audioChunkCount = (this.audioChunkCount || 0) + 1
      if (this.audioChunkCount <= 5 || this.audioChunkCount % 20 === 0) {
        console.log(`Audio chunk #${this.audioChunkCount}: ${audioData.length} bytes`)
      }
      const written = this.recognizeStream.write(audioData)
      if (!written) {
        console.log('Stream buffer full, backpressure')
      }
    } catch (err) {
      console.error('Error writing to stream:', err.message)
    }
  }

  stop() {
    this.isActive = false

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }

    if (this.recognizeStream) {
      try {
        this.recognizeStream.end()
      } catch (err) {
        console.error('Error ending stream:', err.message)
      }
      this.recognizeStream = null
    }
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${hostname}:${port}`)
      const parsedUrl = {
        pathname: url.pathname,
        query: Object.fromEntries(url.searchParams),
      }
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // WebSocket server for transcription
  const wss = new WebSocketServer({
    server,
    path: '/api/transcribe',
  })

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected')

    const session = new TranscriptionSession(ws)
    session.start()
    let firstAudioChunkLogged = false

    ws.on('message', async (message) => {
      // Convert Buffer to string to check if it's a JSON message
      const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message)
      const messageStr = buffer.toString('utf8')

      // Check if it's a JSON message (AI request)
      if (messageStr.startsWith('{')) {
        try {
          const data = JSON.parse(messageStr)
          if (data.type === 'ai_request') {
            console.log('AI request received:', data.question || 'no specific question')
            await handleAIRequest(ws, data.context, data.question)
            return
          }
        } catch (err) {
          // Not valid JSON, treat as audio data
        }
      }

      // Receive audio data and process it
      if (!firstAudioChunkLogged) {
        console.log(`First audio chunk received: ${buffer.length} bytes`)
        firstAudioChunkLogged = true
      }
      session.processAudio(buffer)
    })

    ws.on('close', () => {
      console.log('WebSocket client disconnected')
      session.stop()
    })

    ws.on('error', (err) => {
      console.error('WebSocket error:', err)
      session.stop()
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket transcription available at ws://${hostname}:${port}/api/transcribe`)
  })
})
