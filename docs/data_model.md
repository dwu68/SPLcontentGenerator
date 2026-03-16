# Data Model — SPL Content Generator

All state lives in `App.jsx`. There is no external store, context, or reducer. This document describes the exact shape of each state variable and how data transforms between screens.

---

## App State

```js
// src/App.jsx

screen            : 'builder' | 'authoring'

// Form inputs (Screen 1 left panel)
courseName        : string
moduleName        : string
subtopics         : string   // raw textarea value, newline-separated

// Lesson structure (Screen 1 right panel)
lessonStructure   : LessonStructure[]

// Lesson content (Screen 2)
lessonContent     : LessonContent[]
selectedStepId    : string | null

// Save state
dirtyStepIds      : Set<string>   // step IDs edited since last save
saveStatus        : 'saved' | 'unsaved' | 'saving'
```

---

## LessonStructure

Produced by `generateLessonStructure()`. Represents a single step in the lesson outline.

```ts
{
  id               : string   // e.g. "step-1747382400000-0"
  stepNumber       : number   // 1-based; auto-managed by App handlers
  title            : string   // the step title
  goal             : string   // learning goal ("Students will be able to…")
  coveredSubtopics : string[] // list of topic strings
}
```

**How IDs are generated:**
`step-${Date.now()}-${index}` on initial generation.
`step-new-${Date.now()}` when a step is added manually via "Add Step".

**Who can modify it:**
All mutations go through four handlers in `App.jsx`:
- `handleUpdateStep(id, fields)` — merge partial fields into a step
- `handleAddStep()` — append a blank step, renumber all
- `handleDeleteStep(id)` — remove by id, renumber all
- `handleMoveStep(id, 'up' | 'down')` — swap adjacent steps, renumber all

---

## LessonContent

Produced by `generateLessonContent(lessonStructure)`. Represents the authored content for a single step. IDs match the corresponding `LessonStructure` entry.

```ts
{
  id           : string   // same id as the LessonStructure step
  stepNumber   : number   // same as LessonStructure step
  title        : string   // step title (editable independently in Screen 2)
  concept      : string   // conceptual explanation shown to the learner
  instructions : string   // task the learner must complete
  hint             : string   // optional nudge shown when the learner is stuck
  starterCode      : string   // initial code shown in the code editor
  expectedAction   : string   // what the learner must do to complete the step; used by future validation
  validationNote   : string   // guidance for the validator (not shown to the learner)
}
```

**Who can modify it:**
`handleUpdateContent(stepId, fields)` in `App.jsx` — merges partial fields into the matching entry. Called on every keystroke from `InstructionPanelEditor` and `CodeEditorPanel`.

---

## Data Transformation: Screen 1 → Screen 2

```
subtopics (raw string)
  │  split('\n'), filter empty
  ▼
LessonStructure[]          ← user can add/edit/delete/reorder steps here
  │  generateLessonContent()
  ▼
LessonContent[]            ← user authors content per step here
```

The two arrays share the same `id` values. `LessonContent` is a **full replacement** each time "Generate Lesson Content" is clicked — there is no merge or diff. Manual edits made in Screen 2 are lost if the user returns to Screen 1 and re-generates.

---

## coveredSubtopics — Local State Note

In `StepBuilderCard` (inside `LessonStructurePreview.jsx`), the `coveredSubtopics` array is edited via a local `topicsStr` state variable (a comma-separated string). This prevents the array→string→array round-trip from resetting the cursor while the user types.

```
LessonStructure.coveredSubtopics : string[]   ← canonical (in App state)
StepBuilderCard.topicsStr        : string     ← local, comma-separated
  - initialized from coveredSubtopics.join(', ')
  - resets via useEffect when step.id changes
  - on change: parses to array → calls onUpdate → updates App state
```

**Known limitation:** `topicsStr` resets only when `step.id` changes, not when `coveredSubtopics` content changes from outside the card. Currently safe — no external mutation of this field exists. Will become a bug if undo or bulk-edit is added. See [todo.md](todo.md) — Phase 1.

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
  "subtopics": "...",
  "lessonStructure": [ "...LessonStructure[]" ],
  "lessonContent":   [ "...LessonContent[]"  ],
  "selectedStepId":  "step-..."
}
```

`dirtyStepIds` and `saveStatus` are **not** persisted — they are transient UI state and reset to `new Set()` / `'saved'` after a successful save.

---

## Future: Backend Persistence

The localStorage payload is the natural body for a backend API call. The swap in `handleSaveDraft()` is one line:

```js
// current
localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

// future — marked [PERSIST HOOK] in App.jsx
await fetch('/api/lessons', { method: 'POST', body: JSON.stringify(data) })
```

No state shape changes are required. `expectedAction` and `validationNote` are now live fields in `LessonContent` and are included in the payload automatically.

---

## Future: JSON Export Shape

```json
{
  "meta": {
    "courseName": "...",
    "moduleName": "..."
  },
  "lessonStructure": [ "...LessonStructure[]" ],
  "lessonContent":   [ "...LessonContent[]"  ]
}
```

The data is already in this shape in App state at all times. No structural changes are needed to add an export button.
