# Branch Handoff — `feature/block-based-screen2`

**Latest checkpoint commit:** `421cd1d` (Session 14 — prompt quality + UI refinements)
**Branch base:** `main` at `95a128e` (Session 12 — Screen 2 AI generation wired)
**Last updated:** 2026-03-18 (Session 14)

This document is the working handoff for this experimental branch.
It is **not** a whole-project handoff — for project-wide context see `docs/session_handoff.md` on `main`.

---

## 1. Branch Purpose

### Why this branch was created

`main` implements Screen 2 as a set of fixed named fields per step:
`concept`, `codeExample`, `instructions`, `hint`, `expectedAction`, `validationNote`, `starterCode`.

This is a flat-field model. It works for a simple first pass but it has a structural problem:
the lesson content is a bag of named slots, not an ordered teaching sequence.
The author fills in boxes; the learner reads them in a fixed layout.
There is no way to interleave explanation and example, or to place a quick check between two explanations.

### What product/design problem it is solving

The target experience is a **guided, interleaved lesson flow**:

> explain a small idea → show a small example → ask a quick check → continue with the next idea

The flat-field model cannot represent this. A step that needs two explanations with an example
between them has nowhere to put the second explanation except by cramming it into `concept`.

This branch replaces the flat-field content model with an **ordered sequence of blocks** —
one per teaching unit — so the author can compose a lesson step as a genuine instructional sequence
rather than a form with fixed slots.

---

## 2. Current Implementation Status

### Phase A — Block-based view mode (complete, verified)

- `blocks` added as a passthrough field in `normalizeContent()` — defaults to `[]` if absent
- `LessonStepView` branches on `step.blocks?.length > 0`:
  - If blocks present → renders `BlocksView` (block-based renderer)
  - If blocks absent → original flat-field prose rendering (unchanged)
- `BlocksView` maps the blocks array to `Block` components, dispatching on `type`
- Five block types rendered distinctly in view mode:
  - `explain` — prose paragraphs, optional heading
  - `code` — dark monospace pre block
  - `task` — blue-tinted card with action steps; title always defaults to "Lab"
  - `check` — amber-accented question card with hidden solution, revealed on click
  - `hint` — collapsible `<details>` block, optional summary label

### Phase B — Block-based edit mode (complete, verified)

- `BlockEditor.jsx` handles edit mode for block steps
- `LessonAuthoringView` branches in edit mode:
  - `step.blocks?.length > 0` → `<BlockEditor>`
  - otherwise → `<InstructionPanelEditor>` (flat-field editor, unchanged)
- Per block card: type badge (read-only), optional title input, content textarea, delete button
- `code` blocks additionally show a `language` text input
- `hint` blocks label the title field as "Collapsed label (optional)"
- Add Block row: five small buttons `[+ Explain] [+ Code] [+ Check] [+ Task] [+ Hint]`
  - New `code` blocks default `language` to `'python'`
  - New blocks append at the bottom
- Delete: × button on each card, immediate (Cancel restores)
- Save/Cancel: uses existing `editSnapshot` flow

### Phase C — AI-generated blocks (complete, real AI path verified)

- `mockGenerateContent` in `server/index.js` returns `{ blocks: [...], starterCode, expectedAction, validationNote }`
- `generateContentPrompt.js` completely rewritten with block contract + quality standards
- `normalizeContent` in `lessonContentService.js` passes through `blocks`
- `parseContentResponse` in `server/index.js` is permissive — no changes needed
- **Real AI path (USE_MOCK=false) verified** — tested with GPT before Session 13

### Phase D — UI polish and cross-browser fixes (completed in Session 13)

Independent panel scrolling, "Lab" panel label, code formatting in check/explain/hint blocks,
Safari blank-area CSS fix, Chrome code-flattening heuristic fix. All stable. Do not re-investigate.

### Phase E — Prompt quality and UI refinements (completed in Session 14)

