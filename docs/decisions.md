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

### Progressive generation — navigate first, generate step-by-step

**Decision:** Clicking "Generate Lesson Content →" navigates to Screen 2 immediately, before any generation has completed. Content is generated one step at a time via `generateStepContent()`. Each step transitions `queued → generating → done|error` and its content becomes visible as soon as it finishes. Per-step errors do not abort remaining steps.

**Rationale:** The previous model awaited the full batch before navigating, blocking the user on Screen 1 with no visibility into progress. The progressive model lets the user read and navigate completed steps while later steps continue generating, and makes partial failures visible rather than silently dropping the whole batch.

**Trade-off documented:** Navigating back to Screen 1 mid-generation does not cancel in-flight requests — the background loop continues updating state. Cancellation support is deferred.

### Dedicated narrow generation path for task + starter code

**Decision:** Adding a task block + `starterCode` to an existing step uses a dedicated endpoint (`POST /api/generate-task`) and a separate focused prompt (`generateTaskPrompt.js`), not the full `POST /api/generate-content` path.

**Rationale:** Re-running the full content generation for a single missing field would regenerate all blocks and overwrite existing authored content. The narrow path takes the current blocks as context, generates only the task block and its matching `starterCode`, and appends without touching anything else. The prompt is scoped to this single operation and can carry appropriate constraints (step-anchored, smallest viable task, no concept introduction) without complicating the main content prompt.

**Skip responses:** The prompt instructs the model to return `{ "skip": true, "reason": "..." }` when a task is genuinely inappropriate for the step (e.g. purely conceptual, `guided_tool_workflow` without a coding action). The service passes this through and the UI displays the reason inline. No content is modified on a skip. This prevents forcing a task block onto steps where none is appropriate, at very low implementation cost.

**Block ID assignment:** The task block returned by `POST /api/generate-task` has no `id` field — the client assigns `block-${Date.now()}` at insertion time, consistent with the pattern used by `BlockEditor` for manually added blocks.

**`starterCode` placement:** `starterCode` remains a step-level field on `LessonContent`, not a block in `blocks[]`. The right-side code panel reads it from the step object. This is consistent with how the main content generation path handles it.

### Starter code panel — shown on demand, not always visible

**Decision:** The right-side code panel is hidden in view mode when `starterCode` is empty. An **Add Starter Code** button in the instruction panel header allows the author to open the panel on demand. In edit mode the panel always renders (so the author can type into it). After saving, the panel persists only if `starterCode` is non-empty.

**Rationale:** Most steps do not need starter code. Showing an empty dark panel by default wastes layout space and is visually noisy. The affordance to add it is discoverable (next to the Edit button) without being in the way when unused.

### `isHandsOn: true` as step identity marker — not title text

**Decision:** Steps created via "Add hands-on" carry `isHandsOn: true` on the `lessonStructure` entry. Screen 2 action routing (which AI-assist button appears in edit mode) is keyed on this flag, not on the step title string.

**Rationale:** Relying on `step.title === 'Hands-on Practice'` would break silently if the author renames the step, and would misfire on any other step that happens to share that title. A boolean flag on the step object is stable, cheap to check, and persists correctly through localStorage round-trips. The step type remains `lesson` — `isHandsOn` is purely a UI routing signal with no behavioral effect on generation, structure, or persistence beyond the Screen 2 button choice.

### Dedicated narrow generation path for module-level lab (`Add module lab`)

**Decision:** The "Add module lab" action for `isHandsOn` steps uses a dedicated endpoint (`POST /api/generate-module-lab`) and prompt (`generateModuleLabPrompt.js`), not the full content generation path or the step-local `generate-task` path.

**Rationale:** The module lab differs from a step-local task in one fundamental way: its context is the entire module's prior lesson content, not the current step's blocks. The step-local `generate-task` prompt is scoped to anchor its output to the current step's existing blocks. Re-using it for a module lab would produce a narrowly scoped task rather than a synthesis exercise. A dedicated prompt allows explicit module-synthesis instructions, a different task title ("Module Lab" vs "Lab"), and its own skip criteria.

