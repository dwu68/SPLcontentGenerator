/**
 * lessonStructureService.js
 *
 * Service boundary for Screen 1 lesson structure generation.
 *
 * Architecture:
 *
 *   App.jsx  →  generateLessonStructure()
 *                       │
 *                  callProvider()          ← [AI PROVIDER] replace this body
 *                       │
 *               normalizeStructure()       ← validates shape, assigns ids
 *                       │
 *               LessonStructure[]  →  App.jsx
 *
 * To wire in a real AI call:
 *   1. Replace the body of callProvider() with your fetch() / SDK call.
 *   2. Parse the response into Array<{ title, goal, coveredSubtopics }>.
 *   3. Return that array — do NOT include ids or stepNumbers (assigned here).
 *
 * Everything else — loading state, error handling, confirmation guards — stays
 * in App.jsx and does not need to change.
 */

import { generateLessonStructure as mockGenerateStructure } from '../utils/mockGeneration'

// ---------------------------------------------------------------------------
// [AI PROVIDER] Replace the body of this function with a real API call
// ---------------------------------------------------------------------------

/**
 * callProvider
 *
 * Calls the generation provider and returns raw step data.
 *
 * Expected return shape:
 *   Array<{ title: string, goal: string, coveredSubtopics: string[] }>
 *
 * Do NOT return ids or stepNumbers — normalizeStructure() assigns them.
 *
 * Example swap for a real Anthropic call:
 *
 *   const response = await fetch('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: {
 *       'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
 *       'anthropic-version': '2023-06-01',
 *       'anthropic-dangerous-direct-browser-access': 'true',
 *       'content-type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       model: 'claude-sonnet-4-6',
 *       max_tokens: 2048,
 *       messages: [{ role: 'user', content: buildPrompt(courseName, moduleName, subtopicsText) }],
 *     }),
 *   })
 *   if (!response.ok) throw new Error(`API error ${response.status}`)
 *   const data = await response.json()
 *   return parseProviderResponse(data)   // extract the JSON array from the text block
 *
 * @param {string} courseName
 * @param {string} moduleName
 * @param {string} subtopicsText  raw textarea value, newline-separated
 * @returns {Promise<Array<{ title: string, goal: string, coveredSubtopics: string[] }>>}
 */
async function callProvider(courseName, moduleName, subtopicsText) {
  // Delegating to the local mock until a real provider is wired.
  // The mock returns full LessonStructure objects (with ids). We strip ids here
  // so that normalizeStructure() is the single place that assigns them.
  const mockResult = mockGenerateStructure(courseName, moduleName, subtopicsText)
  return mockResult.map(({ title, goal, coveredSubtopics }) => ({
    title,
    goal,
    coveredSubtopics,
  }))
}

// ---------------------------------------------------------------------------
// Normalization — validates shape, assigns ids and step numbers
// ---------------------------------------------------------------------------

/**
 * Validates the raw provider response and promotes it to a full LessonStructure[].
 * Throws if the response is not a non-empty array.
 * Missing or wrong-typed fields are coerced to safe defaults rather than thrown.
 *
 * @param {unknown} rawSteps
 * @returns {import('../utils/mockGeneration').LessonStructure[]}
 */
function normalizeStructure(rawSteps) {
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    throw new Error('Provider returned no steps.')
  }
  const now = Date.now()
  return rawSteps.map((step, index) => ({
    id: `step-${now}-${index}`,
    stepNumber: index + 1,
    title: typeof step.title === 'string' ? step.title : '',
    goal: typeof step.goal === 'string' ? step.goal : '',
    coveredSubtopics: Array.isArray(step.coveredSubtopics) ? step.coveredSubtopics : [],
  }))
}

// ---------------------------------------------------------------------------
// Public API — called from App.jsx handleSubmit
// ---------------------------------------------------------------------------

/**
 * generateLessonStructure
 *
 * Async entry point for Screen 1 structure generation.
 * App.jsx owns isGenerating / generationError / try-finally — this function
 * only needs to resolve with a valid LessonStructure[] or throw.
 *
 * @param {string} courseName
 * @param {string} moduleName
 * @param {string} subtopicsText  raw textarea value, newline-separated
 * @returns {Promise<LessonStructure[]>}
 */
export async function generateLessonStructure(courseName, moduleName, subtopicsText) {
  const rawSteps = await callProvider(courseName, moduleName, subtopicsText)
  return normalizeStructure(rawSteps)
}