See §5 for full details.

### What is verified vs. what is not

| Behavior | Verified? | How |
|---|---|---|
| Block view mode renders all 5 types | Yes | Manual test with injected data |
| hint collapses/expands | Yes | Manual test |
| check block solution hidden by default | Yes | Visual |
| check block solution revealed on click | Yes | Visual |
| check solution state isolated per step | Yes | Fix applied (step-scoped key) |
| task block title defaults to "Lab" | Yes | Visual |
| block heading: black, normal case, 13px | Yes | Visual |
| BlockEditor opens for block steps | Yes | Manual test with injected data |
| Field editing, dirty dot, Save, Cancel | Yes | Manual test |
| Add block / Delete block | Yes | Manual test |
| Flat-field fallback unaffected | Yes | Manual test |
| Mock path returns block shape end-to-end | Yes | Generated lesson with USE_MOCK=true |
| Real AI path returns block shape | Yes | Tested with GPT before Session 13 |
| Topic coverage prompt rule (≥1 block per topic) | Code only | Needs real-AI generation to verify |
| Lab/check role split (prose objective, solution toggle) | Code only | Needs real-AI generation to verify |
| Starter code: TODO + Expected format | Code only | Needs real-AI generation to verify |
| `expectedAction` / `validationNote` quality | **Not yet** | No dedicated prompt quality section written yet |
| Independent panel scrolling | Yes | Verified after Session 13 layout fix |
| Code formatting inside check/explain/hint blocks | Yes | Verified Chrome and Safari after Session 13 |
| Cross-browser layout (Safari blank area) | Yes | Confirmed fixed after Session 13 |

---

## 3. Current Prompt Status

**File:** `server/prompts/generateContentPrompt.js`

The master prompt produces:

```json
{
  "blocks": [...],
  "starterCode": string,
  "expectedAction": string,
  "validationNote": string
}
```

The old flat fields (`concept`, `codeExample`, `instructions`, `hint`) are gone from the prompt contract.
`starterCode`, `expectedAction`, and `validationNote` remain as top-level fields (not blocks).

### Prompt structure

The prompt has five sections in this order:

1. **Scope, voice, and pedagogical framing** — learner context, scope constraints, voice rules
2. **JSON contract** — block shape definition, top-level keys
3. **Quality standards by block type** — eight sub-sections (see below)
4. **Consistency rules** — cross-field coherence requirements
5. **Output rules** — JSON formatting, no fences, no extra keys

### Quality sub-sections and their key intentions

| Sub-section | Key intention |
|---|---|
| Topic and step phrasing | Prevent mechanical repetition of step title across blocks and titles |
| Block sequence | Every topic in stepTopics must be covered by ≥1 explain or code block; block ceiling is 7 for multi-topic steps; "do not pad" means redundant blocks only |
| Explain blocks | Titles must name a specific idea; name the mechanism not just the concept; one idea per block |
| Code blocks | Real variable names and values; demonstrate one mechanic; comments only where they clarify; exact output on print lines |
| Check blocks | Apply not recall; code-snippet question strongly preferred; answer hidden behind "Solution" button; omit if no genuinely non-obvious question |
| Task blocks | Title always "Lab"; content is a prose problem statement (goal + concept + expected result), not numbered steps; implementation detail lives in starterCode |
| Hint blocks | Title optional; name the specific stuck mechanic; give a new angle, not "re-read above" |
| Starter code | Two-line TODO format: `# TODO:` + `# Expected:`; inline orientation comments allowed (name situation, not answer); matched to lab objective not task steps |

### Prompt wording changes made in Session 14

