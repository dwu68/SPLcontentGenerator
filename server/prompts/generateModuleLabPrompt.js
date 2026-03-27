/**
 * server/prompts/generateModuleLabPrompt.js
 *
 * Focused prompt for generating a module-level lab task + starterCode
 * for a manually added Hands-on Practice step.
 *
 * Unlike generateTaskPrompt.js (which anchors to the current step's blocks),
 * this prompt synthesizes across all previous lesson steps in the module.
 * Previous steps are supplied in condensed form (title, goal, topics,
 * block-type + excerpt) — full block prose is not included.
 *
 * Supports a graceful skip response when no suitable lab can be generated:
 *   { "skip": true, "reason": "..." }
 *
 * Normal response:
 *   { "taskBlock": { "type": "task", "title": "Module Lab", "content": "..." },
 *     "starterCode": "..." }
 */

// ---------------------------------------------------------------------------
// Lesson style guidance — mirrors calibration in generateTaskPrompt.js
// ---------------------------------------------------------------------------

const LESSON_STYLE_LABELS = {
  code_lab:             'Programming (code_lab)',
  guided_tool_workflow: 'Guided Tool Workflow',
  concept_application:  'Concept & Application',
}

const LESSON_STYLE_GUIDANCE = {
  code_lab: `The learner is expected to write code. A module lab should synthesize multiple concepts taught across the earlier steps into one coherent coding exercise. Include starterCode.`,
  guided_tool_workflow: `The learner follows a tool-based workflow. A module lab is appropriate only if the previous steps contain at least one genuine coding or tool-action component. If the prior steps are entirely observational or slide-based with no coding, return the skip response.`,
  concept_application: `The learner is building conceptual understanding. A module lab is appropriate only if the prior steps contain at least one concept that maps directly to a concrete coding action. If the prior content is entirely conceptual with no natural practice action, return the skip response.`,
}

// ---------------------------------------------------------------------------
// Previous-steps serializer
// ---------------------------------------------------------------------------

function serializePreviousSteps(previousSteps) {
  if (!previousSteps || previousSteps.length === 0) return '(none)'
  return previousSteps
    .map((step, i) => {
      const topics = step.coveredSubtopics?.length > 0
        ? step.coveredSubtopics.join(', ')
        : '(none listed)'
      const blocks = step.blockSummaries?.length > 0
        ? step.blockSummaries
            .map((b) => `  [${b.type.toUpperCase()}] ${b.excerpt}`)
            .join('\n')
        : '  (no block content)'
      return `Step ${i + 1}: ${step.title}\nGoal: ${step.goal}\nTopics: ${topics}\nContent excerpts:\n${blocks}`
    })
    .join('\n\n')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * buildGenerateModuleLabPrompt
 *
 * @param {object} params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {string}   params.lessonFormat
 * @param {string}   params.outputLanguage
 * @param {object}   params.currentStep       — { title, goal, coveredSubtopics }
 * @param {object[]} params.previousSteps     — condensed: { title, goal, coveredSubtopics, blockSummaries }
 * @returns {string}
 */
export function buildGenerateModuleLabPrompt({
  courseName,
  moduleName,
  lessonFormat,
  outputLanguage,
  currentStep,
  previousSteps,
}) {
  const styleLabel    = LESSON_STYLE_LABELS[lessonFormat]   ?? lessonFormat
  const styleGuidance = LESSON_STYLE_GUIDANCE[lessonFormat] ?? LESSON_STYLE_GUIDANCE['code_lab']
  const previousStepsDisplay = serializePreviousSteps(previousSteps)

  return `You are a course author writing a module-level hands-on lab for a self-paced lesson.

This is the final practice step of the module. It should synthesize concepts covered across the previous lesson steps — not just the most recent one.

The learner is studying alone — no instructor, no live feedback. Write as a skilled course author speaking directly to a learner.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course: ${courseName}
Module: ${moduleName}
Lesson style: ${styleLabel}
Output language: ${outputLanguage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT STEP (the hands-on lab step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step title: ${currentStep.title}
Step goal: ${currentStep.goal || '(not set)'}
Step topics: ${currentStep.coveredSubtopics?.join(', ') || '(none listed)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREVIOUS LESSON STEPS (condensed — what the learner has already studied)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${previousStepsDisplay}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON STYLE GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${styleGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK BLOCK RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write one task block that creates a cohesive lab exercise drawing on concepts from the previous steps.

- Title: always "Module Lab"
- Content: 3–5 sentences of natural learner-facing prose
- Name the specific concepts being integrated — do not be generic
- Describe what the learner will build or produce, and what a correct result looks like
- State the goal, not the procedure — do not write numbered steps
- The task must be achievable using only what the previous steps have already taught
- Do not introduce new concepts not present in the previous steps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STARTER CODE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write the starter code in ${outputLanguage}.

- Provide enough scaffolding so the learner can orient without revealing the solution
- The lab should draw on multiple concepts from the previous steps — reflect that in the code structure and variable setup
- Use ONE coherent TODO for the core challenge — do not fragment into many small TODOs
- Format: # TODO: [concise goal] on one line, # Expected: [outcome description] on the next
- Use real variable names and values — not abstract placeholders
- Do not include near-solution code or commented-out answer code
- The lab must be completable by editing only the TODO area

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO SKIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return the skip response if:
- The previous steps contain no coding concepts or practical actions to synthesize
- Creating a meaningful lab would require introducing concepts not yet taught in this module
- The lesson style guidance above says to skip for this module type

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETURN FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return exactly ONE valid JSON object. Two possible shapes:

Normal — lab is appropriate:
{
  "taskBlock": {
    "type": "task",
    "title": "Module Lab",
    "content": "..."
  },
  "starterCode": "..."
}

Skip — no suitable lab for this module:
{
  "skip": true,
  "reason": "One sentence explaining why no lab was generated."
}

Rules:
- Do not return markdown. Do not wrap in code fences. No commentary before or after.
- starterCode must be a non-empty string when taskBlock is present.
- The reason in a skip response must be a single, author-facing sentence (not an error message).
- Ensure the JSON is valid and parseable.`
}
