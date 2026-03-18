# Branch Handoff — `feature/block-based-screen2`

**Latest checkpoint commit:** `247b609` (no new commits this session — all changes are in working tree, uncommitted)
**Branch base:** `main` at `95a128e` (Session 12 — Screen 2 AI generation wired)
**Last updated:** 2026-03-18 (Session 13)

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
  - `task` — blue-tinted card with action steps
  - `check` — amber-accented question card
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
- **Mock path verified end-to-end**
- **Real AI path (USE_MOCK=false) verified** — tested with GPT before Session 13. The real AI path
  returns a valid block-shaped response and renders correctly.

### Phase D — UI polish and cross-browser fixes (completed in Session 13)

See §5 for full details. All issues found in this phase are resolved.

### What is verified vs. what is not

| Behavior | Verified? | How |
|---|---|---|
| Block view mode renders all 5 types | Yes | Manual test with injected data |
| hint collapses/expands | Yes | Manual test |
| BlockEditor opens for block steps | Yes | Manual test with injected data |
| Field editing, dirty dot, Save, Cancel | Yes | Manual test |
| Add block / Delete block | Yes | Manual test |
| Flat-field fallback unaffected | Yes | Manual test |
| Mock path returns block shape end-to-end | Yes | Generated lesson with USE_MOCK=true |
| Real AI path returns block shape | **Yes** | Tested with GPT before Session 13 |
| Real AI content quality (titles, checks, tasks) | Partially observed | Saw real output; targeted prompt tweaks made |
| Independent panel scrolling | Yes | Verified after Session 13 layout fix |
| Code formatting inside check/explain/hint blocks | Yes | Verified in Chrome and Safari after Session 13 |
| Cross-browser layout (Safari blank area) | Yes | Confirmed fixed; was cache in normal mode, clean in private |
| `expectedAction` / `validationNote` quality | **Not yet** | No dedicated prompt quality section written yet |

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
| Topic and step phrasing | Prevent mechanical repetition of the step title across blocks and titles |
| Block sequence | Use instructional logic, not a fixed template; don't pad; omit optional blocks when not needed |
| Explain blocks | Titles must name a specific idea (not "What it is"); name the mechanism, not just the concept; one idea per block |
| Code blocks | Real variable names and values; demonstrate one mechanic; comments only where they clarify; exact output on print lines |
| Check blocks | Apply not recall; code-snippet question strongly preferred; 1–2 sentence answer; omit if no genuinely non-obvious question |
| Task blocks | Steps must reference named starterCode elements; final step usually a verification with exact output; no stock opener |
| Hint blocks | Title optional; name the specific stuck mechanic; give a new angle, not "re-read above" |
| Starter code | Must match task steps exactly; single TODO; real variable values; deterministic output |

### Prompt wording changes made in Session 13

| Location | Old wording | New wording | Why |
|---|---|---|---|
| Check block title Good-examples (line ~222) | `"Quick trace — what does this print?"` | `"Quick check — what does this print?"` | "Quick trace" felt too technical; "Quick check" is more learner-friendly |
| Task block title Good-examples (line ~264) | `"Complete the starter code"` | `"Lab task"` | Coupled too tightly to one exercise type; "Lab task" works for any practice type |

### Known prompt weaknesses — still open

- **`expectedAction` and `validationNote`** have no dedicated quality sub-section.
  The consistency rules constrain them, but the model may still produce generic content.
  This is the highest-priority prompt improvement remaining.

---

## 4. UI Wording State (as of Session 13)

| Element | Old label | New label | Where |
|---|---|---|---|
| Right panel header | "Starter Code" | "Lab" | `LessonAuthoringView.jsx` line ~143 |
| Task block title guidance (prompt) | "Complete the starter code" | "Lab task" | `generateContentPrompt.js` line ~264 |
| Check block title guidance (prompt) | "Quick trace" | "Quick check" | `generateContentPrompt.js` line ~222 |

