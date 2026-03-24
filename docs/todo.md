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
- 🔲 **Pass `lessonFormat` to AI generation** — `lessonFormat` is in state but not yet forwarded to `POST /api/generate-structure` or `POST /api/generate-content`; prompts should use it to adjust generation style
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
| Non-lesson steps render as lesson view in Screen 2 | Medium | `LessonAuthoringView` does not yet branch by `stepType`. Non-lesson steps open in Screen 2 showing an empty lesson panel. Next implementation slice. |
| `lessonFormat` not yet forwarded to AI generation | Low | `lessonFormat` is in state and persisted but not yet passed to `POST /api/generate-structure` or `POST /api/generate-content`. Prompts ignore it for now. |
| AI generation runs for all steps regardless of type | Low | `generateAllLessonContent` is called for every step; non-lesson steps will fail or produce nonsense content if navigated to. Next slice will filter to `lesson` steps only. |
| localStorage can restore stale Screen 2 state | Low | A saved draft with `"screen": "authoring"` will reopen Screen 2 on reload. Can surface old lesson content unexpectedly. Clear by triggering a new generation. |
| `code_lab` internal value vs "Programming" UI label | Info | The stored/internal value is still `code_lab`. The UI shows "Programming". These should be reconciled when the value is first used meaningfully (e.g. passed to AI prompts). |
| `starterCode` field not yet renamed | Info | The field is called `starterCode` in `LessonContent`. The intended future name for lesson steps is `workingMaterial`. Rename deferred to avoid disrupting the current generation flow. |
| `src/utils/mockGeneration.js` is dead code | Low | No file imports it — mock behavior is server-side. Safe to delete. |
| `lessonContentService.js` JSDoc and `CONTENT_FIELDS` describe old flat schema | Low | Runtime behavior is correct. Comments reference flat fields (`concept`, `codeExample`, etc.) instead of the current block-based schema. Should be updated. |
| Check block reveal/hide only works on newly generated content | Info | The `→ ` separator rule was added to the prompt in Session 13. Existing saved drafts will not have the separator. Regenerate to get the new format. |
| Bullet list rendering only applies to `\n\n`-separated chunks | Info | Bullets embedded inside prose without surrounding blank lines render as flat paragraphs. Regenerate to get proper rendering. |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts. |
