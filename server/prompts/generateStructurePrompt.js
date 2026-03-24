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
 * Branches on what source material is present:
 *   - slideText only        → slides are sole source
 *   - slideText + subtopics → slides primary, subtopics are author overrides
 *   - subtopics only        → original behavior (unchanged)
 *
 * @param {object} params
 * @param {string} params.courseName
 * @param {string} params.moduleName
 * @param {string} [params.subtopicsText] — raw textarea value, one sub-topic per line
 * @param {string} [params.slideText]     — extracted slide text, labelled by slide number
 * @returns {string}
 */
export function buildGenerateStructurePrompt({ courseName, moduleName, subtopicsText, slideText }) {
  const hasSlides = slideText && slideText.trim().length > 0
  const hasSubtopics = subtopicsText && subtopicsText.trim().length > 0

  const header = `You are a curriculum designer creating a structured lesson outline for a coding course.

Course: ${courseName}
Module: ${moduleName}`

  const footer = `Return a JSON object with a "steps" array. Each step must have exactly these fields:
- "title": string — concise step title
- "goal": string — learning goal starting with "Students will be able to..."
- "coveredSubtopics": string[] — specific topics covered in this step

Return only valid JSON, no explanation.`

  // ── Case 1: slides only ──────────────────────────────────────────────────
  if (hasSlides && !hasSubtopics) {
    return `${header}

The following text was extracted from the course slides. Use it as your sole source material.
Derive lesson step titles, goals, and covered subtopics directly from the slide content.
Stay faithful to the sequence, scope, and terminology of the slides.
Group related slide content into coherent lesson steps — one step per distinct teaching point.

Slide content:
${slideText}

${footer}`
  }

  // ── Case 2: slides + subtopics ───────────────────────────────────────────
  if (hasSlides && hasSubtopics) {
    return `${header}

The following text was extracted from the course slides. Use it as your primary source material.
The author has also provided explicit sub-topics below — treat these as guidance and overrides.
If a sub-topic conflicts with or extends the slides, prefer the author's intent.

Slide content:
${slideText}

Author sub-topics (one per line — treat as overrides or supplements to the slides):
${subtopicsText}

${footer}`
  }

  // ── Case 3: subtopics only (original behavior) ───────────────────────────
  return `${header}
Sub-topics (one per line):
${subtopicsText}

${footer}

One step per sub-topic line.`
}
