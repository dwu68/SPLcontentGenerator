/**
 * lessonStructureService.js
 *
 * Service boundary for Screen 1 lesson structure generation.
 *
 * Architecture:
 *
 *   App.jsx  →  generateLessonStructure()
 *                       │
 *                  callProvider()          ← calls POST /api/generate-structure
 *                       │
 *               normalizeStructure()       ← validates shape, assigns ids
 *                       │
 *               LessonStructure[]  →  App.jsx
 *
 * The backend (server/index.js) owns the provider API key and the OpenAI call.
 * Mock vs real switching is a server-side concern (USE_MOCK env flag).
 * This module only calls the endpoint — it never talks to OpenAI directly.
 */

// ---------------------------------------------------------------------------
// Provider call — POST /api/generate-structure
// ---------------------------------------------------------------------------

/**
 * callProvider
 *
 * Calls the backend endpoint and returns raw step data.
 *
 * Expected return shape (from server):
 *   Array<{ title: string, goal: string, coveredSubtopics: string[] }>
 *
 * The Vite dev proxy forwards /api/* to http://localhost:3001.
 * In production the frontend and backend share the same origin.
 *
 * @param {string} courseName
 * @param {string} moduleName
 * @param {string} subtopicsText  raw textarea value, newline-separated
 * @param {string} [slideText]    extracted slide text (optional)
 * @returns {Promise<Array<{ title: string, goal: string, coveredSubtopics: string[] }>>}
 */
async function callProvider(courseName, moduleName, subtopicsText, slideText) {
  const res = await fetch('/api/generate-structure', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseName, moduleName, subtopicsText, slideText }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Normalization — validates shape, assigns ids and step numbers
// ---------------------------------------------------------------------------

/**
 * Validates the raw provider response and promotes it to a full LessonStructure[].
 * Throws if the response is not a non-empty array.
 * Missing or wrong-typed fields are coerced to safe defaults.
 *
 * @param {unknown} rawSteps
 * @returns {LessonStructure[]}
 */
function normalizeStructure(rawSteps) {
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new Error('Provider returned no steps.')
  }
  const now = Date.now()
  return rawSteps.map((step, index) => ({
    id: `step-${now}-${index}`,
    stepNumber: index + 1,
    stepType: 'lesson',
    title: typeof step.title === 'string' ? step.title : '',
    goal: typeof step.goal === 'string' ? step.goal : '',
    coveredSubtopics: Array.isArray(step.coveredSubtopics) ? step.coveredSubtopics : [],
    slideNumbers: Array.isArray(step.slideNumbers) ? step.slideNumbers.map(String) : [],
  }))
}

// ---------------------------------------------------------------------------
// Public API — called from App.jsx handleSubmit
// ---------------------------------------------------------------------------

/**
 * generateLessonStructure
 *
 * Async entry point for Screen 1 structure generation.
 * App.jsx owns isGenerating / generationError / try-finally.
 *
 * @param {string} courseName
 * @param {string} moduleName
 * @param {string} subtopicsText  raw textarea value, newline-separated
 * @param {string} [slideText]    extracted slide text (optional)
 * @returns {Promise<LessonStructure[]>}
 */
export async function generateLessonStructure(courseName, moduleName, subtopicsText, slideText) {
  const rawSteps = await callProvider(courseName, moduleName, subtopicsText, slideText)
  return normalizeStructure(rawSteps)
}
