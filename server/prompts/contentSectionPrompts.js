/**
 * server/prompts/contentSectionPrompts.js
 *
 * Per-section prompt builders for Screen 2.
 *
 * ── EDIT THIS FILE to refine individual section prompts ──────────────────
 *
 * Use these when you want to generate (or regenerate) one section of a step
 * at a time — e.g. regenerate only the hint, or only the starter code —
 * rather than calling the master content prompt for the whole step.
 *
 * Each function accepts a PromptContext (from server/lib/promptContext.js)
 * and returns a plain string prompt. None of these are wired to a server
 * endpoint yet. When you are ready, add per-section routes to server/index.js
 * that call the relevant builder here.
 *
 * Sections covered:
 *   buildExplanationPrompt   — concept / teaching narrative
 *   buildCodeExamplePrompt   — short annotated snippet
 *   buildInstructionsPrompt  — numbered task steps
 *   buildHintPrompt          — stuck-learner nudge
 *   buildStarterCodePrompt   — initial editor code with TODO
 *   buildPracticeTaskPrompt  — optional standalone practice exercise
 */

// ── SECTION: Explanation (concept field) ─────────────────────────────────────
//
// ── PASTE YOUR EXPLANATION PROMPT BELOW ──────────────────────────────────────
// Replace the template literal with your final teaching-narrative prompt.
// Return type expected: plain text (not JSON).

export function buildExplanationPrompt(context) {
  const { stepTitle, stepGoal, stepTopics, learnerLevel, outputLanguage } = context

  return `Write a teaching narrative for the following coding concept.

Step: ${stepTitle}
Goal: ${stepGoal}
Topics: ${stepTopics.join(', ')}
Learner level: ${learnerLevel}
Language: ${outputLanguage}

Cover: why the concept matters, how it works (the key rule or mechanism), and one common mistake learners make.
Return plain text only — no JSON, no markdown headings.`
}


// ── SECTION: Code example (codeExample field) ────────────────────────────────
//
// ── PASTE YOUR CODE EXAMPLE PROMPT BELOW ─────────────────────────────────────
// Return type expected: code only (no surrounding prose or JSON).

export function buildCodeExamplePrompt(context) {
  const { stepTitle, stepTopics, outputLanguage } = context

  return `Write a short annotated ${outputLanguage} snippet illustrating the following concept.

Step: ${stepTitle}
Topics: ${stepTopics.join(', ')}

Requirements:
- 4–8 lines of code
- Inline comments on the parts that demonstrate the key concept
- Include one example of the correct pattern and, if space allows, one common mistake

Return code only — no prose, no JSON.`
}


// ── SECTION: Task instructions (instructions field) ───────────────────────────
//
// ── PASTE YOUR INSTRUCTIONS PROMPT BELOW ─────────────────────────────────────
// Return type expected: plain text numbered list (not JSON).

export function buildInstructionsPrompt(context) {
  const { stepTitle, stepGoal, outputLanguage } = context

  return `Write numbered task instructions for a ${outputLanguage} coding exercise.

Step: ${stepTitle}
Goal: ${stepGoal}

Requirements:
- 2–4 numbered steps
- Action-focused only ("Do X", "Call Y") — no explanations or teaching
- Each step is one sentence

Return plain text only — no JSON, no markdown headings.`
}


// ── SECTION: Hint ─────────────────────────────────────────────────────────────
//
// ── PASTE YOUR HINT PROMPT BELOW ─────────────────────────────────────────────
// Return type expected: one plain-text sentence (not JSON).

export function buildHintPrompt(context) {
  const { stepTitle, stepGoal } = context

  return `Write a one-sentence hint for a learner who is stuck on this coding exercise.

Step: ${stepTitle}
Goal: ${stepGoal}

The hint should nudge the learner toward the answer without giving it away.
Return a single sentence — no JSON, no markdown.`
}


// ── SECTION: Starter code (starterCode field) ────────────────────────────────
//
// ── PASTE YOUR STARTER CODE PROMPT BELOW ─────────────────────────────────────
// Return type expected: code only (not JSON, not prose).

export function buildStarterCodePrompt(context) {
  const { stepTitle, stepGoal, outputLanguage } = context

  return `Write the starter code for a ${outputLanguage} coding exercise.

Step: ${stepTitle}
Goal: ${stepGoal}

Requirements:
- Include a clearly marked TODO comment where the learner writes their solution
- Add any necessary imports and scaffolding
- Add brief inline comments to orient the learner
- Keep it short — only what the learner actually needs

Return code only — no prose, no JSON.`
}


// ── SECTION: Practice task ────────────────────────────────────────────────────
//
// ── PASTE YOUR PRACTICE TASK PROMPT BELOW ────────────────────────────────────
// A practice task is an optional standalone exercise beyond the main step task.
// Return type expected: plain text (not JSON).

export function buildPracticeTaskPrompt(context) {
  const { stepTitle, stepGoal, outputLanguage } = context

  return `Write a short practice task for a ${outputLanguage} coding exercise.

Step: ${stepTitle}
Goal: ${stepGoal}

Requirements:
- 1–3 sentences
- Clearly states what the learner must build or modify
- Slightly extends the main task to reinforce the concept

Return plain text only — no JSON, no markdown headings.`
}
