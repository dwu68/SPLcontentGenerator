/**
 * lessonContentService.js
 *
 * Service boundary for Screen 2 lesson content generation.
 *
 * Architecture:
 *
 *   App.jsx  →  generateAllLessonContent()
 *                       │
 *             for each step in lessonStructure:
 *                  callProvider()          ← calls POST /api/generate-content
 *                       │
 *               normalizeContent()        ← validates shape, assigns id/stepNumber/title
 *                       │
 *               LessonContent[]  →  App.jsx
 *
 * One API call is made per step. Steps are generated sequentially.
 * If a step's response is missing fields they are coerced to empty strings
 * rather than crashing the UI.
 */

// The seven content fields the server is expected to return for each step.
const CONTENT_FIELDS = [
  'concept',
  'codeExample',
  'instructions',
  'hint',
  'expectedAction',
  'validationNote',
  'starterCode',
]

// ---------------------------------------------------------------------------
// Provider call — POST /api/generate-content
// ---------------------------------------------------------------------------

/**
 * callProvider
 *
 * Calls the backend endpoint for a single step and returns the raw content object.
 *
 * Expected return shape (from server):
 *   { concept, codeExample, instructions, hint, expectedAction, validationNote, starterCode }
 *
 * @param {object} params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {object}   params.step            — the LessonStructure step to generate content for
 * @param {object[]} params.lessonStructure — full structure array (sent as context)
 * @param {string}   [params.learnerLevel]
 * @param {string}   [params.outputLanguage]
 * @returns {Promise<object>}
 */
async function callProvider({ courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText }) {
  // [DIAG] point 1 — confirm fetch is about to fire and what payload size looks like
  const _diagPayload = { courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText }
  console.log('[DIAG][frontend] callProvider firing for step:', step?.title, '| lessonFormat:', lessonFormat, '| payload bytes:', JSON.stringify(_diagPayload).length)
  const res = await fetch('/api/generate-content', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText }),
  })
  // [DIAG] point 1b — confirm fetch resolved and what HTTP status came back
  console.log('[DIAG][frontend] fetch resolved for step:', step?.title, '| status:', res.status, '| ok:', res.ok)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status} for step "${step.title}"`)
  }
  const _diagJson = await res.json()
  // [DIAG] point 1c — confirm res.json() resolved and what the top-level keys are
  console.log('[DIAG][frontend] res.json() resolved for step:', step?.title, '| top-level keys:', Object.keys(_diagJson))
  return _diagJson
}

// ---------------------------------------------------------------------------
// Normalization — validates shape, assigns id / stepNumber / title
// ---------------------------------------------------------------------------

/**
 * normalizeContent
 *
 * Validates the raw provider response for one step and promotes it to a full
 * LessonContent object. Missing or wrong-typed fields are coerced to empty
 * strings rather than propagating undefined into App state.
 *
 * @param {unknown} rawContent  — parsed JSON object from the server
 * @param {object}  step        — the LessonStructure step this content belongs to
 * @returns {LessonContent}
 */
function normalizeContent(rawContent, step) {
  const raw = rawContent && typeof rawContent === 'object' && !Array.isArray(rawContent)
    ? rawContent
    : {}

  const coerced = {}
  for (const field of CONTENT_FIELDS) {
    coerced[field] = typeof raw[field] === 'string' ? raw[field] : ''
  }

  return {
    id:         step.id,
    stepNumber: step.stepNumber,
    title:      step.title,
    blocks:     Array.isArray(raw.blocks) ? raw.blocks : [],
    ...coerced,
  }
}

// ---------------------------------------------------------------------------
// Public API — called from App.jsx handleGenerate
// ---------------------------------------------------------------------------

/**
 * generateStepContent
 *
 * Generates content for a single lesson step. Used by the progressive
 * generation flow in App.jsx where Screen 2 is navigated to immediately
 * and steps are generated one at a time.
 *
 * @param {object} params — same shape as callProvider params
 * @returns {Promise<LessonContent>}
 */
export async function generateStepContent({ courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText }) {
  const raw = await callProvider({ courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText })
  return normalizeContent(raw, step)
}

/**
 * generateTaskForStep
 *
 * Calls POST /api/generate-task for a step that has no task block or starterCode.
 * Returns one of:
 *   { taskBlock, starterCode }         — task generated; caller assigns block id
 *   { skip: true, reason: string }     — model signalled no suitable task exists
 *
 * Throws on network error or unexpected server response.
 *
 * @param {object}   params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {object}   params.step             — LessonStructure step (title, goal, topics, slideNumbers)
 * @param {object[]} params.currentBlocks    — live blocks already in this step (in-edit state)
 * @param {string}   [params.lessonFormat]
 * @param {string}   [params.slideText]
 * @returns {Promise<{ taskBlock, starterCode } | { skip: true, reason: string }>}
 */
export async function generateTaskForStep({ courseName, moduleName, step, currentBlocks, lessonFormat, slideText }) {
  const res = await fetch('/api/generate-task', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseName, moduleName, step, currentBlocks, lessonFormat, slideText }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status} for step "${step.title}"`)
  }
  const raw = await res.json()
  if (raw.skip === true) {
    return { skip: true, reason: raw.reason || 'No suitable task for this step.' }
  }
  if (!raw.taskBlock || typeof raw.starterCode !== 'string') {
    throw new Error('Unexpected response shape from /api/generate-task')
  }
  return { taskBlock: raw.taskBlock, starterCode: raw.starterCode }
}

/**
 * generateModuleLabForStep
 *
 * Calls POST /api/generate-module-lab for a Hands-on Practice step.
 * Condenses previous lesson steps client-side before sending — only
 * lesson steps that appear before the current step and have at least
 * one block are included. Each step is reduced to:
 *   { title, goal, coveredSubtopics, blockSummaries: [{ type, excerpt }] }
 * Fields excluded: starterCode, expectedAction, validationNote.
 *
 * If no qualifying previous steps exist, returns a skip response
 * immediately without making a network call.
 *
 * Returns one of:
 *   { taskBlock, starterCode }         — lab generated; caller assigns block id
 *   { skip: true, reason: string }     — no suitable lab; caller shows reason
 * Throws on network error or unexpected server response.
 *
 * @param {object}   params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {string}   [params.lessonFormat]
 * @param {object}   params.step             — current LessonStructure step
 * @param {object[]} params.lessonStructure  — full structure array
 * @param {object[]} params.lessonContent    — full content array
 * @returns {Promise<{ taskBlock, starterCode } | { skip: true, reason: string }>}
 */
export async function generateModuleLabForStep({
  courseName,
  moduleName,
  lessonFormat,
  step,
  lessonStructure,
  lessonContent,
}) {
  // Collect lesson steps that appear before the current step and have content
  const currentIndex = lessonStructure.findIndex((s) => s.id === step.id)
  const stepsBeforeCurrent = currentIndex >= 0
    ? lessonStructure.slice(0, currentIndex)
    : lessonStructure

  const previousSteps = stepsBeforeCurrent
    .filter((s) => s.stepType === 'lesson')
    .map((s) => {
      const content = lessonContent.find((c) => c.id === s.id)
      const blocks = Array.isArray(content?.blocks) ? content.blocks : []
      if (blocks.length === 0) return null  // skip steps with no completed content

      const blockSummaries = blocks.map((b) => ({
        type:    b.type,
        excerpt: (b.content ?? '').trim().slice(0, 150),
      }))

      return {
        title:            s.title,
        goal:             s.goal ?? '',
        coveredSubtopics: Array.isArray(s.coveredSubtopics) ? s.coveredSubtopics : [],
        blockSummaries,
      }
    })
    .filter(Boolean)

  // Early exit — no qualifying context to synthesize from
  if (previousSteps.length === 0) {
    return {
      skip: true,
      reason: 'No previous lesson content is available to base a module lab on. Add content to the earlier steps first.',
    }
  }

  const res = await fetch('/api/generate-module-lab', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      courseName,
      moduleName,
      lessonFormat,
      currentStep: {
        title:            step.title,
        goal:             step.goal ?? '',
        coveredSubtopics: Array.isArray(step.coveredSubtopics) ? step.coveredSubtopics : [],
      },
      previousSteps,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status} for step "${step.title}"`)
  }

  const raw = await res.json()
  if (raw.skip === true) {
    return { skip: true, reason: raw.reason || 'No suitable module lab for this step.' }
  }
  if (!raw.taskBlock || typeof raw.starterCode !== 'string') {
    throw new Error('Unexpected response shape from /api/generate-module-lab')
  }
  return { taskBlock: raw.taskBlock, starterCode: raw.starterCode }
}

/**
 * generateBlockForStep
 *
 * Calls POST /api/generate-block to add a single AI-generated content block
 * to a step that is currently being edited.
 *
 * Supports two block types:
 *   'code'  — a short annotated code example grounded in the step's content
 *   'check' — a knowledge-check question with a reveal answer (question\n→ answer)
 *
 * No skip path — always returns a block.
 * Throws on network error or unexpected server response.
 *
 * @param {object}   params
 * @param {object}   params.step           — LessonStructure step (title, goal, topics)
 * @param {object[]} params.currentBlocks  — live blocks currently in the step
 * @param {'code'|'check'} params.blockType
 * @param {string}   [params.language]     — code language; used only for blockType 'code'
 * @param {string}   [params.lessonFormat]
 * @param {string}   [params.slideText]
 * @returns {Promise<{ block: object }>}
 */
export async function generateBlockForStep({ step, currentBlocks, blockType, language, lessonFormat, slideText }) {
  const res = await fetch('/api/generate-block', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ step, currentBlocks, blockType, language, lessonFormat, slideText }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status} for step "${step.title}"`)
  }
  const raw = await res.json()
  if (!raw.block || !raw.block.type) {
    throw new Error('Unexpected response shape from /api/generate-block')
  }
  return { block: raw.block }
}

/**
 * generateAllLessonContent
 *
 * Generates content for every step in the lesson structure.
 * Each step is one POST /api/generate-content call; steps are processed
 * sequentially. Throws on the first network or server error.
 *
 * Kept for reference / batch fallback; the progressive slice uses
 * generateStepContent instead.
 *
 * @param {object}   params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {object[]} params.lessonStructure
 * @param {string}   [params.learnerLevel='beginner']
 * @param {string}   [params.outputLanguage='Python']
 * @returns {Promise<LessonContent[]>}
 */
export async function generateAllLessonContent({
  courseName,
  moduleName,
  lessonStructure,
  lessonFormat = 'code_lab',
  learnerLevel = 'beginner',
  outputLanguage = 'Python',
  slideText = '',
}) {
  const results = []
  for (const step of lessonStructure) {
    if (step.stepType !== 'lesson') continue
    const raw = await callProvider({ courseName, moduleName, step, lessonStructure, lessonFormat, learnerLevel, outputLanguage, slideText })
    results.push(normalizeContent(raw, step))
  }
  return results
}
