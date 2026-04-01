# User Flow — SPL Content Generator

This document describes the actual interaction flow through the app as it exists today.

---

## App Entry

On load, the app checks `localStorage` for a saved draft under the key `spl_lesson_draft`.

- **If a draft exists:** restores all state — form values, lesson structure, lesson content, selected step, and which screen was active. The user resumes where they left off.
- **If no draft:** starts on Screen 1 with an empty form.

**Caveat:** A draft saved while on Screen 2 will reopen Screen 2 on reload. This can be unexpected if the user intended to start fresh. The draft can be cleared by triggering a new generation (which removes the stale draft from localStorage automatically).

---

## Screen 1 — Module Structure Builder

### Layout

Two columns:
- **Left (fixed 420px):** `LessonInputForm` — module setup inputs
- **Right (flex):** `LessonStructurePreview` — the editable step list

### Step-by-step flow

**1. Fill in the module setup form**

The user fills in these fields:
- Course Name / Skill Name (text input)
- Module Name (text input)
- Lesson Format (dropdown): **Programming** | Guided Tool Workflow | ~~Concept & Application~~ *(visible but disabled — not yet available)*
- Sub-topics (textarea, one topic per line)
- Slides (optional `.pptx` upload — uploading extracts slide text server-side via `POST /api/upload-slides`)

The "Generate Structure Preview" button is disabled until Course Name, Module Name, and at least one of Sub-topics or a slide file are provided. Lesson Format defaults to `Programming` and does not block generation. Keyboard shortcut: ⌘+Enter (or Ctrl+Enter) submits the form.

A **Review Sub-topics with AI** button appears below the Sub-topics textarea whenever it is non-empty. Clicking it sends the list to `POST /api/review-subtopics`. On success a suggestion panel appears with a revised list, rationale, and **Apply / Dismiss** actions. Apply overwrites the textarea. This state is transient — not persisted to localStorage.

**2. Generate the structure**

Clicking "Generate Structure Preview" calls `generateLessonStructure()` in `lessonStructureService.js`, which sends `POST /api/generate-structure` to the Express backend. The backend calls OpenAI (or returns mock data if `USE_MOCK=true`). While the request is in flight, `isGenerating` is `true` — the button is disabled and a loading indicator is shown. If the request fails, `generationError` is set and an error message is displayed.

On success, the response is normalized into a `LessonStructure` step per returned item. Each step gets:
- A unique `id`
- A `stepNumber` (1-based)
- `stepType: 'lesson'`
- A `title`, `goal`, and `coveredSubtopics` array

The right panel updates immediately to show the editable step cards.

**3. Edit the structure (inline)**

The step cards are always editable — no mode switch required. Each card header shows:

| Element | Behavior |
|---|---|
| Step number badge | Display only. Updates automatically after reorder or delete. |
| Step type badge | Color-coded pill showing the step type (e.g. LESSON, LAB FILES, EXTERNAL LAB). |
| Title input | Large text field. Edit directly. |
| ↑ button | Swaps this step with the one above. Disabled on the first step. |
| ↓ button | Swaps this step with the one below. Disabled on the last step. |
| × button | Deletes this step. Steps below renumber automatically. Turns red on hover. |

The card body varies by step type:

**`lesson` steps:**
- Goal field (text input): learning outcome
- Topics field (text input, comma-separated): parsed into an array; displayed as-is while typing

**`downloadable_lab_files` steps:**
- Description (text input)
- Files: disabled placeholder input ("File upload — coming soon")

**`starter_code_file` steps:**
- Description (text input)
- Starter Code: disabled placeholder input
- Problem Statement: disabled placeholder input (optional)

**`external_lab_link` steps:**
- Description (text input)
- Lab Link: URL input

**4. Add a step**

Clicking "Add Step" toggles an inline type picker showing four options:

| Option | Creates |
|---|---|
| Lesson | A blank `lesson` step (can be opened in Screen 2 for AI-generated content) |
| Lab Files | A `downloadable_lab_files` step |
| Starter Code | A `starter_code_file` step |
| External Lab | An `external_lab_link` step |

Clicking a type option creates the step and closes the picker. Clicking "Add Step" again while the picker is open collapses it without adding a step.

**5. Re-generate**

The user can change the sub-topics in the form and click "Generate Structure Preview" again. A confirmation prompt is shown when a structure already exists. Confirming **replaces** the entire structure. Any manual edits to step cards are lost.

**6. Proceed to Screen 2**

Clicking "✨ Generate Lesson Content →" validates that all steps have titles, shows a confirmation prompt if lesson content already exists, then **navigates to Screen 2 immediately** — before any generation has completed. The app auto-selects the first step.

Content is generated one step at a time via `generateStepContent()` in `lessonContentService.js`, which calls `POST /api/generate-content` once per lesson step. Each step transitions through `queued → generating → done` (or `error`) as the loop progresses. Completed step content becomes visible as soon as each step finishes — the user does not wait for the full batch.

**Per-step generation status** is tracked in `stepGenerationStatus` (an object keyed by step ID). The sidebar shows a color-coded dot: pulsing blue for `generating`, muted grey for `queued`, red for `error`. The instruction panel shows a distinct status message when a step's content is not yet available.

**Per-step errors do not abort the remaining steps.** A failed step is marked `error`; generation continues with the next step.

**Known limitation:** Navigating back to Screen 1 mid-generation does not cancel in-flight requests. The background generation loop continues updating state until it finishes.

---

## Screen 2 — Step Authoring View

### Layout

Three columns:
- **Left sidebar (320px, collapsible):** step list navigation
- **Center panel (flex):** instruction panel (view/edit)
- **Right panel (flex):** code editor panel (dark theme) — hidden in view mode when `starterCode` is empty

