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
import { buildGenerateTaskPrompt } from './prompts/generateTaskPrompt.js'
import { buildGenerateModuleLabPrompt } from './prompts/generateModuleLabPrompt.js'
import { buildGenerateBlockPrompt } from './prompts/generateBlockPrompt.js'
import { buildReviewSubtopicsPrompt } from './prompts/reviewSubtopicsPrompt.js'
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
// Mock fallback — signal-driven content generation (mirrors unified prompt logic)
//
// Primary signal:  slideNumbers.length > 0  → mandatory [slide, slide-explain] pairs first
// Secondary signal: lessonFormat            → calibrates additional blocks
// Derived signal:  task block present       → starterCode is non-empty; otherwise ""
//
// Returns the same raw shape the content route expects: { blocks, starterCode, … }
// ---------------------------------------------------------------------------

function mockGenerateContent(step, lessonFormat) {
  const hasSlides = Array.isArray(step.slideNumbers) && step.slideNumbers.length > 0
  const slideNums = hasSlides ? step.slideNumbers : []
  const topic     = step.title
  const topicLower = topic.toLowerCase()
  const format    = lessonFormat || 'code_lab'

  const blocks = []
  let nextId = 1
  const push = (block) => blocks.push({ id: `b${nextId++}`, ...block })

  // ── Signal 1: assigned slides → mandatory pairs first ──────────────────────
  if (hasSlides) {
    slideNums.forEach((num) => {
      push({
        type: 'slide',
        title: null,
        slideRef: String(num),
        content: '',
      })
      push({
        type: 'slide-explain',
        title: null,
        content: `Slide ${num} covers "${topic}".\n\nReview it carefully — it introduces the core idea you will be working with in this step.`,
      })
    })
  }

  // ── Signal 2: lessonFormat → additional blocks ─────────────────────────────

  if (format === 'code_lab') {
    // code_lab: explain + code + task (standard lab pattern)
    // explain bridges slides → practice, or stands alone if no slides
    push({
      type: 'explain',
      title: hasSlides ? `${topic} in code` : 'What it is',
      content: hasSlides
        ? `The slide above introduces the concept. Here is what it looks like when you write it yourself.`
        : `${topic} is a core concept you will use throughout this module. Understanding it clearly now will make the next steps much easier.`,
      language: null,
    })
    push({
      type: 'code',
      title: null,
      content: `# ${topic} — example\n\nresult = example_${topicLower.replace(/\s+/g, '_')}()\nprint(result)  # expected output`,
      language: 'python',
    })
    push({
      type: 'task',
      title: 'Lab',
      content: `Practice ${topicLower} by completing the TODO in the starter code. When correct, the output should match the expected result shown in the comments.`,
      language: null,
    })
    return {
      blocks,
      starterCode: `# Step ${step.stepNumber}: ${topic}\n# -----------------------------------------------\n# Study the example in the lesson panel, then\n# complete the TODO below.\n\n# TODO: apply ${topicLower} here\n# Expected: correct output\n`,
      expectedAction: `Complete the TODO by correctly applying ${topicLower}. The code should run without errors and produce the expected output.`,
      validationNote: `Correct solution fills in the TODO and produces the expected output. Watch for: copying the code example without adapting it, and leaving the TODO comment in place.`,
    }
  }

  if (format === 'guided_tool_workflow') {
    // guided_tool_workflow: slides carry most teaching.
    // Add one explain block for the concept gap not covered by slide-explain.
    // No task, no starter code unless the step genuinely involves coding (which mock cannot detect).
    push({
      type: 'explain',
      title: `${topic} — key point`,
      content: hasSlides
        ? `The slide above introduces ${topicLower}. Understanding this clearly is important before moving to the next step in the workflow.`
        : `${topic} is a key part of this workflow. Understanding the concept before using the tool will help you recognize what is happening at each stage.`,
      language: null,
    })
    if (!hasSlides) {
      // No slides — add a second explain to compensate for the missing slide-explain coverage
      push({
        type: 'explain',
        title: 'Why it matters',
        content: `Getting ${topicLower} right here keeps the rest of the workflow predictable and makes it easier to troubleshoot if something goes wrong.`,
        language: null,
      })
    }
    return { blocks, starterCode: '', expectedAction: '', validationNote: '' }
  }

  // concept_application (and any unrecognized format)
  // explain + check — no task, no starter code
  push({
    type: 'explain',
    title: 'Core idea',
    content: `${topic} underpins the applications you will explore in this module. Grasping the concept clearly here will sharpen how you recognize it in practice.`,
    language: null,
  })
  push({
    type: 'check',
    title: 'Quick check',
    content: `In what situation would you apply ${topicLower} rather than a simpler alternative?\n\n→ ${topic} is the right choice when the defining conditions are clearly present. Recognizing those conditions is the key skill.`,
    language: null,
  })
  return { blocks, starterCode: '', expectedAction: '', validationNote: '' }
}

