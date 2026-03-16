/**
 * server/index.js
 *
 * Express backend proxy for SPL Content Generator.
 *
 * Responsibilities:
 *   - Hold the provider API key (never exposed to the frontend)
 *   - POST /api/generate-structure  →  OpenAI (or mock if USE_MOCK=true)
 *   - Serve the Vite build as static files in production
 *
 * Env variables (set in .env — see .env.example):
 *   OPENAI_API_KEY   required unless USE_MOCK=true
 *   USE_MOCK         set to "true" to skip OpenAI and return mock data
 *   OPENAI_MODEL     OpenAI model name (default: gpt-4o-mini)
 *   PORT             server port (default: 3001)
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const USE_MOCK = process.env.USE_MOCK === 'true'

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------

if (!USE_MOCK && !process.env.OPENAI_API_KEY) {
  console.error('[server] OPENAI_API_KEY is not set. Add it to .env or set USE_MOCK=true.')
  process.exit(1)
}

const openai = USE_MOCK ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ---------------------------------------------------------------------------
// Mock fallback — mirrors mockGeneration.js structure logic, server-side
// Returns the same raw shape callProvider() expects: { title, goal, coveredSubtopics }[]
// ---------------------------------------------------------------------------

function mockGenerateStructure(subtopicsText) {
  const lines = subtopicsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  return lines.map((line) => ({
    title: line,
    goal: `Students will be able to ${line.toLowerCase()}.`,
    coveredSubtopics: [line],
  }))
}

// ---------------------------------------------------------------------------
// OpenAI helpers
// ---------------------------------------------------------------------------

function buildPrompt(courseName, moduleName, subtopicsText) {
  return `You are a curriculum designer creating a structured lesson outline for a coding course.

Course: ${courseName}
Module: ${moduleName}
Sub-topics (one per line):
${subtopicsText}

Return a JSON object with a "steps" array. Each step must have exactly these fields:
- "title": string — concise step title derived from the sub-topic
- "goal": string — learning goal starting with "Students will be able to..."
- "coveredSubtopics": string[] — specific topics covered in this step

One step per sub-topic line. Return only valid JSON, no explanation.`
}

function parseProviderResponse(content) {
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.steps)) {
    throw new Error('Provider returned unexpected JSON shape — expected { steps: [] }')
  }
  return parsed.steps
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = express()
app.use(express.json())

// POST /api/generate-structure
app.post('/api/generate-structure', async (req, res) => {
  const { courseName, moduleName, subtopicsText } = req.body

  if (!courseName || !moduleName || !subtopicsText) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, subtopicsText',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateStructure(subtopicsText))
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: buildPrompt(courseName, moduleName, subtopicsText) },
      ],
    })
    const steps = parseProviderResponse(completion.choices[0].message.content)
    return res.json(steps)
  } catch (err) {
    console.error('[generate-structure]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// Serve Vite build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, () => {
  const mode = USE_MOCK ? 'mock' : `openai / ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`
  console.log(`Server running on http://localhost:${PORT} [${mode}]`)
})
