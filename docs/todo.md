# Todo — SPL Content Generator

Backlog in priority order. Items marked ✅ are complete. Items marked 🔲 are not started. Items marked ~~strikethrough~~ are de-prioritized or out of scope.

---

## Phase 0 — Repo Hygiene & Cleanup

- ✅ Create `.gitignore` — exclude `node_modules/`, `dist/`, `.DS_Store`, `*.local`
- ✅ Delete `src/components/LessonStructureEditor.jsx` — dead code
- 🔲 Delete `src/utils/mockGeneration.js` — dead code; nothing imports it; mock behavior is server-side

---

## Phase 1 — Data Model & UI Stabilization

- ✅ Add `expectedAction` and `validationNote` to `LessonContent`
- ✅ Add empty-title validation on Screen 1
- ✅ Add re-generation confirmation on Screen 1
- ✅ Add re-generation confirmation on Screen 2
- ✅ Fix `coveredSubtopics` local state drift
- ✅ Add `codeExample` field to `LessonContent`
- ✅ Screen 2 view/edit mode

---

## Phase 2 — AI Integration

- ✅ Scaffold Screen 1 service layer (`src/services/lessonStructureService.js`)
- ✅ Add Express backend proxy (`server/index.js`) with `POST /api/generate-structure`
- ✅ Wire Vite dev proxy (`/api` → `http://localhost:3001`)
- ✅ Add mock fallback behind server-side `USE_MOCK` env flag
- ✅ Test and verify the real OpenAI path end-to-end (verified with `gpt-5.4`)
- ✅ Server-side prompt infrastructure (`server/prompts/`, `server/lib/promptContext.js`)
- ✅ Screen 2: wire real AI content generation (`POST /api/generate-content`, `lessonContentService.js`)
- ✅ Verify Screen 2 real AI generation end-to-end
- ✅ Add `isGenerating` boolean and loading indicator
- ✅ Add error state for AI generation failures

---

## Phase 3 — Multi-Format & Step Type Foundation

Work done in this phase establishes the module format and per-step type model.

