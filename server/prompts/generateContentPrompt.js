/**
 * server/prompts/generateContentPrompt.js
 *
 * Prompt builder for Screen 2 — full lesson content generation for a single step.
 *
 * Returns a prompt that asks the model to produce one JSON object:
 *
 * {
 *   "blocks": [
 *     {
 *       "id": "b1",
 *       "type": "explain" | "code" | "check" | "task" | "hint",
 *       "title": string | null,
 *       "content": string,
 *       "language": string | null
 *     }
 *   ],
 *   "starterCode": string,
 *   "expectedAction": string,
 *   "validationNote": string
 * }
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
    slideText,
  } = context

  return `You are writing the instructional content for ONE step of a self-paced coding lesson.

The learner is studying alone.
There is no instructor, no live feedback, and no spoken explanation.
Write like a skilled course author speaking directly to a learner on a lesson page.

Course: ${courseName}
Module: ${moduleName}
Step title: ${stepTitle}
Step learning goal: ${stepGoal}
Step topics: ${stepTopics.join(', ')}
Learner level: ${learnerLevel}
Programming language: ${outputLanguage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHORING PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write like a real lesson author, not like a worksheet generator, validator, or curriculum database.

Natural learner-facing prose is more important than sounding systematic.
If a sentence sounds like assignment instructions, teacher notes, metadata, or internal planning language, rewrite it as natural lesson prose.

Prefer writing that feels comfortable to read from top to bottom on a lesson page:
- concrete
- clear
- specific
- human
- not stiff
- not generic
- not repetitive

Do NOT use placeholder phrasing such as:
- "In this step you will learn..."
- "This is an important concept..."
- "This concept is used a lot..."
- "You will use this later..."
- "Below is..."
- "Now let's..."

Start with the idea itself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate content for this step only.

Stay focused on:
- the step title
- the step goal
- the listed step topics

Do not:
- assume knowledge beyond a ${learnerLevel} learner
- add side topics that belong to later steps
- mention future lessons
- add caveats that distract from this step
- write teacher notes
- write author notes
- explain the whole module

If detail is missing, make the safest reasonable assumption based on the step goal and topics.
${slideText ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following text was extracted from the author's presentation slides for this module.
Treat it as the primary reference material for this step's content.

- Use the same terminology, examples, and teaching points as the slides.
- Adapt slide bullets into natural lesson prose — closely following the slide content is expected and appropriate.
- If the slide context and the step goal conflict, the step goal takes priority.

<slides>
${slideText}
</slides>
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RETURN FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return exactly ONE valid JSON object with these top-level keys:

{
  "blocks": [...],
  "starterCode": "...",
  "expectedAction": "...",
  "validationNote": "..."
}

Do not return markdown.
Do not wrap the JSON in code fences.
Do not include commentary before or after the JSON.
Do not include extra keys.

"blocks" must be an ordered array.
Each block must have this exact shape:

{
  "id": "b1",
  "type": "explain" | "code" | "check" | "task" | "hint",
  "title": string | null,
  "content": string,
  "language": string | null
}

Rules:
- "language" is required for code blocks and must be "${outputLanguage}".
- "language" must be null for all non-code blocks.
- IDs must be unique within this step: "b1", "b2", "b3", ...
- Keep block order intentional and readable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPIC COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every topic listed in Step topics is a coverage requirement.

Every listed topic must be addressed by at least one instructional block.
Do not silently omit a listed topic just because the block count feels high.

A step with one or two topics typically needs 3–5 blocks.
A step with three or more topics may need up to 7 blocks.
Use as many blocks as needed for clear coverage, up to 7.

Do not pad with redundant blocks.
But complete coverage is NOT padding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCK SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the instructional logic of this step, not a rigid template.

A strong step usually moves through these stages:
1. explain the idea clearly
2. show it in code
3. check understanding with one focused question
4. give the learner a lab to complete
5. optionally provide a hint if a real stuck point exists

Typical valid sequences:
- explain → code → task
- explain → explain → code → check → task
- explain → code → check → task → hint
- explain → explain → code → task
- explain → code → task → hint

Do not include a block just because a type exists.
Include a block only if it earns its place.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCK TITLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Titles must help the learner see what each block is about.

Do:
- name the specific idea in that block
- vary titles naturally across the step
- use short, clear phrases

Do not:
- repeat the step title as every block title
- use generic labels such as "What it is", "Why it matters", "Example", "Practice"
- make every title sound like a template

Good title style:
- Reading one value by key
- Adding a new entry
- Keys, values, and pairs in use
- When a tuple cannot change

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPLAIN BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "explain"

Purpose:
Teach the idea clearly.
Do not merely summarize it.

Content rules:
- Usually write 3–12 sentences.
- One explain block should teach one clear idea.
- A strong explain block usually includes at least two of these:
  - the rule
  - the behavior in code
  - the distinction from a nearby similar idea
- Explain what actually happens, not just what the concept is called.
- If nearby ideas are easy to confuse, make the difference explicit.
- State the consequence:
  what the learner can do with it, what result it produces, or what limitation it introduces.
- A brief inline code snippet is allowed when it sharpens one point.

Note:
  Visual clarification is allowed when it makes the idea easier to understand.

  You may include:
  - a simple markdown table for comparing related ideas,
  - or a small plain-text diagram for positions, structure, flow, or before/after state.
  - a bullet list when a set of items is clearer as a list than as prose.

  Bullet list format rules (required):
  - Each item must be on its own line starting with "- ".
  - The list must be separated from surrounding prose by a blank line above and below.
  - Do not embed a bullet list inside a prose sentence.

  Use these only when they genuinely clarify the concept better than prose alone.
  Do not add a table or diagram just for decoration.
  Keep them compact and easy to read inside a lesson page.

Depth check:
- If the block could be reduced to a glossary entry without losing meaning, it is too shallow.
- If the learner could read the block and still not know when to use the idea, it is too shallow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "code"
Language: "${outputLanguage}"

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

Good code blocks feel like:
- a clean example worth reading
- not a dump of syntax
- not a mini lab
- not pseudo-code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "check"

Purpose:
Give the learner one short reasoning check before the lab.

Title:
- Use a natural, specific title.
- Do not use "Quick trace".
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

The "→ " separator is required. It is used by the UI to split the question from the hidden answer and show a reveal button.

A check block may be omitted if there is no genuinely useful non-obvious question for this step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "task"
Title: always "Lab"

Purpose:
The middle pane Lab block is a brief learner-facing lab objective.

Content rules:
- Write the Lab block as natural learner-facing prose.
- Keep it concise, usually 2–4 sentences.
- It should read like a small coding objective or scenario, not an assignment sheet.
- Explain:
  - what the learner is trying to accomplish,
  - what idea the lab is practicing,
  - and what a correct result should look like.
- State the goal, not the procedure.
- Do not write numbered steps.
- Do not mention line numbers, TODO markers, or exact code to type.
- Do not overuse procedural wording like:
  "find", "replace", "run", "confirm", "first", "second", "third"
  unless absolutely necessary.

A good Lab block sounds like:
- a small coding scenario
- a natural objective
- a brief result-oriented description

Not like:
- a checklist
- a worksheet instruction list
- a solution plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HINT BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: "hint"

Purpose:
Offer a useful nudge only when there is a real likely stuck point.

Rules:
- Hint blocks are optional.
- Include one only if the learner is likely to get stuck in a specific way.
- The hint should point to the right idea without giving away the answer.
- It must not say "look above", "review the example", or "read the instructions again".
- It should give a fresh angle on the exact stuck mechanic.

The hint title is the collapsed label.
Use a natural learner-facing label such as:
- Need a hint?
- Not sure which method fits?
- Unsure what should change?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STARTER CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The starterCode is the learner's work area.

It should provide enough local orientation for the learner to begin confidently,
without turning the code pane into a step-by-step solution guide.

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
   Do not spell out the full answer line by line unless exact formatting is the actual learning target.
7. Avoid over-directing the learner.
   Do not write comments like:
   - first line do this
   - second line do that
   - replace this TODO with ...
   - call method X here
   unless that exact sequence is itself the point of the lesson.
8. Do not include near-solution code or commented-out answer code.

Good starter code feels like:
- one coherent little work area
- enough context to begin
- enough freedom that the learner still has to make the key choice

Bad starter code feels like:
- a worksheet
- three mini tasks
- a disguised answer key

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPECTEDACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"expectedAction" is NOT shown to the learner.
It is an internal concise description of what the learner must do.

Rules:
- Write exactly one concrete sentence.
- Refer to the actual action needed to complete the lab.
- Be specific to this step.
- Do not write vague text like "Complete the lab" or "Finish the task".

Example style:
- Add one new dictionary entry, remove one old entry, and print the title plus the final dictionary.
- Use a slice to read the middle values and an index to read the first value.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATIONNOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"validationNote" is NOT shown to the learner.
It is for internal validation.

Rules:
- Write 1–2 sentences.
- Describe what a correct completed starterCode should produce or do.
- Name one common wrong approach to watch for when useful.
- Be specific to this step.
- Do not write generic validator language.

Example style:
- Correct code should print the movie title first, then the updated dictionary containing title, year, and genre but no rating. A common mistake is deleting the wrong key or printing the dictionary before applying the update.
- Correct code should use the dictionary method that returns pairs, not only keys or only values.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSISTENCY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All parts of the response must agree with each other.

- The Lab block, starterCode, expectedAction, and validationNote must describe the same exercise.
- The starterCode must support the Lab objective directly.
- The code example must teach the same step the lab is practicing.
- The check block should test understanding of a real confusion point from this step.
- The expected output/result described in the Lab block must match the starterCode's Expected comment.
- The lab objective must be achievable by editing only the TODO area in starterCode.
- The learner should not need hidden setup or implied missing code outside starterCode.
- Keep the difficulty appropriate for a ${learnerLevel} learner.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL QUALITY BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before you finalize the JSON, silently check:

- Does this read like a real lesson page, not a content template?
- Do the explain blocks actually teach?
- Are all listed step topics covered?
- Does the code example feel real?
- Does the check block make the learner think?
- Does the Lab block sound natural?
- Does the starterCode guide without giving away the answer?
- Are expectedAction and validationNote specific rather than generic?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return only the JSON object.
No markdown.
No code fences.
No commentary.
No extra keys.
No trailing commas.
Ensure the JSON is valid and parseable.`
}