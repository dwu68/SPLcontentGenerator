/**
 * server/prompts/generateStructurePrompt.js
 *
 * Prompt builder for Screen 1 — lesson structure generation.
 *
 * ── EDIT THIS FILE to change the structure-generation prompt ──────────────
 *
 * The exported function receives the raw form inputs and returns the prompt
 * string sent to the AI provider. Edit the template literal body to change
 * what the model produces.
 *
 * JSON contract this prompt must produce (parsed by parseProviderResponse
 * in server/index.js):
 *
 *   {
 *     "steps": [
 *       {
 *         "title":            string   — concise step title
 *         "goal":             string   — learning goal ("Students will be able to…")
 *         "coveredSubtopics": string[] — topics covered in this step
 *       },
 *       …
 *     ]
 *   }
 */

/**
 * buildGenerateStructurePrompt
 *
 * @param {object} params
 * @param {string} params.courseName
 * @param {string} params.moduleName
 * @param {string} params.subtopicsText — raw textarea value, one sub-topic per line
 * @returns {string}
 */
export function buildGenerateStructurePrompt({ courseName, moduleName, subtopicsText }) {
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
