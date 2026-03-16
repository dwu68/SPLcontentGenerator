# Architectural & Design Decisions

Canonical record of decisions made and their rationale. Covers technology choices, UX patterns, and state management. Intended to prevent re-litigating resolved questions.

---

## Technology

### Vite + React (no framework)

**Decision:** Plain Vite + React. No Next.js, no Remix, no CRA.

**Rationale:** This is a single-page internal tool with no routing requirements beyond two screens. A full framework adds build complexity and enforces patterns (SSR, file-based routing) that provide no value here. Vite gives fast hot-reload and a clean production build.

### No UI component library

**Decision:** Plain React + a single `App.css` file. No Tailwind, no MUI, no shadcn.

**Rationale:** The component surface is small and predictable. Importing a UI library for a handful of inputs, buttons, and panels adds dependency weight and requires learning its override system when the defaults don't fit. Raw CSS with design tokens (CSS variables) is transparent and maintainable.

### No icon library

**Decision:** Unicode characters for reorder (↑ ↓) and delete (×) buttons.

**Rationale:** Three icons do not justify a dependency. Unicode arrows and the multiplication sign are universally rendered and need no SVG loading overhead.

### No state management library

**Decision:** All state in `App.jsx` via `useState`. No Redux, no Zustand, no Context API.

**Rationale:** The app has two screens and a flat, predictable state shape. Prop drilling is shallow — typically one level from App to screen component to editor component. A global store would add boilerplate with no architectural benefit at this scale. If the app grows to three or more screens with cross-cutting state, extracting a context or a lightweight store is a straightforward refactor.

---

## Screen 1 — Lesson Structure Builder

### Always-editable cards, no edit-mode toggle

**Decision:** Step cards on Screen 1 are always editable. There is no "view mode / edit mode" toggle.

**Rationale:** A toggle implies the structure is primarily for reading, with editing as a secondary action. This tool is an authoring tool — the structure is always being worked on. Removing the toggle reduces clicks and makes the editing affordance obvious. The card gets a blue border ring on focus-within as the visual cue that it is interactive.

### Immediate structure mutations (no local draft on Screen 1)

**Decision:** Add, delete, reorder, and field edits on Screen 1 update `lessonStructure` in App state directly. There is no "pending changes" draft that must be committed with an Update button.

**Rationale:** The lesson structure is the working document. Immediate edits are simpler and faster than a two-step edit-then-commit flow. Contrast: Screen 2 uses an explicit Save Draft because that state needs to survive to localStorage (and eventually a backend).

### Re-generation replaces the structure (no merge)

**Decision:** Clicking "Generate Structure Preview" with a new sub-topics list replaces the entire `lessonStructure` array with no merge.

**Rationale:** Merging requires a diff algorithm and decisions about which edited steps to keep. Full replacement is the simplest correct behavior. A `window.confirm()` guard is shown when a structure already exists.

---

## Screen 2 — Lesson Authoring View

### Immediate field updates, explicit save

**Decision:** Every keystroke in Screen 2 updates `lessonContent` in App state. Nothing is persisted until the user clicks "Save Draft".

**Rationale:** Immediate state updates mean switching steps never loses changes (the content is already in state). Explicit save gives the user control over when the draft is persisted to localStorage (and, in future, to a backend). The SaveStatus indicator keeps the user informed at all times.

### Global save, not per-step

**Decision:** "Save Draft" persists all `lessonContent` at once. There is no per-step save.

**Rationale:** Per-step save is more granular but adds complexity (per-step saved state, partial-save error handling). A single save action is easy to understand and maps cleanly to a single backend write call in future.

### Re-generation replaces lessonContent (no merge)

**Decision:** Clicking "Generate Lesson Content →" again produces a fresh `lessonContent` array, discarding any Screen 2 edits.

**Rationale:** Merging AI-generated content with user edits is a complex problem best deferred until real AI generation is in place. A `window.confirm()` guard is shown when lesson content already exists.

---

## coveredSubtopics — Local String State in StepBuilderCard

**Decision:** `StepBuilderCard` maintains a local `topicsStr` string state for the comma-separated topics input, rather than deriving the input value directly from `step.coveredSubtopics.join(', ')`.

**Rationale:** If the input value is derived directly from the array on every render, the array→string conversion after each keystroke produces a normalized string (trimmed, sorted) that resets the cursor position. Local string state lets the user type freely (including a trailing comma mid-entry) without disruption. The `useEffect` dependency on `step.id` ensures the local state resets correctly when a new structure is generated.

**Known limitation:** If `coveredSubtopics` is modified from outside the card (e.g., a future undo operation or bulk-edit feature), the local string will not update. See [todo.md](todo.md).

---

## Draft Persistence

### localStorage, not sessionStorage or IndexedDB

**Decision:** `localStorage` with the key `spl_lesson_draft`.

**Rationale:** The draft should survive tab close and browser restart. `sessionStorage` would not. `IndexedDB` supports larger payloads and structured queries but is unnecessary overhead for a single-document draft at this size. The full lesson state serializes comfortably as JSON within localStorage limits.

### Save is opt-in (button), not automatic

**Decision:** No auto-save. The user must click "Save Draft".

**Rationale:** Auto-save to localStorage is fine, but auto-save to a future backend requires network error handling, conflict resolution, and rate limiting. Building opt-in save now means the behavior is consistent before and after backend integration.
