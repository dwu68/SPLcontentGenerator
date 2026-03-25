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
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import OpenAI from 'openai'
import { buildGenerateStructurePrompt } from './prompts/generateStructurePrompt.js'
import { buildGenerateContentPrompt } from './prompts/generateContentPrompt.js'
import { buildPromptContext } from './lib/promptContext.js'
import { extractSlideText } from './lib/extractSlideText.js'

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

function mockGenerateContent(step, lessonFormat) {
  if (lessonFormat === 'guided_tool_workflow') {
    // Use assigned slideNumbers if present; fall back to ['1'] for mock runs without slides.
    const slideNums = Array.isArray(step.slideNumbers) && step.slideNumbers.length > 0
      ? step.slideNumbers
      : ['1']

    const blocks = []
    slideNums.forEach((num, i) => {
      const b1 = i * 2 + 1
      const b2 = i * 2 + 2
      blocks.push({
        id: `b${b1}`,
        type: 'slide',
        title: null,
        slideRef: num,
        content: '',
      })
      blocks.push({
        id: `b${b2}`,
        type: 'slide-explain',
        title: null,
        content: `Slide ${num} introduces "${step.title}" as a key part of this workflow.\n\nReview it carefully — it shows the core concept or pattern you will be working with in this step.`,
      })
    })

    return {
      blocks,
      starterCode: '',
      expectedAction: '',
      validationNote: '',
    }
  }

  const topic = step.title
  const topicLower = topic.toLowerCase()
  return {
    blocks: [
      {
        id: 'b1',
        type: 'explain',
        title: 'What it is',
        content: `${topic} is a core concept you will use throughout this module. Understanding it clearly now will make the next steps much easier.`,
        language: null,
      },
      {
        id: 'b2',
        type: 'explain',
        title: 'Why it matters',
        content: `Getting ${topicLower} wrong does not always produce an obvious error — sometimes the code runs but produces incorrect output, which makes it harder to debug. The key is to apply it consistently.`,
        language: null,
      },
      {
        id: 'b3',
        type: 'code',
        title: null,
        content: `# ${topic} — short example\n\n# Correct usage:\nresult = do_the_thing_correctly()   # this works as expected\nprint(result)\n\n# Common mistake (do not do this):\n# wrong_result = do_the_thing_wrong() # produces incorrect output`,
        language: 'python',
      },
      {
        id: 'b4',
        type: 'check',
        title: 'Before you continue',
        content: `What is the most important rule to remember when applying ${topicLower}?\n\n→ Apply it consistently and verify the output matches the expected result.`,
        language: null,
      },
      {
        id: 'b5',
        type: 'task',
        title: 'Your turn',
        content: `1. Look at the starter code on the right. Find the section marked TODO.\n2. Apply ${topicLower} to complete that section.\n3. Confirm the output matches the expected result shown in the comment.`,
        language: null,
      },
      {
        id: 'b6',
        type: 'hint',
        title: 'Need a hint?',
        content: `Look at the code example above — the correct usage pattern there is exactly what the TODO is asking for. Focus on the key rule for ${topicLower}.`,
        language: null,
      },
    ],
    expectedAction: `The learner completes the TODO block by correctly applying ${topicLower}. The code should run without errors and produce the expected output.`,
    validationNote: `Correct solution: the TODO block is filled in and the output matches what is expected. Watch for: copy-pasting the example without adapting it to the task, and leaving the TODO comment in place.`,
    starterCode: `# Step ${step.stepNumber}: ${topic}\n# -----------------------------------------------\n# Study the example in the lesson panel, then\n# complete the TODO below.\n\n# TODO: apply ${topicLower} here\n\n\n# Expected output is shown as a comment after each print:\nif True:\n    print("Step ${step.stepNumber} is running")  # Step ${step.stepNumber} is running\n`,
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

// ---------------------------------------------------------------------------
// Multer — in-memory, .pptx only, 10 MB limit
// ---------------------------------------------------------------------------

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

const slidesUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === PPTX_MIME || file.originalname.toLowerCase().endsWith('.pptx')) {
      cb(null, true)
    } else {
      cb(new Error('Only .pptx files are accepted'))
    }
  },
})

// POST /api/upload-slides
app.post('/api/upload-slides', slidesUpload.single('slides'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' })
  try {
    const { slideText, slideCount } = await extractSlideText(req.file.buffer)
    return res.json({ slideText, slideCount, fileName: req.file.originalname })
  } catch (err) {
    console.error('[upload-slides]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-structure
app.post('/api/generate-structure', async (req, res) => {
  const { courseName, moduleName, subtopicsText, slideText } = req.body

  const hasSlides = slideText && slideText.trim().length > 0
  const hasSubtopics = subtopicsText && subtopicsText.trim().length > 0

  if (!courseName || !moduleName) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName',
    })
  }
  if (!hasSlides && !hasSubtopics) {
    return res.status(400).json({
      error: 'Provide either sub-topics or upload slides before generating.',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateStructure(subtopicsText || slideText))
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: buildGenerateStructurePrompt({ courseName, moduleName, subtopicsText, slideText }) },
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
    lessonFormat,
    learnerLevel,
    outputLanguage,
    slideText,
  } = req.body

  if (!courseName || !moduleName || !step?.title) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, step (with title)',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateContent(step, lessonFormat))
  }

  try {
    const context = buildPromptContext({
      courseName,
      moduleName,
      step,
      lessonStructure,
      lessonFormat,
      learnerLevel,
      outputLanguage,
      slideText,
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

// POST /api/export
app.post('/api/export', (req, res) => {
  const {
    courseName,
    moduleName,
    lessonStructure = [],
    lessonContent = [],
    learnerLevel = 'beginner',
    outputLanguage = 'Python',
    exportedAt,
  } = req.body

  if (!courseName || !moduleName || !lessonContent.length) {
    return res.status(400).json({ error: 'Missing required fields: courseName, moduleName, lessonContent' })
  }

  // Build output dir relative to project root
  const outputDir = path.join(__dirname, '../output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Filename: slug-course-slug-module-MMDD-HHMM.json
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const now = new Date(exportedAt || Date.now())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const filename = `${slug(courseName)}-${slug(moduleName)}-${mm}${dd}-${hh}${min}.json`

  // Join content + structure by id to attach goal and topics to each step
  const steps = lessonContent.map((content) => {
    const structure = lessonStructure.find((s) => s.id === content.id) || {}
    return {
      stepNumber:     content.stepNumber,
      stepTitle:      content.title,
      stepGoal:       structure.goal || '',
      stepTopics:     structure.coveredSubtopics || [],
      blocks:         content.blocks || [],
      starterCode:    content.starterCode || '',
      expectedAction: content.expectedAction || '',
      validationNote: content.validationNote || '',
    }
  })

  const payload = {
    courseName,
    moduleName,
    learnerLevel,
    outputLanguage,
    exportedAt: exportedAt || now.toISOString(),
    steps,
  }

  try {
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(payload, null, 2))
    return res.json({ filename })
  } catch (err) {
    console.error('[export]', err.message)
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