**Note:** The mock data in `mockGenerateContent` (`server/index.js`) still uses anti-pattern
titles like "What it is" and "Why it matters". This is intentional — the mock is a low-quality
baseline placeholder, not representative of real AI output. Do not use mock output to evaluate
content quality.

---

## 5. Session 13 Changes — Full Record

### 5a. Independent panel scrolling fix

**Problem:** In view mode, both the Instructions pane and the Lab (starter code) pane shared a
single page scroll. The user had to scroll the whole page to read the task, then scroll back up
to see the starter code.

**Root cause:** A `.authoring-main.view-mode` CSS block intentionally set `overflow-y: auto` on
the main container and `overflow: visible` on both panel bodies — collapsing them to natural height
so everything scrolled together.

**Fix:**
- Removed the entire `.authoring-main.view-mode` CSS block from `src/App.css`
- Removed the `view-mode` conditional class from `<main>` in `LessonAuthoringView.jsx`
- The base CSS already had the correct structure: `.panel` has `overflow: hidden`,
  `.panel-body` / `.panel-body-code` have `flex: 1; overflow-y: auto` — this gives independent
  scrolling in both edit and view modes without any special-case override.

**Files:** `src/App.css`, `src/components/LessonAuthoringView.jsx`

---

### 5b. Label rename: "Starter Code" → "Lab"

**Problem:** The right panel label "Starter Code" was too narrow. The right panel is the
learner's work area, not just a snippet.

**Fix:** Changed `"Starter Code"` → `"Lab"` at `LessonAuthoringView.jsx` line ~143 (the
`panel-title-code` span in the right panel header). One-line change.

**Note:** The filename badge `starter_code.py` in the same header was intentionally left
unchanged — not requested.

**File:** `src/components/LessonAuthoringView.jsx`

---

### 5c. Prompt wording: task title and check title

**Problem:** "COMPLETE THE STARTER CODE" appeared as the AI-generated task block title.
"QUICK TRACE" appeared as the AI-generated check block title. Both felt awkward.

**Root cause:** Both titles were AI-generated, not hardcoded UI text. The prompt's Good-examples
list in the check and task quality sub-sections included these exact phrases. The model follows
the examples literally.

**Fix:** Updated two Good-example strings in `server/prompts/generateContentPrompt.js`:
- Check title: `"Quick trace — what does this print?"` → `"Quick check — what does this print?"`
- Task title: `"Complete the starter code"` → `"Lab task"`

**File:** `server/prompts/generateContentPrompt.js`

---

### 5d. Code formatting inside instructional blocks

**Problem:** Code snippets embedded inside `check` block content (and potentially `explain`,
`hint`) were rendering as flat inline text — line breaks and indentation lost.

**Root cause:** The `paragraphs` renderer in the `Block` component split content on `\n\n` and
wrapped every chunk in `<p>`. HTML `<p>` does not preserve `\n` or leading whitespace, so
`city = 'Rome'\nprint(city)` rendered as one flat sentence.

**Fix in `LessonAuthoringView.jsx`:** Replaced `paragraphs` with `segments` — a smarter renderer
that inspects each `\n\n`-separated chunk before deciding how to render it:
- If any line in the chunk starts with whitespace → `<pre class="block-inline-code">` (indented code)
- If the chunk is multi-line AND starts with a lowercase letter → `<pre class="block-inline-code">` (unindented code; prose paragraphs always start with capital or digit)
- Otherwise → `<p>` (prose)

Applied to `explain`, `check`, and `hint` block types (all three used the old `paragraphs` helper).
The `task` block uses the separate `lines` renderer (unchanged).

**Fix in `App.css`:** Added `.block-inline-code` CSS class — dark monospace styling (same palette
as `.block-code`), `white-space: pre`, `overflow-x: auto`, `max-width: 100%`, `box-sizing: border-box`.

**Files:** `src/components/LessonAuthoringView.jsx`, `src/App.css`

