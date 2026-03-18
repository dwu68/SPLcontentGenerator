# Branch Handoff — `feature/block-based-screen2`

**Latest checkpoint commit:** `48f8906`
**Branch base:** `main` at `95a128e` (Session 12 — Screen 2 AI generation wired)
**Date written:** 2026-03-18

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

This branch explores replacing the flat-field content model with an **ordered sequence of blocks** —
one per teaching unit — so the author can compose a lesson step as a genuine instructional sequence
rather than a form with fixed slots.

---

## 2. Current Implementation Status

### What has been implemented on this branch

**Phase A — Block-based view mode (read-only rendering)**

- `blocks` added as a passthrough field in `normalizeContent()` — defaults to `[]` if absent
- `LessonStepView` branches on `step.blocks?.length > 0`:
  - If blocks present → renders `BlocksView` (new block-based renderer)
  - If blocks absent → original flat-field prose rendering (unchanged)
- `BlocksView` maps the blocks array to `Block` components, dispatching on `type`
- Five block types rendered distinctly in view mode:
  - `explain` — prose paragraphs, optional heading
  - `code` — dark monospace pre block
  - `task` — blue-tinted card with action steps
  - `check` — amber-accented question card
  - `hint` — collapsible `<details>` block, optional summary label

**Phase B — Block-based edit mode**

- New component `BlockEditor.jsx` handles edit mode for block steps
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
- Save/Cancel: uses existing `editSnapshot` flow — no changes to `LessonAuthoringView` state logic

### Files added or changed on this branch

| File | Status | What changed |
|---|---|---|
| `src/components/BlockEditor.jsx` | **New** | All block editing logic — `BlockEditor` + `BlockCard` components |
| `src/components/LessonAuthoringView.jsx` | Modified | Import + view mode branch (`BlocksView`) + edit mode branch (`BlockEditor`) |
| `src/services/lessonContentService.js` | Modified | `normalizeContent()` passes through `blocks: []` |
| `src/App.css` | Modified | Block editor styles (`.block-editor-*`) + block view styles (`.block-view`, `.block-*`) |

No changes to `App.jsx`, `server/index.js`, `InstructionPanelEditor.jsx`, or any prompt files.

---

## 3. What Has Been Manually Verified

All verification was done with a manually injected test step (see §6 for how to re-inject).

- **Block-based view mode renders correctly** — all five block types visible, `hint` collapses/expands
- **Block-based edit mode opens correctly** — clicking Edit on a block step shows `BlockEditor`, not `InstructionPanelEditor`
- **Block field editing works** — title and content edits update the step in App state; amber dirty dot appears in sidebar
- **Add block works** — clicking a type button appends a new empty card; `code` blocks pre-fill `language: 'python'`
- **Delete block works** — × removes the card; Cancel restores it
- **Save works** — block edits survive Save Draft and page reload (written to localStorage correctly)
- **Cancel restores correctly** — edits and added/deleted blocks are all discarded on Cancel
- **Flat-field fallback unaffected** — steps without blocks open `InstructionPanelEditor` in edit mode and render the original flat-field prose in view mode, exactly as on `main`
- **Step switching while editing cancels correctly** — switching to a different step while in block edit mode silently cancels (existing behavior, still works)

---

## 4. What Is Intentionally Not Implemented Yet

| Feature | Status |
|---|---|
| AI-generated blocks | Not started. The server still returns flat fields. No prompt changes. |
| Block reordering (↑/↓ or drag) | Out of scope for Phase B. Delete + re-add is the workaround. |
| Type switching on an existing block | Out of scope. Type is fixed once set. Delete + re-add is the workaround. |
| Convert flat fields → blocks | Designed but not built. Was discussed as a secondary escape hatch, not the primary path. |
| Block-level dirty tracking | Step-level dirty dots work; no per-block granularity. |
| Language dropdown/autocomplete | Plain text input only. |
| Block insertion at a specific position | Add always appends at the bottom. |
| Multiple starter code files | Not in scope for this branch. |

---

## 5. Architecture Decisions

### Block shape

```js
{
  id       : string,               // e.g. "block-1747382400000-2"
  type     : 'explain' | 'code' | 'check' | 'task' | 'hint',
  title   ?: string,               // optional heading/label; for hint: used as <summary> text
  content  : string,               // prose, code, question, or action steps
  language?: string,               // code blocks only; e.g. 'python'
}
```

`title` is the same field name for all block types including `hint`.
The hint editor labels it "Collapsed label (optional)" in the UI — the field name in the data is still `title`.

### Why these five block types

