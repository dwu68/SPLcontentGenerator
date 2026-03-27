# Data Model — SPL Content Generator

All state lives in `App.jsx`. There is no external store, context, or reducer. This document describes the exact shape of each state variable and how data transforms between screens.

---

## App State

```js
// src/App.jsx

screen            : 'builder' | 'authoring'

// Module-level inputs (Screen 1 left panel)
courseName        : string
moduleName        : string
lessonFormat      : 'code_lab' | 'guided_tool_workflow' | 'concept_application'
                    // UI labels: 'Programming' | 'Guided Tool Workflow' | 'Concept & Application'
                    // Default: 'code_lab'
subtopics         : string   // raw textarea value, newline-separated

// Module structure (Screen 1 right panel)
lessonStructure   : Step[]

// Step content (Screen 2) — populated only for lesson steps
lessonContent     : LessonContent[]
selectedStepId    : string | null

// Save state
dirtyStepIds      : Set<string>   // step IDs edited since last save
saveStatus        : 'saved' | 'unsaved' | 'saving'

// Generation loading / error state
isGenerating         : boolean        // true while any generation call is in flight
generationError      : string | null  // message from the most recent failed generation
titleValidationError : string | null  // set when generate is blocked by empty step titles

// Per-step generation status (Screen 2 progressive generation)
stepGenerationStatus : Record<stepId, 'queued' | 'generating' | 'done' | 'error'>
                       // populated at generation start; empty object before first run
                       // not persisted to localStorage
```

---

## Step (LessonStructure)

Each entry in `lessonStructure[]` is a step. All steps share a common base; type-specific fields are present depending on `stepType`.

### Common base fields (all step types)

```ts
{
  id         : string   // e.g. "step-1747382400000-0" or "step-new-{timestamp}"
  stepNumber : number   // 1-based; auto-managed by App handlers
  stepType   : 'lesson' | 'downloadable_lab_files' | 'starter_code_file' | 'external_lab_link'
  title      : string
}
```

### lesson step (additional fields)

```ts
{
  goal             : string   // learning outcome ("Students will be able to…")
  coveredSubtopics : string[] // list of topic strings
}
```

All AI-generated steps are `lesson` steps. Manually added `lesson` steps are blank and can have content generated in Screen 2.

### downloadable_lab_files step (additional fields)

```ts
{
  description : string   // brief description of what the files contain
  // files[] — not yet implemented; upload is a placeholder in Screen 1
}
```

### starter_code_file step (additional fields)

```ts
{
  description : string   // what the learner should do with the file
  // starterCodeFile, starterCodeText — not yet implemented; upload is a placeholder
  // problemStatementFile (optional) — not yet implemented
}
```

### external_lab_link step (additional fields)

```ts
{
  description    : string   // brief description of the external lab
  externalLabLink: string   // URL to the external lab platform
}
```

**How IDs are generated:**
`step-${Date.now()}-${index}` on AI generation.
`step-new-${Date.now()}` when a step is added manually via "Add Step".

**Who can modify lessonStructure:**
All mutations go through handlers in `App.jsx`:
- `handleUpdateStep(id, fields)` — merge partial fields into a step
- `handleAddStep(stepType)` — append a blank step of the given type, renumber all
- `handleDeleteStep(id)` — remove by id, renumber all
- `handleMoveStep(id, 'up' | 'down')` — swap adjacent steps, renumber all

---

## LessonContent

Populated progressively during Screen 2 generation. Each entry is produced by `generateStepContent()` in `lessonContentService.js` (one call per step, sequential). `generateAllLessonContent()` remains in the service as a batch-mode fallback but is no longer called by the app. Only `lesson` steps produce `LessonContent` entries. IDs match the corresponding `lessonStructure` entry.

**Note:** The runtime schema is block-based. The `LessonContent` object carries `blocks[]` as the primary content. The flat fields (`concept`, `codeExample`, `instructions`) are a legacy fallback — new content is generated in the block-based format only.

```ts
{
  id             : string     // same id as the Step
  stepNumber     : number     // same as Step
  title          : string     // step title; edits in Screen 2 mirror back to lessonStructure

  // Block-based content (current schema)
  blocks         : Block[]    // ordered content blocks; primary content model

  // Supporting fields
  starterCode    : string     // initial code shown in the right panel (code editor)
                              // NOTE: not yet renamed; future preferred name is `practiceContent` (if generalized beyond code)
  expectedAction : string     // what the learner must do to complete the step
  validationNote : string     // guidance for the validator (not shown to the learner)

  // Legacy flat fields (fallback only — present on older saved drafts)
  concept        : string     // teaching narrative (UI label: "Explanation")
  codeExample    : string     // short annotated snippet
  instructions   : string     // task steps (UI label: "Task")
  hint           : string     // optional nudge for learners who are stuck
}
```

### Block shape

All blocks share a common base:

```ts
{
  id      : string
  type    : 'explain' | 'code' | 'check' | 'task' | 'hint'          // code_lab types
           | 'slide' | 'slide-explain' | 'explain'                    // guided_tool_workflow types
                                                                       // ('explain' is shared)
  title   : string    // optional label shown above the block
  content : string
}
```

Type-specific additional fields:

```ts
// code blocks only
language : string   // e.g. 'python' — required for type 'code', absent on all others

// slide blocks only
slideRef : string   // slide number or range, e.g. "3" or "3-5" — required for type 'slide'
                    // content is "" on AI-generated slide blocks; may hold a caption if manually edited
```

### Block types by format

**`code_lab` steps** — AI generates a variable sequence of:
`explain`, `code`, `check`, `task`, `hint`

**`guided_tool_workflow` steps** — AI generates exactly three blocks in this order:

1. **`slide`** — declares which slide or consecutive range covers this step. `slideRef` is a string like `"3"` or `"3-5"`. `content` is `""` (display is driven by `slideRef`, not content). The `slide` block is a reference anchor, not a prose block.

2. **`slide-explain`** — learner-facing prose that explains the referenced slide content. Primary purpose: help the learner understand what is on the slide. Stays anchored to the slide material. Formatted as short paragraphs and/or bullet points — not a wall of text. Always AI-generated per step; user may delete it in the editor afterward.

3. **`explain`** — concept-level teaching block grounded in the step `goal` and `coveredSubtopics`. Primary purpose: teach the underlying concept at the step level. Not slide-anchored. Behaves identically to an `explain` block in `code_lab`. Some overlap with `slide-explain` is acceptable — these two blocks approach the same material from different angles.

**Distinction between `slide-explain` and `explain`:**
- `slide-explain`: *what does this slide show, and what does it mean for the learner?*
- `explain`: *what does the learner need to understand about this topic, given the step goal?*

**Who can modify LessonContent:**
`handleUpdateContent(stepId, fields)` in `App.jsx` — merges partial fields into the matching entry. Called from `BlockEditor`, `InstructionPanelEditor`, and `CodeEditorPanel`.

---

## Data Transformation: Screen 1 → Screen 2

```
subtopics (raw string)
  │  split('\n'), filter empty → sent to POST /api/generate-structure
  ▼
lessonStructure[]   — stepType: 'lesson' for all AI-generated steps
  │  user may add non-lesson steps manually (no AI call for those)
  │  generateStepContent() called once per lesson step (non-lesson steps skipped)
  ▼
lessonContent[]     — one entry per lesson step; block-based schema; populated progressively
```

The two arrays share the same `id` values. `lessonContent` is a **full replacement** each time "Generate Lesson Content →" is clicked — there is no merge or diff. Manual edits made in Screen 2 are lost if the user returns to Screen 1 and re-generates.

---

## coveredSubtopics — Local State Note

In `LessonStepFields` (inside `LessonStructurePreview.jsx`), the `coveredSubtopics` array is edited via a local `topicsStr` state variable (a comma-separated string). This prevents the array→string→array round-trip from resetting the cursor while the user types.

```
Step.coveredSubtopics : string[]   ← canonical (in App state)
LessonStepFields.topicsStr : string  ← local, comma-separated
  - initialized from coveredSubtopics.join(', ')
  - resets via lastSentCanonicalRef guard when external changes arrive
  - on change: parses to array → calls onUpdate → updates App state
```

---

## localStorage Draft

**Key:** `spl_lesson_draft`

**Written by:** `handleSaveDraft()` in `App.jsx` (triggered by "Save Draft" button).

**Read by:** `useEffect` on mount in `App.jsx`.

**Shape:**

```json
{
  "screen": "builder | authoring",
  "courseName": "...",
  "moduleName": "...",
  "lessonFormat": "code_lab | guided_tool_workflow | concept_application",
  "subtopics": "...",
  "lessonStructure": [ "...Step[]" ],
  "lessonContent":   [ "...LessonContent[]" ],
  "selectedStepId":  "step-..."
}
```

`dirtyStepIds` and `saveStatus` are **not** persisted — they are transient UI state and reset to `new Set()` / `'saved'` after a successful save.

**Caveat:** A saved draft that includes Screen 2 (`"screen": "authoring"`) will reopen Screen 2 on page reload. This can surface unexpected state (e.g. a draft from a previous lesson) if the user has started a new session. Draft restore logic should be reviewed when backend persistence is added.

---

## Backend Persistence (deferred — another team)

The localStorage payload is the natural body for a backend API call. The swap in `handleSaveDraft()` is one line:

```js
// current
localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

// future — marked [PERSIST HOOK] in App.jsx
await fetch('/api/lessons', { method: 'POST', body: JSON.stringify(data) })
```

No state shape changes are required for the swap. `lessonFormat` and `stepType` are already in the payload.
