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
 *     "blocks": [
 *       {
 *         "id":       string   — unique within the step, e.g. "b1", "b2", …
 *         "type":     "explain" | "code" | "check" | "task" | "hint"
 *         "title":    string?  — optional heading; for hint: used as collapsed label
 *         "content":  string   — prose, code, question text, or action steps
 *         "language": string?  — code blocks only, e.g. "python"
 *       },
 *       …
 *     ]
 *     "starterCode":    string  — initial code shown in the code editor
 *     "expectedAction": string  — what the learner must do to complete the step
 *     "validationNote": string  — guidance for the validator (not shown to learner)
 *   }
 *
 * Block type semantics:
 *   explain — teaching prose (optional title becomes a heading)
 *   code    — read-only annotated example; must include language field
 *   task    — numbered action steps the learner performs
 *   check   — quick comprehension question (rendered as a question card)
 *   hint    — optional nudge, rendered collapsed; title is the collapsed label
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

return `You are writing the instructional content for one step of a self-paced coding lesson.
The learner is reading alone — no instructor, no live feedback. Write as a knowledgeable
author writing directly for this specific learner.

Course: ${courseName}
Module: ${moduleName}
Step title: ${stepTitle}
Step learning goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Learner level: ${learnerLevel}
Programming language: ${outputLanguage}

Scope:
- Generate content for this step only. Stay focused on "${stepTitle}" and the step goal.
- Do not assume knowledge beyond what a ${learnerLevel} learner would have.
- Do not add caveats or forward references ("later you will learn..."). Stay in this step.
- If detail is missing, make the safest assumption based on the step goal and topics.

Voice:
- Write concretely. Every word must be real lesson content — no placeholder phrasing.
- Start with the idea itself. Avoid meta-language: "In this step you will learn...",
  "is a core concept", "is important because", "you will use this throughout".
- Use short, direct sentences.

Return exactly one JSON object with these top-level keys:
  "blocks", "starterCode", "expectedAction", "validationNote"

"blocks" is an ordered array. Each element has this shape:

  {
    "id":       string,          // e.g. "b1", "b2" — unique within this step
    "type":     "explain" | "code" | "check" | "task" | "hint",
    "title":    string | null,   // optional; see quality rules below
    "content":  string,          // required; see quality rules below
    "language": string | null    // required for code blocks; null for all others
  }

── TOPIC AND STEP PHRASING ─────────────────────────────────

The step title is "${stepTitle}". The topics are: ${stepTopics.join(', ')}.

When referring to the concept across blocks:
- Do not repeat the step title word-for-word as a heading or sentence opener in every block.
  Vary the phrasing naturally. Use "this syntax", "the pattern", "this approach",
  or a short descriptive phrase where the full topic name would be repetitive.
- Do not make the topic name the grammatical subject of every sentence.
  Restate the mechanism or behavior instead of restating the name.
- Block titles (the "title" field) must name the specific idea in that block, not just the
  topic name. If the step is about f-strings, a title of "f-strings" on every block is wrong.
  Write titles that distinguish one block from another within the same step.

── BLOCK SEQUENCE ──────────────────────────────────────────

The block sequence must follow the instructional logic of this specific step.
Think of it as four stages:

  1. Build understanding  →  one or two explain blocks
  2. Make it concrete     →  one code block
  3. Test understanding   →  one check block  (optional)
  4. Have them do it      →  one task block   (almost always present)
  5. Provide a lifeline   →  one hint block   (optional)

Rules:
- A typical step has 3–5 blocks. Do not pad.
  A sharp 3-block step is better than a padded 6-block step.
- Use two explain blocks only when the concept has two genuinely distinct parts that
  the learner needs to hold separately. Do not split one idea into two blocks to add length.
- Add a check block when the concept has a non-obvious implication or a common confusion
  point worth pausing on. Do not add one just to have one.
- Add a hint block only when the task involves a mechanic that is easy to confuse.
  Omit it when the task is straightforward.
- The task block is the learner's exercise and is present in almost every step.
  Omit it only for a pure reading or observation step with no exercise.

── EXPLAIN BLOCKS ──────────────────────────────────────────

type: "explain"

title:
  Name the specific idea in this block. The title should tell the learner what they are
  about to understand — not label the block generically.

  Good:  "The f prefix and what it tells Python"
         "Why {} works without concatenation"
         "What happens when Python evaluates the expression"
  Bad:   "What it is"  "Why it matters"  "Overview"  "Introduction"
         The topic name alone  Any variation of "What / Why / How"

  Never use "What it is", "Why it matters", or "Common mistake". These are
  table-of-contents labels, not titles. If you cannot write a title that adds
  information beyond the block type name, use null.

content:
  Write enough to explain the idea clearly — usually 2–4 sentences, but let the concept
  determine the length. Short sentences, one idea per sentence. Apply these rules:

  1. Connect to what the learner already knows before introducing the new thing.
     Begin from the familiar, then show what is new or different.

  2. Name the mechanism — describe what actually happens when this runs,
     not just what the concept is called.
     Bad:  "f-strings are a way to format strings."
     Good: "Writing f before the opening quote tells Python to evaluate any expression
            inside {} before constructing the final string."

  3. One explain block = one idea. If you are about to make two distinct points,
     use two explain blocks with different titles.

  4. A brief inline code snippet in the prose is allowed when it makes one point concrete
     (e.g. "Writing f'{name}' inserts the current value of name.").
     Keep it to a single expression or line — this is not the code block.

  5. Do not begin with meta-language. Start with the idea itself.

── CODE BLOCKS ─────────────────────────────────────────────

type: "code"

language: always "${outputLanguage.toLowerCase()}" — never null for code blocks

content:
  Real, runnable ${outputLanguage} code. Apply these rules:

  1. Use real variable names, real values, and real function calls relevant to the topic.
     Do not use placeholder names: no do_thing(), my_func(), example_code,
     correct_usage(), or similar. Name things after what they represent.

  2. Demonstrate exactly ONE mechanic — the specific thing explained in the immediately
     preceding explain block. Do not try to demonstrate the full topic in one block.
     If there are two explain blocks covering two distinct mechanics, you may write
     two code blocks, one per mechanic.

  3. If contrasting correct usage with a common mistake, label each clearly with comments:
       # Correct — Python evaluates the expression and inserts the result:
       ...
       # Common mistake — this treats the {} as a literal character:
       ...
     Limit to ONE contrast. Do not catalog multiple mistakes.

  4. Add inline comments where they clarify the mechanism — not on every line.
     Comment lines that demonstrate the key behavior. Do not comment obvious lines
     (variable assignments, import statements, simple value lookups).

  5. If any line produces printed output, add a comment on that line showing the exact
     output the learner will see:
       print(greeting)   # Hello, Ada from Rome

  6. Target 4–8 lines. If you need more than 8 lines to show the mechanic,
     the scope is too large — narrow it to the single key point.

  7. This code is a demonstration, not a template for the task. It must not look like
     a near-complete solution to what the task block asks the learner to write.

── CHECK BLOCKS ────────────────────────────────────────────

type: "check"

title:
  Optional. If used, name what the learner is checking — not "Before you continue".
  Good:        "Quick check — what does this print?"
               "Before you write the task code"
  Acceptable:  null
  Bad:         "Before you continue"  (generic filler label — never use this)

content:
  A question the learner should think about for a few seconds before moving to the task.

  Format: the question text, then a blank line, then "→ " and the answer.

  Quality rules:

  1. Ask the learner to APPLY the concept, not recall its definition.

     Bad (recall — answered by re-reading the explain block):
       "What is an f-string?"
       "Why are f-strings useful?"

     Good (apply — requires tracing execution):
       "What does this print?\\n\\n  city = 'Rome'\\n  print(f'I love {city}!')\\n\\nThink, then scroll.\\n\\n→ I love Rome!"

     Good (discriminate — requires understanding the rule):
       "Which of these two lines will raise a TypeError, and why?\\n\\n  a = f'sum: {1 + 2}'\\n  b = f'sum: {1 + \\"2\\"}'\\n\\nThink, then scroll.\\n\\n→ Line b raises TypeError. '2' is a string; Python cannot add it to the integer 1 inside an f-string expression."

  2. A short code snippet inside the question is strongly preferred.
     It forces the learner to trace execution rather than recite a definition.

  3. The answer after "→" is 1–2 sentences. It confirms or corrects the learner's
     thinking. It does not re-explain the concept from the beginning.

  4. The question must be answerable from the explain and code blocks shown before it.
     Do not ask about anything that only the task block introduces.

  5. If you cannot write a genuinely non-obvious question for this step, omit the check
     block entirely. A weak or trivial check is worse than no check.

── TASK BLOCKS ─────────────────────────────────────────────

type: "task"

title:
  A short label that signals the learner's turn to act.
  Good:  "Your turn"  "Now write it"  "Lab task"
  Use null if no title is needed.

content:
  Numbered action steps. Apply these rules:

  1. Reference specific, named elements from the starterCode in each step:
     variable names, function names, TODO marker context, or line descriptions.

     Bad:  "Apply f-strings to complete the TODO section."
     Good: "Find the variable greeting. Replace the TODO with an f-string
            that uses the variables name and city."

  2. Each step is ONE action. Do not chain two actions with "and".

  3. Do not open with "Look at the starter code on the right." The learner knows
     where the code is. Start with the action itself.

  4. The final step is usually a verification that states the exact expected output:
     "Run the code. Confirm it prints:\\n  Hello, Ada from Rome"
     If the exercise produces no printed output, use a different concrete verification
     that tells the learner what to look for — not just "confirm it is correct".

  5. 2–4 steps. A focused 2-step task (one action + one verification) is often
     better than a padded 4-step task.

  6. The learner should be able to complete all steps by editing only the TODO area.
     Do not ask them to change variable definitions, imports, or other scaffolding.

── HINT BLOCKS ─────────────────────────────────────────────

type: "hint"

title:
  Optional. If used, write a short phrase that signals relevance — specific enough that
  the learner knows whether to open it, without giving the hint away.
  Good:        "Stuck on the {} syntax?"
               "Not sure what to put inside the braces?"
  Acceptable:  "Need a hint?"  null
  Bad:         A title that restates the task or just says "Hint"

content:
  One short hint. Apply these rules:

  1. Name the specific mechanic the learner is most likely stuck on — not the general
     concept. Think about the one sub-thing in this task that trips people up.

     Bad:  "Re-read the explanation above and look at the code example."
           (sends them back; gives nothing new)
     Good: "The expression inside {} is evaluated at runtime — you can write
            name.upper() directly inside the braces without a separate variable."

  2. Give the learner a new angle or a concrete nudge, not a pointer back to what they
     already read. If the hint sends them back to re-read, it is not a hint.

  3. Do not give away the answer. Name the mechanism and let the learner apply it.

  4. One sentence is usually enough. Two sentences is the maximum.

  Omit the hint block if the task is unlikely to cause confusion.

── STARTER CODE ────────────────────────────────────────────

"starterCode" — the code the learner starts from in the editor

Apply these rules:

1. The starterCode must match the task block steps exactly.
   Every named element the task references must exist in the starterCode.
   If the task says "find the variable greeting", there must be a variable named greeting.
   If the task says "replace the TODO", there must be exactly one TODO marker.

2. Use a single, clearly marked TODO. Format it as:
     # TODO: [one-line description of what the learner must write here]
   Do not add multiple TODO markers unless the task genuinely has two distinct exercises —
   and even then, reconsider whether this is one step or two.

3. Use variable names and values that give the task concrete anchors.
   If the task step says "use name and city", define them with real values:
     name = "Ada"
     city = "Rome"
     # TODO: write an f-string that prints: Hello, Ada from Rome
   Do not use placeholder values like "your_name" or "value_here".

4. Include only the scaffolding the learner needs — no more.
   Do not include commented-out hints, near-complete implementations,
   or large blocks of boilerplate that crowd the exercise.

5. The expected output must be deterministic. Whatever the learner writes in the
   TODO area, the correct solution should produce one specific, predictable output —
   the same output shown in the task block's verification step.

6. Do not wrap in markdown fences. Plain code only.

── CONSISTENCY RULES ───────────────────────────────────────

- All blocks, starterCode, expectedAction, and validationNote must describe the same
  concept and the same learning objective. There must be no contradiction between them.

- The code block and the starterCode must not be identical or near-identical.
  The code block demonstrates the mechanic. The starterCode is the exercise scaffold.
  They serve different purposes and must look clearly different.

- The task block steps must be completable by editing only the TODO area
  in the starterCode as provided.

- The check block question must be answerable from the explain and code blocks
  that precede it. It must not depend on anything introduced in the task block.

- The expectedAction and the task block describe the same learner action —
  one for the learner, one for the validator. They must not contradict each other.

- The validationNote describes what a correct completed starterCode looks like.
  It is internal author/validator guidance only — not learner-facing copy.

- Difficulty must be appropriate for ${learnerLevel}.
  For a beginner step: the TODO should require writing 1–3 lines of new code,
  not a function, class, or multi-part algorithm.

── OUTPUT RULES ────────────────────────────────────────────

- Return valid JSON only.
- Do not return markdown.
- Do not use code fences anywhere — not around code block content,
  not around the JSON object itself.
- Do not add any text before or after the JSON object.
- Include exactly these top-level keys: "blocks", "starterCode", "expectedAction",
  "validationNote". No extra keys.
- Include as many blocks as the instructional logic requires. Do not add blocks to
  hit a target count, and do not omit blocks the learner needs.
- Every block must have a non-empty "content" string.
- Every "code" block must have a non-null "language" string.
- "starterCode", "expectedAction", and "validationNote" must all be non-empty strings.`
}
