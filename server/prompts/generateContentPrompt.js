/**
 * server/prompts/generateContentPrompt.js
 *
 * Prompt builder for Screen 2 — full lesson content generation for a single step.
 *
 * ── EDIT THIS FILE to paste or refine the master content prompt ───────────
 *
 * This function is called once per lesson step. It receives a PromptContext
 * object (assembled by buildPromptContext in server/lib/promptContext.js) and
 * returns the prompt string sent to the AI provider.
 *
 * JSON contract this prompt must produce (one object per step call):
 *
 *   {
 *     "concept":        string  — teaching narrative (UI label: "Explanation")
 *     "codeExample":    string  — short annotated snippet, 4–8 lines
 *     "instructions":   string  — numbered task steps (UI label: "Task")
 *     "hint":           string  — nudge shown when the learner is stuck
 *     "expectedAction": string  — what the learner must do to complete the step
 *     "validationNote": string  — guidance for the validator (not shown to learner)
 *     "starterCode":    string  — initial code shown in the code editor
 *   }
 *
 * This endpoint does not exist yet. When you are ready to wire it, add
 * POST /api/generate-content to server/index.js following the same pattern
 * as POST /api/generate-structure.
 */

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
    learnerLevel,
    outputLanguage,
  } = context

  // ── PASTE YOUR MASTER CONTENT PROMPT BELOW ───────────────────────────────
  //
  // Replace the template literal below with your final prompt text.
  // All context fields listed above are available to interpolate.
  // The model must return a valid JSON object matching the contract above.
  //
  // ─────────────────────────────────────────────────────────────────────────

return `You are generating content for Screen 2 of a self-paced coding lesson authoring tool.

Your job is to create the complete lesson content for exactly ONE lesson step.

Course: ${courseName}
Module: ${moduleName}
Step title: ${stepTitle}
Step learning goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Learner level: ${learnerLevel}
Programming language for code: ${outputLanguage}

Important scope rules:
- Generate content for this step only.
- Stay tightly focused on the step title, step goal, and step topics above.
- Do not introduce future concepts unless they are absolutely necessary for this exact step.
- Do not assume knowledge beyond what a ${learnerLevel} learner would reasonably know.
- If some detail is missing, make the safest reasonable assumption based on the current step goal and topics.

You must return exactly one JSON object with exactly these keys:
{
  "concept": string,
  "codeExample": string,
  "instructions": string,
  "hint": string,
  "expectedAction": string,
  "validationNote": string,
  "starterCode": string
}

Field requirements:

1. "concept"
- Write the explanation in a scan-friendly format for self-paced learners.
- Use exactly these three labeled parts in this order:
  1. What it is:
  2. Why it matters:
  3. Common mistake:
- Under each label, write 1–2 short sentences of real lesson content.
- Keep the writing concrete and specific to this step.
- Do not use brackets, placeholders, template text, or meta-instructions in the output.
- Do not write things like "[describe ... here]" or "[example ...]".
- Do not leave any part generic.

2. "codeExample"
- Write a short example in ${outputLanguage}.
- It should demonstrate the exact concept from this step.
- Keep it small enough to read comfortably in one lesson panel.
- Prefer roughly 4–8 lines when possible.
- Include brief inline comments only where they genuinely help.
- This is a demonstration example, not the learner exercise solution.
- Do not wrap it in markdown fences.

3. "instructions"
- Write clear learner task instructions for this step.
- Use a numbered list in plain text.
- Keep the instructions action-focused.
- Usually 2–4 steps.
- The learner should be able to complete these instructions using the starterCode.
- Do not repeat the full teaching explanation here.

4. "hint"
- Write one short helpful hint for a stuck learner.
- It should guide without giving away the full answer.
- It should point to the key idea of this specific step.

5. "expectedAction"
- State clearly what the learner is expected to do to complete this step.
- This should align directly with the instructions and starterCode.
- Be specific enough that future validation logic could use it.

6. "validationNote"
- Write internal validation guidance, not learner-facing copy.
- Describe what a correct result should include.
- Mention the most common mistake(s) to watch for.
- Keep it concise but specific.

7. "starterCode"
- Write starter code in ${outputLanguage}.
- It must support the exact task described in "instructions".
- Include only the minimum scaffolding the learner needs.
- Leave meaningful work for the learner to do.
- Include a clearly marked TODO where the learner should write or complete code.
- Do not fully solve the task.
- Do not wrap it in markdown fences.

Consistency rules:
- "concept", "codeExample", "instructions", "expectedAction", "validationNote", and "starterCode" must all describe the same step and the same learning objective.
- "codeExample" and "starterCode" must not be identical.
- "instructions" must be solvable using "starterCode".
- "expectedAction" must match what the learner is asked to do in "instructions".
- Keep the difficulty appropriate for ${learnerLevel}.

Output rules:
- Return valid JSON only.
- Do not return markdown.
- Do not use code fences.
- Do not add any text before or after the JSON object.
- Do not include any extra keys.
- Do not leave any required field empty.`
}