---

### 5e. Cross-browser layout fix — Safari blank left area

**Problem:** In Safari (normal mode), a large blank area appeared on the left side of the page.
Chrome was unaffected. The blank area appeared across Screen 2 and also in the Builder (Screen 1),
confirming it was a layout-level issue, not content-specific.

**Root cause:** Safari does not reliably compute `overflow-x` from `overflow-y` alone.
The CSS spec says setting `overflow-y: auto` on an element should compute `overflow-x` to `auto`
as well, but Safari leaves `overflow-x: visible` when only `overflow-y` is specified.

Both `.panel-body` and `.panel-body-code` had only `overflow-y: auto` — no explicit `overflow-x`.
This allowed `<pre>` elements with `white-space: pre` (specifically the `code-pre` in the right
panel when starter code had long lines) to expand horizontally beyond their containers. Safari
then extended the page's scrollable area, causing the viewport to appear shifted right, which
looks like a blank area on the left.

The initial fix added `overflow-x: hidden` only to `.panel-body` (left/instruction panel),
missing `.panel-body-code` (right/code panel) — which is where the long-line `<pre>` was
actually escaping. That is why the first fix didn't work in normal-mode Safari.

**Fixes:**
- Added `overflow-x: hidden` to `.panel-body` (covers instruction panel)
- Added `overflow-x: hidden` to `.panel-body-code` (covers code panel — the actual escape point)
- Added `max-width: 100%; box-sizing: border-box` to `.block-inline-code` (inline code pre)
- Added `max-width: 100%; box-sizing: border-box` to `.code-pre` (read-only starter code view)

**Verification:** Confirmed fixed in Safari private mode immediately. Normal-mode Safari showed
the issue persisting — confirmed to be a browser cache issue (old CSS cached). Hard refresh
(`Cmd+Option+R`) or clearing the cache resolves it. The code is correct.

**File:** `src/App.css`

---

### 5f. Cross-browser code rendering — Chrome flattened code

**Problem:** On some generated steps, the code snippet inside the `check` block appeared
flattened in Chrome (rendered as `<p>`, no line breaks) while looking correct in Safari.

**Root cause:** The detection heuristic `chunk.split('\n').some(line => /^\s/.test(line))`
only fires when the AI produces indented code (leading whitespace on any line). The model
sometimes generates unindented code — e.g., `city = 'Rome'\nprint(city)` with no leading
spaces. When that happens, `/^\s/` returns false and the chunk falls through to `<p>`.
The AI happened to produce indented code in one browser session and unindented in the other,
making it appear browser-specific.

**Fix:** Extended the detection to also check for multi-line content whose first character is
a lowercase letter or underscore (`/^[a-z_]/`). Prose paragraphs always open with a capital
letter. Code identifiers and keywords always start lowercase. This covers unindented code
without requiring language-specific keyword lists.

**File:** `src/components/LessonAuthoringView.jsx`

---

## 6. Files Changed in Session 13

| File | What changed |
|---|---|
| `src/components/LessonAuthoringView.jsx` | Removed `view-mode` class; "Starter Code" → "Lab"; replaced `paragraphs` helper with `segments` (code-aware renderer); extended code detection heuristic for unindented code |
| `src/App.css` | Removed `.authoring-main.view-mode` CSS block; added `.block-inline-code` class; added `overflow-x: hidden` to `.panel-body` and `.panel-body-code`; added `max-width: 100%` + `box-sizing: border-box` to `.block-inline-code` and `.code-pre` |
| `server/prompts/generateContentPrompt.js` | Check block title example: "Quick trace" → "Quick check"; task block title example: "Complete the starter code" → "Lab task" |

No changes to: `BlockEditor.jsx`, `InstructionPanelEditor.jsx`, `App.jsx`, `server/index.js`,
`lessonContentService.js`, `server/lib/`.

---

## 7. What Is Intentionally Not Implemented Yet

