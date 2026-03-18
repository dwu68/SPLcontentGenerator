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
- Every topic listed in "Step topics" is a coverage requirement.
  Every topic must be addressed by at least one explain or code block.
  Do not silently omit a listed topic because the block count feels high.
- A step with one or two topics typically needs 3–5 blocks.
  A step with three or more topics may need up to 7 blocks to meet coverage.
  Use as many blocks as the topics require — up to 7.
- Do not pad. "Padding" means adding a block that restates a topic already fully
  covered, or adding a block to hit a count. It does not mean covering all listed topics.
  A focused 3-block step is better than a padded 6-block step.
  A 7-block step that covers five distinct topics is not padding.
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
  Teach the idea, do not merely summarize it.

  Write enough for a learner reading alone to understand both the rule and how it behaves in code.
  Usually 3–6 sentences. Use fewer only when the idea is truly simple. Use more when a short explanation
  would leave an important distinction unclear.

  Apply these rules:

  1. Begin from something the learner already knows, then introduce the new rule or behavior.
     Move from familiar → new, not definition → definition.

  2. Name the mechanism — describe what actually happens when this runs,
     not just what the concept is called.

  3. Explain the practical distinction when nearby topics are easy to confuse.
     If this step includes related ideas (for example indexing vs slicing, keys vs values vs items,
     tuple immutability vs list mutability), make the difference explicit in the prose.

  4. Do not stop at naming the rule. Also state the consequence:
     what the learner can do with it, what result it produces, or what limitation it introduces.

  5. One explain block = one teachable idea.
     A teachable idea may include the rule, its behavior, and one important distinction,
     but do not cram multiple unrelated ideas into one block.

  6. A brief inline code snippet in the prose is allowed when it sharpens one point.
     Keep it to a single expression or line — this is not the main code block.

  7. Do not begin with meta-language. Start with the idea itself.

Depth check for explain blocks:
- After reading this block, the learner should understand not only what the idea is,
  but how it behaves and how it differs from the most similar nearby idea in this step.
- If the block could be reduced to a glossary entry without losing meaning, it is too shallow.
- If the block only lists features or names examples without clarifying the rule, it is too shallow.
- A strong explain block usually includes at least two of these three elements:
  the rule, the behavior in code, and the distinction from a nearby similar idea.
- If the learner could read the block and still not know when to use this idea,
  the block is too shallow.

── CODE BLOCKS ─────────────────────────────────────────────

type: "code"

language: always "${outputLanguage.toLowerCase()}" — never null for code blocks

content:
  Real, runnable ${outputLanguage} code. Apply these rules:

  1. Use real variable names, real values, and real function calls relevant to the topic.
     Do not use placeholder names: no do_thing(), my_func(), example_code,
     correct_usage(), or similar. Name things after what they represent.

  2. Demonstrate one main mechanic clearly.
    A code block may also include one closely related supporting mechanic when the learner
    needs to see how they work together in real code.
    Do not try to demonstrate the full topic in one block, but do not reduce the example
    to an unnaturally isolated fragment if a nearby idea is essential to understanding it.

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

The example should still be rich enough to make the mechanic feel real.
Prefer code that shows the mechanic in a small meaningful context, not in the thinnest possible toy form.

── CHECK BLOCKS ────────────────────────────────────────────

type: "check"

title:
  Optional. If used, name what the learner is checking — not "Before you continue".
  Good:        "Quick check — what does this print?"
               "Before you write the task code"
  Acceptable:  null
  Bad:         "Before you continue"  (generic filler label — never use this)

content:
  A short reasoning check the learner should use to confirm understanding before the task.

  Format: the question text, then a blank line, then "→ " and the answer.

  Quality rules:

  1. Ask the learner to APPLY or DISCRIMINATE, not merely recall.
    Good checks make the learner choose, trace, compare, or predict.

  2. A short code snippet inside the question is strongly preferred.
    Use it to make the learner reason about behavior, output, validity, or which option is correct.

  3. The answer after "→" should confirm the result and briefly name the key reason.
    Usually 1–3 sentences.
    Do not restart the whole explanation, but do include the decisive rule that makes the answer correct.

  4. Prefer checks that expose a likely confusion point:
    - which line works vs fails
    - which method returns which kind of result
    - what output appears and why
    - which operation changes the data and which only reads it

  5. The question must be answerable from the explain and code blocks shown before it.
     Do not ask about anything that only the task block introduces.

  6. If you cannot write a genuinely non-obvious question for this step, omit the check
     block entirely. A weak or trivial check is worse than no check.