**Context condensation:** Previous-step context is built client-side in `generateModuleLabForStep()` before the network request. Each qualifying step (lesson steps before the current one with at least one block) is reduced to `{ title, goal, coveredSubtopics, blockSummaries: [{ type, excerpt }] }` where each block excerpt is the first 150 characters of `content`. Fields `starterCode`, `expectedAction`, and `validationNote` are excluded — they describe the practice interface, not the taught content. This keeps the payload compact while giving the model enough signal to synthesize across topics.

**Early-exit skip:** If no qualifying previous steps exist after filtering, `generateModuleLabForStep()` returns a skip response immediately without making a network call. This avoids a wasted round-trip and surfaces a clear author-facing message.

### `external_link` and `downloadable_file` as block types — not step types

**Decision:** External links and downloadable file references within a lesson step are implemented as block types (`external_link`, `downloadable_file`) using the existing base block shape `{ id, type, title, content }`. They are not new step types and do not require new step-level fields.

**Rationale:** The existing non-lesson step types (`external_lab_link`, `downloadable_lab_files`) are step-level constructs designed to hold module-structure metadata. Making links and files available *within* a lesson step's content — alongside `explain`, `task`, and other blocks — requires them to be block types. Both fit cleanly into the existing schema: `external_link` uses `content` for the URL and `title` for the link label; `downloadable_file` uses `title` for the filename label and `content` for the description. No new fields are needed. Actual file upload for `downloadable_file` is a placeholder, consistent with the existing pattern for the `downloadable_lab_files` step type.

---

## coveredSubtopics — Local String State in StepBuilderCard

**Decision:** `StepBuilderCard` maintains a local `topicsStr` string state for the comma-separated topics input, rather than deriving the input value directly from `step.coveredSubtopics.join(', ')`.

**Rationale:** If the input value is derived directly from the array on every render, the array→string conversion after each keystroke produces a normalized string (trimmed, sorted) that resets the cursor position. Local string state lets the user type freely (including a trailing comma mid-entry) without disruption. The `useEffect` dependency on `step.id` ensures the local state resets correctly when a new structure is generated.

**Status:** This limitation was resolved in Phase 1. A `lastSentCanonicalRef` guard now prevents user-typed round-trips from resetting the input while still syncing external changes to `coveredSubtopics`.

---

## AI Generation

### Backend proxy — no direct browser-to-provider calls

**Decision:** The frontend never calls the AI provider directly. All generation requests go to `POST /api/generate-structure` on our own Express backend (`server/index.js`). The backend holds the API key and calls OpenAI.

**Rationale:** Direct browser calls would require exposing the API key in the client bundle (via a `VITE_` prefix env variable), making it visible in DevTools and in version control. A backend proxy keeps the key server-side only, even for an internal tool. It also gives us a single place to add rate limiting, logging, and provider swaps without touching the frontend.

**Dev setup:** Vite proxies `/api/*` → `http://localhost:3001` during development, so the frontend always uses a relative `/api` path with no CORS concerns. In production, Express serves the Vite build and the API at the same origin.

### OpenAI as the AI provider

**Decision:** OpenAI via the official `openai` npm SDK. Code default: `gpt-4o-mini`. Overridable via `OPENAI_MODEL` env variable (`.env.example` ships with `gpt-5.4`).

**Rationale:** Well-documented SDK, reliable JSON mode (`response_format: { type: 'json_object' }`), and straightforward model overriding via env var. Provider is isolated to `server/index.js` — swapping to a different model or provider only touches that file.

**JSON contract:** The server always returns `Array<{ title, goal, coveredSubtopics }>`. The frontend's `normalizeStructure()` assigns IDs and step numbers. This contract holds regardless of which provider the server uses.

### Mock fallback behind a server-side env flag (USE_MOCK)

**Decision:** `USE_MOCK=true` in `.env` causes the server to return mock data instead of calling OpenAI. The frontend has no knowledge of this — it receives the same JSON shape either way.

**Rationale:** Keeps mock/real switching off the client entirely. Useful for local development without spending API credits. The flag is server-side only so there is no risk of accidentally shipping a "mock mode" to a shared deployment.

