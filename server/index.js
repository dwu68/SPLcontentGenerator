/**
 * server/index.js
 *
 * Express backend proxy for SPL Content Generator.
 *
 * Responsibilities:
 *   - Hold the provider API key (never exposed to the frontend)
 *   - POST /api/generate-structure  →  OpenAI (or mock if USE_MOCK=true)
 *   - POST /api/generate-content    →  OpenAI (or mock if USE_MOCK=true)
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
import { buildGenerateStructurePrompt } from './prompts/generateStructurePrompt.js'
import { buildGenerateContentPrompt } from './prompts/generateContentPrompt.js'
import { buildPromptContext } from './lib/promptContext.js'

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
// Mock fallback — mirrors mockGeneration.js content logic, server-side
// Returns the same raw shape the content route expects: { concept, … }
// ---------------------------------------------------------------------------

function mockGenerateContent(step) {
  return {
    concept: `${step.title} is a core concept you will use throughout this module.\n\nWhy it matters: getting ${step.title.toLowerCase()} wrong does not always produce an obvious error — sometimes the code runs but produces incorrect output, which makes it harder to debug.\n\nHow it works: the key rule is that [describe the primary rule or mechanism here]. This applies any time [describe when the rule is in force].\n\nCommon mistake: learners often assume [describe a typical misconception]. The correct approach is always to [describe the correct practice].`,
    codeExample: `# ${step.title} — short example\n\n# Correct usage:\n[example of correct code here]   # <- why this works\n\n# Common mistake:\n[example of incorrect code here] # <- what goes wrong and why`,
    instructions: `1. Look at the starter code on the right. Find the section marked TODO.\n2. Apply ${step.title.toLowerCase()} to complete that section.\n3. Run the code and confirm the output matches the expected result shown in the comment.`,
    hint: `Re-read the explanation above and focus on the key rule for ${step.title.toLowerCase()}. Then look at the code example — the correct usage pattern there is exactly what the TODO is asking for.`,
    expectedAction: `The learner completes the TODO block by correctly applying ${step.title.toLowerCase()}. The code should run without errors and produce the expected output.`,
    validationNote: `Correct solution: the TODO block is filled in and the output matches what is expected. Watch for: copy-pasting the example without adapting it to the task, and leaving the TODO comment in place.`,
    starterCode: `# Step ${step.stepNumber}: ${step.title}\n# -----------------------------------------------\n# Read this code carefully. Two concepts below\n# relate directly to: ${step.title}\n\n# TODO: Add your comment here explaining what you notice.\n\n\n# Example code\nif True:\n    print("Step ${step.stepNumber} is running")\n`,
  }
}

// ---------------------------------------------------------------------------
// OpenAI helpers
// ---------------------------------------------------------------------------

function parseProviderResponse(content) {
  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.steps)) {
    throw new Error('Provider returned unexpected JSON shape — expected { steps: [] }')
  }
  return parsed.steps
}

function parseContentResponse(content) {
  const parsed = JSON.parse(content)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Provider returned unexpected JSON shape — expected a content object')
  }
  return parsed
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
        { role: 'user', content: buildGenerateStructurePrompt({ courseName, moduleName, subtopicsText }) },
      ],
    })
    const steps = parseProviderResponse(completion.choices[0].message.content)
    return res.json(steps)
  } catch (err) {
    console.error('[generate-structure]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-content
app.post('/api/generate-content', async (req, res) => {
  const {
    courseName,
    moduleName,
    step,
    lessonStructure = [],
    learnerLevel,
    outputLanguage,
  } = req.body

  if (!courseName || !moduleName || !step?.title) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, step (with title)',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateContent(step))
  }

  try {
    const context = buildPromptContext({
      courseName,
      moduleName,
      step,
      lessonStructure,
      learnerLevel,
      outputLanguage,
    })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: buildGenerateContentPrompt(context) },
      ],
    })
    const contentFields = parseContentResponse(completion.choices[0].message.content)
    return res.json(contentFields)
  } catch (err) {
    console.error('[generate-content]', err.message)
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