The header shows a breadcrumb (`Course Name › Module Name`), the SaveStatus indicator, a Save Draft button, and a "← Back to Builder" button.

### View mode vs Edit mode

Screen 2 opens in **view mode** by default. The instruction panel renders lesson content as readable blocks — no textareas, no nested scroll areas. The page scrolls naturally.

Clicking the **Edit** button (top-right of the instruction panel) enters **edit mode** for the currently selected step. Clicking **Save** keeps changes and returns to view mode. Clicking **Cancel** discards in-progress edits and returns to view mode. Switching to a different step while in edit mode automatically cancels in-progress edits.

### Step-by-step flow

**1. Select a step**

Click any step in the left sidebar to load its content into the view panel. The active step is highlighted with a blue background. Steps with unsaved changes show a small amber dot.

**2. View / edit lesson content**

For `lesson` steps with AI-generated content, the instruction panel shows blocks in sequence. View mode renders prose blocks (explain, slide-explain, hint, task, check) as markdown-rich text via `react-markdown` + `remark-gfm`, supporting bold, italic, inline code, bullet lists, ordered lists, links, fenced code blocks, and GFM pipe tables. The dedicated `code` block type renders in a dark `<pre>` theme and is unaffected.

In edit mode, each block becomes an editable card (`BlockEditor`) with title, type label, content textarea, and a delete button. Blocks can be reordered with ↑/↓ buttons. New blocks can be added via type buttons at the bottom of the editor:
- All formats: EXPLAIN, CODE, CHECK, TASK, HINT, LINK, FILE, MEDIA
- Guided Tool Workflow: additionally SLIDE, SLIDE-EXPLAIN

AI-assist actions visible in the instruction panel header while in edit mode:
- **+ AI Example** — generates a filled `code` block (annotated runnable example); calls `POST /api/generate-block`
- **+ AI Check** — generates a filled `check` block (question + answer); calls `POST /api/generate-block`
- **Add task with starter code** — for non-hands-on steps without an existing task or starterCode; calls `POST /api/generate-task`; generates a task block + matching starterCode; skip responses are shown inline when the step is unsuitable
- **Add module lab** — appears instead of "Add task with starter code" on hands-on steps (`isHandsOn: true`); calls `POST /api/generate-module-lab` with condensed prior-step context; generates a "Module Lab" task block + starterCode synthesized across the module

**3. Edit starter code (right panel)**

A dark-themed monospace `<textarea>` for the step's starter code. The Tab key inserts 4 spaces. Changes update app state immediately. The panel is read-only in view mode.

When a step has no `starterCode`, the right panel is hidden in view mode. An **Add Starter Code** button appears in the instruction panel header alongside the Edit button. Clicking it enters edit mode and reveals the code panel so the author can type the initial code. After saving, the panel remains visible only if `starterCode` is non-empty; an empty value collapses the panel back to hidden.

**4. Add a hands-on practice step**

At the bottom of the step sidebar, below all lesson steps, an **Add hands-on** button is always visible. It is disabled while generation is in progress and enabled once all steps have settled (done or error). Clicking it:
1. Appends a new `lesson` step titled "Hands-on Practice" to `lessonStructure`, with `isHandsOn: true`
2. Creates a matching empty `lessonContent` entry (`blocks: []`, `starterCode: ''`)
3. Auto-selects the new step so the author can begin editing immediately

In edit mode, the new step shows `BlockEditor` with an empty block list and the full add-block row (including `LINK` and `FILE` block types). No AI generation is triggered automatically.

**AI-assist action for hands-on steps:** the **Add module lab** button appears in the instruction panel header (in place of "Add task with starter code") while in edit mode, as long as no task block or `starterCode` already exists. Clicking it calls `POST /api/generate-module-lab`, which uses the condensed content of all previous lesson steps as context and synthesizes a `task` block (title: "Module Lab") plus `starterCode`. Skip responses are shown inline when there is insufficient prior lesson content.

**5. Non-lesson steps in Screen 2**

Non-lesson steps (`downloadable_lab_files`, `starter_code_file`, `external_lab_link`) render a dedicated read-only summary panel (`NonLessonStepPanel`) showing the step type, title, description, and any configured URL or file reference. No block editor is shown and no AI generation is triggered for these steps.

**6. Switch steps**

Clicking a different step in the sidebar loads its content. Edits to the previous step are already in app state — nothing is lost by switching.

**7. Save Draft**

Clicking "Save Draft" in the header:
1. Sets save status to "Saving…" (blue pulsing dot)
2. Writes the full state to `localStorage` as JSON
3. After 350ms, clears all dirty-step markers and sets status to "Saved" (green dot)

The Save Draft button is disabled when status is already "Saved" or "Saving…".

**8. Return to Screen 1**

Clicking "← Back to Builder" returns to Screen 1. The lesson structure and all authoring content remain in app state.

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
  └── localStorage has draft? → restore all state (including screen)
  └── no draft → Screen 1, empty form

Screen 1
  ├── Fill form → Submit → lessonStructure populated → editable step cards appear
  ├── Edit cards → lessonStructure updated in place (immediate)
  ├── Add Step → type picker → choose type → new step appended
  └── Generate Lesson Content → lessonContent generated → navigate to Screen 2

Screen 2
  ├── Select step → selectedStepId updated → panels re-render
  ├── Edit field → lessonContent[stepId] updated → step marked dirty
  ├── Save Draft → full state → localStorage → dirty markers cleared
  └── Back to Builder → screen = 'builder' (all state preserved)
```