| Feature | Status |
|---|---|
| `expectedAction` / `validationNote` quality rules | **Highest-priority next prompt task.** No dedicated quality sub-section yet. |
| Block reordering (↑/↓ or drag) | Out of scope. Delete + re-add is the workaround. |
| Type switching on an existing block | Out of scope. Type is fixed once set. Delete + re-add. |
| Convert flat fields → blocks | Designed but not built. Not the primary path. |
| Block-level dirty tracking | Step-level dirty dots work; no per-block granularity. |
| Language dropdown/autocomplete | Plain text input only. |
| Block insertion at a specific position | Add always appends at bottom. |
| `check` blocks are not interactive | Renders as a read-only question card. No learner response mechanism. |
| File header comment in `generateContentPrompt.js` | Still describes old flat-field contract. Update once a stable commit is made. |
| `starter_code.py` filename badge in the right panel header | Not renamed. Not requested. Still says `starter_code.py`. |

---

## 8. Recommended Next Steps

### Do not re-investigate — already confirmed

- Real AI path works. USE_MOCK=false + real API key produces valid block-shaped JSON.
- Independent panel scrolling works in both Chrome and Safari.
- Code formatting inside `check`/`explain`/`hint` blocks works in both Chrome and Safari.
- Safari blank-area issue is resolved (was a CSS `overflow-x` omission on the code panel body).
- Chrome code-flattening issue is resolved (heuristic extended for unindented code).

### Next session: prompt quality iteration

The UI is stable. The architecture is complete. The focus for the next session should be
**prompt and content quality** — specifically the two known gaps:

**1. Add a quality sub-section for `expectedAction` and `validationNote`**

These two fields are always generated and have no dedicated guidance beyond the consistency
rules. The model currently produces generic content for both. Add a dedicated sub-section
in `generateContentPrompt.js` between the Hint sub-section and the Consistency rules.

Intended behavior:
- `expectedAction`: one concrete sentence describing what the learner must do to pass the step.
  Must reference the specific TODO or action, not just "complete the task."
- `validationNote`: internal author/validator guidance. Should describe what a correct completed
  starterCode looks like AND name the one most common wrong approach to watch for.

**2. Run a fresh real-AI generation session and read the output critically**

Evaluate against:
- Do explain block titles still default to generic labels despite the guidance?
- Do task steps reference named elements from the starterCode?
- Is the starterCode anchored tightly to the task (no mismatch between TODO and task steps)?
- Does the check block contain an apply question with a code snippet, or just a recall question?
- Are `expectedAction` and `validationNote` still generic?

**3. One round of testing → one round of targeted prompt revision** is the right session scope.

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
      { id: 'b1', type: 'explain', title: 'What it is',
        content: 'An f-string lets you embed a variable directly inside a string — no concatenation needed.\n\nPut an f before the opening quote, then wrap any variable name in {}.' },
      { id: 'b2', type: 'code', language: 'python',
        content: 'name = "Ada"\nage = 35\n\ngreeting = f"My name is {name} and I am {age} years old."\nprint(greeting)\n# My name is Ada and I am 35 years old.' },
      { id: 'b3', type: 'check', title: 'Before you continue',
        content: 'What would this print?\n\n  city = "Rome"\n  print(f"I love {city}!")\n\nThink about it, then scroll.\n\n→  I love Rome!' },
      { id: 'b4', type: 'explain', title: 'Beyond variables',
        content: 'The {} in an f-string can hold any Python expression — not just a variable name.\n\nThe expression is evaluated at runtime and the result is inserted into the string.' },
      { id: 'b5', type: 'task', title: 'Your turn',
        content: '1. Look at the starter code on the right.\n2. Find the two TODO lines.\n3. Replace each one with an f-string that produces the expected output.' },
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
247b609  Switch Screen 2 content generation to block-based prompt contract
```

Session 13 changes are in the working tree and have not been committed yet.
