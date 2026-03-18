# Todo — SPL Content Generator

Backlog in priority order. Items marked ✅ are complete. Items marked 🔲 are not started.

---

## Phase 0 — Repo Hygiene & Cleanup

- ✅ Create `.gitignore` — exclude `node_modules/`, `dist/`, `.DS_Store`, `*.local`
- ✅ **Delete `src/components/LessonStructureEditor.jsx`** — dead code, not imported anywhere; superseded when the edit-mode toggle was removed in Session 2

---

## Phase 1 — Data Model & UI Stabilization

Tighten up the current implementation before adding new capabilities.

- ✅ **Add `expectedAction` and `validationNote` to `LessonContent`** — fields added to `generateLessonContent()` in `mockGeneration.js` and exposed as editable textareas in `InstructionPanelEditor`
- ✅ **Add empty-title validation on Screen 1** — warn (or block) if any step has a blank title before "Generate Lesson Content →" is clicked
- ✅ **Add re-generation confirmation on Screen 1** — clicking "Generate Structure Preview" when a structure already exists silently replaces all edits; show a confirmation prompt
- ✅ **Add re-generation confirmation on Screen 2** — navigating back to Screen 1 and clicking "Generate Lesson Content →" silently discards all Screen 2 edits; show a confirmation prompt
- ✅ **Fix `coveredSubtopics` local state drift** — `StepBuilderCard.topicsStr` resets only on `step.id` change; make it also respond to `coveredSubtopics` content changes so future bulk-edit or undo won't break it
- ✅ **Add `codeExample` field to `LessonContent`** — short annotated snippet (4–8 lines) illustrating the concept; separate from the full `starterCode` block; relabeled `concept` → "Explanation" and `instructions` → "Task" in the UI
- ✅ **Screen 2 view/edit mode** — default is a readable lesson page (prose blocks, natural scroll, no nested textareas); Edit/Save/Cancel controls in the instruction panel header; Cancel restores a snapshot; switching steps while editing silently cancels

---

## Phase 2 — AI Integration

**Prerequisite:** OpenAI API key. Add to `.env` (see `.env.example`).

- ✅ Scaffold Screen 1 service layer (`src/services/lessonStructureService.js`)
- ✅ Add Express backend proxy (`server/index.js`) with `POST /api/generate-structure`
- ✅ Wire Vite dev proxy (`/api` → `http://localhost:3001`)
- ✅ Add mock fallback behind server-side `USE_MOCK` env flag
- 🔲 **Test and verify the real OpenAI path end-to-end**
  - Copy `.env.example` to `.env`, set `OPENAI_API_KEY`, run `npm run dev:all`
  - Confirm structure generation returns valid steps from OpenAI
  - Confirm `USE_MOCK=true` path still works
- 🔲 **Screen 2: wire real AI content generation**
  - Add `POST /api/generate-content` to `server/index.js`
    - Input: `LessonStructure[]`
    - Output: `LessonContent[]` (including `expectedAction` and `validationNote`)
  - Extract `src/services/lessonContentService.js` (same three-layer pattern)
  - Update import in `App.jsx`; add `await`
- ✅ Add `isGenerating` boolean to `App.jsx` state
- ✅ Disable "Generate" buttons and show a loading indicator while generation is in progress
- ✅ Add error state: surface AI generation failures with a clear message

---

## Phase 3 — Export & Persistence

- 🔲 Add JSON export button in Screen 2 header — download `{courseName}-{moduleName}.json`; state shape is documented in [data_model.md](data_model.md), no structural changes needed
- 🔲 Replace `localStorage.setItem` in `handleSaveDraft()` with a backend API call — hook is marked `// [PERSIST HOOK]` in `App.jsx`
- 🔲 Load draft from backend API on mount (alongside or replacing the localStorage restore)
- 🔲 Support named / multiple drafts — currently only one draft slot exists in `localStorage`

---

## Phase 4 — Screen Improvements

- 🔲 Drag-and-drop step reordering on Screen 1 (alternative to ↑/↓ buttons)
- 🔲 Replace code textarea with Monaco or CodeMirror for syntax highlighting and language selection
- 🔲 Copy-to-clipboard on individual instruction fields
- 🔲 Support multiple code files per step (currently one `starterCode` string per step)
- 🔲 Undo / redo for Screen 2 content edits

---

## Phase 5 — Multi-Lesson Management

- 🔲 Lesson list screen — browse, name, duplicate, and delete lessons
- 🔲 Multiple named draft slots (localStorage or backend)
- 🔲 Lesson slug / unique identifier (currently only course + module name)

---

## Phase 6 — Polish & Accessibility

- 🔲 `aria-live` region to announce step position after ↑/↓ reorder
- 🔲 Keyboard navigation in the step sidebar (arrow keys between steps)
- 🔲 Responsive / mobile layout (currently desktop-width only)
- 🔲 Dark mode (CSS variables are in place; a dark color scheme variant is needed)
- 🔲 Duplicate step title warning

---

## Known Issues

| Item | Severity | Detail |
|---|---|---|
| ~~`coveredSubtopics` local state can drift~~ | ~~Low~~ | Fixed — `lastSentCanonicalRef` prevents user-typed round-trips from resetting the input while still syncing external changes |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts |
| ~~Generation errors use fixed messages~~ | ~~Low~~ | Fixed — `handleSubmit` catch block now uses `err.message`; server returns specific error text for 400/500 responses |
| `isGenerating` loading state invisible during mock use | Info | Mock path (`USE_MOCK=true`) is synchronous on the server — label flashes one tick; becomes visible on the real OpenAI path due to network latency |
