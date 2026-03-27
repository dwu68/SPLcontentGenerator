/**
 * server/prompts/generateTaskPrompt.js
 *
 * Focused prompt for generating a single task block + matching starterCode
 * for a step that currently has no task.
 *
 * The task must be tightly anchored to what the existing blocks have already
 * taught. The AI sees the current blocks as context so it does not repeat
 * teaching content — it translates it into a small, step-aligned lab.
 *
 * Supports a graceful skip response when no suitable task exists:
 *   { "skip": true, "reason": "..." }
 *
 * Normal response:
 *   { "taskBlock": { "type": "task", "title": "Lab", "content": "..." },
 *     "starterCode": "..." }
 */

// ---------------------------------------------------------------------------
// Lesson style guidance — mirrors the calibration in generateContentPrompt.js
// ---------------------------------------------------------------------------

const LESSON_STYLE_LABELS = {
  code_lab:             'Programming (code_lab)',
  guided_tool_workflow: 'Guided Tool Workflow',
  concept_application:  'Concept & Application',
}

const LESSON_STYLE_GUIDANCE = {
  code_lab: `The learner is expected to write code. A task block is appropriate for most steps unless the step is purely conceptual. Include starterCode.`,
  guided_tool_workflow: `The learner follows a tool-based workflow. A task block is appropriate only when the step involves a genuine learner-facing action beyond reading slides. Starter code is appropriate only when there is a real coding practice component. If the step is purely observational or informational, return the skip response.`,
  concept_application: `The learner is building conceptual understanding. A task block is appropriate only when the concept is directly tied to a coding action the learner can practice. If the step is purely conceptual with no natural practice action, return the skip response.`,
}

// ---------------------------------------------------------------------------
// Block serializer — readable summary for the prompt context
// ---------------------------------------------------------------------------

const BLOCK_TYPE_LABELS = {
  explain:       'EXPLAIN',
  code:          'CODE',
  check:         'CHECK',
  task:          'TASK',
  hint:          'HINT',
  slide:         'SLIDE',
  'slide-explain': 'SLIDE-EXPLAIN',
}

function serializeBlocksForPrompt(blocks) {
  if (!blocks || blocks.length === 0) return '(no blocks yet)'
  return blocks
    .map((b) => {
      const label = BLOCK_TYPE_LABELS[b.type] ?? b.type.toUpperCase()
      const titlePart = b.title ? ` "${b.title}"` : ''
      const refPart   = b.slideRef ? ` [slideRef: ${b.slideRef}]` : ''
      const rawContent = (b.content ?? '').trim()
      const contentSnippet = rawContent.length > 400
        ? rawContent.slice(0, 400) + '…'
        : rawContent
      const contentPart = contentSnippet ? `\n  ${contentSnippet.replace(/\n/g, '\n  ')}` : ''
      return `[${label}]${titlePart}${refPart}${contentPart}`
    })
    .join('\n\n')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * buildGenerateTaskPrompt
 *
 * @param {object} params
 * @param {string}   params.stepTitle
 * @param {string}   params.stepGoal
 * @param {string[]} params.stepTopics
 * @param {object[]} params.currentBlocks   — live blocks already in this step
 * @param {string}   params.lessonFormat
 * @param {number[]} params.slideNumbers
 * @param {string}   params.slideText
 * @param {string}   params.outputLanguage
 * @returns {string}
 */
export function buildGenerateTaskPrompt({
  stepTitle,
  stepGoal,
  stepTopics,
  currentBlocks,
  lessonFormat,
  slideNumbers,
  slideText,
  outputLanguage,
}) {
  const styleLabel    = LESSON_STYLE_LABELS[lessonFormat]    ?? lessonFormat
  const styleGuidance = LESSON_STYLE_GUIDANCE[lessonFormat]  ?? LESSON_STYLE_GUIDANCE['code_lab']
  const hasSlides     = Array.isArray(slideNumbers) && slideNumbers.length > 0

  const slideContext = hasSlides && slideText?.trim()
    ? `\nAssigned slides for this step: ${slideNumbers.join(', ')}\n\nSlide content (extract relevant sections only):\n<slides>\n${slideText}\n</slides>`
    : hasSlides
      ? `\nAssigned slides for this step: ${slideNumbers.join(', ')}`
      : ''

  const blocksDisplay = serializeBlocksForPrompt(currentBlocks)

  return `You are a course author adding a hands-on task to a step that has been partially authored.

The step already has instructional blocks. Your job is to write ONE task block and matching starter code that directly practices what those blocks have taught.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step title: ${stepTitle}
Step goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Lesson style: ${styleLabel}
Output language: ${outputLanguage}
${slideContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXISTING BLOCKS (what the learner has already read)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${blocksDisplay}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON STYLE GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${styleGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The task block is a brief learner-facing lab objective. It will appear at the end of the step, after the existing blocks.

- Title: always "Lab"
- Content: 2–4 sentences of natural learner-facing prose
- Describe what the learner is trying to accomplish and what a correct result looks like
- State the goal, not the procedure — do not write numbered steps
- The task must be directly anchored to what the existing blocks have already taught
- Do not introduce new concepts not present in the existing blocks
- Aim for the smallest meaningful practice action for this step, not a large unrelated lab
- Do not mention line numbers, TODO markers, or exact code to type

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STARTER CODE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write the starter code in ${outputLanguage}.

- Provide enough context to orient the learner without revealing the answer
- Use ONE coherent TODO for the lab — do not split into multiple mini-exercises unless the task genuinely has distinct parts
- Format: # TODO: [concise goal] on one line, # Expected: [outcome description] on the next
- Use real variable names and real values — not abstract placeholders
- Do not include near-solution code or commented-out answer code
- The lab must be completable by editing only the TODO area

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO SKIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return the skip response if:
- The step is purely conceptual with no natural coding action to practice
- The existing blocks are slide-explain only and the step has no programming component
- Adding a task would require introducing a concept not yet taught in this step
- The lesson style guidance above says to skip for this step type

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETURN FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return exactly ONE valid JSON object. Two possible shapes:

Normal — task is appropriate:
{
  "taskBlock": {
    "type": "task",
    "title": "Lab",
    "content": "..."
  },
  "starterCode": "..."
}

Skip — no suitable task for this step:
{
  "skip": true,
  "reason": "One sentence explaining why no task was generated."
}

Rules:
- Do not return markdown. Do not wrap in code fences. No commentary before or after.
- starterCode must be a non-empty string when taskBlock is present.
- The reason in a skip response must be a single, author-facing sentence (not an error message).
- Ensure the JSON is valid and parseable.`
}
