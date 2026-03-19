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
- ✅ **Test and verify the real OpenAI path end-to-end**
  - Verified with `gpt-5.4`; response shape `[{ title, goal, coveredSubtopics }]` matched `normalizeStructure()` contract exactly
  - Real AI content confirmed (not mock boilerplate); no code changes required
  - `USE_MOCK=true` path confirmed working (validated in Session 7)
- ✅ **Server-side prompt infrastructure** — all prompt text isolated in `server/prompts/`; `server/index.js` imports builders, no inline prompt strings; `server/lib/promptContext.js` normalizes inputs
- ✅ **Screen 2: wire real AI content generation**
  - `POST /api/generate-content` added to `server/index.js` (one call per step; mock + real paths)
  - `src/services/lessonContentService.js` created (same three-layer pattern as Screen 1)
  - `App.jsx` updated to import and `await` `generateAllLessonContent`
- ✅ **Verify Screen 2 real AI generation end-to-end** — confirmed live with GPT-5.4; block-based schema (`blocks[]`, `starterCode`, `expectedAction`, `validationNote`) working correctly; multiple live generations completed across sessions
- ✅ Add `isGenerating` boolean to `App.jsx` state
- ✅ Disable "Generate" buttons and show a loading indicator while generation is in progress
- ✅ Add error state: surface AI generation failures with a clear message

---

## Phase 3 — Export & Persistence

- ✅ **Add JSON export** — "Export JSON" button in Screen 2 header; calls `POST /api/export`; backend writes `output/{slug-course}-{slug-module}-MMDD-HHMM.json`; `output/` folder created automatically; payload includes all steps with blocks, starterCode, expectedAction, validationNote, stepGoal, stepTopics, and metadata
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
| `src/utils/mockGeneration.js` is dead code | Low | No file imports it — mock behavior is server-side. Safe to delete. |
| `src/components/LessonStructureEditor.jsx` is dead code | Low | Dead since Session 2 — never imported. Safe to delete. |
| `lessonContentService.js` JSDoc and `CONTENT_FIELDS` describe old flat schema | Low | Runtime behavior is correct (normalization handles both schemas). The comments reference `concept`, `codeExample`, `instructions` etc. — these should be updated to reflect the current block-based schema. |
| check block reveal/hide only works on newly generated content | Info | The `→ ` separator rule was added to the prompt in Session 13. Existing saved drafts generated before this session will not have the separator and will render as flat text with no reveal button. Regenerate to get the new format. |
| Bullet list rendering only applies to `\n\n`-separated chunks | Info | Bullet lists embedded inside a prose sentence (no surrounding blank lines) will still render as a flat paragraph. The prompt now instructs the model to separate lists with blank lines; regenerate to get proper rendering. |