| Location | Change | Why |
|---|---|---|
| BLOCK SEQUENCE — rules | Added: every stepTopic is a coverage requirement; block ceiling raised to 7 for 3+ topics; "padding" redefined as redundant-only | Model was silently omitting topics to stay within old 3–5 block ceiling |
| TASK BLOCKS — title | `"Your turn" / "Now write it" / "Lab task"` → always `"Lab"` | Fixed label, no model variation |
| TASK BLOCKS — content | Replaced 8-rule numbered-steps format with prose problem-statement format | Middle pane should state the goal, not micromanage implementation |
| STARTER CODE — Rule 1 | "must match the task block steps exactly" → "must support the lab objective" | Decoupled from task block being a step list |
| STARTER CODE — Rule 2 | Single `# TODO:` → two-line `# TODO:` + `# Expected:` | Success criterion now lives in the code panel where the learner is working |
| STARTER CODE — Rule 4 | "do not include commented-out hints" → allow orientation comments (name situation, not answer) | Right pane now carries local implementation guidance |
| STARTER CODE — Rule 5 | "same output shown in task block's verification step" → "same output shown in TODO's Expected line" | Task block no longer has a verification step |
| CONSISTENCY RULES | "task block steps must be completable" → "lab objective must be achievable" | Language consistency with new task block role |

### Known prompt weaknesses — still open

- **`expectedAction` and `validationNote`** have no dedicated quality sub-section.
  The consistency rules constrain them, but the model still produces generic content.
  This is the highest-priority prompt improvement remaining.
- **Screen 1 step granularity** — the structure prompt still allows/encourages multi-topic
  `coveredSubtopics` arrays (2–5 items from one input line) without guidance on keeping them
  narrow enough for Screen 2 to cover. The coverage rule (≥1 block per topic) helps but does
  not prevent steps with 5+ topics from generating an unwieldy block sequence.

---

## 4. UI State (as of Session 14)