They cover the minimal pedagogical vocabulary needed for the target interleaved flow:
- `explain` — teaching prose
- `code` — read-only annotated example
- `check` — quick comprehension moment (no interactivity yet, renders as a question card)
- `task` — numbered action steps the learner performs
- `hint` — optional nudge, collapsible

Deliberately excluded for now: `callout`, `image`, `quiz`, `video`, anything interactive.

### Why `starterCode` stays as a top-level field

`starterCode` is not instructional content — it is the code the learner works in (right panel editor).
It is structurally different: always exactly one per step, always shown in the code panel, always editable.
Promoting it to a block would break the panel layout and the `CodeEditorPanel` component
without any benefit. It stays top-level.

### Why blocks are additive (not replacing flat fields immediately)

The flat-field model is still the content source for every real step generated by AI (`main` and this branch).
Removing flat fields immediately would break the fallback rendering path and make
every AI-generated step unsupported in view mode.

The migration strategy:
1. Blocks and flat fields coexist on `LessonContent` — neither is removed
2. `blocks.length > 0` acts as the mode selector — if present, block mode wins
3. Flat-field mode remains the fallback for all AI-generated steps until the AI prompt changes
4. The two modes are isolated — changing one does not affect the other

This makes the branch reversible: removing `BlockEditor` and the `blocks` branch
in `LessonAuthoringView` restores main-branch behavior without touching the data model or App state.

---

## 6. Risks and Caveats

### Block content is still manually injected

There is no path today for a real step to arrive with blocks populated by AI.
All block content on this branch came from a console snippet that manually overwrites
`lessonContent[0].blocks` in localStorage. The manual test data is f-strings content
injected into whatever Step 1 happens to be in the current draft.

**To re-inject the test step** (paste in browser console after generating a lesson and saving a draft):

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

### `check` blocks are not interactive yet

`check` renders as a question card in view mode. It is purely read-only — there is no
user response mechanism. This is intentional for Phase A/B but means the current
implementation delivers only partial value for this block type.

### No block reordering in the editor

Authors can only add at the bottom and delete. Reordering requires delete + re-add
of any block that needs to move. This is acceptable for manual testing but will
feel limiting once real lessons are being authored with blocks.

### The test step's topic (f-strings) does not match the real lesson content

When the console snippet is injected, it replaces `lessonContent[0]` with f-strings content
regardless of what the actual lesson is. This is only a problem for testing against real
lesson topics — it does not affect the block rendering or editing behavior.

---

## 7. Recommended Next Step for the Next Session

### Recommendation: Wire AI-generated blocks (Phase C)

Both Phase A (view) and Phase B (edit) are complete and verified.
The remaining gap is the **content source**: blocks only exist today via manual console injection.

The next meaningful milestone is making the AI generate blocks directly,
so a real lesson can be authored end-to-end in block mode without any manual injection.

**What Phase C involves:**
1. Update `generateContentPrompt.js` (server-side) to return a `blocks` array instead of flat fields
2. Update `parseContentResponse` in `server/index.js` to accept the new shape
3. Update `normalizeContent` in `lessonContentService.js` to map the new server shape to `LessonContent`
4. Update `mockGenerateContent` in `server/index.js` to produce mock blocks

This is entirely server-side + service layer — no React component changes needed.
The block editor and block renderer are already ready to receive the output.

**Why not the conversion flow (flat → blocks) first:**

Conversion is a one-way lossy operation. It is useful as an escape hatch
for steps that were already AI-generated in flat-field mode, but it moves
content *backward* through the migration. Building the AI path first means
new content is born in block mode, which is the target state.

**Why not a design refinement first:**

Phase A and B are working and have been verified. The design is stable enough
to move to the content generation phase. Any UX refinements (reordering, type switching,
richer `check` interactivity) are easier to evaluate once real block content is in the system.

**Suggested Phase C scope for one session:**
- Prompt change: instruct the model to return `{ blocks: [...] }` with the five types
- Keep `starterCode`, `expectedAction`, `validationNote` as separate top-level fields in the response (not blocks)
- Add mock blocks to `mockGenerateContent` (can reuse the f-strings example structure as a template)
- Verify end-to-end: generate a lesson, click Generate Lesson Content, confirm Step 1 opens in block view mode automatically

---

## 8. Safe Rollback Note

To return to the stable `main` branch at any time:

```bash
git checkout main
```

`main` is at `95a128e` (Session 12 — Screen 2 AI generation wired, fully functional on the flat-field model).
No changes from this branch have been merged to `main`.
All block-related work is isolated to `feature/block-based-screen2`.

The latest verified checkpoint on this branch is:

```
48f8906  Prototype block-based Screen 2 view and edit flow
```
