/**
 * server/prompts/generateContentPrompt.js
 *
 * Unified prompt builder for Screen 2 — lesson content generation for a single step.
 *
 * Block composition is signal-driven, not format-gated:
 *   - If slideNumbers.length > 0 → mandatory [slide, slide-explain] pairs come first
 *   - Additional blocks (explain, code, check, task, hint) → AI decides based on step need
 *   - lessonFormat is a teaching style bias that calibrates those decisions, not a block contract
 *   - starterCode is present only when a task block is present (task-coupled, not format-coupled)
 *
 * Returns: { "blocks": [...], "starterCode": string, "expectedAction": string, "validationNote": string }
 */

// ---------------------------------------------------------------------------
// Style lookup tables — used to build the LESSON STYLE section
// ---------------------------------------------------------------------------

const LESSON_STYLE_LABELS = {
  code_lab:              'Programming (code_lab)',
  guided_tool_workflow:  'Guided Tool Workflow',
  concept_application:   'Concept & Application',
}

const LESSON_STYLE_GUIDANCE = {
  code_lab: `The learner is expected to write code. Code blocks and a task/lab component are typical for most steps in this format unless the step is purely conceptual. When a task block is present, include starter code.`,

  guided_tool_workflow: `The learner follows a tool-based workflow. Slides carry most of the teaching weight — the slide-explain blocks are the primary instructional vehicle per slide. An explain block is appropriate when slides leave a genuine concept gap not covered by the slide-explain. Code blocks are appropriate for tool commands or configuration syntax — not heavy algorithmic exercises. A task block should appear only when the step involves a genuine learner-facing action beyond reading the slides. Starter code is appropriate only when there is a real coding practice component.`,

  concept_application: `The learner is building conceptual understanding. An explain block is typically appropriate. A check block is appropriate when a useful application-level reasoning question exists for this step. Code blocks and task blocks should appear only when the concept is inherently tied to coding practice.`,
}

// ---------------------------------------------------------------------------
// Main export — single unified function
// ---------------------------------------------------------------------------

/**
 * buildGenerateContentPrompt
 *
 * @param {import('../lib/promptContext.js').PromptContext} context
 * @returns {string}
 */