| Element | State | Where |
|---|---|---|
| Right panel header | "Lab" | `LessonAuthoringView.jsx` ~line 143 |
| Block heading style | Black (#000), 13px, normal case | `App.css` `.block-heading` |
| Task block title default | "Lab" (hardcoded fallback in view) | `LessonAuthoringView.jsx` task renderer |
| Check block solution | Hidden by default; revealed on "Solution" button click | `CheckBlock` component in `LessonAuthoringView.jsx` |
| Check block solution state isolation | Per-step (block key is `step.id-block.id`) | `BlocksView` in `LessonAuthoringView.jsx` |
| `starter_code.py` filename badge | Unchanged — still says `starter_code.py` | Not requested |

**Note:** The mock data in `mockGenerateContent` (`server/index.js`) still uses anti-pattern
titles like "What it is" and "Why it matters". This is intentional — the mock is a low-quality
baseline placeholder, not representative of real AI output. Do not use mock output to evaluate
content quality.

---

## 5. Session 14 Changes — Full Record

### 5a. Block sequence coverage requirement

**Problem diagnosed:** `stepTopics` was passed as background context only. The model silently
omitted listed topics to stay within the "3–5 blocks, do not pad" ceiling.

**Fix in `generateContentPrompt.js` — BLOCK SEQUENCE rules:**
- Added: every topic in "Step topics" is a coverage requirement — at least one explain or
  code block must address it
- Block ceiling: raised from 5 to 7 for steps with 3+ topics
- "Do not pad" redefined: padding = restating a fully-covered topic OR adding blocks to hit
  a count. Covering all listed topics is not padding.

**File:** `server/prompts/generateContentPrompt.js`

---

### 5b. Task block / Starter code role split

**Problem diagnosed:** Task block content was a numbered implementation checklist
("Find the variable greeting. Replace the TODO. Run the code.") which overlapped with the
code panel's role and micromanaged implementation detail. Starter code had no local guidance
because Rule 4 prohibited orientation comments.

**Intended role split:**
- Middle pane (task block) = lab objective: what the learner is trying to accomplish,
  what concept the lab practices, what success looks like
- Right pane (starter code) = local implementation guidance through TODO comments and
  inline orientation comments

**Prompt changes in `generateContentPrompt.js`:**
- TASK BLOCKS title: always "Lab" — no model variation
- TASK BLOCKS content: replaced numbered-steps format with prose problem-statement format
  (goal + concept + expected result in 2–4 natural sentences, no step micromanagement)
- STARTER CODE section: fully rewritten with 8 rules + quality bar:
  - Rule 1: align to lab objective (not task step list)
  - Rule 2: brief orientation comments only — describe situation, not solution
  - Rule 3: prefer one coherent TODO; don't split into mini-exercises
  - Rule 4: do not name the exact method/operator/expression when choosing it is the exercise
    (e.g. "# TODO: inspect this dictionary in three ways" not "# TODO: print .keys(), .values()")
  - Rule 5: TODO + Expected two-line format
  - Rule 6: Expected describes outcome shape, not full solution line-by-line
  - Rule 7: no over-directing ("first line do this, second line do that")
  - Rule 8: no giveaway hints or commented-out solution code
  - Quality bar: learner must still make the key coding choice; if they can copy the comment into code with no decision, it's too explicit
- CONSISTENCY RULES: "task block steps" → "lab objective"

**File:** `server/prompts/generateContentPrompt.js`

---

### 5c. Block heading style

**Problem:** Block title labels were all-caps, light grey, and too small (10.5px).

**Fix in `App.css`:**
- Removed `text-transform: uppercase`
- `color` changed from `var(--color-text-muted)` to `#000`
- `font-size` increased from `10.5px` to `13px`

**File:** `src/App.css`

---

### 5d. Check block — solution hidden by default

**Problem:** The check block rendered the full content including the `→ answer` inline.
The learner had no opportunity to think before seeing the answer.

**Fix:** Introduced `CheckBlock` sub-component in `LessonAuthoringView.jsx`:
- Splits content on `\n→ ` — question goes above, answer goes below
- Answer is hidden by default
- "Solution" button toggles visibility; label changes to "Hide solution" when open
- Styled in the amber check-block palette
- Safe fallback: if content has no `→`, renders the full `segments` without a button

**New CSS classes:** `.check-solution`, `.check-solution-btn`, `.check-solution-text`

**Files:** `src/components/LessonAuthoringView.jsx`, `src/App.css`

---

### 5e. Check block solution state isolated per step

**Problem:** Block components were keyed by `block.id` only (e.g. "b1", "b2"). Block IDs
repeat across steps, so React reused component instances when navigating between steps —
causing the `revealed` state to leak from one step to the next.

**Fix in `BlocksView`:** Key changed from `block.id` to `` `${step.id}-${block.id}` ``.
React now re-mounts each block on step navigation, resetting `revealed` to `false`.

**File:** `src/components/LessonAuthoringView.jsx`

---

### 5f. Task block title defaults to "Lab"

**Problem:** Task block title was conditionally rendered — if the AI returned `null` or
omitted the title, no heading appeared. The prompt says always use "Lab", but UI should
not silently drop it if the model doesn't comply.

**Fix:** Changed `{title && <div className="block-heading">{title}</div>}` in the task
renderer to always render `<div className="block-heading">{title || 'Lab'}</div>`.

**File:** `src/components/LessonAuthoringView.jsx`

---

## 6. Files Changed in Session 14

| File | What changed |
|---|---|
| `server/prompts/generateContentPrompt.js` | Block sequence coverage rule; task block role rewrite (prose objective); starter code section fully rewritten (8 rules + quality bar: anti-spoiler guidance, TODO+Expected format, orientation-not-solution comments) |
| `src/components/LessonAuthoringView.jsx` | `CheckBlock` sub-component added (hidden solution + toggle); task block title defaulted to "Lab"; block key changed to `step.id-block.id` |
| `src/App.css` | `.block-heading` style (no uppercase, black, 13px); `.check-solution`, `.check-solution-btn`, `.check-solution-text` added |

No changes to: `BlockEditor.jsx`, `InstructionPanelEditor.jsx`, `App.jsx`, `server/index.js`,
`lessonContentService.js`, `server/lib/`, `generateStructurePrompt.js`.

---

## 7. What Is Intentionally Not Implemented Yet

| Feature | Status |
|---|---|
| `expectedAction` / `validationNote` quality rules | **Highest-priority next prompt task.** No dedicated quality sub-section. Model produces generic content. |
| Screen 1 step granularity | Structure prompt still allows multi-topic steps (2–5 coveredSubtopics from one input line). Coverage rule helps but doesn't prevent unwieldy sequences. |
| Lab single-TODO limitation | One TODO = one mechanic. Multi-topic steps cannot be fully exercised in the Lab. Product decision needed. |
| Fresh real-AI generation to validate Session 14 prompt changes | All Session 14 prompt changes are code-only. Not yet tested against real GPT output. |
| Block reordering (↑/↓ or drag) | Out of scope. Delete + re-add is the workaround. |
| Type switching on an existing block | Out of scope. Type is fixed once set. Delete + re-add. |
| Convert flat fields → blocks | Designed but not built. Not the primary path. |
| Block-level dirty tracking | Step-level dirty dots work; no per-block granularity. |
| Language dropdown/autocomplete | Plain text input only. |
| Block insertion at a specific position | Add always appends at bottom. |
| `check` blocks are not interactive | Renders as a question card. No learner response mechanism. |
| File header comment in `generateContentPrompt.js` | Still describes old flat-field contract. Update once stable commit is made. |
| `starter_code.py` filename badge | Still says `starter_code.py`. Not requested. |

---

## 8. Recommended Next Steps

### Do not re-investigate — already confirmed

- Real AI path works. USE_MOCK=false + real API key produces valid block-shaped JSON.
- Independent panel scrolling works in both Chrome and Safari.
- Code formatting inside `check`/`explain`/`hint` blocks works in both Chrome and Safari.
- Safari blank-area and Chrome code-flattening issues are resolved.
- Check block solution toggle is isolated per step.

### Next session priorities

**1. Run a fresh real-AI generation and evaluate Session 14 prompt changes**

This is the gating task before any further prompt work. Generate 2–3 steps across different
topic counts and evaluate:
- Does a step with 3+ topics produce blocks that cover all listed topics?
- Does the task block read as a prose objective or does it still produce numbered steps?
- Does the starterCode include `# Expected:` on the TODO line?
- Does the starterCode include orientation comments, not hints?

**2. Add a quality sub-section for `expectedAction` and `validationNote`**

These two fields have no dedicated quality guidance. The model produces generic content.
Insert a new sub-section between the Hint sub-section and Consistency rules.

Intended behavior:
- `expectedAction`: one concrete sentence describing what the learner must do to pass.
  Must reference the specific TODO or action, not just "complete the task."
- `validationNote`: internal guidance — what the correct completed starterCode looks like
  AND the one most common wrong approach to watch for.

**3. Evaluate Screen 1 step granularity**

The structure prompt says "one step per sub-topic line" but generates `coveredSubtopics`
arrays with 2–5 items from a single input line. The coverage rule (≥1 block per topic)
now enforces coverage, but 5-topic steps are still potentially too wide for a single
block sequence and a single-TODO lab. Options:
- Add guidance to the structure prompt to keep `coveredSubtopics` to ≤3 items per step
- Provide product guidance on when to split a broad topic into multiple steps

---

## 9. Re-injecting Test Data (Manual Block Testing)

If you need to test Phase A/B rendering without the real AI path, paste this in the browser
console after generating a lesson and saving a draft:

```js
const key = 'spl_lesson_draft'
const draft = JSON.parse(localStorage.getItem(key) || '{}')

if (!draft.lessonContent?.length) {
  console.error('No lesson content in draft. Generate content, Save Draft, then run this.')
} else {
  draft.lessonContent[0] = {
    ...draft.lessonContent[0],
    blocks: [
      { id: 'b1', type: 'explain', title: 'The f prefix and what it tells Python',
        content: 'An f-string lets you embed a variable directly inside a string — no concatenation needed.\n\nPut an f before the opening quote, then wrap any variable name in {}.' },
      { id: 'b2', type: 'code', language: 'python',
        content: 'name = "Ada"\nage = 35\n\ngreeting = f"My name is {name} and I am {age} years old."\nprint(greeting)\n# My name is Ada and I am 35 years old.' },
      { id: 'b3', type: 'check', title: 'Quick check — what does this print?',
        content: 'What would this print?\n\n  city = "Rome"\n  print(f"I love {city}!")\n\nThink about it, then check.\n→ I love Rome!' },
      { id: 'b4', type: 'explain', title: 'Beyond variables',
        content: 'The {} in an f-string can hold any Python expression — not just a variable name.\n\nThe expression is evaluated at runtime and the result is inserted into the string.' },
      { id: 'b5', type: 'task', title: 'Lab',
        content: 'Your job is to build a formatted greeting using an f-string that combines a name and a city. The lab exercises embedding two variables in a single string expression. When the code runs correctly, it will print: Hello, Ada from Rome' },
      { id: 'b6', type: 'hint',
        content: 'You can call .upper() directly inside the {} — no intermediate variable needed.' }
    ]
  }
  localStorage.setItem(key, JSON.stringify(draft))
  console.log('Done. Refresh — Step 1 now uses block mode.')
}
```

---

## 10. Architecture Decisions (Unchanged)

### Block shape

```js
{
  id       : string,               // e.g. "block-1747382400000-2"
  type     : 'explain' | 'code' | 'check' | 'task' | 'hint',
  title   ?: string,               // optional heading/label
  content  : string,               // prose, code, question, or action steps
  language?: string,               // code blocks only; e.g. 'python'
}
```

### Why `starterCode` stays as a top-level field

`starterCode` is not instructional content — it is the code the learner works in (right panel editor).
It is structurally different: always exactly one per step, always shown in the code panel, always editable.
Promoting it to a block would break the panel layout without any benefit. It stays top-level.

### Why blocks are additive (not replacing flat fields immediately)

The flat-field model is still coerced in `normalizeContent` — missing fields become empty strings.
`blocks.length > 0` acts as the mode selector. Flat-field mode remains the fallback for any step
that arrives without blocks. The two modes are isolated.

### Check block solution format (as of Session 14)

The prompt instructs the model to write check block content as:

```
question text

→ answer text
```

The `CheckBlock` component in `LessonAuthoringView.jsx` splits on `\n→ ` to separate question
from answer. Everything before `\n→ ` renders as the visible question; everything after is
hidden until the learner clicks "Solution". If no `→` is present, the full content renders
without a button.

### Task block / Starter code role split (as of Session 14)

```
Middle pane (task block):  lab objective — goal, concept, expected result (prose, 2–4 sentences)
Right pane (starter code): local guidance — # TODO: action / # Expected: output / orientation comments
```

The task block no longer contains implementation steps. Local detail lives in the starterCode.

---

## 11. Safe Rollback Note

To return to the stable `main` branch at any time:

```bash
git checkout main
```

`main` is at `95a128e` (Session 12 — Screen 2 AI generation wired, fully functional on the flat-field model).
No changes from this branch have been merged to `main`.
All block-related work is isolated to `feature/block-based-screen2`.

**What `main` represents relative to this branch:**
- `main` has a fully working Screen 2 with flat-field AI generation (real OpenAI path verified)
- `main` has no block infrastructure — no `BlockEditor`, no `BlocksView`, no block prompt
- Returning to `main` gives you a stable, tested product; returning to this branch resumes block work

The latest committed checkpoint on this branch is:

```
421cd1d  update prompts for starter code
```