// ---------------------------------------------------------------------------
// Mock fallback — task + starterCode generation
//
// Returns skip for concept_application (no natural coding action).
// Returns a minimal task block + starterCode for code_lab and guided_tool_workflow.
// ---------------------------------------------------------------------------

function mockGenerateTask(step, lessonFormat) {
  const format = lessonFormat || 'code_lab'
  if (format === 'concept_application') {
    return { skip: true, reason: 'This step is conceptual — no coding action to practice.' }
  }
  const topic     = step.title
  const topicSlug = topic.toLowerCase().replace(/\s+/g, '_')
  return {
    taskBlock: {
      type:    'task',
      title:   'Lab',
      content: `Apply ${topic.toLowerCase()} by completing the TODO in the starter code. When your solution is correct, the output should match the expected result shown in the comments.`,
    },
    starterCode: `# ${topic}\n# TODO: apply ${topicSlug} here\n# Expected: correct result\n`,
  }
}

// ---------------------------------------------------------------------------
// Mock fallback — module-level lab generation
//
// Returns skip for concept_application (no natural coding synthesis).
// For code_lab / guided_tool_workflow, synthesizes topics from previousSteps.
// ---------------------------------------------------------------------------

function mockGenerateModuleLab(previousSteps, lessonFormat) {
  const format = lessonFormat || 'code_lab'
  if (format === 'concept_application') {
    return { skip: true, reason: 'This module is conceptual — no integrated coding lab is appropriate.' }
  }
  const allTopics = (previousSteps || [])
    .flatMap((s) => s.coveredSubtopics || [])
    .slice(0, 3)
  if (allTopics.length === 0) {
    return { skip: true, reason: 'No previous lesson content is available to base a module lab on.' }
  }
  const topicList = allTopics.join(', ')
  const slug = topicList.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
  return {
    taskBlock: {
      type:    'task',
      title:   'Module Lab',
      content: `Apply ${topicList} together in a single exercise. Your solution should correctly use each concept and produce the expected output shown in the starter code comments.`,
    },
    starterCode: `# Module Lab: ${topicList}\n\n# TODO: apply ${slug} together\n# Expected: correct output combining all module concepts\n`,
  }
}

// ---------------------------------------------------------------------------
// Mock fallback — subtopics review
//
// Mock always signals that the list looks fine (skip=true).
// Real AI provides substantive feedback.
// ---------------------------------------------------------------------------

function mockReviewSubtopics(subtopicsText) {
  const count = subtopicsText.split('\n').filter((l) => l.trim()).length
  return {
    skip: true,
    reason: `The ${count} topic${count === 1 ? '' : 's'} look well-structured for this module. (Mock review — set USE_MOCK=false for substantive AI feedback.)`,
  }
}

// ---------------------------------------------------------------------------
// Mock fallback — single block generation (code or check)
// ---------------------------------------------------------------------------

