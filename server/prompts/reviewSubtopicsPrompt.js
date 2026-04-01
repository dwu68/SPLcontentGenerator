/**
 * buildReviewSubtopicsPrompt
 *
 * Prompt for POST /api/review-subtopics.
 *
 * Asks the AI to assess the current sub-topic list for a lesson module and
 * return either a revised list with rationale, or a skip signal if the list
 * is already well-structured.
 *
 * Return contract:
 *   { revisedSubtopics: string, rationale: string }   — revision suggested
 *   { skip: true, reason: string }                     — list is already good
 *
 * revisedSubtopics must be newline-separated (matching the textarea format)
 * so the client can apply it directly with no conversion.
 */
export function buildReviewSubtopicsPrompt({ courseName, moduleName, lessonFormat, subtopicsText }) {
  const formatLabel = {
    code_lab:              'Programming (hands-on coding lab)',
    guided_tool_workflow:  'Guided Tool Workflow (step-by-step tool use)',
    concept_application:   'Concept & Application (conceptual + applied learning)',
  }[lessonFormat] || lessonFormat

  return `You are a curriculum specialist reviewing the sub-topics for an internal lesson module.

MODULE CONTEXT
Course:         ${courseName}
Module:         ${moduleName}
Lesson format:  ${formatLabel}

CURRENT SUB-TOPICS (one per line)
${subtopicsText.trim()}

TASK
Review these sub-topics and decide whether they need revision. Consider:
1. Completeness — are important prerequisite or follow-on topics missing for a learner at this level?
2. Ordering — are they sequenced logically (concepts before applications, simpler before complex)?
3. Granularity — are any topics too broad (should be split) or too narrow (should be merged)?
4. Relevance to format — are they appropriate for a "${formatLabel}" lesson?
5. Currency — based on your training knowledge, do any topics appear outdated or missing modern equivalents?

DECISION RULES
- If the list is already well-structured and no substantive changes are warranted, return skip=true.
- Only suggest a revision if it meaningfully improves the list. Small cosmetic rewording alone is not a reason to suggest a revision.
- Do not add topics that are out of scope for the stated module name and course.
- Preserve the author's intended scope — do not expand a focused module into a broad survey.

OUTPUT FORMAT (JSON only — no prose outside the JSON object)

If revision is needed:
{
  "revisedSubtopics": "<newline-separated list of revised topics — same format as the input, one topic per line>",
  "rationale": "<2–4 sentences explaining specifically what changed and why. Name the topics added, removed, reordered, or merged.>"
}

If the list is already good:
{
  "skip": true,
  "reason": "<1–2 sentences confirming the list looks appropriate and why. Be specific.>"
}

Return only valid JSON. Do not wrap in markdown code fences.`
}
