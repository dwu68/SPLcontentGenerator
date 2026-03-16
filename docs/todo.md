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
- 🔲 **Add empty-title validation on Screen 1** — warn (or block) if any step has a blank title before "Generate Lesson Content →" is clicked
- ✅ **Add re-generation confirmation on Screen 1** — clicking "Generate Structure Preview" when a structure already exists silently replaces all edits; show a confirmation prompt
- ✅ **Add re-generation confirmation on Screen 2** — navigating back to Screen 1 and clicking "Generate Lesson Content →" silently discards all Screen 2 edits; show a confirmation prompt
- 🔲 **Fix `coveredSubtopics` local state drift** — `StepBuilderCard.topicsStr` resets only on `step.id` change; make it also respond to `coveredSubtopics` content changes so future bulk-edit or undo won't break it

---

## Phase 2 — AI Integration

**Prerequisite:** API access to Anthropic (or similar).

- 🔲 Replace `generateLessonStructure()` in `src/utils/mockGeneration.js` with a real API call — hook in `App.jsx` is marked `// [AI HOOK]`
  - Input: `courseName`, `moduleName`, `subtopicsText`
  - Output: `LessonStructure[]`
- 🔲 Replace `generateLessonContent()` in `src/utils/mockGeneration.js` with a real API call — hook in `App.jsx` is marked `// [AI HOOK]`
  - Input: `LessonStructure[]`
  - Output: `LessonContent[]` (including `expectedAction` and `validationNote`)
- 🔲 Add `isGenerating` boolean to `App.jsx` state
- 🔲 Disable "Generate" buttons and show a loading indicator while generation is in progress
- 🔲 Add error state: surface AI generation failures with a clear message

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
| No loading state for generation | Medium | Mock is synchronous so invisible now; will cause a frozen UI when real async AI calls land |
| `coveredSubtopics` local state can drift | Low | Safe currently; will break if undo or bulk-edit is added — Phase 1 |
| Re-generation silently discards edits | Low–Medium | No confirmation prompt on Screen 1 or Screen 2 — Phase 1 |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts |
