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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status} for step "${step.title}"`)
  }
  return res.json()
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