export function buildGenerateContentPrompt(context) {
  const {
    courseName,
    moduleName,
    stepTitle,
    stepGoal,
    stepTopics,
    slideNumbers,
    slideText,
    lessonFormat,
    learnerLevel,
    outputLanguage,
  } = context

  const hasAssignedSlides = Array.isArray(slideNumbers) && slideNumbers.length > 0
  const N = hasAssignedSlides ? slideNumbers.length : 0
  const styleLabel    = LESSON_STYLE_LABELS[lessonFormat]   || lessonFormat
  const styleGuidance = LESSON_STYLE_GUIDANCE[lessonFormat] || LESSON_STYLE_GUIDANCE['code_lab']

  // ---------------------------------------------------------------------------
  // Slide section — conditionally included
  // ---------------------------------------------------------------------------

  const slideSection = hasAssignedSlides ? buildSlideSection(slideNumbers, slideText, N) : ''

  // ---------------------------------------------------------------------------
  // Additional blocks intro — varies based on whether slides are present
  // ---------------------------------------------------------------------------

  const additionalBlocksIntro = hasAssignedSlides
    ? 'After the slide pairs, decide whether this step also needs any of the following.'
    : 'Decide which of the following blocks this step needs.'

  // ---------------------------------------------------------------------------
  // Return format block shape — slide pairs first (if any), then additional
  // ---------------------------------------------------------------------------

  const slidePairsExample = hasAssignedSlides
    ? slideNumbers.map((num, i) => {
        const b1 = i * 2 + 1
        const b2 = i * 2 + 2
        return (
          `    { "id": "b${b1}", "type": "slide", "title": null, "slideRef": "${num}", "content": "" },\n` +
          `    { "id": "b${b2}", "type": "slide-explain", "title": string | null, "content": string }`
        )
      }).join(',\n') + ','
    : ''

  const nextId = hasAssignedSlides ? N * 2 + 1 : 1
  const additionalBlockExample =
    `    { "id": "b${nextId}", "type": "explain" | "code" | "check" | "task" | "hint", "title": string | null, "content": string }`

  const blockOrderRule = hasAssignedSlides
    ? `"blocks" must begin with the ${N} slide pair${N > 1 ? 's' : ''} shown above (in the order listed), followed by any additional blocks in instructional order.`
    : '"blocks" must contain the chosen blocks in instructional order.'

  // ---------------------------------------------------------------------------
  // Full prompt
  // ---------------------------------------------------------------------------

  return `You are writing the instructional content for ONE step of a self-paced lesson.

The learner is studying alone — no instructor, no live feedback.
Write like a skilled course author speaking directly to a learner on a lesson page.

Course: ${courseName}
Module: ${moduleName}
Step title: ${stepTitle}
Step learning goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Learner level: ${learnerLevel}
${slideSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${additionalBlocksIntro}

Available types:
- explain  — concept-level teaching; expands what the learner needs to understand
- code     — a focused example showing a mechanic in action
- check    — a short reasoning check before a hands-on task
- task     — a hands-on lab objective (always paired with starterCode; never without)
- hint     — a nudge for a specific likely stuck point (only alongside a task)

Quality bar: include a block only if it materially improves the instructional value of this step.
Do not add blocks to seem complete. A step with two well-focused blocks is better than five thin ones.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lesson style: ${styleLabel}

This is a teaching style signal, not a block contract. Use it to calibrate your decisions:

${styleGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHORING QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write like a real lesson author, not a worksheet generator.

Natural learner-facing prose is more important than sounding systematic.
If a sentence sounds like teacher notes or internal planning language, rewrite it as natural lesson prose.

Prefer writing that feels comfortable to read from top to bottom on a lesson page:
- concrete, clear, specific, human — not stiff, not generic, not repetitive

Do NOT use placeholder phrasing such as:
- "In this step you will learn..."
- "This is an important concept..."
- "Now let's..."
- "Below is..."

Start with the idea itself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate content for this step only.
Stay focused on: the step title, the step goal, the listed step topics.

Every listed topic must be addressed by at least one instructional block.
Slide-explain blocks count toward topic coverage.

Do not:
- assume knowledge beyond a ${learnerLevel} learner
- add side topics that belong to other steps
- mention future lessons
- add caveats that distract from this step
- write teacher notes or author notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLAIN BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "explain"

Purpose:
Teach the idea clearly. Do not merely summarize it.

Content rules:
- Usually write 3–12 sentences.
- One explain block should teach one clear idea.
- A strong explain block usually includes at least two of these:
  - the rule
  - the behavior in code or practice
  - the distinction from a nearby similar idea
- Explain what actually happens, not just what the concept is called.
- If nearby ideas are easy to confuse, make the difference explicit.
- State the consequence: what the learner can do with it, what result it produces, or what limitation it introduces.
- A brief inline code snippet is allowed when it sharpens one point.

Note:
  Visual clarification is allowed when it makes the idea easier to understand.

  You may include:
  - a simple markdown table for comparing related ideas,
  - or a small plain-text diagram for structure, flow, or before/after state,
  - a bullet list when a set of items is clearer as a list than as prose.

  Bullet list format rules (required):
  - Each item must be on its own line starting with "- ".
  - The list must be separated from surrounding prose by a blank line above and below.
  - Do not embed a bullet list inside a prose sentence.

  Use these only when they genuinely clarify the concept. Do not add a table or diagram for decoration.

Depth check:
- If the block could be reduced to a glossary entry without losing meaning, it is too shallow.
- If the learner could read the block and still not know when to use the idea, it is too shallow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "code"
Language field: "${outputLanguage}" (use this exact value for the "language" field on code blocks)

Purpose:
Show the learner the idea in action with a small, readable example.

Content rules:
- Use real variable names and real values.
- The example should feel like real code, not abstract placeholders.
- Show one main mechanic clearly.
- You may include one closely related supporting mechanic when the learner needs to see how they work together.
- Do not try to demonstrate the entire topic universe in one code block.
- Prefer code that shows the mechanic in a small meaningful context, not the thinnest possible toy form.
- Keep the example readable and compact.
- Include inline comments only when they genuinely clarify behavior or output.
- If the code prints output, show the exact output in comments on the print lines when helpful.
- Preserve proper indentation and formatting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "check"

Purpose:
Give the learner one short reasoning check before the lab.

Title:
- Use a natural, specific title.
- "Quick check" is acceptable, but a more specific title is better when natural.

Content rules:
- Ask the learner to APPLY or DISCRIMINATE, not merely recall.
- A short code snippet is strongly preferred.
- Good checks make the learner choose, trace, compare, predict, or identify what would fail.
- Prefer confusion points over fact checks.
- The answer should confirm the result and briefly name the decisive reason.
- Usually 1–3 sentences for the answer.
- Do not restart the whole lesson explanation in the answer.

Answer format:
Write the question first, then on a new line write exactly "→ " followed by the answer.
Example:
  What does scores[-1] return?

  → It returns the last element. Negative indices count from the end of the list.

The "→ " separator is required. It is used by the UI to split the question from the hidden answer.

A check block may be omitted if there is no genuinely useful non-obvious question for this step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "task"
Title: always "Lab"

Purpose:
A brief learner-facing lab objective. Always paired with non-empty starterCode — never include a task block without also producing starterCode.

Content rules:
- Write as natural learner-facing prose.
- Keep it concise, usually 2–4 sentences.
- Explain: what the learner is trying to accomplish, what idea the lab is practicing, and what a correct result looks like.
- State the goal, not the procedure.
- Do not write numbered steps.
- Do not mention line numbers, TODO markers, or exact code to type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HINT BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "hint"

Purpose:
Offer a useful nudge only when there is a real likely stuck point. Only include alongside a task block.

Rules:
- Include only if the learner is likely to get stuck in a specific way.
- The hint should point to the right idea without giving away the answer.
- It must not say "look above", "review the example", or "read the instructions again".
- It should give a fresh angle on the exact stuck mechanic.

The hint title is the collapsed label. Use a natural learner-facing label such as:
- Need a hint?
- Not sure which method fits?
- Unsure what should change?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STARTER CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Include starterCode only when a task block is present. If no task block, set starterCode to "".

When a task block is present:

The starterCode is the learner's work area. Provide enough local orientation to begin confidently, without revealing the answer.

Rules:
1. The lab must be completable by editing only the intended TODO area.
2. Prefer ONE coherent TODO for the whole lab.
   Do not split one small lab into multiple mini-exercises unless the exercise truly has distinct parts.
3. Comments may explain:
   - what the data represents
   - what the learner is trying to produce
   - what kind of result should appear
4. Do NOT reveal the exact method, operator, or expression when choosing it is part of the exercise.
5. Use this format:
   # TODO: [one concise description of the coding goal]
   # Expected: [result shape, outcome, or success condition]
6. The Expected line should describe the outcome, not restate the full solution.
7. Avoid over-directing the learner. Do not write comments like:
   - "first line do this"
   - "second line do that"
   - "replace this TODO with ..."
   - "call method X here"
   unless that exact sequence is itself the learning target.
8. Do not include near-solution code or commented-out answer code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPECTEDACTION AND VALIDATIONNOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If a task block is present:
- "expectedAction": one concrete sentence describing exactly what the learner must do to complete the lab.
  Be specific to this step. Do not write vague text like "Complete the lab" or "Finish the task".
  Example style: "Use a slice to read the middle values and an index to read the first value."
- "validationNote": 1–2 sentences describing what a correct solution produces and naming one common wrong approach if any.
  Be specific to this step. Do not write generic validator language.

If no task block:
- Set both to "".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETURN FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return exactly ONE valid JSON object:

{
  "blocks": [
${slidePairsExample}
${additionalBlockExample}
  ],
  "starterCode": "...",
  "expectedAction": "...",
  "validationNote": "..."
}

Rules:
- ${blockOrderRule}
- IDs must be unique and sequential within this step: "b1", "b2", "b3", ...
- Every block must have: "id", "type", "title" (string or null), "content" (string).
- type "slide" additionally requires "slideRef": the exact assigned slide number as a string. Its "content" must be "". Its "title" must be null.
- type "code" additionally requires "language": "${outputLanguage}". All other block types must not include a "language" field.
- If a task block is present: starterCode must be a non-empty string; set expectedAction and validationNote accordingly.
- If no task block: starterCode, expectedAction, and validationNote must all be "".
- Do not return markdown. Do not wrap the JSON in code fences. No commentary before or after. No extra keys. No trailing commas.
- Ensure the JSON is valid and parseable.`
}