── TASK BLOCKS ─────────────────────────────────────────────

type: "task"

title:
  Always “Lab”. This block is the lab objective card — the title is always “Lab”.

content:
  Write a lab problem statement in natural learner-facing prose.
  Do not write numbered implementation steps. Do not reference specific line numbers, or TODO markers — those details belong in the starterCode comments.

  The content should read like a brief, direct briefing: what the learner is trying to
  accomplish, what concept or mechanic they are applying, and what a correct result
  looks like. Write it as connected sentences, not as a labeled template or a checklist.
  

  Quality rules:

  1. State the goal, not the procedure.
     Bad:  “Find the greeting variable. Replace the TODO with an f-string. Run the code.”
     Good: “Your job is to build a formatted greeting string using an f-string. When the
            code runs correctly, it will print: Hello, Ada from Rome”

  2. The task must require a real application of the concept — not a syntax copy.
     If the learner can finish by pasting the demo code with one word changed, it is too weak.
     Prefer tasks that require the learner to choose the right operation, combine two values,
     retrieve part of a structure, or apply the mechanic to new data.

  3. If the step covers two closely related ideas, the lab should exercise both when natural.
     Do not force it, but do not collapse the lab to the single easiest action.

  4. State the expected result concretely.
     Give the exact output string, return value, or observable change the learner should see.
     “The code should work” is not a success criterion.

  5. Keep it short. Two to four sentences is the right length for a lab objective.
     The starterCode carries the local implementation detail — this block carries the goal.

  6. Write this block as natural learner-facing prose.
    It should read like a brief coding objective or scenario, not like a checklist or worksheet instruction list.

    Describe:
    - what the learner is trying to accomplish,
    - what they are exploring, building, or producing,
    - and what a correct result looks like.

    Prefer natural verbs like explore, inspect, build, create, retrieve, compare, or show.
    Avoid micromanaging verbs like find, replace, run, confirm unless absolutely necessary.


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

1. The starterCode must be set up so the learner can accomplish the lab objective
   stated in the task block. The variables, data, and TODO must directly support
   what the task block describes as the goal and expected result.

2. Starter code comments should provide conceptual local guidance, not exact implementation instructions.
  Good comments describe:
  - what the current data represents,
  - what the learner needs to produce,
  - what kind of result a line should generate.

  Do not reveal the exact method, operator, or expression when choosing it is part of the exercise.

  Bad:
  # TODO: print pet.keys(), pet.values(), and pet.items()

  Good:
  # TODO: print the field names stored in the pet dictionary
  # TODO: print the stored values
  # TODO: print each field together with its value

3. Use variable names and values that give the task concrete anchors.
   If the task step says "use name and city", define them with real values:
     name = "Ada"
     city = "Rome"
     # TODO: write an f-string that prints: Hello, Ada from Rome
   Do not use placeholder values like "your_name" or "value_here".

4. Include brief inline comments that orient the learner locally — what each variable
   represents, what section they are working in, what kind of value belongs in the TODO.
   These are orientation comments, not hints. They name the situation, not the answer.
   Good:  name = "Ada"    # the name to include in the greeting
   Bad:   name = "Ada"    # hint: put name inside the f-string braces
   Do not include near-complete implementations or commented-out solution code.
   Do not add large blocks of boilerplate that crowd the exercise.

5. The expected output must be deterministic. Whatever the learner writes in the
   TODO area, the correct solution should produce one specific, predictable output —
   the same output shown in the TODO's Expected comment line.

6. Do not wrap in markdown fences. Plain code only.

── CONSISTENCY RULES ───────────────────────────────────────

- All blocks, starterCode, expectedAction, and validationNote must describe the same
  concept and the same learning objective. There must be no contradiction between them.

- The code block and the starterCode must not be identical or near-identical.
  The code block demonstrates the mechanic. The starterCode is the exercise scaffold.
  They serve different purposes and must look clearly different.

- The lab objective stated in the task block must be achievable by editing only
  the TODO area in the starterCode as provided.

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