- ✅ **Add `lessonFormat` to module state** — `'code_lab' | 'guided_tool_workflow' | 'concept_application'`; UI dropdown shows "Programming / Guided Tool Workflow / Concept & Application"; persisted in localStorage draft
- ✅ **Add `stepType` to all steps** — AI-generated steps default to `'lesson'`; manually added steps can be `'lesson'`, `'downloadable_lab_files'`, `'starter_code_file'`, or `'external_lab_link'`
- ✅ **Add Step type picker** — clicking "Add Step" shows an inline type picker with four options; step type badge shown on each card header
- ✅ **Non-lesson step fields in Screen 1** — minimal type-specific fields per step type; file upload inputs are disabled placeholders
- ✅ **Screen 2 step-type-awareness** — non-lesson steps render their configured content (description, link, file reference); lesson block view is unchanged
- ✅ **Exclude non-lesson steps from AI generation** — `generateAllLessonContent` skips steps where `stepType !== 'lesson'`
- ✅ **Default title for non-lesson steps** — new non-lesson steps default to "Hands-on practice"
- ✅ **Slides upload UI (Slice A)** — `.pptx`-only file input in Screen 1 left panel; `slideFileName` stored in App state and persisted in localStorage draft; file can be removed/replaced; no backend wiring yet
- ✅ **Slides backend upload + extraction (Slice B)** — `POST /api/upload-slides` endpoint; `multer` in-memory upload; `jszip` + `<a:t>` XML extraction; returns `{ slideText, slideCount }` to frontend; `slideText` stored in App state; subtopics made optional when slides are present
- ✅ **Wire slides into generate-structure (Slice C)** — pass `slideText` in `POST /api/generate-structure` body; update `buildGenerateStructurePrompt` to use slides as primary source when present
- ✅ **Wire slides into generate-content (Slice D)** — pass `slideText` in `POST /api/generate-content` body for `lesson` steps only; update `buildGenerateContentPrompt` to use slide context when present; non-lesson steps and Screen 2 rendering unchanged
- ✅ **Pass `lessonFormat` to AI generation** — forwarded through `lessonContentService.js` → `POST /api/generate-content` → `promptContext` → `buildGenerateContentPrompt`; prompt branches on `lessonFormat`; `code_lab` behavior unchanged
- ✅ **`guided_tool_workflow` content model** — new block types `slide` and `slide-explain` registered in `BlockEditor`; `Block` renderer handles them without crashing; `explain` block also used in this format
- ✅ **`guided_tool_workflow` generate-content prompt** — produces exactly three blocks in order: `slide`, `slide-explain`, `explain`; `slide-explain` is AI-required; `explain` is step-goal-grounded
- ✅ **Slide coverage rules in generate-structure** — instructional slides must each produce a step; non-instructional slides (title/agenda/divider/closing) may be skipped; default one slide = one step; conservative grouping only
- ✅ **Conditional lab panel** — Screen 2 right panel shown only when `starterCode` is non-empty; content-driven, not format-driven; instruction panel expands to full width when lab panel is absent
- ✅ **Hands-on Practice step from Screen 2** — "Add hands-on" button in Screen 2 sidebar; creates an empty `lesson` step with `isHandsOn: true`; auto-selects; no AI generation triggered
- ✅ **`external_link` block type** — available in `BlockEditor` for all editable steps; URL stored in `content`; renders as a link card in view mode
- ✅ **`downloadable_file` block type** — available in `BlockEditor` for all editable steps; title = filename, content = description; file upload is placeholder
- ✅ **Edit-mode branch fix** — empty-blocks steps now correctly use `BlockEditor` in edit mode (condition `blocks?.length > 0` → `Array.isArray(blocks)`)
- ✅ **`Add module lab` for hands-on steps** — dedicated narrow path (`POST /api/generate-module-lab`); condensed previous-step context; replaces "Add task with starter code" for `isHandsOn` steps; skip responses supported
- ✅ **`+ AI Example` and `+ AI Check` edit-mode actions** — shared `POST /api/generate-block` endpoint with `blockType` param; `generateBlockPrompt.js`; appends to end of block list; shared loading state; no skip path; language auto-detected from existing code blocks
- ✅ **`downloadable_file` real file upload** — `POST /api/upload-file` (disk storage, 50 MB); `express.static('/uploads')`; `fileUrl`/`fileName` stored on block; edit UI with uploading/success/error states; view mode shows download link or "No file uploaded yet"; `server/uploads/` git-ignored
- ✅ **Screen 2 sidebar widened** — `224px → 320px`
- ✅ **Screen 2 sidebar collapsible** — `‹`/`›` toggle; collapsed hides step list; main area expands; state not persisted
- ✅ **Slide placeholder aspect ratio** — `aspect-ratio: 4/3`; `max-height: 50vh`
- ✅ **Screen 1 sidebar widened** — `360px → 420px`
- ✅ **Screen 1 label copy** — "Course Name" → "Course Name / Skill Name"; subtitle updated
- ✅ **"Add hands-on" button moved inline** — now flows inside step list `<nav>` after last step; styled with blue tint + dashed border
- ✅ **Block reordering in Screen 2 edit mode** — ↑/↓ buttons in each `BlockCard` header; first block disables ↑, last block disables ↓; pure local array swap in `BlockEditor`; no prop changes outside `BlockEditor`
- ✅ **Review Sub-topics with AI** (Screen 1) — button below Sub-topics textarea (shown when non-empty); `POST /api/review-subtopics`; returns revised list + rationale or skip; suggestion panel with Apply / Dismiss; transient state, not persisted
- ✅ **`media` block type** — image upload via existing `POST /api/upload-file`; `accept="image/*"` client-side; view mode renders `<img>` inline with optional caption; red placeholder when no image uploaded; Vite dev proxy extended to cover `/uploads`
- 🔲 **Render slide content in `slide` block`** — the `slide` block currently shows only the `slideRef` label; it should render the extracted slide text for that slide number from `slideText` (per-slide structured extraction required first)
- 🔲 **Per-slide structured extraction** — `extractSlideText.js` returns a flat string; should return `slides: [{ slideNumber, text }]` so `slideRef` can be resolved to specific slide text in the UI
- ~~**Format-gate block add buttons**~~ — **intentionally not implemented**. All block types remain available in `BlockEditor` for all formats. Authors may freely mix block types regardless of `lessonFormat`. Do not revisit.
- 🔲 **End-to-end AI validation for `guided_tool_workflow`** — three-block shape verified in mock only; needs a real generation test to confirm prompt produces correct JSON
- 🔲 **Per-lesson-step optional guidance field** — a free-text guidance field on individual `lesson` step cards in Screen 1

---

## Phase 4 — Persistence (Deferred — Another Team)

Backend persistence is out of scope for the current implementation team. The localStorage hook is marked `[PERSIST HOOK]` in `App.jsx`.

- ~~Replace `localStorage.setItem` in `handleSaveDraft()` with a backend API call~~
- ~~Load draft from backend API on mount~~
- ~~Support named / multiple drafts~~

These items will be picked up by the team handling backend integration.

---

## Phase 5 — Screen Improvements

- 🔲 Drag-and-drop step reordering on Screen 1 (alternative to ↑/↓ buttons)
- ~~Replace code textarea with Monaco or CodeMirror~~ — **out of scope**
- 🔲 Copy-to-clipboard on individual instruction fields
- 🔲 Undo / redo for Screen 2 content edits

---

## Phase 6 — Multi-Module Management

- 🔲 Module list screen — browse, name, duplicate, and delete modules
- 🔲 Multiple named draft slots (requires backend)
- 🔲 Module slug / unique identifier

---

## Phase 7 — Polish & Accessibility

- 🔲 `aria-live` region for step reorder announcements
- 🔲 Keyboard navigation in the step sidebar
- 🔲 Responsive / mobile layout
- 🔲 Dark mode
- 🔲 Duplicate step title warning

---

## Known Issues

| Item | Severity | Detail |
|---|---|---|
| `slideText` is session-only | Medium | `slideText` is lost on page reload. Only `slideFileName` (the display label) is restored from localStorage. User must re-upload the PPTX after a reload for slides to influence generation. |
| `generate-content` does not use `slideText` | ~~Resolved~~ | ✅ Fixed in Slice D (Session 20) — `slideText` now passes through to the generate-content prompt for lesson steps. |
| `guided_tool_workflow` AI not yet end-to-end validated | Medium | Three-block shape tested via mock only. Real generation with GPT-5.4 has not been verified. Run a full generation pass to confirm `slide`/`slide-explain`/`explain` shape is produced correctly. |
| `Add module lab` real-model skip behavior not validated | Medium | Mock always skips for `concept_application`. Real model behavior on borderline steps (e.g. guided_tool_workflow steps with no coding, concept_application steps with a technical concept) is not yet tested end-to-end. |
| `isHandsOn` steps included in Screen 1 re-generation | Low | If the author returns to Screen 1 and re-generates content, the hands-on step is treated as a regular lesson step and will receive AI-generated content. Authors should be aware that re-generation overwrites the manually authored hands-on step. |
| Uploaded files not cleaned up | Low | `server/uploads/` grows indefinitely. No deletion on block removal. Fine for internal use now. |
| `media` block: no server-side image MIME filter | Low | `accept="image/*"` on the input only; a non-image upload produces a broken `<img>` in view mode. Add a multer `fileFilter` on `POST /api/upload-file` to harden. |
| `fileUrl` is a relative path | Info | Works same-origin. Would break if moved to a CDN or separate file server. |
| `slide` block shows reference only, not content | Medium | The `slide` block renders `slideRef` as a label (e.g. "Slide 3") but does not show the extracted slide text. Per-slide structured extraction is needed to resolve `slideRef` → text. |
| `slideText` is session-only | Medium | `slideText` is lost on page reload. Only `slideFileName` (the display label) is restored from localStorage. User must re-upload the PPTX after a reload for slides to influence generation. |
| BlockEditor shows all block types regardless of format | — | Intentional. All block types are available in all formats by design. Not a bug. |
| localStorage can restore stale Screen 2 state | Low | A saved draft with `"screen": "authoring"` will reopen Screen 2 on reload. Can surface old lesson content unexpectedly. Clear by triggering a new generation. |
| `code_lab` internal value vs "Programming" UI label | Info | The stored/internal value is still `code_lab`. The UI shows "Programming". Reconcile when convenient. |
| `starterCode` field not yet renamed | Info | The field is called `starterCode` in `LessonContent`. The intended future name is `practiceContent` (if generalized beyond code). Rename deferred to avoid disrupting current generation flow. |
| `src/utils/mockGeneration.js` is dead code | Low | No file imports it — mock behavior is server-side. Safe to delete. |
| `lessonContentService.js` JSDoc and `CONTENT_FIELDS` describe old flat schema | Low | Runtime behavior is correct. Comments reference flat fields (`concept`, `codeExample`, etc.) instead of the current block-based schema. |
| Slide text extraction has no structural awareness | Info | `<a:t>` extraction produces flat text. The model infers heading vs bullet vs body from content alone. SmartArt, speaker notes, and tables-as-drawings are not extracted. |
| Check block reveal/hide only works on newly generated content | Info | The `→ ` separator rule was added in Session 13. Existing saved drafts will not have the separator. Regenerate to get the new format. |
| Bullet list rendering only applies to `\n\n`-separated chunks | Info | Bullets inside prose without surrounding blank lines render as flat paragraphs. Regenerate to get proper rendering. |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts. |