// ---------------------------------------------------------------------------
// Slide section builder — called only when slideNumbers.length > 0
// ---------------------------------------------------------------------------

function buildSlideSection(slideNumbers, slideText, N) {
  const hasSlideText = slideText && slideText.trim().length > 0

  const pairsListing = slideNumbers
    .map((num, i) => `Pair ${i + 1}: slide (slideRef: "${num}") → slide-explain`)
    .join('\n')

  const slideContentSection = hasSlideText ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following text was extracted from the author's slides. Each slide is labelled [Slide N].
Use the content of the assigned slides to write the slide-explain blocks.
Use the same terminology and examples the slides use.

<slides>
${slideText}
</slides>
` : ''

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSIGNED SLIDES — MANDATORY PAIRS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This step has ${N} assigned slide${N > 1 ? 's' : ''}: ${slideNumbers.join(', ')}.

The output MUST begin with exactly ${N} [slide, slide-explain] pair${N > 1 ? 's' : ''}, one per assigned slide, in this order:

${pairsListing}

No block may appear before the slide pairs. Additional blocks go after.
${slideContentSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- "slideRef" must be the exact assigned slide number as a string (e.g. "3"). Never null. Never a number type. Use the assigned number exactly as given.
- "content" must be "" — slide display is handled by the UI.
- "title" must be null.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE-EXPLAIN BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary purpose: help the learner understand what is on the referenced slide.
Each slide-explain is anchored to its immediately preceding slide block.

Write for a solo learner — no instructor, no live walkthrough.
Write like a course author explaining the slide to someone reading alone.

Content rules:
- Draw from the content of the referenced slide.
- Expand on what the slide shows so the learner can absorb it without an instructor.
- Use the same terminology the slides use.
- Where naturally helpful, reference official documentation for the tool being taught.

Formatting rules:
- Prefer structured prose over one long dense paragraph.
- Use short paragraphs (2–4 sentences each) when the content has distinct points.
- Use a bullet list when presenting takeaways, comparisons, steps, or a set of items.
- Bullet list format: each item on its own line starting with "- ", with a blank line above and below.
- Do not use filler phrases like "In this step..." or "As shown above...".
- Start with the idea itself.
`
}
