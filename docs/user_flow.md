# User Flow — SPL Content Generator

This document describes the actual interaction flow through the app as it exists today.

---

## App Entry

On load, the app checks `localStorage` for a saved draft under the key `spl_lesson_draft`.

- **If a draft exists:** restores all state — form values, lesson structure, lesson content, selected step, and which screen was active. The user resumes where they left off.
- **If no draft:** starts on Screen 1 with an empty form.

---

## Screen 1 — Lesson Structure Builder

### Layout

Two columns:
- **Left (fixed 360px):** `LessonInputForm` — the input form
- **Right (flex):** `LessonStructurePreview` — the editable step list

### Step-by-step flow

**1. Fill in the form**

The user fills in three fields:
- Course Name (text input)
- Module Name (text input)
- Sub-topics (textarea, one topic per line)

The "Generate Structure Preview" button is disabled until all three fields have content. Keyboard shortcut: ⌘+Enter (or Ctrl+Enter) submits the form.

**2. Generate the structure**

Clicking "Generate Structure Preview" calls `generateLessonStructure()` in `lessonStructureService.js`, which sends `POST /api/generate-structure` to the Express backend. The backend calls OpenAI (or returns mock data if `USE_MOCK=true`). While the request is in flight, `isGenerating` is `true` — the button is disabled and a loading indicator is shown. If the request fails, `generationError` is set and an error message is displayed.

On success, the response is normalized into one `LessonStructure` step per returned item. Each step gets:
- A unique `id`
- A `stepNumber` (1-based)
- A `title`
- A `goal` string
- A `coveredSubtopics` array

The right panel updates immediately to show the editable step cards.

**3. Edit the structure (inline)**

The step cards are always editable — no mode switch required. Each card has:

| Element | Behavior |
|---|---|
| Step number badge | Display only. Updates automatically after reorder or delete. |
| Title input | Large text field in the card header. Edit directly. |
| ↑ button | Swaps this step with the one above. Disabled on the first step. |
| ↓ button | Swaps this step with the one below. Disabled on the last step. |
| × button | Deletes this step. Steps below renumber automatically. Turns red on hover. |
| Goal field | Short text input describing the learning outcome. |
| Topics field | Comma-separated text input. Parsed into an array; displayed as-is while typing. |

**4. Add a step**

A dashed "+ Add Step" button below the card list appends a blank step at the end.

**5. Re-generate**

The user can change the sub-topics in the form and click "Generate Structure Preview" again. This **replaces** the entire structure. Any manual edits to step cards are lost.

**6. Proceed to Screen 2**

Clicking "✨ Generate Lesson Content →" calls `generateLessonContent()` in `mockGeneration.js`, which produces one `LessonContent` object per structure step. The app navigates to Screen 2 and auto-selects the first step.

---

## Screen 2 — Lesson Authoring View

### Layout

Three columns:
- **Left sidebar (224px):** step list navigation
- **Center panel (flex):** Instruction Panel editor
- **Right panel (flex):** Starter Code editor (dark theme)

The header shows a breadcrumb (`Course Name › Module Name`), the SaveStatus indicator, a Save Draft button, and a "← Back to Builder" button.

### View mode vs Edit mode

Screen 2 opens in **view mode** by default. The instruction panel renders lesson content as readable prose — no textareas, no nested scroll areas. The starter code is shown in a read-only dark block. The overall page scrolls naturally.

Clicking the **Edit** button (top-right of the instruction panel) enters **edit mode** for the currently selected step. Clicking **Save** keeps changes and returns to view mode. Clicking **Cancel** discards in-progress edits and returns to view mode. Switching to a different step while in edit mode automatically cancels in-progress edits (same behavior as Cancel).

### Step-by-step flow

**1. Select a step**

Click any step in the left sidebar to load its content into the view panel. The active step is highlighted with a blue background and a filled blue number badge. Steps with unsaved changes show a small amber dot.

**2. Edit instruction content (center panel)**

Click **Edit** in the panel header to enter edit mode. Seven fields, all editable textareas or inputs:
- **Title** — single-line text input (also controls the step's name in the sidebar)
- **Explanation** — multi-line textarea for the teaching narrative: why the concept matters, how it works, rules, common mistakes
- **Code Example** — short textarea for an annotated 4–8 line snippet illustrating the concept; distinct from the full starter code
- **Task** — multi-line textarea with the specific numbered actions the learner must complete; action-focused only
- **Hint** — textarea for a nudge shown when the learner is stuck
- **Expected Action** — textarea describing what the learner must do to complete the step (used by future validation)
- **Validation Note** — textarea with guidance for the validator (not shown to the learner)

Each keystroke immediately updates that step's `LessonContent` entry in app state and marks the step as having unsaved changes.

**3. Edit starter code (right panel)**

A dark-themed monospace `<textarea>` labelled `starter_code.py`. The Tab key inserts 4 spaces instead of moving focus. All other text editing is standard. Changes update app state immediately.

**4. Switch steps**

Clicking a different step in the sidebar loads its content into both panels. Edits to the previous step are already in app state — nothing is lost by switching.

**5. Save Draft**

Clicking "Save Draft" in the header:
1. Sets save status to "Saving…" (blue pulsing dot)
2. Writes the full state to `localStorage` as JSON
3. After 350ms, clears all dirty-step markers and sets status to "Saved" (green dot)

The Save Draft button is disabled when status is already "Saved" or "Saving…".

**6. Return to Screen 1**

Clicking "← Back to Builder" returns to Screen 1. The lesson structure and all authoring content remain in app state. Unsaved content changes are not lost (they are in app state, just not yet persisted to localStorage).

---

## Save Status Indicator

Visible in the header on Screen 2 at all times.

| State | Dot color | Label |
|---|---|---|
| `saved` | Green | Saved |
| `unsaved` | Amber | Unsaved changes |
| `saving` | Blue (pulsing) | Saving… |

Any edit to any field in Screen 2 sets status to `unsaved`. Save Draft sets it to `saving` then `saved`.

---

## State Lifecycle Summary

```
App load
  └── localStorage has draft? → restore all state
  └── no draft → Screen 1, empty form

Screen 1
  ├── Fill form → Submit → lessonStructure populated → editable cards appear
  ├── Edit cards → lessonStructure updated in place (immediate)
  └── Generate → lessonContent generated → navigate to Screen 2

Screen 2
  ├── Select step → selectedStepId updated → panels re-render
  ├── Edit field → lessonContent[stepId] updated → step marked dirty
  ├── Save Draft → full state → localStorage → dirty markers cleared
  └── Back to Builder → screen = 'builder' (all state preserved)
```
