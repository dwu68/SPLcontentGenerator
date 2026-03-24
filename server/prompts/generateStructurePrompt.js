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

The following text was extracted from the course slides. Each slide is labelled [Slide N].
Use the slides as your sole source material.
Derive lesson step titles, goals, and covered subtopics directly from the slide content.
Stay faithful to the sequence, scope, and terminology of the slides.

SLIDE COVERAGE (required):
Instructional slides must each be covered by exactly one step.
Instructional slides include: concept explanations, examples, step-by-step workflows, diagrams, comparisons, and any slide with teaching content.

Non-instructional slides may be skipped.
Non-instructional slides include: title/cover slides, agenda/outline slides, section divider slides, and closing/thank-you/Q&A slides.

If there is any ambiguity about whether a slide is instructional, include it rather than skipping it.
If a nominally non-instructional slide (e.g. an agenda) contains any meaningful teaching content, treat it as instructional and include it.

For slides that are instructional but thin or hard to interpret: still create a step.
A placeholder-quality step with a reasonable title, best-effort goal, and inferred topics is better than a missing step.

SLIDE GROUPING:
Default is one slide = one step.
Only group consecutive slides into a single step when they clearly form one atomic teaching unit — for example, a before/after pair or a tight 2–3 slide sequence on a single concept.
If there is any uncertainty about whether slides belong together, do not group them.
Do not group slides just because they share a theme. Prefer splitting over grouping.

Slide content:
${slideText}

${footer}`
  }

  // ── Case 2: slides + subtopics ───────────────────────────────────────────
  if (hasSlides && hasSubtopics) {
    return `${header}

The following text was extracted from the course slides. Each slide is labelled [Slide N].
Use the slides as your primary source material.
The author has also provided explicit sub-topics — treat these as guidance and overrides.
If a sub-topic conflicts with or extends the slides, prefer the author's intent.

SLIDE COVERAGE (required):
Every [Slide N] label in the slide content below must be covered by exactly one step.
No slide may be skipped or omitted — not even slides that are thin, unclear, or hard to interpret.
If a slide is unclear, still create a step for it using your best inference from whatever is on the slide.
A placeholder-quality step with a reasonable title, best-effort goal, and inferred topics is better than a missing step.

SLIDE GROUPING:
Default is one slide = one step.
Only group consecutive slides into a single step when they clearly form one atomic teaching unit — for example, a before/after pair or a tight 2–3 slide sequence on a single concept.
If there is any uncertainty about whether slides belong together, do not group them.
Do not group slides just because they share a theme. Prefer splitting over grouping.

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
