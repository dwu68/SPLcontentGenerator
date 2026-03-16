# Todo — SPL Content Generator

Backlog organized by phase. Items marked ✅ are complete. Items marked 🔲 are not started.

---

## Phase 0 — Repository Hygiene (do before first commit)

- 🔲 Create `.gitignore` — exclude `node_modules/`, `dist/`, `.DS_Store`, `*.local`
- 🔲 Delete or repurpose `src/components/LessonStructureEditor.jsx` — currently dead code (not imported anywhere); was superseded when the edit-mode toggle was removed

---

## Phase 1 — AI Integration (highest impact next step)

**Prerequisite:** API access to Anthropic (or similar).

- 🔲 Replace `generateLessonStructure()` in `src/utils/mockGeneration.js` with a real API call
  - Input: `courseName`, `moduleName`, `subtopicsText`
  - Output: `LessonStructure[]`
  - Hook in `App.jsx` is already marked `// [AI HOOK]`
- 🔲 Replace `generateLessonContent()` in `src/utils/mockGeneration.js` with a real API call
  - Input: `LessonStructure[]`
  - Output: `LessonContent[]`
  - Hook in `App.jsx` is already marked `// [AI HOOK]`
- 🔲 Add `isGenerating` boolean to `App.jsx` state
- 🔲 Show loading feedback in Screen 1 right pane while generating structure (skeleton or spinner)
- 🔲 Show loading feedback in Screen 2 while generating content
- 🔲 Disable "Generate" buttons during generation
- 🔲 Add error state: surface AI generation failures with a clear message

---

## Phase 2 — Export & Persistence

- 🔲 Add JSON export button in Screen 2 header — download `{courseName}-{moduleName}.json` using the existing state shape (no data model changes needed)
- 🔲 Replace `localStorage.setItem` in `handleSaveDraft()` with a backend API call — hook is marked `// [PERSIST HOOK]`
- 🔲 Load draft from backend API on mount (alongside or replacing the localStorage restore)
- 🔲 Add named drafts — currently only one draft is supported per browser

---

## Phase 3 — Screen 1 Improvements

- 🔲 Add confirmation dialog (or undo) when clicking "Generate Structure Preview" with an existing structure — currently silently replaces all manual edits
- 🔲 Add validation: warn on empty step titles before proceeding to Screen 2
- 🔲 Add drag-and-drop reordering as an alternative to ↑/↓ buttons
- 🔲 Fix `coveredSubtopics` local state drift — `StepBuilderCard.topicsStr` does not update if `coveredSubtopics` is changed from outside the card (e.g., undo). Currently safe because no such external mutation exists, but will break if bulk-edit or undo is added. See [decisions.md](decisions.md) for background.

---

## Phase 4 — Screen 2 Improvements

- 🔲 Prompt before re-generating content in Screen 2 — currently, navigating back to Screen 1 and clicking "Generate Lesson Content →" discards all Screen 2 edits silently
- 🔲 Add undo / redo for content edits
- 🔲 Replace the code textarea with a proper editor (Monaco or CodeMirror) for syntax highlighting and language selection
- 🔲 Add copy-to-clipboard on individual fields
- 🔲 Support multiple code files per step (currently one `starterCode` string per step)

---

## Phase 5 — Multi-Lesson Management

- 🔲 Lesson list screen — browse, name, duplicate, and delete lessons
- 🔲 Multiple localStorage slots (or backend records) for multiple drafts
- 🔲 Lesson naming / slug (currently only course + module name, not a unique lesson identifier)

---

## Phase 6 — Polish & Accessibility

- 🔲 Add `aria-live` region to announce step reorder to screen readers
- 🔲 Keyboard navigation for step sidebar (arrow keys between steps)
- 🔲 Mobile / responsive layout (currently optimized for desktop-width only)
- 🔲 Dark mode support (CSS variables are in place; color scheme would need a dark variant)
- 🔲 Validate duplicate step titles

---

## Known Issues / Rough Edges

| Item | Severity | Detail |
|---|---|---|
| `LessonStructureEditor.jsx` is dead code | Low | Not imported. Safe to delete. |
| No loading state for generation | Medium | Unnoticeable with mock (synchronous), but will produce a frozen UI once real async AI calls are added. |
| `coveredSubtopics` local state can drift | Low | See Phase 3 item above and [decisions.md](decisions.md). Currently safe. |
| Re-generation silently discards Screen 2 edits | Low-Medium | No warning is shown. Intentional for now; should be addressed in Phase 3. |
| State comment drift in `App.jsx` | Low | The JSDoc comment block at the top of `App.jsx` still mentions `isStructureEdit` which was removed. Should be cleaned up. |
| All state in one `App.jsx` | Low | Manageable now. If the app gains a third screen or cross-screen features, consider extracting `BuilderContext` and `AuthoringContext`. |