function mockGenerateBlock(step, blockType, language) {
  const topic    = step?.title ?? 'this topic'
  const topicSlug = topic.toLowerCase().replace(/\s+/g, '_')

  if (blockType === 'code') {
    const lang = language || 'python'
    return {
      block: {
        type:     'code',
        title:    'Example',
        language: lang,
        content:  `# Example: ${topic}\n${topicSlug}_example = "mock value"  # illustrative value\nprint(${topicSlug}_example)  # outputs: mock value`,
      },
    }
  }

  // blockType === 'check'
  return {
    block: {
      type:    'check',
      title:   'Knowledge Check',
      content: `What is a key concept in "${topic}"?\n→ (Mock answer) The core idea is to apply ${topicSlug} correctly to produce the expected result.`,
    },
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

// ---------------------------------------------------------------------------
// Uploads directory — created on startup if absent
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// Serve uploaded files as static assets at /uploads/<filename>
app.use('/uploads', express.static(UPLOADS_DIR))

// ---------------------------------------------------------------------------
// Multer configs
// ---------------------------------------------------------------------------

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

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${Date.now()}-${safeName}`)
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
})

// POST /api/upload-file
app.post('/api/upload-file', fileUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' })
  return res.json({
    fileUrl:  `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
  })
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
  // [DIAG] point 2 — confirm request reached Express
  console.log('[DIAG][server] /api/generate-content received | step:', req.body?.step?.title, '| lessonFormat:', req.body?.lessonFormat, '| USE_MOCK:', USE_MOCK)

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
    // [DIAG] point 3 — confirm we are about to call OpenAI and what model is being used
    const _diagModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    console.log('[DIAG][server] calling OpenAI | model:', _diagModel, '| prompt length (chars):', buildGenerateContentPrompt(context).length)
    const completion = await openai.chat.completions.create({
      model: _diagModel,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: buildGenerateContentPrompt(context) },
      ],
    })
    // [DIAG] point 4 — confirm OpenAI returned and what the response looks like
    console.log('[DIAG][server] OpenAI returned | finish_reason:', completion.choices[0]?.finish_reason, '| content length (chars):', completion.choices[0]?.message?.content?.length)
    const contentFields = parseContentResponse(completion.choices[0].message.content)
    // [DIAG] point 4b — confirm parseContentResponse succeeded and what we are about to send
    const _diagResponseJson = JSON.stringify(contentFields)
    console.log('[DIAG][server] parseContentResponse OK | about to res.json | serialized response length (chars):', _diagResponseJson.length)
    return res.json(contentFields)
  } catch (err) {
    // [DIAG] point 5 — capture the full error including stack
    console.error('[DIAG][server] generate-content ERROR | message:', err.message, '| status:', err.status, '| code:', err.code)
    console.error('[DIAG][server] stack:', err.stack)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-task
app.post('/api/generate-task', async (req, res) => {
  const {
    courseName,
    moduleName,
    step,
    currentBlocks = [],
    lessonFormat,
    slideText,
    outputLanguage = 'Python',
  } = req.body

  if (!courseName || !moduleName || !step?.title) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, step (with title)',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateTask(step, lessonFormat))
  }

  try {
    const prompt = buildGenerateTaskPrompt({
      stepTitle:     step.title,
      stepGoal:      step.goal      ?? '',
      stepTopics:    Array.isArray(step.coveredSubtopics) ? step.coveredSubtopics : [],
      slideNumbers:  Array.isArray(step.slideNumbers)    ? step.slideNumbers    : [],
      currentBlocks: Array.isArray(currentBlocks)        ? currentBlocks        : [],
      lessonFormat:  lessonFormat   || 'code_lab',
      slideText:     slideText      || '',
      outputLanguage,
    })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = JSON.parse(completion.choices[0].message.content)
    return res.json(raw)
  } catch (err) {
    console.error('[generate-task]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-module-lab
app.post('/api/generate-module-lab', async (req, res) => {
  const {
    courseName,
    moduleName,
    lessonFormat,
    outputLanguage = 'Python',
    currentStep,
    previousSteps = [],
  } = req.body

  if (!courseName || !moduleName || !currentStep?.title) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, currentStep (with title)',
    })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateModuleLab(previousSteps, lessonFormat))
  }

  try {
    const prompt = buildGenerateModuleLabPrompt({
      courseName,
      moduleName,
      lessonFormat: lessonFormat || 'code_lab',
      outputLanguage,
      currentStep,
      previousSteps,
    })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = JSON.parse(completion.choices[0].message.content)
    return res.json(raw)
  } catch (err) {
    console.error('[generate-module-lab]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-block
app.post('/api/generate-block', async (req, res) => {
  const {
    step,
    currentBlocks = [],
    blockType,
    language      = 'python',
    lessonFormat  = 'code_lab',
    outputLanguage = 'Python',
  } = req.body

  if (!step?.title || !blockType) {
    return res.status(400).json({
      error: 'Missing required fields: step (with title), blockType',
    })
  }
  if (blockType !== 'code' && blockType !== 'check') {
    return res.status(400).json({ error: 'blockType must be "code" or "check"' })
  }

  if (USE_MOCK) {
    return res.json(mockGenerateBlock(step, blockType, language))
  }

  try {
    const prompt = buildGenerateBlockPrompt({
      stepTitle:     step.title,
      stepGoal:      step.goal      ?? '',
      stepTopics:    Array.isArray(step.coveredSubtopics) ? step.coveredSubtopics : [],
      currentBlocks: Array.isArray(currentBlocks)         ? currentBlocks         : [],
      blockType,
      language,
      lessonFormat,
      outputLanguage,
    })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = JSON.parse(completion.choices[0].message.content)
    return res.json(raw)
  } catch (err) {
    console.error('[generate-block]', err.message)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/review-subtopics
app.post('/api/review-subtopics', async (req, res) => {
  const { courseName, moduleName, lessonFormat, subtopicsText } = req.body

  if (!courseName || !moduleName || !subtopicsText?.trim()) {
    return res.status(400).json({
      error: 'Missing required fields: courseName, moduleName, subtopicsText',
    })
  }

  if (USE_MOCK) {
    return res.json(mockReviewSubtopics(subtopicsText))
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: buildReviewSubtopicsPrompt({ courseName, moduleName, lessonFormat, subtopicsText }) },
      ],
    })
    const raw = JSON.parse(completion.choices[0].message.content)
    return res.json(raw)
  } catch (err) {
    console.error('[review-subtopics]', err.message)
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
