/**
 * server/prompts/generateBlockPrompt.js
 *
 * Focused prompt for generating a single content block grounded in a step's
 * existing instructional blocks.
 *
 * Supports two block types via the `blockType` parameter:
 *   'code'  — a short annotated code example illustrating the step content
 *   'check' — a knowledge-check question with a reveal answer
 *
 * No skip path — an example or check can be generated for any teaching content.
 *
 * Response shape (always):
 *   {
 *     "block": {
 *       "type":     "code" | "check",
 *       "title":    "Example" | "Knowledge Check",
 *       "content":  "...",
 *       "language": "python"   // present only when type === "code"
 *     }
 *   }
 */

// ---------------------------------------------------------------------------
// Shared helpers — reused from generateTaskPrompt.js pattern
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
// Type-specific guidance
// ---------------------------------------------------------------------------

function codeBlockGuidance(language) {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE EXAMPLE BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write a short, runnable code example that illustrates the concept taught in this step.

- type:     "code"
- title:    "Example"
- language: "${language}"
- content:  the code itself — no prose, no surrounding markdown fences

Code rules:
- 5–20 lines maximum
- Use realistic variable names and values — not abstract placeholders
- Annotate with inline comments to explain what each meaningful line does
- The example must be directly grounded in the step's existing blocks — do not introduce concepts not yet taught
- Do not write a TODO exercise — this is a demonstrating example, not a practice lab
- The code must run without additional imports unless those imports are part of what was taught

Return format:
{
  "block": {
    "type": "code",
    "title": "Example",
    "language": "${language}",
    "content": "# example code here\\nwith_inline_comments = True"
  }
}`
}

function checkBlockGuidance() {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE CHECK BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write one knowledge-check question with a hidden answer, grounded in the concept taught in this step.

- type:    "check"
- title:   "Knowledge Check"
- content: MUST follow the reveal format: question text, then the literal separator \\n→ , then the answer

Content format (exactly):
  <question text>
  → <answer text>

Rules:
- The question must test a specific concept taught in this step's existing blocks — not a general recall question
- Prefer "What / Which / Why" questions over true/false
- The answer must be 1–2 sentences — not a paragraph
- The question and answer together must fit on two lines in a lesson card (be concise)
- The → separator is a literal newline followed by the → character followed by a space — reproduce it exactly

Return format:
{
  "block": {
    "type": "check",
    "title": "Knowledge Check",
    "content": "What does .items() return?\\n→ It returns key-value pairs as tuples."
  }
}`
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * buildGenerateBlockPrompt
 *
 * @param {object}   params
 * @param {string}   params.stepTitle
 * @param {string}   params.stepGoal
 * @param {string[]} params.stepTopics
 * @param {object[]} params.currentBlocks   — live blocks already in this step
 * @param {'code'|'check'} params.blockType
 * @param {string}   params.language        — used only when blockType === 'code'
 * @param {string}   params.lessonFormat
 * @param {string}   params.outputLanguage
 * @returns {string}
 */
export function buildGenerateBlockPrompt({
  stepTitle,
  stepGoal,
  stepTopics,
  currentBlocks,
  blockType,
  language,
  lessonFormat,
  outputLanguage,
}) {
  const blocksDisplay = serializeBlocksForPrompt(currentBlocks)
  const typeGuidance  = blockType === 'code'
    ? codeBlockGuidance(language)
    : checkBlockGuidance()

  return `You are a course author adding a single content block to a partially authored lesson step.

The step already has instructional blocks. Your job is to write ONE additional block that is tightly grounded in what those blocks have already taught.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step title: ${stepTitle}
Step goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Lesson format: ${lessonFormat}
Output language: ${outputLanguage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXISTING BLOCKS (what the learner has already read)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${blocksDisplay}
${typeGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Do not return markdown. Do not wrap in code fences. No commentary before or after.
- Return exactly ONE valid JSON object matching the format shown above.
- Ensure the JSON is valid and parseable.`
}