### Service layer for provider calls (lessonStructureService.js)

**Decision:** Screen 1 generation goes through a dedicated service module (`src/services/lessonStructureService.js`) rather than putting the API call inline in `App.jsx`.

**Rationale:** The service separates three concerns that must stay independent:
- **Provider call** (`callProvider`) — calls `POST /api/generate-structure`. The only function that changes if the endpoint URL or request shape changes.
- **Normalization** (`normalizeStructure`) — validates the server response and assigns `id` and `stepNumber` locally. Prevents malformed responses from corrupting App state.
- **App orchestration** (`handleSubmit` in App.jsx) — owns `isGenerating`, `generationError`, confirmation guards, and state updates. Does not change when the provider or endpoint changes.

**Pattern applied to Screen 2:** `POST /api/generate-content` is implemented in `server/index.js`; `lessonContentService.js` handles Screen 2 calls following the same three-layer pattern (provider call / normalization / App orchestration).

---

### Markdown rendering in view mode (`react-markdown` + `remark-gfm`)

**Decision:** Prose blocks in Screen 2 view mode (`explain`, `slide-explain`, `hint`, `task`, `check`) are rendered through `react-markdown` with the `remark-gfm` plugin. Raw HTML rendering (`rehype-raw`) is intentionally excluded. Links are overridden to open in a new tab (`target="_blank" rel="noreferrer noopener"`).

**Rationale:** The old hand-rolled heuristic (split on `\n\n`, classify as bullets/code/prose) had false positives (multi-line prose incorrectly wrapped in `<pre>`) and no support for bold, italic, inline code, ordered lists, or GFM tables. `react-markdown` handles all of these correctly and safely. Raw HTML is disabled to prevent `dangerouslySetInnerHTML` — unneeded since AI-generated content is structured prose, not HTML. The dedicated `code` block type retains its own `<pre>` dark-theme renderer and is unaffected.

**Scope:** Styles for markdown output are scoped under `.block-body` in `App.css` to prevent bleed into edit mode or other surfaces. `BlockEditor` (edit mode) is unchanged — authors still type raw markdown in textareas; rendering only applies in view mode.

### `media` block type reuses `POST /api/upload-file`

**Decision:** The `media` block type for inline image display shares the existing `POST /api/upload-file` disk-storage multer endpoint with `downloadable_file` blocks. No new server endpoint was added. The file input restricts to `accept="image/*"` client-side only.

**Rationale:** The upload behavior is identical — multipart form data, disk storage, return `{ fileUrl, fileName }`. Adding a separate endpoint would duplicate the handler. A server-side image MIME filter (`multer fileFilter`) would harden this but is deferred; the internal use context makes a malformed upload unlikely. The red placeholder in view mode (when no image is uploaded) is intentional — it makes absent images immediately obvious to authors.

### Sub-topics review state is transient

**Decision:** The `subtopicsReview` state (suggestion, rationale, skip signal) is held in App state but is **not** persisted to `localStorage`. It resets on page reload.

**Rationale:** Review results are contextual to the current editing session. Persisting them would require migration logic and could surface stale AI suggestions after the author has already applied or ignored them. The save payload stays clean. A separate `isReviewing` flag is used (isolated from `isGenerating`) so the review button and the "Generate Structure Preview" button do not block each other.

---

## Draft Persistence

### localStorage, not sessionStorage or IndexedDB

**Decision:** `localStorage` with the key `spl_lesson_draft`.

**Rationale:** The draft should survive tab close and browser restart. `sessionStorage` would not. `IndexedDB` supports larger payloads and structured queries but is unnecessary overhead for a single-document draft at this size. The full lesson state serializes comfortably as JSON within localStorage limits.

### Save is opt-in (button), not automatic

**Decision:** No auto-save. The user must click "Save Draft".

**Rationale:** Auto-save to localStorage is fine, but auto-save to a future backend requires network error handling, conflict resolution, and rate limiting. Building opt-in save now means the behavior is consistent before and after backend integration.
