# Session Handoff — SPL Content Generator

---

## END-OF-SESSION SUMMARY (Session 31, 2026-03-31)

### What was completed this session

| # | Feature | Status |
|---|---|---|
| 1 | **Remove Export JSON button** — button, handler, and all wiring removed entirely | ✅ Done |
| 2 | **"Next Module →" button in Screen 2 header** — appears to the right of "← Back to Builder" | ✅ Done |
| 3 | **Confirmation dialog before clearing module** — warns user to save draft first | ✅ Done |
| 4 | **Full module state reset on confirm** — all 14 state variables reset to defaults, localStorage draft cleared | ✅ Done |

### Important decisions made

- **Export JSON removed entirely** — not left as dead code. The feature was already de-prioritized in the docs; removing it cleans up the header and the codebase.
- **"Next Module →" is always shown on Screen 2** — not gated on whether content exists. An author might want to start fresh even before generating content.
- **localStorage is cleared on "Next Module" confirm** — `localStorage.removeItem(STORAGE_KEY)` fires before any state reset, so a page refresh after confirming starts fully clean.
- **Button order in header (left to right):** SaveStatus → Save Draft → ← Back to Builder → Next Module →. "Next Module" is rightmost as a deliberate forward/exit action distinct from the back-navigation cluster.

### Files changed this session

| File | What changed |
|---|---|
| `src/App.jsx` | Removed `handleExport` (entire async function + fetch); added `handleNextModule` (confirm + localStorage clear + full state reset); updated `<Header>` props (dropped `onExport`, added `onNextModule`) |
| `src/components/Header.jsx` | Removed `onExport` prop + Export JSON button; added `onNextModule` prop + "Next Module →" button; updated JSDoc |

No new files created. No files deleted.

### What is currently working

Everything from Sessions 1–30, plus:
- "Next Module →" button in Screen 2 header (right of "← Back to Builder")
- Confirmation dialog with clear message before clearing the module
- Full state reset to blank Screen 1 on confirm, including localStorage draft removal
- Export JSON button and its server wiring fully removed

### What is not implemented yet (top remaining items)

| Item | Priority | Notes |
|---|---|---|
| **Per-slide structured extraction** | Medium | `extractSlideText.js` returns flat string; needs `slides: [{ slideNumber, text }]` |
| **Render slide text in `slide` block** | Medium | Depends on structured extraction above |
| **End-to-end AI validation for `guided_tool_workflow`** | Medium | Three-block shape confirmed in mock; needs a real generation pass |
| **`concept_application` prompt branch** | Low | Format value forwarded to AI but no dedicated prompt |
| **Per-lesson-step optional guidance field** | Low | Free-text field on Screen 1 step cards |
| **Delete `src/utils/mockGeneration.js`** | Low | Dead code — nothing imports it; safe to delete |

### Next 3 recommended steps (in order)

1. **Per-slide structured extraction** — change `extractSlideText.js` to return `{ slides: [{ slideNumber, text }], fullText: string }`. `fullText` preserves backward compat with all existing prompt code. Server-side only, no UI impact.

2. **Render slide text in `slide` block** — once extraction is structured, resolve `slideRef` → slide text in the `Block` renderer. Falls back gracefully to "Slide N" label when `slideText` is absent. This closes the most visible gap in `guided_tool_workflow` content.

3. **Delete dead code** — remove `src/utils/mockGeneration.js` (nothing imports it). Clean up `lessonContentService.js` JSDoc to reference the block-based schema instead of flat fields.

### Known issues / rough edges

| Item | Severity | Notes |
|---|---|---|
| `slideText` session-only | Medium | Lost on page reload; user must re-upload PPTX. By design for now. |
| `slide` block shows reference only, not content | Medium | Renders `slideRef` label (e.g. "Slide 3"); per-slide extraction needed |
| `concept_application` has no prompt branch | Low | Generates content but with no format-specific guidance |
| Module Summary pushed non-last by "Add Step" | Low | Manually added steps append after the summary; authors can reorder with ↑/↓ |
| `src/utils/mockGeneration.js` dead code | Low | Safe to delete |
| `lessonContentService.js` JSDoc stale | Low | References flat schema fields; runtime is correct |
| `code_lab` internal value vs "Programming" UI label | Info | Not reconciled; low urgency |
| `starterCode` field not yet renamed to `practiceContent` | Info | Deferred |

### Recommended git commit messages

**Recommended:**
```
feat: add Next Module button and remove Export JSON
```

**Alternative 1:**
```
feat: Next Module flow — header button, confirm dialog, full state + localStorage reset
```

**Alternative 2:**
```
feat: replace Export JSON with Next Module action in Screen 2 header
```

---

**ID** 30
**Date:** 2026-03-30
**Session scope:** Slide placeholder sizing fix (Screen 2 view mode)

### What was completed this session

| # | Feature | Status |
|---|---|---|
| 1 | **Block reordering in Screen 2 edit mode** | ✅ Done |
| 2 | **Format-gating block types** — intentionally removed from backlog | ✅ Decision |
| 3 | **"Resume step content editing" button on Screen 1** | ✅ Done |
| 4 | **Back-to-builder confirmation dialog** | ✅ Done |
| 5 | **Module Summary step always last in generated structure** | ✅ Done |
| 6 | **Slide placeholder centered and constrained (max-width: 700px)** | ✅ Done |

### Important decisions made

- **All block types remain available in all formats** — `BlockEditor` add-block row is not format-gated. Intentional; do not revisit. Recorded in `docs/todo.md` and memory.
- **Module Summary enforced at two layers** — prompt instruction + normalization fallback. Tolerant detection (`includes('summary')`, case-insensitive) on last step to avoid duplicates from AI near-variants.
- **`coveredSubtopics: ['module summary']`** used in the normalization fallback (not empty array).
- **Back-to-builder confirm is accurate** — wording says content is lost "if you regenerate", not "just by clicking back", because that's what actually happens.

### Files changed this session

| File | What changed |
|---|---|
| `src/components/BlockEditor.jsx` | `handleMoveUp`/`handleMoveDown`; `isFirst`/`isLast`/`onMoveUp`/`onMoveDown` props on `BlockCard`; ↑ ↓ buttons in card header; updated JSDoc |
| `src/components/LessonStructurePreview.jsx` | `onResumeAuthoring` prop + "Resume step content editing" button in footer |
| `src/App.jsx` | `handleBackToBuilder` confirm guard; `onResumeAuthoring` prop wired to `LessonStructurePreview` |
| `src/App.css` | `.block-editor-card-header-actions` + `.block-reorder-btn` styles; `structure-footer` → `flex-direction: row`; `.block-slide-placeholder` → `max-width: 700px` + `margin: 0 auto` |
| `src/services/lessonStructureService.js` | Summary step guarantee appended in `normalizeStructure()` |
| `server/prompts/generateStructurePrompt.js` | "REQUIRED FINAL STEP" block added to `footer` and `slideFooter` |
| `docs/todo.md` | Block reordering ✅; format-gating marked intentional |
| `docs/product_overview.md` | Current state updated to Session 30; new features added to "What is live" list |
| `docs/session_handoff.md` | Sessions 28, 29, 30 entries added |

No new files created. No files deleted.

### What is currently working

Everything from Sessions 1–27, plus:
- ↑/↓ reorder buttons on every block card in edit mode (disabled at boundaries)
- "Resume step content editing" on Screen 1 when content exists
- Confirm dialog before navigating back to Screen 1
- Module Summary step always present as the last generated step
- Slide placeholder centered, constrained to 700px max-width, responsive

### What is not implemented yet (top remaining items)

| Item | Priority | Notes |
|---|---|---|
| **Per-slide structured extraction** | Medium | `extractSlideText.js` returns flat string; needs `slides: [{ slideNumber, text }]` |
| **Render slide text in `slide` block** | Medium | Depends on structured extraction above |
| **End-to-end AI validation for `guided_tool_workflow`** | Medium | Three-block shape tested with real AI (confirmed working), but worth a fresh generation pass after slide rendering is added |
| **`concept_application` prompt branch** | Low | Format value forwarded to AI but no dedicated prompt; falls through to undefined behavior |
| **Per-lesson-step optional guidance field** | Low | Free-text field on Screen 1 step cards |
| **Delete `src/utils/mockGeneration.js`** | Low | Dead code — nothing imports it; safe to delete |

### Next 3 recommended steps (in order)

1. **Per-slide structured extraction** — change `extractSlideText.js` to return `{ slides: [{ slideNumber, text }], fullText: string }`. `fullText` preserves backward compat with existing prompt code. Server-side only, no UI impact.

2. **Render slide text in `slide` block** — once extraction is structured, pass `slideText` (parsed) into Screen 2 and resolve `slideRef` → slide text in the `Block` renderer. Falls back gracefully to "Slide N" label when `slideText` is absent.

3. **Delete dead code** — remove `src/utils/mockGeneration.js`. One-line change, zero risk. Clean up `lessonContentService.js` JSDoc to reference block-based schema instead of flat fields.

### Known issues / rough edges

| Item | Severity | Notes |
|---|---|---|
| `slideText` session-only | Medium | Lost on page reload; user must re-upload PPTX. By design for now. |
| `concept_application` has no prompt branch | Low | Generates content but with no format-specific guidance |
| Module Summary pushed non-last by "Add Step" | Low | Manually added steps via Screen 1 "Add Step" append after the summary. Authors can reorder with ↑/↓. |
| `src/utils/mockGeneration.js` dead code | Low | Safe to delete |
| `lessonContentService.js` JSDoc stale | Low | References flat schema fields; runtime is correct |
| `code_lab` internal value vs "Programming" UI label | Info | Not reconciled; low urgency |
| `starterCode` field not yet renamed to `practiceContent` | Info | Deferred |

### Recommended git commit messages

**Recommended:**
```
feat: block reorder, module summary step, resume-authoring button, and UX guards
```

**Alternative 1:**
```
feat: Screen 2 block reordering + guaranteed Module Summary step + Screen 1 resume navigation
```

**Alternative 2:**
```
feat: edit-mode block reorder, always-present summary step, back/resume nav guards
```

---

**ID** 30
**Date:** 2026-03-30
**Session scope:** Slide placeholder sizing fix (Screen 2 view mode)

---

## What Was Completed This Session

### Fix — Slide placeholder sizing (Screen 2)

The `slide` block placeholder in view mode was stretching to the full width of the instruction panel. Fixed by constraining it to a real slide proportion and centering it.

**CSS-only change** to `.block-slide-placeholder` in `App.css`:
- Added `max-width: 700px` — caps the card at a sensible slide width (700×525 at 4:3)
- Added `margin: 0 auto` — centers the card horizontally in the panel
- `width: 100%` kept — allows responsive shrink on narrow viewports
- `aspect-ratio: 4/3` and `max-height: 50vh` unchanged

No component, state, or logic changes.

---

## Files Changed This Session

| File | Change |
|---|---|
| `src/App.css` | `.block-slide-placeholder`: added `max-width: 700px` and `margin: 0 auto` |

---

**ID** 29
**Date:** 2026-03-30
**Session scope:** Always-present Module Summary step; "Resume step content editing" button on Screen 1; Back-to-builder confirmation dialog

---

## What Was Completed This Session

### Feature — Module Summary step always last in generated structure

Every generated lesson structure now ends with a "Module Summary" step, regardless of whether generation used subtopics, slides, or both.

**Two-layer enforcement:**

1. **Prompt** (`server/prompts/generateStructurePrompt.js`) — a "REQUIRED FINAL STEP" block was added to both `footer` (subtopics branch) and `slideFooter` (slides branches). Instructs the AI to use exactly the title "Module Summary", write a consolidation goal, list major topics in `coveredSubtopics`, and set `slideNumbers: []`.

2. **Normalization fallback** (`src/services/lessonStructureService.js`) — after `.map()`, checks the last step's title (case-insensitive `.includes('summary')`). If absent, appends a fallback step: title "Module Summary", standard goal, `coveredSubtopics: ['module summary']`, `slideNumbers: []`. Tolerant check prevents duplicate when AI uses a near-match title.

### Feature — "Resume step content editing" button on Screen 1

When `lessonContent` already exists, a secondary "Resume step content editing" button appears in the Screen 1 footer alongside "Generate Lesson Content →". Clicking it navigates directly to Screen 2 without triggering any generation. Disabled while generation is in progress.

- `LessonStructurePreview` receives `onResumeAuthoring` prop (null when no content exists → button absent)
- `App.jsx` passes `() => setScreen('authoring')` when `lessonContent.length > 0`
- `structure-footer` changed from `flex-direction: column` to `flex-direction: row` so both buttons sit side by side

### Feature — Back-to-builder confirmation dialog

`handleBackToBuilder` in `App.jsx` now shows `window.confirm()` when `lessonContent.length > 0`. The message accurately states that content will be lost *if the user regenerates from Screen 1*, not just by navigating back.

---

## Important Decisions Made

- **Both prompt + normalization** for summary step — prompt gives AI a chance to author a meaningful summary; normalization guarantees presence regardless of AI behavior.
- **Tolerant summary detection** — `title.toLowerCase().includes('summary')` rather than exact match, to avoid duplicate on AI near-variants.
- **`coveredSubtopics: ['module summary']`** in the normalization fallback (not empty array) — consistent with how the field is used elsewhere.
- **Back-to-builder confirm** only fires when `lessonContent.length > 0` — no dialog on first use before any content exists.

---

## Files Changed This Session

| File | Change |
|---|---|
| `server/prompts/generateStructurePrompt.js` | Added REQUIRED FINAL STEP block to `footer` and `slideFooter` |
| `src/services/lessonStructureService.js` | Summary step guarantee in `normalizeStructure()` |
| `src/components/LessonStructurePreview.jsx` | `onResumeAuthoring` prop + "Resume step content editing" button |
| `src/App.jsx` | `handleBackToBuilder` confirm guard; `onResumeAuthoring` prop wired |
| `src/App.css` | `structure-footer` changed to `flex-direction: row` |
| `docs/todo.md` | Block reordering and format-gating entries updated |
| `docs/session_handoff.md` | This entry |

---

**ID** 28
**Date:** 2026-03-30
**Session scope:** Block reordering in Screen 2 edit mode

---

## What Was Completed This Session

### Feature — Block reordering (↑/↓) in Screen 2 edit mode

In edit mode, each block card in the instruction panel now has ↑ and ↓ reorder buttons in its card header, to the left of the existing × delete button.

- ↑ is disabled on the first block; ↓ is disabled on the last block; both disabled when only one block exists.
- Each click performs an immutable adjacent-swap on the `blocks` array and calls `onUpdate`, which flows through the existing `onUpdateContent` path — no new state or props needed outside `BlockEditor`.
- The reorder buttons are styled as transparent icon buttons (matching the delete button's size and border radius) with a subtle hover state; they dim to 25% opacity when disabled.
- The right side of the card header is now wrapped in `.block-editor-card-header-actions` (flex row, 4px gap) to keep the three controls aligned cleanly.

**Architecture:** entirely self-contained within `BlockEditor.jsx`. No prop or handler changes in `LessonAuthoringView`, `App.jsx`, or the server.

---

## Important Decisions Made

- **Disabled, not hidden** for out-of-range buttons — consistent with the ↑/↓ pattern on Screen 1 step reorder.
- **`block-editor-card-header-actions` wrapper** introduced to group the right-side controls (↑ ↓ ×) without changing the flex layout of the card header.
- **No interaction with AI actions** — reorder is a synchronous local op; no need to disable during `isAddingBlock` or other generation states.

---

## Files Changed This Session

| File | Change |
|---|---|
| `src/components/BlockEditor.jsx` | `handleMoveUp` / `handleMoveDown` in `BlockEditor`; `isFirst`/`isLast`/`onMoveUp`/`onMoveDown` props on `BlockCard`; ↑ ↓ buttons in card header; updated JSDoc |
| `src/App.css` | Added `.block-editor-card-header-actions` and `.block-reorder-btn` styles |
| `docs/todo.md` | Marked block reordering ✅ |
| `docs/session_handoff.md` | This entry |

---

## What Is Currently Working

- All previous functionality from Sessions 1–27 remains intact.
- ↑/↓ buttons appear in every block card header in edit mode.
- First block: ↑ disabled. Last block: ↓ disabled. Single block: both disabled.
- Reordering updates app state immediately; step is marked dirty; Save Draft persists the new order.
- `key={block.id}` is stable across reorders — React reconciles in place; `uploadStatus` local state in `downloadable_file` cards survives reordering without reset.

---

**ID** 27
**Date:** 2026-03-30
**Session scope:** "Add AI Example" and "Add AI Check" edit-mode actions in Screen 2; minor UI alignment fixes (sidebar header height, "LESSON STEPS" / "INSTRUCTIONS" alignment)

---

## What Was Completed This Session

### Feature — "Add AI Example" and "Add AI Check" in Screen 2 edit mode

Two new AI-assisted actions available in edit mode in the Screen 2 instruction panel header:

- **+ AI Example** — generates a new filled `code` block grounded in the current step's existing blocks. The generated block is a short annotated runnable example (5–20 lines), not a TODO exercise.
- **+ AI Check** — generates a new filled `check` block grounded in the current step's existing blocks. The check follows the existing reveal convention: `question text\n→ answer text`.

Both actions append the generated block to the **end** of the current step's block list. No cap — each click appends another block.

**Architecture — one shared endpoint with `blockType` parameter:**

A deliberate divergence from the one-action-per-file pattern. Since both actions take identical input (step context + current blocks) and return a single block, one shared endpoint + one shared prompt file was chosen over two separate files.

**5-layer stack:**

| Layer | File | Notes |
|---|---|---|
| Prompt | `server/prompts/generateBlockPrompt.js` | `buildGenerateBlockPrompt({ ..., blockType, language })`; type-specific guidance sections; `code` branch enforces `language` field; `check` branch enforces `\n→ ` separator |
| Route | `server/index.js` | `POST /api/generate-block`; `blockType` validated; mock returns plausible blocks for both types |
| Service | `src/services/lessonContentService.js` | `generateBlockForStep(...)`; validates `raw.block.type`; no skip path |
| Handler | `src/App.jsx` | `handleAddBlock(blockType, currentBlocks)`; detects `language` from first existing `code` block in step, falls back to `'python'`; appends with `id: block-${Date.now()}` |
| UI | `src/components/LessonAuthoringView.jsx` | `isAddingBlock` + `addBlockError` shared local state; both buttons disabled while either is generating; error cleared on edit-mode exit |

**Response shape:**
```json
{ "block": { "type": "code", "title": "Example", "language": "python", "content": "..." } }
{ "block": { "type": "check", "title": "Knowledge Check", "content": "Question?\n→ Answer." } }
```

No skip path — these blocks can always be generated for any instructional content.

### UI — Sidebar header height alignment

- `step-sidebar-toggle` padding increased from `1px 3px` → `5px 4px` so the toggle button's total height (~26px) matches `btn-sm` (~27px). This makes the "LESSON STEPS" and "INSTRUCTIONS" headers visually the same height.

---

## Important Decisions Made

- **One endpoint, one prompt file (`generateBlockPrompt.js`)** for both `code` and `check` block generation. The `blockType` parameter drives the type-specific guidance section. Rationale: both actions are structurally identical across all layers; separate files would be duplication without benefit.
- **No skip path** for these actions. Unlike `generate-task`, there is no meaningful "unsuitable" condition for adding an example or a check to a teaching step.
- **Shared `isAddingBlock` state** — both buttons share one loading flag. A second click on either button while one is in flight is blocked. No parallel requests.
- **Language detection** — scans `currentBlocks` for the first `code` block and reuses its `language`; falls back to `'python'`. No author-facing language picker yet.
- **No format-gating** — both buttons appear for all `lessonFormat` values (consistent with existing deferred format-gating policy).
- **No cap** on how many AI blocks can be appended — consistent with the manual add-block behaviour.

---

## Files Changed This Session

| File | Change |
|---|---|
| **New** `server/prompts/generateBlockPrompt.js` | Prompt builder for single-block generation; `blockType: 'code' \| 'check'`; type-specific guidance; shared block serializer |
| `server/index.js` | Import `buildGenerateBlockPrompt`; `mockGenerateBlock(step, blockType, language)`; `POST /api/generate-block` route |
| `src/services/lessonContentService.js` | New export `generateBlockForStep(...)` |
| `src/App.jsx` | Import `generateBlockForStep`; `handleAddBlock(blockType, currentBlocks)` handler; `onAddBlock` prop wired to `LessonAuthoringView` |
| `src/components/LessonAuthoringView.jsx` | `onAddBlock` prop threaded; `isAddingBlock` + `addBlockError` state; `handleAddBlockClick(blockType)`; `+ AI Example` and `+ AI Check` buttons in edit-mode panel header; `addBlockError` inline display |
| `src/App.css` | `.step-sidebar-toggle` padding `1px 3px` → `5px 4px` (header height alignment) |

---

## What Is Currently Working

- All previous functionality from Sessions 1–26 remains intact.
- "+ AI Example" and "+ AI Check" appear in edit mode for all step types and all formats.
- Both buttons are disabled while either is generating; loading label shows "Generating…".
- Generated blocks are appended to the end of the block list and immediately visible in the editor.
- Error state shown inline below the panel header; cleared when edit mode exits.
- Sidebar header ("LESSON STEPS") and instruction panel header ("INSTRUCTIONS") are now visually aligned.

---

## What Is Not Implemented Yet

- **Format-gating block add buttons** — `+ AI Example` / `+ AI Check` appear for all formats; `slide`/`slide-explain` manual add buttons still appear for `code_lab` steps. Deferred.
- **Language picker for AI Example** — defaults to first existing `code` block's language or `python`. No author control.
- **`guided_tool_workflow` AI generation not end-to-end validated** — three-block shape tested via mock only.
- **`concept_application` prompt branch** — format value exists but no dedicated prompt.
- **Per-slide structured extraction** — `slide` block shows `slideRef` label only; no actual slide text rendered.
- **`[DIAG]` console logs** — still in `callProvider` and the generate-content route.

---

## Recommended Next Steps

**1. End-to-end validate `+ AI Example` and `+ AI Check` with real model**
Run both actions on a live `code_lab` step with real content and confirm the generated blocks are well-grounded, correctly formatted, and appended cleanly. Specifically verify the `\n→ ` separator appears correctly in the rendered `check` block reveal.

**2. Format-gate block add buttons in `BlockEditor`**
Filter `ADD_TYPES` based on a `lessonFormat` prop passed to `BlockEditor`. Removes `slide`/`slide-explain` from `code_lab` editors and `code`/`check`/`task`/`hint` from `guided_tool_workflow`. Small, well-scoped, no data model change.

**3. Remove `[DIAG]` console logs**
`callProvider` in `lessonContentService.js` and the generate-content route in `server/index.js` both emit `[DIAG]` logging. Safe to remove now.

---

## Known Issues / Rough Edges

| Item | Severity | Detail |
|---|---|---|
| No language picker for `+ AI Example` | Low | Language is inferred from existing `code` blocks; no override. First `code` block wins if multiple exist with different languages. |
| `+ AI Example` visible in `guided_tool_workflow` | Low | Format-gating deferred; a `code` block is atypical in GTW steps but not blocked. |
| No cap on AI block generation | Info | Authors can click `+ AI Example` or `+ AI Check` repeatedly and get duplicates. Intentional for now. |
| `[DIAG]` logs still in production code | Low | Carry-forward from Session 24. |
| `guided_tool_workflow` real-model validation pending | Medium | Carry-forward from Session 25. |
| `src/utils/mockGeneration.js` is dead code | Low | Nothing imports it. Safe to delete. |

---

## Git

### Recommended commit message
```
feat: Add AI Example and Add AI Check edit-mode actions in Screen 2
```

### Alternative messages
```
feat: AI-generated code example and knowledge check blocks via POST /api/generate-block
```
```
feat(session-27): generate-block endpoint + AI Example / AI Check UI actions
```

### Commands

```bash
git add server/prompts/generateBlockPrompt.js \
  server/index.js \
  src/App.css \
  src/App.jsx \
  src/components/LessonAuthoringView.jsx \
  src/services/lessonContentService.js

git commit -m "feat: Add AI Example and Add AI Check edit-mode actions in Screen 2"
```

> **Do not commit** `output/claude-code-prompt-engineering-for-coding-0327-1223.json` — untracked generated output file. Consider adding `output/*.json` to `.gitignore`.

---

**ID** 26
**Date:** 2026-03-30
**Session scope:** UI polish pass (sidebar widths, collapsible sidebar, slide placeholder proportions, label copy) + `downloadable_file` real file upload + "Add hands-on" button relocation and visual treatment

---

## What Was Completed This Session

### UI Polish — Screen 1

- **Left setup sidebar widened:** `360px → 420px`. Form inputs have more horizontal room.
- **Label renamed:** "Course Name" → "Course Name / Skill Name" (`LessonInputForm.jsx`).
- **Subtitle copy updated:** "Enter course details and the list of topics you want to cover. Each topic becomes one step in the lesson." → "Enter course/skill details and the list of topics you want to cover. AI will generate lesson steps accordingly."

### UI Polish — Screen 2

- **Left lesson-steps sidebar widened in two increments:** `224px → 280px → 320px`. Step titles have significantly more room before truncating.
- **Sidebar made collapsible:** A `‹` / `›` toggle button sits in the sidebar header. When collapsed, the sidebar shrinks to 36px and the step list is hidden; the main authoring area expands to fill the freed space. Toggle state is local React state (`isSidebarCollapsed`) in `LessonAuthoringView`. Collapsed state hides the step list and header label via `.step-sidebar--collapsed` modifier class. Not persisted to localStorage — collapses reset on reload.
- **Slide placeholder aspect ratio:** `.block-slide-placeholder` updated to `aspect-ratio: 4 / 3` with `max-height: 50vh` so it never dominates the viewport. Previously it had only a `min-height: 120px` with no upper bound.

### Feature — `downloadable_file` real file upload

The `downloadable_file` block type previously stored only a title and description with a "coming soon" placeholder. It now supports real file upload.

**Block shape extension (additive, no breaking change):**
```js
{
  id, type, title, content,   // existing fields unchanged
  fileUrl:  string,            // new — e.g. "/uploads/1711808000000-myfile.csv"
  fileName: string,            // new — original filename for display / download attribute
}
```

**Backend (`server/index.js`):**
- `server/uploads/` directory created on server startup (`fs.mkdirSync`) if absent.
- `express.static(UPLOADS_DIR)` serves `/uploads/<filename>` as static assets.
- `fileUpload` multer config: disk storage, `Date.now()-safeName` filename, 50 MB limit, no MIME filter.
- `POST /api/upload-file` — accepts `multipart/form-data` with field `file`; returns `{ fileUrl, fileName }`.

**Edit mode (`BlockEditor.jsx`):**
- Local state: `uploadStatus` (`'idle' | 'uploading' | 'success' | 'error'`) and `uploadError`.
- Hidden `<input type="file">` + styled `<label>` trigger button (same pattern as slides upload).
- Upload fires immediately on file selection; no explicit submit step.
- Button label: "Choose file" (no file yet) / "Replace file" (file already attached).
- Status text below button: muted for idle, blue for uploading, green for success, red for error.
- On success: calls `onChange({ fileUrl, fileName })` to write into block state.
- On re-upload: overwrites `fileUrl` and `fileName` cleanly.

**View mode (`LessonAuthoringView.jsx`):**
- If `block.fileUrl` is present: renders `<a href={fileUrl} download={fileName}>⬇ filename</a>`.
- If absent: renders "No file uploaded yet" (replaces "File upload — coming soon").

**`.gitignore`:** `server/uploads/` added. `server/uploads/.gitkeep` keeps the directory tracked while ignoring its contents.

### UI — "Add hands-on" button relocation and styling

- **Moved** from a separate `<div class="step-sidebar-footer">` (pinned at the bottom of the sidebar) into the `<nav class="step-sidebar-list">` directly after the last step item. Button now flows inline below the last step.
- **`.step-sidebar-footer`** CSS block removed entirely (dead code after move).
- **Visual treatment:** Button now has a light-blue tinted background (`#eff6ff`), primary-color text, and a dashed blue border (`#bfdbfe`). Hover deepens to `#dbeafe` with a solid primary border. Clearly distinguishable from the plain step-nav buttons above it.

---

## Important Decisions Made

- **`fileUrl` / `fileName` on the block itself** — the uploaded file reference lives on the `downloadable_file` block object, making blocks self-contained. No new step-level fields added.
- **Disk storage, not memory** — uploaded files survive server restarts. `server/uploads/` is git-ignored via `.gitignore`.
- **No MIME filter on `/api/upload-file`** — any file type is accepted (CSV, PDF, zip, etc.). Filtering can be added later if needed.
- **Collapsed sidebar state not persisted** — intentional. Reload always starts with the sidebar open. Adding localStorage persistence for this would be a one-liner if desired.
- **`max-height: 50vh` on slide placeholder** — content-driven cap; the 4:3 aspect ratio is maintained via CSS `aspect-ratio` and the cap prevents a very tall viewport from producing an oversized placeholder.

---

## Files Changed This Session

| File | Change |
|---|---|
| `.gitignore` | Added `server/uploads/` |
| `server/uploads/.gitkeep` | **New** — keeps directory tracked |
| `server/index.js` | `UPLOADS_DIR` setup + `fs.mkdirSync`; `express.static('/uploads')`; `fileUpload` multer (disk); `POST /api/upload-file` route |
| `src/components/BlockEditor.jsx` | Added `useState` import; `fileUrl`/`fileName` destructured from block; `uploadStatus`/`uploadError` local state; `handleFileChange` async upload handler; file upload UI section in `downloadable_file` cards |
| `src/components/LessonAuthoringView.jsx` | `downloadable_file` view: real download `<a>` vs "No file uploaded yet"; "Add hands-on" button moved from footer into nav |
| `src/components/LessonInputForm.jsx` | Label: "Course Name" → "Course Name / Skill Name"; subtitle copy updated |
| `src/App.css` | `.builder-left` width `360px → 420px`; `.step-sidebar` width `224px → 320px`; `.step-sidebar--collapsed` rule simplified; `.step-sidebar-footer` block removed; `.step-sidebar-add-handson` restyled (blue tint, dashed border); `.block-slide-placeholder` `aspect-ratio: 4/3` + `max-height: 50vh`; `.block-downloadable-file-link` (download link); `.block-file-upload*` upload control styles |

---

## What Is Currently Working

- All previous functionality from Sessions 1–25 remains intact.
- File upload on `downloadable_file` blocks: choose file → upload → download link shown in view mode.
- Re-upload overwrites block reference cleanly.
- Sidebar collapse/expand toggle.
- "Add hands-on" flows inline below last step with clear visual treatment.
- Slide placeholder renders at 4:3, capped at 50vh.
- Screen 1 label and subtitle copy updated.

---

## What Is Not Implemented Yet

- **`slideText` per-slide structured extraction** — flat text only; `slide` block shows ref label not actual slide content.
- **Format-gating block add buttons** — `slide`/`slide-explain` still appear in `code_lab` editors; `code`/`check`/`task`/`hint` still appear in `guided_tool_workflow` editors.
- **`guided_tool_workflow` AI not end-to-end validated** — three-block shape tested via mock only.
- **`concept_application` format** — lessonFormat value exists and is forwarded; no dedicated prompt branch yet.
- **Backend persistence** — localStorage only; deferred to another team.
- **`[DIAG]` console logs** — still in `callProvider` and the generate-content route.

---

## Recommended Next Steps

**1. End-to-end validate `guided_tool_workflow` generation with real model**
Run a full generation pass on a GTW module (with slides if possible), confirm the three-block shape (`slide`, `slide-explain`, `explain`) is produced correctly by GPT. This is a medium-severity known gap.

**2. Format-gate block add buttons in `BlockEditor`**
Filter `ADD_TYPES` based on a `lessonFormat` prop passed down to `BlockEditor`. Small, low-risk, well-scoped. Prevents authors from accidentally adding `slide`/`slide-explain` blocks to `code_lab` steps.

**3. Remove `[DIAG]` console logs**
`callProvider` in `lessonContentService.js` and the generate-content route in `server/index.js` both emit `[DIAG]` logging. Safe to remove now that the progressive generation hang has been resolved.

---

## Known Issues / Rough Edges

| Item | Severity | Detail |
|---|---|---|
| Uploaded files not cleaned up | Low | `server/uploads/` grows indefinitely. No deletion on block removal. Fine for internal use; would need a cleanup strategy for production. |
| `fileUrl` is a relative path (`/uploads/…`) | Info | Works in dev (Vite proxy) and production (same-origin Express). Would break if the app ever moves to a CDN or separate file server. |
| Collapsed sidebar state lost on reload | Low | Intentional — not persisted. One-liner fix if desired. |
| `[DIAG]` logs still in production code | Low | Carry-forward from Session 24. |
| `downloadable_file` upload has no MIME restriction | Info | Any file type accepted. Add `fileFilter` to multer config if restriction is needed. |
| `isHandsOn` steps overwritten by Screen 1 re-generation | Low | Carry-forward from Session 25. |
| `src/utils/mockGeneration.js` is dead code | Low | Nothing imports it. Safe to delete. |

---

## Git

### Recommended commit message
```
feat: real file upload for downloadable_file blocks + UI polish pass
```

### Alternative messages
```
feat: downloadable_file upload endpoint + sidebar polish (widths, collapsible, hands-on button)
```
```
feat(session-26): file upload, sidebar collapse, slide placeholder ratio, copy updates
```

### Commands

```bash
git add .gitignore server/index.js server/uploads/.gitkeep \
  src/App.css \
  src/components/BlockEditor.jsx \
  src/components/LessonAuthoringView.jsx \
  src/components/LessonInputForm.jsx

git commit -m "feat: real file upload for downloadable_file blocks + UI polish pass"
```

> **Do not commit** `output/claude-code-prompt-engineering-for-coding-0327-1223.json` — it is an untracked generated output file and should stay out of version control. Add `output/*.json` to `.gitignore` if you want this enforced automatically.

---

**ID** 25
**Date:** 2026-03-27
**Session scope:** Hands-on Practice step from Screen 2; `external_link` / `downloadable_file` block types; `Add module lab` dedicated narrow generation path; edit-mode branch fix for empty-blocks steps

---

## What Was Completed This Session

### Feature — "Add hands-on" step in Screen 2 sidebar

A new **Add hands-on** button sits at the bottom of the Screen 2 step sidebar, always visible, disabled while any step is still queued or generating. Clicking it:

1. Appends a new `lesson` step to `lessonStructure` with title "Hands-on Practice" and `isHandsOn: true`
2. Creates a matching empty `lessonContent` entry (`blocks: []`, `starterCode: ''`, `expectedAction: ''`, `validationNote: ''`) — no AI call
3. Auto-selects the new step

`isHandsOn: true` is the canonical routing marker. Screen 2 action routing (which AI-assist button appears in edit mode) is keyed on this flag, not on the step title string. The flag persists in the localStorage draft and survives renaming the step.

### Fix — Edit-mode branch for empty-blocks steps

The condition selecting between `BlockEditor` and `InstructionPanelEditor` in edit mode was changed from `blocks?.length > 0` to `Array.isArray(blocks)`. This means:
- Steps with `blocks: []` (new hands-on steps, and AI-generated steps that happen to have no blocks) correctly open `BlockEditor`
- Only legacy flat-field drafts (`blocks` is `undefined`) fall back to `InstructionPanelEditor`

### Feature — `external_link` and `downloadable_file` block types

Both new block types use the existing base shape `{ id, type, title, content }` — no new fields. Available via the add-block row in `BlockEditor` for all editable lesson steps.

**`external_link`:**
- `content` = the URL
- `title` = learner-facing link label (optional; falls back to URL)
- Edit UI: standard title input + `<input type="url">` for content
- View: clickable link card with blue left border

**`downloadable_file`:**
- `title` = filename or display label
- `content` = description of the file
- Edit UI: "Filename or label" input + description textarea
- View: file card with grey left border and "File upload — coming soon" placeholder

### Feature — "Add module lab" for hands-on steps

For steps with `isHandsOn: true`, the "Add task with starter code" button is suppressed and replaced by **Add module lab** in edit mode (same guard: no task block and no `starterCode`). The two buttons are mutually exclusive by design.

**Generation path:**
- Client: `generateModuleLabForStep()` in `lessonContentService.js`
  - Finds all lesson steps appearing before the current step in `lessonStructure`
  - Filters to those with `blocks.length > 0` (completed content only)
  - Condenses each to `{ title, goal, coveredSubtopics, blockSummaries: [{ type, excerpt }] }` where `excerpt` = first 150 chars of `content`; `starterCode` / `expectedAction` / `validationNote` excluded
  - If no qualifying steps: returns skip immediately without a network call
- Server: `POST /api/generate-module-lab` → `buildGenerateModuleLabPrompt()` in `generateModuleLabPrompt.js`
- Response (success): `{ taskBlock: { type: 'task', title: 'Module Lab', content }, starterCode }`
- Response (skip): `{ skip: true, reason }`

On success: `taskBlock` gets `id: block-${Date.now()}` client-side; appended to `blocks[]`; `starterCode` set at step level. Author remains in edit mode.

---

## Files Changed This Session

| File | Change |
|---|---|
| `server/prompts/generateModuleLabPrompt.js` | **New** — prompt builder for module-level lab; serializes condensed previous-steps context; module-synthesis task + starterCode rules; skip contract |
| `server/index.js` | Import `buildGenerateModuleLabPrompt`; `mockGenerateModuleLab()`; `POST /api/generate-module-lab` route |
| `src/services/lessonContentService.js` | New export `generateModuleLabForStep()` — condensation, early-exit skip, fetch, validation |
| `src/App.jsx` | `isHandsOn: true` in `handleAddHandsOnStep`; new `handleAddModuleLab()` handler; import and prop wiring |
| `src/components/LessonAuthoringView.jsx` | (1) Edit-mode branch: `blocks?.length > 0` → `Array.isArray(blocks)`; (2) `onAddModuleLab` + `isHandsOnStep` props threaded to `LessonStepPanels`; (3) mutual-exclusion button conditions; (4) `external_link` / `downloadable_file` view rendering in `Block`; (5) three new module-lab feedback state vars |
| `src/components/BlockEditor.jsx` | `external_link` and `downloadable_file` added to `TYPE_LABELS`, `ADD_TYPES`, `contentRows`, `contentPlaceholder`; `isExternalLink` / `isDownloadableFile` flags; URL input for `external_link` content field; type-aware labels |
| `src/App.css` | `.step-sidebar-footer`, `.step-sidebar-add-handson`; `.block-external-link`, `.block-external-link-url`, `.block-downloadable-file`, `.block-downloadable-file-placeholder`, `.block-empty-placeholder` |
| `docs/product_overview.md` | New features documented; current state date updated to Session 25 |
| `docs/decisions.md` | Three new decisions: `isHandsOn` marker; dedicated module-lab path; `external_link`/`downloadable_file` as block types |
| `docs/data_model.md` | `isHandsOn` added to lesson step shape; `external_link`/`downloadable_file` block semantics; block-types-by-format table updated |
| `docs/user_flow.md` | New Screen 2 step 4 (hands-on flow); step numbers updated |
| `docs/todo.md` | Five new ✅ items; four new Known Issues entries |
| `docs/session_handoff.md` | This entry |

---

## What Has Been Manually Tested and Is Working

*(Based on code review and mock-mode logic — full manual test list provided to author at end of session)*

- "Add hands-on" button appears below the step list; disabled during generation; enabled after
- New hands-on step appears in sidebar with "Hands-on Practice" title, is auto-selected
- Edit mode on the new empty step opens `BlockEditor`, not `InstructionPanelEditor`
- `+ LINK` and `+ FILE` add-block buttons appear in `BlockEditor` for all steps
- `external_link` block: URL input in edit mode; link card in view mode; empty-URL fallback renders "No URL set"
- `downloadable_file` block: "Filename or label" label in edit mode; file card with description and placeholder in view mode
- Edit mode on a normal lesson step: "Add task with starter code" appears; "Add module lab" does not
- Edit mode on a hands-on step: "Add module lab" appears; "Add task with starter code" does not
- `isHandsOn: true` is present on the step after creation and survives localStorage save/restore

---

## Known Limitations / Follow-up Ideas

| Item | Severity | Detail |
|---|---|---|
| `Add module lab` real-model skip behavior not validated | Medium | Mock always skips for `concept_application`. Real model behavior on borderline steps not yet tested with live OpenAI calls. |
| `isHandsOn` steps included in Screen 1 re-generation | Low | If the author re-generates from Screen 1, the hands-on step is treated as a regular lesson step and receives AI-generated content. Overwrite is expected but may surprise authors who forget. |
| `downloadable_file` block has no real file upload | Low | Stores title and description only. Real upload requires backend work deferred to another team. |
| Block add-button row grows with each new type | Low | Now 9 buttons in the add-block row. If more types are added, the row will need grouping or a dropdown. |
| `DIAG` console logs still in production code | Low | Carry-forward from Session 24 — `callProvider` and the generate-content route still emit `[DIAG]` logs. |

---

## Most Sensible Next Steps

**A. End-to-end validate `Add module lab` with real OpenAI**
Run a full generation pass on a `code_lab` module, add a hands-on step, trigger "Add module lab", and confirm the synthesized task and starter code draw on concepts from the previous steps — not just the most recent one.

**B. Validate skip behavior with real model**
Test `Add module lab` on a `guided_tool_workflow` module with slide-only steps and on a `concept_application` module to confirm skip fires appropriately and the reason text is author-friendly.

**C. Format-gate block add buttons in `BlockEditor`**
`slide` and `slide-explain` blocks are still addable in `code_lab` editors. A filter on `ADD_TYPES` keyed by `lessonFormat` prop would fix this. Low risk, small change. Carry-forward from Sessions 23–24.

**D. Clean up `[DIAG]` console logs**
Remove diagnostic logging from `callProvider` and the generate-content route once the progressive generation hang is confirmed not to recur. Carry-forward from Session 24.

**E. Per-slide structured extraction**
`extractSlideText.js` returns flat text. Returning `[{ slideNumber, text }]` would allow the `slide` block to render actual extracted slide text rather than just the reference label. Foundation work before the slide-content rendering slice.

---

**ID** 24
**Date:** 2026-03-27
**Session scope:** AI-assisted "Add task with starter code" in Screen 2 edit mode; view-mode "Add Starter Code" button removal; progressive generation hang diagnostics

---

## What Was Completed This Session

### Feature — "Add task with starter code" in Screen 2 edit mode

When a `lesson` step in edit mode has no `task` block and no `starterCode`, the instruction panel header now shows an **Add task with starter code** button.

**Behaviour:**
- Clicking calls `POST /api/generate-task` with the step's current live blocks, metadata (title, goal, topics, slideNumbers), `lessonFormat`, and `slideText`
- The AI generates one `task` block anchored to what the existing blocks have already taught, plus matching `starterCode`
- The task block is appended to the end of the block sequence; `starterCode` is set at the step level
- The author stays in edit mode and can immediately refine both
- If the AI judges the step unsuitable (purely conceptual, no coding action), it returns `{ skip: true, reason }` — shown as an inline note; no content is modified
- Loading, error, and skip feedback are local state in `LessonStepPanels` — cleared automatically when edit mode exits

**`server/prompts/generateTaskPrompt.js`** (new file):
- Focused prompt that serializes the current blocks as context, asks for one task block + starterCode anchored to the existing teaching content
- Block IDs are not assigned by the server; client uses `block-${Date.now()}` at insertion, matching `BlockEditor`'s existing pattern
- Includes lessonFormat guidance (mirrors the style from `generateContentPrompt.js`)
- Instructs the model to return `{ skip: true, reason }` for unsuitable steps

**`server/index.js`**:
- Added `mockGenerateTask(step, lessonFormat)` — returns skip for `concept_application`; returns a minimal task + starterCode for `code_lab` / `guided_tool_workflow`
- Added `POST /api/generate-task` route

**`src/services/lessonContentService.js`**:
- Added `generateTaskForStep(...)` — narrow fetch to `/api/generate-task`; validates response shape; passes skip responses through as `{ skip: true, reason }`; throws on server error

**`src/App.jsx`**:
- Added `handleAddTask(currentBlocks)` — calls `generateTaskForStep` with the live structure step context; uses a functional `setLessonContent` updater to append the new block safely; marks step dirty
- Passes `onAddTask` prop to `LessonAuthoringView`

**`src/components/LessonAuthoringView.jsx`**:
- `LessonStepPanels` accepts `onAddTask`
- Three local state variables: `isAddingTask`, `addTaskError`, `addTaskSkipNote`
- `useEffect` clears error/skip note on edit-mode exit
- Button condition: `isEditing && selectedContent && !hasTaskBlock && !hasLabContent`
- Button disabled while generating; label changes to "Generating…"
- Error and skip note render as small inline messages below the panel header

### Fix — Removed "Add Starter Code" from view mode

The **Add Starter Code** button previously shown next to the Edit button in view mode was removed. The equivalent authoring affordance is now available in edit mode via "Add task with starter code" (which covers the common case) and the code panel's direct editability while in edit mode.

### Diagnostics — Progressive generation hang investigation

Added targeted DIAG points to narrow down where later steps were getting stuck in `generating`:

**`server/index.js`** — new DIAG 4b between `parseContentResponse` and `res.json()`:
```
[DIAG][server] parseContentResponse OK | about to res.json | serialized response length (chars): N
```

**`src/services/lessonContentService.js`** — two new client-side DIAGs in `callProvider`:
- DIAG 1b: immediately after `fetch` resolves (logs HTTP status)
- DIAG 1c: immediately after `res.json()` resolves (logs top-level keys)

The hang was not consistently reproducible by the end of the session. DIAGs remain in place for future observation.

---

## Files Changed This Session

| File | Change |
|---|---|
| `server/prompts/generateTaskPrompt.js` | **New file** — focused task + starterCode generation prompt |
| `server/index.js` | `mockGenerateTask`; `POST /api/generate-task` route; DIAG 4b |
| `src/services/lessonContentService.js` | `generateTaskForStep()` export; DIAG 1b + 1c in `callProvider` |
| `src/App.jsx` | `handleAddTask()` handler; `onAddTask` prop wired to `LessonAuthoringView` |
| `src/components/LessonAuthoringView.jsx` | `onAddTask` prop; local state + button in `LessonStepPanels`; view-mode "Add Starter Code" button removed |
| `docs/product_overview.md` | "Add task with starter code" feature documented; current state date updated |
| `docs/decisions.md` | New decision: dedicated narrow generation path for task + starter code |
| `docs/session_handoff.md` | This entry |

---

## What Has Been Manually Tested and Is Working

- "Add task with starter code" button appears only in edit mode when step has no task block and no starterCode
- Button is absent once a task block or starterCode exists on the step
- Clicking generates a task block + starterCode and inserts them; author stays in edit mode
- Code panel appears after successful generation (starterCode is now non-empty)
- Error message appears inline on server failure; existing content is unchanged
- Skip response (mock: `concept_application` format) shows the reason message; no content is modified
- Button disables and shows "Generating…" while the request is in flight
- Error and skip note clear when exiting edit mode
- "Add Starter Code" button is gone from view mode

---

## Known Limitations / Follow-up Ideas

| Item | Severity | Detail |
|---|---|---|
| DIAG points remain in production code | Low | `callProvider` and the generate-content route still have `[DIAG]` console logs. Should be cleaned up once the progressive generation hang is confirmed resolved. |
| Skip response UX is informational only | Low | The skip note appears but disappears silently if the author exits and re-enters edit mode. No persistent indication that a task was suggested to be skipped. |
| `hint` block not generated alongside task | Low | The narrow path generates only a task block. An associated hint block (if the step has a likely stuck point) is not generated. Author can add one manually via BlockEditor. |
| No server-side validation that task is anchored to existing blocks | Low | The prompt instructs anchoring; the model generally complies. No post-generation check verifies that the task topic aligns with the existing block content. |
| Real skip behavior not yet tested against live model | Medium | Mock always skips for `concept_application`. Real model behavior on borderline steps (e.g. `guided_tool_workflow` steps with slides but no coding) is not yet validated. |

---

## Most Sensible Next Steps

**A. Clean up DIAG points**
Remove the `[DIAG]` console logs from `callProvider` and the generate-content route once the progressive generation hang is confirmed not to recur. They were a debugging aid, not permanent logging.

**B. Validate generate-task skip behavior with live model**
Run end-to-end with real OpenAI calls across `code_lab`, `guided_tool_workflow`, and `concept_application` steps to confirm the skip response fires correctly for unsuitable steps and does not fire for steps where a task is appropriate.

**C. Format-gate block add buttons in BlockEditor**
`slide`/`slide-explain` blocks are addable in `code_lab` editors. A single filter on the `ADD_TYPES` list in `BlockEditor` keyed by `lessonFormat` prop would fix this. Carry-forward from Session 23.

**D. Cancel in-flight generation on back-navigation**
Add an `AbortController` ref to the generation loop in `handleGenerate`. Carry-forward from Session 23.

---

**ID** 23
**Date:** 2026-03-27
**Session scope:** Progressive Screen 2 generation (step-by-step, navigate first) + manual "Add Starter Code" affordance in Screen 2

---

## What Was Completed This Session

### Feature 1 — Progressive Screen 2 generation

Previously, clicking "Generate Lesson Content →" awaited the full batch before navigating. The user sat blocked on Screen 1 with no visibility.

**New behaviour:** The app navigates to Screen 2 immediately on click. Content is generated one step at a time. Each completed step becomes visible as soon as it finishes. Remaining steps show their queued/generating status in the sidebar and instruction panel.

**`src/services/lessonContentService.js`**:
- Added `generateStepContent()` export — single-step version of `callProvider()` + `normalizeContent()`.
- `generateAllLessonContent()` kept as-is (batch fallback, no longer called by the app).

**`src/App.jsx`**:
- Added `stepGenerationStatus` state: `{ [stepId]: 'queued' | 'generating' | 'done' | 'error' }`.
- Rewrote `handleGenerate`:
  - Initialises all lesson steps as `queued`
  - Navigates to Screen 2 immediately (`setScreen('authoring')`)
  - Loops: each step transitions `queued → generating → done|error` with intermediate state updates
  - Per-step errors do not abort remaining steps; `generationError` records the most recent failure
  - Back-navigation limitation documented inline in comment above the function
- Passes `stepGenerationStatus` to `LessonAuthoringView`.

**`src/components/LessonAuthoringView.jsx`**:
- Accepts `stepGenerationStatus` prop (defaults `{}`).
- Sidebar: each step shows a color-coded dot — pulsing blue (`generating`), muted grey (`queued`), red (`error`). `done` shows no dot.
- Content panel: a new `StepGenerationMessage` component replaces the old generic "No content" string, rendering distinct messages for `queued`, `generating`, `error`, and the no-run-yet state.

**`src/App.css`**:
- `.step-nav-genstatus` + `--queued` / `--generating` / `--error` sidebar dot variants
- `.panel-gen-status` + `--queued` / `--generating` / `--error` instruction panel message variants
- Shared `genstatus-pulse` keyframe animation for the generating state

### Feature 2 — Manual "Add Starter Code" affordance in Screen 2

Previously, steps without `starterCode` had no way to add it manually in Screen 2 — the right-side code panel was simply absent.

**`src/components/LessonAuthoringView.jsx`** (only file changed):
- In `LessonStepPanels`, when view mode and `starterCode` is empty, an **Add Starter Code** button appears in the instruction panel header alongside the Edit button. Both buttons call `onEdit()`.
- Code panel render condition changed from `hasLabContent` to `hasLabContent || isEditing`. In edit mode the panel always renders, allowing the author to type starter code even when none existed before.
- After Save: `hasLabContent` re-evaluates. Non-empty `starterCode` → panel persists. Empty → panel collapses.

### Docs updated

- `docs/user_flow.md` — "Proceed to Screen 2" section rewritten; starter code panel section updated with "Add Starter Code" behavior
- `docs/decisions.md` — two new decisions added: "Progressive generation" and "Starter code panel — shown on demand"
- `docs/data_model.md` — `stepGenerationStatus` added to App state shape; `LessonContent` and flow diagram updated to reference `generateStepContent()`

---

## Files Changed This Session

| File | Change |
|---|---|
| `src/services/lessonContentService.js` | Added `generateStepContent()` export |
| `src/App.jsx` | Added `stepGenerationStatus` state; rewrote `handleGenerate` for progressive flow |
| `src/components/LessonAuthoringView.jsx` | Per-step status in sidebar + panel; "Add Starter Code" button; code panel shown in edit mode |
| `src/App.css` | Generation status dot and message styles |
| `docs/user_flow.md` | Screen 1 → Screen 2 transition; starter code panel affordance |
| `docs/decisions.md` | Two new decisions: progressive generation, starter code panel |
| `docs/data_model.md` | `stepGenerationStatus` in state shape; `generateStepContent()` references |

---

## What Has Been Manually Tested and Is Working

- Clicking "Generate Content" on Screen 1 navigates to Screen 2 immediately
- Steps arrive one at a time — content becomes visible as each step completes
- Sidebar dots correctly show queued / generating / done states during a run
- Instruction panel shows correct status message per step before content arrives
- Clicking a completed step while others are still queued/generating works normally
- Steps without `starterCode` show the "Add Starter Code" button in view mode
- Clicking "Add Starter Code" enters edit mode and reveals the code panel
- Typing starter code and saving makes the panel persist in view mode
- Saving with empty starter code collapses the code panel back to hidden

---

## Known Limitations / Risks

| Item | Severity | Detail |
|---|---|---|
| Back navigation mid-generation does not cancel requests | Medium | Navigating to Screen 1 while generation is running leaves the background loop continuing to call the API and update state. No cancellation mechanism (AbortController) is in place. |
| `stepGenerationStatus` is not persisted | Low | On page reload the status map resets to `{}`. Steps restored from localStorage show the generic "No content" message rather than "done". This is cosmetic — the content itself is restored correctly. |
| Real AI generation not yet tested end-to-end with new prompts | Medium | From Session 22: `slideNumbers` contract and the rewritten `guided_tool_workflow` prompt have not been run against the live model. |
| `slideNumbers` not visible in Screen 1 UI | Low | Authors cannot see or correct slide assignments from Screen 1. |
| Format-gating in BlockEditor still absent | Low | `slide`/`slide-explain` add buttons appear in `code_lab` editors. Deferred from Session 21. |
| `concept_application` has no prompt branch | Low | Falls through to `code_lab` behavior silently. |
| `slideText` is session-only | Medium | Lost on page reload. User must re-upload PPTX. |

---

## Most Sensible Next Implementation Options

**A. Cancel in-flight generation on back-navigation**
Add an `AbortController` ref to the generation loop in `handleGenerate`. Check the signal before each `await generateStepContent()` call. This closes the known limitation cleanly.

**B. Validate the new AI prompts against the live model**
Run end-to-end with real OpenAI calls to verify: (1) `slideNumbers` is returned as strings by the structure prompt, (2) the `guided_tool_workflow` content prompt correctly produces N × [slide, slide-explain] pairs, (3) no silent field omissions.

**C. Show `slideNumbers` in Screen 1 step cards**
Authors currently cannot see which slides were assigned to each step. A small read-only tag or chip on each step card would close the visibility gap. No state changes needed — the data is already on the step object.

**D. Format-gate block add buttons in BlockEditor**
`slide`/`slide-explain` blocks should only be addable when `lessonFormat === 'guided_tool_workflow'`. A single filter on the `ADD_TYPES` array keyed by `lessonFormat` prop would fix this.

---

**ID** 22
**Date:** 2026-03-25
**Session scope:** Path B slide ownership — explicit `slideNumbers` assignment; contract re-evaluation; session ended early pending product model reconsideration

---

## What Was Completed This Session

### Re-evaluation of the guided_tool_workflow contract

Before any coding, the session opened with a full review of the current implementation against an updated product direction.

The previous 3-block contract (`slide` → `slide-explain` → `explain`, exactly one of each) was identified as wrong in two ways:
- It assumed one slide per step; the new model allows multiple slides per step
- It included a default `explain` block; the new model drops this

The new contract: a step contains N × `[slide, slide-explain]` pairs — one pair per assigned slide, no default `explain`.

The deeper architectural issue identified: the old contract let the content generation prompt **infer** which slides belonged to each step. Because content generation is called once per step with no cross-step visibility, this cannot enforce global slide ownership (each slide appears in exactly one step). This is a global constraint, and it belongs at the structure layer.

**Path B was chosen** (vs. Path A which would have patched the content prompt without fixing ownership):
- Structure generation assigns `slideNumbers[]` explicitly per step
- Content generation consumes those assignments — no inference

### Slice implemented (Path B end-to-end)

**`server/prompts/generateStructurePrompt.js`**:
- Added `slideFooter` — used by Cases 1 & 2 (slides present). Requires `slideNumbers: string[]` per step in the AI output.
- Ownership rules in the footer: every instructional slide must appear in exactly one step; no slide may be reused across steps; individual numbers only (no range notation).
- Case 3 (subtopics only) unchanged — still uses original `footer` without `slideNumbers`.

**`src/services/lessonStructureService.js`**:
- `normalizeStructure` now preserves `slideNumbers` from the AI response and coerces each entry to a string.
- Defaults to `[]` when the field is absent (subtopics-only sessions, mock runs).

**`server/lib/promptContext.js`**:
- Added `slideNumbers: step?.slideNumbers ?? []` to the context object so all prompt builders can access it.

**`server/prompts/generateContentPrompt.js`**:
- Full rewrite of `buildGuidedToolWorkflowContentPrompt`.
- Shape: N × `[slide, slide-explain]` pairs, where N = `slideNumbers.length` (minimum 1).
- No `explain` block. No range `slideRef`. `slideRef` must be a single slide number string.
- When `slideNumbers` is empty (no slides uploaded), produces one pair with `slideRef: "?"`.
- The prompt tells the AI exactly which slides are assigned and explicitly lists the expected block sequence in the return format.

**`server/index.js`**:
- `mockGenerateContent` for `guided_tool_workflow` updated: reads `step.slideNumbers`, produces one `[slide, slide-explain]` pair per number. Falls back to `['1']` when `slideNumbers` is absent.
- Old 3-block mock (slide + slide-explain + explain) removed.

**`src/components/LessonAuthoringView.jsx`**:
- `slide` block renderer changed from a tiny inline label (`block-slide-ref`) to a styled placeholder box (`block-slide-placeholder`).

**`src/components/BlockEditor.jsx`**:
- `slideRef` input placeholder text updated from `"e.g. 3 or 3-5"` to `"e.g. 3"` (ranges are no longer part of the contract).

**`src/App.css`**:
- Added `.block-slide-placeholder` (dashed border, muted background, min-height 120px) and `.block-slide-placeholder-label` styles.

### Commit

`95a9480` — `feat: Path B slide ownership — explicit slideNumbers assignment across structure and content`

---

## Files Changed This Session

| File | Change |
|---|---|
| `server/prompts/generateStructurePrompt.js` | `slideFooter` with `slideNumbers` + ownership rules for Cases 1 & 2 |
| `src/services/lessonStructureService.js` | `normalizeStructure` preserves `slideNumbers`, defaults `[]` |
| `server/lib/promptContext.js` | Added `slideNumbers` to context |
| `server/prompts/generateContentPrompt.js` | Rewritten `guided_tool_workflow` branch — N pairs, no `explain`, no ranges |
| `server/index.js` | Mock updated to N pairs from `step.slideNumbers` |
| `src/components/LessonAuthoringView.jsx` | `slide` block renders placeholder box |
| `src/components/BlockEditor.jsx` | `slideRef` placeholder text updated |
| `src/App.css` | Placeholder box styles added |

---

## Current System Behavior After This Session

- **Structure generation with slides** (Cases 1 & 2): the AI is now asked to produce `slideNumbers` per step. Each instructional slide is assigned to exactly one step. The frontend normalizes this field onto the Step object in App state.
- **Structure generation without slides** (Case 3): behavior unchanged. `slideNumbers` is `[]` on all steps.
- **Content generation for `guided_tool_workflow`**: receives `slideNumbers` from the step, produces one `[slide, slide-explain]` pair per number. The prompt is explicit — the AI does not infer slide ownership.
- **Mock mode**: correctly exercises the new shape.
- **Screen 2 `slide` block**: renders as a dashed placeholder box labeled "Slide N". Not a tiny label.
- **`explain` block**: no longer generated by default for `guided_tool_workflow`. Authors can still add one manually via the BlockEditor add-block row.

---

## Known Risks and Incomplete Areas

| Item | Severity | Detail |
|---|---|---|
| Real AI generation not yet tested | Medium | The new structure prompt (with `slideNumbers`) and content prompt have not been run against GPT-5.4. The `slideNumbers` contract could fail silently if the model omits the field or produces numbers as integers instead of strings. `normalizeStructure` will coerce integers via `.map(String)` but missing fields will result in `[]`. |
| `slideNumbers` is not shown in Screen 1 UI | Low | Step cards do not display which slides are assigned to them. Authors cannot see or edit the slide assignment in Screen 1. This is an authoring visibility gap — there is no way to verify or correct the assignment without inspecting localStorage. |
| Format-gating in BlockEditor still absent | Low | `slide`/`slide-explain` add buttons appear in `code_lab` step editors. Deferred from Session 21, still unaddressed. |
| `concept_application` has no prompt branch | Low | Falls through to `code_lab` behavior silently. |
| `slideText` is session-only | Medium | Lost on page reload. User must re-upload PPTX. Unchanged from previous sessions. |

---

## ⚠️ Pending Product Direction Change — Next Session Must Re-evaluate

**Implementation was stopped here intentionally.**

During this session, a higher-level product model question surfaced that needs to be resolved before further implementation:

**The current model treats `lessonFormat` as a hard contract** — `guided_tool_workflow` produces a rigid block sequence, `code_lab` produces a different rigid sequence. This worked as a starting point, but it may not be the right model going forward.

**The direction under consideration for next session:**

- `lessonFormat` may be better treated as a **soft bias** (a signal to the AI about what kind of content to lean toward) rather than a **hard switch** that locks in a block sequence contract.
- **Block composition may need to be driven by content needs** — what this step actually requires to teach the material — rather than by format rules.
- Better signals for block composition may be:
  - **Slide presence** — does this step have assigned slides? → include slide blocks
  - **Lab need** — does this step involve a hands-on activity? → include task/hint blocks
  - **Starter code need** — does this step have practice code? → include code blocks and show the right panel
  - These signals are independent and composable, not locked to a format type

**What this means for the work done in this session:**
- The `slideNumbers` assignment mechanism (Path B) is still correct and still needed — the global ownership constraint is real regardless of how the block contract is structured.
- The content prompt contract (N × [slide, slide-explain]) may be too rigid if `guided_tool_workflow` steps could legitimately also have lab components or concept blocks alongside slides.
- The `explain` block removal may need to be revisited.

**Next session should start here** — by deciding whether `lessonFormat` remains a hard block contract or becomes a soft signal, and what the new block composition model looks like. Do not extend the current implementation until this is resolved.

---

**ID** 21
**Date:** 2026-03-24
**Session scope:** `guided_tool_workflow` content model, prompt, slide coverage rules, Screen 2 crash fix, conditional lab panel

---

## What Was Completed This Session

### Slice 1 — Content model: new block types

**`src/components/BlockEditor.jsx`**:
- Added `slide` and `slide-explain` to `TYPE_LABELS` and `ADD_TYPES`
- `handleAdd` initializes `slide` blocks with `slideRef: ''` and `content: ''`
- `BlockCard` renders a "Slide reference" text input for `slide` blocks; relabels content field as "Caption / notes (optional)"
- Added `contentRows` and `contentPlaceholder` cases for both new types

**`docs/data_model.md`**: Block shape section updated to document new types and `slideRef` field.

### Slice 2 — `lessonFormat` forwarded to generate-content

**`server/lib/promptContext.js`**: Added `lessonFormat = 'code_lab'` to params and returned context.

**`server/index.js`**:
- `POST /api/generate-content` route now destructures and forwards `lessonFormat`
- Mock (`mockGenerateContent`) branches on `lessonFormat`; `guided_tool_workflow` mock returns three-block shape

**`server/prompts/generateContentPrompt.js`**:
- `buildGenerateContentPrompt` dispatches on `context.lessonFormat`
- New `buildGuidedToolWorkflowContentPrompt`: generates exactly three blocks (`slide`, `slide-explain`, `explain`) in that order; slide-explain is AI-required; explain is step-goal-grounded; both formatted to avoid walls of text
- Original prompt renamed `buildCodeLabContentPrompt` — zero behavior change for `code_lab`

**`src/services/lessonContentService.js`**: `callProvider` and `generateAllLessonContent` accept and forward `lessonFormat`.

**`src/App.jsx`**: `generateAllLessonContent` call now passes `lessonFormat`.

### Bug fix — Screen 2 crash on null block content

**`src/components/LessonAuthoringView.jsx`**:
- Root cause: `segments` and `lines` were computed unconditionally by calling `.split` on `content` before any type dispatch. `slide` blocks have `content: ""` (previously `null`), crashing the renderer.
- Fix: `const safeContent = content ?? ''` guards all `.split` calls; `safeContent` passed to `CheckBlock` as well.
- Added `slide` render branch: shows a styled slide reference panel with `slideRef` label; renders `safeContent` only if non-empty.
- Added `slide-explain` render branch: prose segments, same as `explain`.

### Prompt refinements — three-block contract

Iteratively refined `buildGuidedToolWorkflowContentPrompt`:
- Updated from two blocks (slide + slide-explain) to three (slide + slide-explain + explain)
- `slide.content` changed from `null` to `""` (safer for the renderer; avoids null-coercion in future paths)
- `slide-explain` formatting rules: short paragraphs and/or bullet points; not a wall of text
- `explain` block rules: step-goal-grounded, not slide-anchored; some overlap with slide-explain is acceptable
- Distinction framed as primary purpose, not hard no-overlap constraint

### Slide coverage rules in generate-structure

**`server/prompts/generateStructurePrompt.js`** — Cases 1 and 2 (slides-based branches) updated:
- **`SLIDE COVERAGE`** section added: instructional slides must each produce a step; non-instructional slides (title, agenda, dividers, closing) may be skipped; if ambiguous, include rather than skip; placeholder-quality steps preferred over missing steps
- **`SLIDE GROUPING`** section added: default one slide = one step; group only when consecutive slides clearly form one atomic teaching unit; prefer splitting over grouping when uncertain
- Case 3 (subtopics only) unchanged

### Conditional lab panel — Screen 2

**`src/components/LessonAuthoringView.jsx`**:
- `hasLabContent = Boolean(selectedContent?.starterCode?.trim())` — content-driven
- Code panel wrapped in `{hasLabContent && ...}` — not rendered when empty
- `panel-instruction--full` class applied to instruction panel when no lab panel

**`src/App.css`**: `.panel-instruction--full { border-right: none; }` — removes divider border when full-width.

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| `slide` block renders only `slideRef` label, not slide content | Per-slide structured extraction not yet built; flat `slideText` cannot resolve a specific slide number |
| Per-slide structured extraction | Separate slice — `extractSlideText.js` still returns flat string |
| Format-gating in BlockEditor add buttons | Deferred — all block types visible in all formats |
| End-to-end real AI test for `guided_tool_workflow` | Mock path verified; real generation needs a test run |
| `concept_application` prompt branch | No design yet |
| `starterCode` → `practiceContent` rename | Deferred |

---

## Remaining Limitations

| Item | Severity | Detail |
|---|---|---|
| `guided_tool_workflow` AI not end-to-end validated | Medium | Three-block shape verified via mock. Real GPT-5.4 generation not yet tested. |
| `slide` block shows reference only | Medium | Renders "Slide 3" label; does not show extracted slide text. Needs per-slide structured extraction. |
| `slideText` is session-only | Medium | Lost on page reload. User must re-upload PPTX to use slides in generation after reload. |
| BlockEditor shows all block types regardless of format | Low | `slide`/`slide-explain` appear in `code_lab` step editors; format-gating deferred. |

---

## Next Session — Recommended Starting Point

**Validate the `guided_tool_workflow` AI generation end-to-end before adding more features.**

1. Run a real generation pass with `lessonFormat = 'guided_tool_workflow'` and an uploaded PPTX. Confirm the AI produces the correct three-block shape (`slide`, `slide-explain`, `explain`) and that `slideRef` values are populated correctly.

2. If generation looks good, the most impactful next slice is **rendering the slide content inside the `slide` block** — showing the actual extracted text for the step's `slideRef`. This requires:
   - Modifying `extractSlideText.js` to return `slides: [{ slideNumber, text }]` alongside the existing flat `slideText`
   - Storing `slideData` (the array) in App state alongside `slideText`
   - Updating the `slide` block renderer in `LessonAuthoringView` to resolve `slideRef` → text from `slideData`

3. Secondary candidate: format-gating the BlockEditor add buttons so `slide`/`slide-explain` only appear for `guided_tool_workflow`.

---

**ID** 20
**Date:** 2026-03-23
**Session scope:** Wire slideText into generate-content (Slice D) — complete the PPTX slides pipeline end-to-end

---

## What Was Completed This Session

### Slides → generate-content wiring — Slice D

**`src/App.jsx`**:
- `generateAllLessonContent` call now passes `slideText` as a named argument.

**`src/services/lessonContentService.js`**:
- `generateAllLessonContent` accepts `slideText = ''` in its params destructure.
- `callProvider` accepts and forwards `slideText` in the `POST /api/generate-content` JSON body.
- Non-lesson steps are still skipped before `callProvider` is ever called (existing guard unchanged).

**`server/index.js`** — `POST /api/generate-content` route:
- Destructures `slideText` from `req.body`.
- Passes `slideText` to `buildPromptContext`.

**`server/lib/promptContext.js`**:
- Accepts `slideText = ''`; exposes it on the returned context object.
- This change is safe for the generate-structure route, which passes `slideText` separately and does not use `buildPromptContext`.

**`server/prompts/generateContentPrompt.js`**:
- Extracts `slideText` from context.
- When `slideText` is non-empty: injects a `SLIDE CONTEXT` section between the SCOPE and RETURN FORMAT sections.
- The section instructs the model to treat the slides as **primary reference material** — use the same terminology, examples, and teaching points; closely adapt slide bullets into lesson prose; faithfully follow slide content.
- Single override rule: if slide context and the step goal conflict, **the step goal takes priority**.
- When `slideText` is empty (no upload, or post-reload): the section is omitted entirely; prompt behavior is byte-for-byte identical to before this change.

### Docs updated this session
- `docs/product_overview.md` — updated session number to 20; corrected Screen 2 description (non-lesson rendering is live, not a known gap); added slide context to the content generation bullet; updated slides ingestion scope row to "Implemented through Slice D"; updated "next candidate slice" note.
- `docs/todo.md` — Slice D marked ✅; resolved known issue row cleaned up; `starterCode` preferred future name corrected to `practiceContent`.
- `docs/data_model.md` — `starterCode` comment updated to `practiceContent`.

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| `lessonFormat` forwarded to AI prompts | Separate slice — product/design discussion needed first |
| `guided_tool_workflow` block model | No design yet — next session should start with discussion |
| `slide_reference` block type | No design yet — worth discussing before implementation |
| Real file upload (lab files, starter code) | Deferred |
| `starterCode` renamed to `practiceContent` | Deferred — disruptive rename; do when lessonFormat is wired |

---

## Remaining Limitations

| Item | Severity | Detail |
|---|---|---|
| `slideText` is session-only | Medium | Lost on page reload. Only `slideFileName` label is restored from localStorage. User must re-upload the PPTX to use slides in generation after a reload. |
| Slide text is flat extracted text | Info | `<a:t>` XML extraction only. No heading vs body vs bullet structural signals. No SmartArt, speaker notes, or embedded objects. The model infers structure from content alone. |
| No slide preview rendering | Info | The uploaded slides are not rendered or previewed anywhere in the UI. Only filename and slide count are shown. |
| `lessonFormat` not forwarded to AI prompts | Low | Exists in state and localStorage but prompts do not use it. `code_lab` is the effective implicit assumption in all current prompts. |
| `code_lab` internal value vs "Programming" UI label | Info | Should be reconciled when `lessonFormat` is first forwarded to prompts. |

---

## Next Session — Recommended Starting Point

**Start with product/design discussion, not implementation.**

The two questions worth resolving before writing any code:

**1. How should `guided_tool_workflow` lessons generate blocks and content?**
The current block model (`explain`, `code`, `check`, `task`, `hint`) and the current generate-content prompt are built around programming-focused, lab-style learning. A guided tool workflow step (e.g. "Use Claude Code to refactor a function") has a different instructional shape — it may need different block types, different starter content, and a different prompt strategy. This needs to be designed before Slice E touches `lessonFormat`.

**2. Is a `slide_reference` block type the right direction for future slide integration?**
The slides pipeline now provides `slideText` as raw context to the AI. A future direction could be a `slide_reference` block that lets the author pin specific slide content to a specific step — surfacing slide material directly in the rendered lesson rather than only using it as AI prompt context. This would be a meaningfully different architecture decision (block-type addition, upload pipeline change, possible UI for slide selection) and warrants explicit scoping before implementation begins.

---

**ID** 19
**Date:** 2026-03-23
**Session scope:** Wire slideText into generate-structure (Slice C)

---

## What Was Completed This Session

### Slides → generate-structure wiring — Slice C

**`server/prompts/generateStructurePrompt.js`** — major update:
- Function signature now accepts optional `slideText` in addition to `subtopicsText`
- Branches into three cases at runtime:
  - **Slides only** (`slideText` present, `subtopicsText` empty): slides are sole source; prompt instructs the model to stay faithful to slide sequence, scope, and terminology; groups related slide content into coherent steps
  - **Slides + subtopics** (`slideText` + `subtopicsText` both present): slides are primary source; author subtopics treated as guidance and overrides; model prefers author intent when conflicts arise
  - **Subtopics only** (no `slideText`): original prompt unchanged — no behaviour change for existing users
- JSON contract (`steps[].title`, `.goal`, `.coveredSubtopics`) is identical across all three cases

**`server/index.js`** — `POST /api/generate-structure` route:
- Destructures `slideText` from request body (alongside existing fields)
- Validation relaxed: `courseName` and `moduleName` remain required; `subtopicsText` is now only required when `slideText` is absent; if neither is present, returns 400 with a clear message
- Mock path updated: falls back to `subtopicsText || slideText` so mock mode still works when only slides are provided
- `buildGenerateStructurePrompt` call now passes `slideText`

**`src/services/lessonStructureService.js`** — `callProvider` and `generateLessonStructure`:
- Both functions now accept an optional `slideText` parameter (fourth argument)
- `slideText` is included in the `POST /api/generate-structure` JSON body

**`src/App.jsx`**:
- `handleSubmit` guard updated: subtopics required only when `slideText.trim().length === 0`
- `generateLessonStructure` call now passes `slideText` as fourth argument
- `slideText` now passed as a prop to `LessonInputForm` (for the form's own `isValid` check)

**`src/components/LessonInputForm.jsx`**:
- Accepts new `slideText` prop
- `isValid` now: `courseName && moduleName && (subtopics || slideText)` — subtopics field no longer blocks the Generate button when slides have been successfully uploaded

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| Wire `slideText` into `generate-content` | Deferred — separate slice |
| `lessonFormat` forwarded to AI prompts | Separate slice |
| Real file upload (lab files, starter code) | Deferred |

---

## Remaining Limitations

- `slideText` is session-only (cleared on page reload); user must re-upload. Only `slideFileName` label is restored from localStorage.
- `generate-content` (Screen 2 block generation) does not yet receive `slideText` — step content is generated without slide context.
- Slide text is plain extracted text (`<a:t>` nodes only); no structural cues (heading vs bullet vs body), no slide layout awareness.
- The subtopics hint text ("One topic per line — each becomes a lesson step") is no longer always accurate when slides are the source, but is only shown when subtopics are present so it is not misleading.

---

**ID** 18
**Date:** 2026-03-23
**Session scope:** Slides backend upload + text extraction (Slice B)

---

## What Was Completed This Session

### Slides backend upload + extraction — Slice B

**New dependency installs:**
- `multer` — multipart/form-data middleware for Express (in-memory storage)
- `jszip` — pure-JS ZIP parser used to unpack the PPTX archive

**`server/lib/extractSlideText.js`** (new file):
- Accepts a `Buffer`; uses `jszip` to unzip the PPTX
- Finds `ppt/slides/slide*.xml` entries, sorted numerically
- Extracts all `<a:t>` text nodes per slide (titles, text boxes, bullet runs)
- Returns `{ slideText: string, slideCount: number }`
- Slides with no text content are silently skipped
- Scope is normal slide text only — no SmartArt, speaker notes, or embedded objects

**`server/index.js`** additions:
- Imports `multer` and `extractSlideText`
- `slidesUpload` multer instance: memory storage, 10 MB limit, `.pptx`-only filter (checks both MIME type and file extension)
- `POST /api/upload-slides` route: receives `multipart/form-data` with `slides` field; calls `extractSlideText`; returns `{ slideText, slideCount, fileName }`

**`src/App.jsx`** additions:
- Four new state vars: `slideText` (string), `slideCount` (number), `isUploadingSlides` (boolean), `slideUploadError` (string|null)
- `handleSlideUpload(file)` — POSTs real `File` object via `FormData` to `/api/upload-slides`; sets `slideText` and `slideCount` on success; clears `slideFileName` and sets `slideUploadError` on failure
- `handleSlideRemove()` — clears all four slide-related state vars
- New props passed to `LessonInputForm`: `slideCount`, `isUploadingSlides`, `slideUploadError`, `onSlideUpload`, `onSlideRemove`
- Old `onSlideFileChange` prop removed entirely
- `slideText` is **not** persisted to localStorage (file cannot be recovered from storage; user must re-upload on reload)

**`src/components/LessonInputForm.jsx`** changes:
- Props updated: `onSlideFileChange` replaced by `onSlideUpload` + `onSlideRemove`; added `slideCount`, `isUploadingSlides`, `slideUploadError`
- `handleFileChange` now passes the real `File` object to `onSlideUpload` (previously passed only `file.name`)
- `handleRemoveSlide` now calls `onSlideRemove()` (previously called `onSlideFileChange('')`)
- Slides field renders three states:
  - **Uploading**: "Uploading…" text while `isUploadingSlides` is true
  - **Loaded**: filename + slide count (e.g. "deck.pptx — 24 slides") + × remove button
  - **Empty**: file picker button + error message below if `slideUploadError` is set

**`src/App.css`** additions:
- `.slides-uploading` — muted small text for upload-in-progress state
- `.slides-upload-error` — danger-coloured small text for upload error

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| Wire `slideText` into `generate-structure` | Slice C — approved next step |
| Make subtopics optional when slides present | Slice C |
| `lessonFormat` forwarded to AI prompts | Separate slice |
| Real file upload (lab files, starter code) | Deferred |

---

## Limitations Still Present After Slice B

- `slideText` is lost on page reload — user must re-upload. Only `slideFileName` is restored from localStorage (display label only, no text).
- `<a:t>` extraction is sufficient for most standard decks but will miss text in SmartArt, speaker notes, tables rendered as drawings, or heavily custom XML namespaces.
- No slide count is shown if the server returns `slideCount: 0` (edge case: deck with no parseable text nodes) — filename shows without a slide label, which is acceptable.
- `generate-structure` and prompts are completely untouched — `slideText` sits in state, unused by AI until Slice C.

---

## Recommended Next Slice (Slice C)

**Wire `slideText` into `generate-structure` — do not change anything else.**

1. Pass `slideText` in the `POST /api/generate-structure` request body (in `lessonStructureService.js`).
2. Update `buildGenerateStructurePrompt` to use slides as the primary source when `slideText` is present, and subtopics as fallback/supplement.
3. Make subtopics optional in the `generate-structure` route validation when `slideText` is provided.
4. Make subtopics optional in the Screen 1 `isValid` check when `slideFileName` is set.

`generate-content` and content prompts stay untouched in Slice C.

---

**ID** 17
**Date:** 2026-03-23
**Session scope:** Screen 2 step-type-awareness; non-lesson step defaults; Slides upload UI (Slice A)

---

## What Was Completed This Session

### 1. Screen 2 step-type-awareness

`LessonAuthoringView.jsx` — major restructure (Screen 1 untouched):

- `lessonStructure` is now passed as a prop and drives the sidebar (all step types visible).
- `selectedStructureStep` (from `lessonStructure`) determines `stepType`; `selectedContent` (from `lessonContent`) is the lesson content entry, only present for lesson steps.
- Lesson steps: existing block view + code panel, unchanged. Edit/Save/Cancel mode applies only to lesson steps.
- Non-lesson steps: `NonLessonStepPanel` renders a read-only summary of the step's configured fields (description, URL, or file placeholder note). No Edit button, no code panel.
- Sidebar dirty dot only appears for lesson steps (non-lesson steps have no `lessonContent` entry).

`lessonContentService.js` — one-line fix: `if (step.stepType !== 'lesson') continue` — AI generation now skips non-lesson steps entirely.

`App.jsx` — `setSelectedStepId` after generate now uses `lessonStructure[0]?.id` (not `content[0]?.id`) so the first step is selected correctly regardless of type.

### 2. Default title for non-lesson steps

`App.jsx` — `handleAddStep`: non-lesson steps now default to `title: 'Hands-on practice'` instead of `''`. This prevents empty-title validation from blocking generation.

### 3. Slides upload UI — Slice A (frontend only)

`App.jsx` — new `slideFileName` state (string, empty = no slides); restored from localStorage draft on mount; persisted in `handleSaveDraft`.

`LessonInputForm.jsx` — new "Slides" field in Screen 1 left panel (between Lesson Format and Sub-topics):
- A hidden `<input type="file" accept=".pptx">` triggered by a styled label button.
- When a file is selected: filename row with a × remove button.
- Remove clears both App state and the file input ref.
- Accepts `.pptx` only (via `accept` attribute).

`App.css` — new classes: `.slides-file-input`, `.slides-upload-label`, `.slides-selected`, `.slides-selected-name`, `.slides-remove-btn`.

**No backend, no extraction, no prompt changes in this slice.**

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| Backend PPTX upload + extraction | Next slice (Slice B) |
| Wire `slideText` into `generate-structure` | Slice C — after Slice B is confirmed |
| Make subtopics optional when slides present | Slice B/C |
| `lessonFormat` forwarded to AI prompts | Separate slice |
| Real file upload (lab files, starter code) | Deferred |

---

## Recommended Next Slice (Slice B)

**Backend PPTX upload and text extraction only — do not touch `generate-structure` yet.**

1. `npm install multer jszip` (single `package.json`).
2. New `server/lib/extractSlideText.js` — accepts a Buffer; uses `jszip` to unzip the PPTX; reads `ppt/slides/slide*.xml` in order; extracts `<a:t>` text nodes per slide; returns a structured string (slide-labelled blocks of text).
3. New `POST /api/upload-slides` route in `server/index.js` — `multer` memory storage, 10 MB limit, `.pptx`-only; calls `extractSlideText`; returns `{ slideText, slideCount, fileName }`.
4. `App.jsx` — add `slideText` state (empty string); call `POST /api/upload-slides` on file select in a new `handleSlideUpload` handler; store returned `slideText`; clear on remove. **Do not pass `slideText` to `generate-structure` yet.**
5. `LessonInputForm.jsx` — show a loading state during upload; show slide count on success (e.g. "deck.pptx — 24 slides").

`generate-structure` and the prompt builder stay completely untouched in Slice B.

---

**ID** 16
**Date:** 2026-03-23
**Session scope:** Product direction update; lessonFormat + stepType foundation; Add Step type picker; non-lesson step scaffolding

---

## Product Direction Change (effective this session)

The product goal has been updated. This tool is no longer scoped to programming-only lessons. The new direction:

**Goal:** A flexible internal authoring interface for structured self-paced technical modules, supporting:
- Programming (`code_lab`)
- Guided Tool Workflow (`guided_tool_workflow`)
- Concept & Application (`concept_application`)

**Scope decisions (firm):**
- Monaco / CodeMirror — **out of scope**
- Export JSON / output folder — **de-prioritized** (built, but not maintained going forward)
- Backend persistence — **deferred to another team**; localStorage only for now
- Database / upload pipeline — **not in scope**
- PPT / slides ingestion — UI placeholder deferred; not implemented

The 2-screen workflow (Screen 1 defines steps, Screen 2 authors content) remains unchanged.

---

## What Was Completed This Session

### 1. `lessonFormat` added to module state

`App.jsx`: new `lessonFormat` state, default `'code_lab'`. Persisted in localStorage draft under the `lessonFormat` key. Restored on mount.

`LessonInputForm.jsx`: new Lesson Format dropdown (Course Name → Module Name → **Lesson Format** → Sub-topics). Three options defined in `LESSON_FORMAT_OPTIONS`:

| UI label | Internal value |
|---|---|
| Programming | `code_lab` |
| Guided Tool Workflow | `guided_tool_workflow` |
| Concept & Application | `concept_application` |

### 2. `stepType` added to all steps

`lessonStructureService.js` — `normalizeStructure()`: every AI-generated step now includes `stepType: 'lesson'`.

`App.jsx` — `handleAddStep(stepType)`: signature changed from no-args to accept a `stepType` parameter. Creates type-appropriate step shapes:

| stepType | Additional fields added |
|---|---|
| `lesson` | `goal: ''`, `coveredSubtopics: []` |
| `downloadable_lab_files` | `description: ''` |
| `starter_code_file` | `description: ''` |
| `external_lab_link` | `description: ''`, `externalLabLink: ''` |

### 3. Add Step type picker (Screen 1)

`LessonStructurePreview.jsx` — major update:
- "Add Step" button now toggles an inline `StepTypePicker` component showing four options: Lesson / Lab Files / Starter Code / External Lab
- Clicking a type creates the step and closes the picker
- `StepBuilderCard` split into: common header (step number badge + **step type badge** + title + controls) + four type-specific body components:
  - `LessonStepFields` — Goal + Topics (unchanged behavior, `topicsStr`/`lastSentCanonicalRef` logic preserved)
  - `DownloadableLabFilesFields` — Description + disabled file upload placeholder
  - `StarterCodeFileFields` — Description + two disabled file upload placeholders
  - `ExternalLabLinkFields` — Description + URL input

`App.css` — new classes: `.add-step-area`, `.step-type-picker`, `.step-type-picker-label`, `.step-type-picker-options`, `.step-type-picker-btn`, `.step-type-badge` (with four color variants), `.step-field-input--placeholder`.

### 4. UI label fix

`LessonInputForm.jsx`: field label column width widened from `52px` to `88px` so multi-word labels (Starter Code, Problem Statement) display correctly.

### 5. Lesson format label

The UI-facing label for `code_lab` was changed from "Code Lab" to "Programming". The internal value (`code_lab`) is unchanged.

---

## Current Architecture State

```
App.jsx
  screen / courseName / moduleName / lessonFormat / subtopics
  lessonStructure: Step[]          ← each step has stepType
  lessonContent:   LessonContent[] ← block-based; only for lesson steps today
  selectedStepId / dirtyStepIds / saveStatus / isGenerating / ...

Screen 1
  LessonInputForm          ← courseName, moduleName, lessonFormat, subtopics, generate button
  LessonStructurePreview   ← step cards (type-aware header + body) + Add Step picker

Screen 2
  LessonAuthoringView      ← sidebar + instruction panel (blocks view/edit) + code panel
    BlockEditor            ← edit mode for block-based lesson steps
    InstructionPanelEditor ← flat-field fallback (legacy)
    CodeEditorPanel        ← starterCode textarea

Services
  lessonStructureService.js  ← POST /api/generate-structure
  lessonContentService.js    ← POST /api/generate-content (one call per step)

Server
  server/index.js            ← Express proxy; holds API key
  server/prompts/            ← prompt builders (structure + content)
  server/lib/promptContext.js
```

---

## What Is Intentionally Not Done Yet

| Item | Reason |
|---|---|
| Screen 2 rendering for non-lesson step types | Next slice — non-lesson steps currently open the lesson panel, which shows an empty state |
| Filtering non-lesson steps from AI generation | Next slice — `generateAllLessonContent` still runs for all steps |
| Forwarding `lessonFormat` to AI prompts | After Screen 2 non-lesson fix — value is in state, not yet sent to backend |
| Real file upload (lab files, starter code) | Deferred — disabled placeholder inputs only |
| Reference materials area (slides, module guidance) | Deferred |
| Backend persistence | Deferred to another team |
| Export JSON workflow | De-prioritized |
| Monaco / CodeMirror | Out of scope |
| `starterCode` → `workingMaterial` rename | Deferred — would touch generation, normalization, and Screen 2 rendering |

---

## Known Caveats

- **localStorage draft can reopen Screen 2 unexpectedly.** A saved draft with `"screen": "authoring"` restores Screen 2 on reload. If the user has moved to a new lesson without saving, the old Screen 2 state will reappear. Fix: trigger a new generation (which clears the draft) or wait for backend persistence to replace localStorage.
- **`code_lab` vs "Programming" mismatch.** The internal value is still `code_lab`. The UI shows "Programming". These should be reconciled when `lessonFormat` is first forwarded to AI prompts.
- **`starterCode` field name.** Not yet renamed. The preferred future name for lesson step working material is `workingMaterial`. The `starter_code_file` step type still uses `starterCodeFile` / `starterCodeText` (these are fine as-is for that type).
- **Non-lesson steps in Screen 2.** Opening a non-lesson step in Screen 2 renders the lesson block view, which will be empty or confusing. This is the most important gap to address next.

---

## Recommended Next Slice

**Make Screen 2 step-type-aware for non-lesson steps.**

The safest approach:
1. In `LessonAuthoringView`, read `step.stepType` from `lessonContent` (or fall back to `lessonStructure` if the step has no `lessonContent` entry).
2. Branch the render: if `stepType === 'lesson'`, render current block view + code panel. For other types, render a simple read/edit view of the step's configured fields (description, URL, file reference note).
3. Simultaneously, filter `generateAllLessonContent` in `App.jsx` to skip non-lesson steps so they never get a `lessonContent` entry.

This slice keeps Screen 1 unchanged, does not touch AI prompts, and gives non-lesson steps a coherent Screen 2 experience.

---

**ID** 15
**Date:** 2026-03-19
**Session scope:** Prompt fixes, export feature, stale-draft bug, bullet list rendering

> **Note on session numbering:** Sessions 13 and 14 (prompt quality iteration, cross-browser CSS/layout fixes, check block UI polish, independent scrolling panes) were completed but not written to this doc. The memory file at `~/.claude/projects/.../memory/project_spl_content_generator.md` was the working context for those sessions. This entry resumes the doc from the current code state.

---

## What Was Completed

### Session 13

#### 1. Check block answer separator — prompt fix

`server/prompts/generateContentPrompt.js` — CHECK BLOCKS section.

Added explicit format instruction: question first, then `→ ` on a new line followed by the answer. This is required for `CheckBlock` in `LessonAuthoringView.jsx` to split the content and show the "Show answer / Hide answer" reveal button. Without the separator the button never appeared. The fix is prompt-only — no frontend changes.

**Note:** Only content generated after this session will have the separator. Existing saved drafts must be regenerated.

#### 2. JSON export

New: `POST /api/export` endpoint in `server/index.js`.
- Accepts `{ courseName, moduleName, lessonStructure, lessonContent, learnerLevel, outputLanguage, exportedAt }`
- Creates `output/` dir at project root if absent (`fs.mkdirSync` with `recursive: true`)
- Joins `lessonContent` + `lessonStructure` by `id` to attach `stepGoal` and `stepTopics` to each step
- Writes `{slug-course}-{slug-module}-MMDD-HHMM.json`
- Returns `{ filename }` on success

`src/App.jsx` — added `handleExport()`: calls `POST /api/export` with current state, alerts `output/{filename}` on success.
`src/components/Header.jsx` — added `onExport` prop; renders "Export JSON" button (secondary style, left of Save Draft) when `onExport` is non-null.
In `App.jsx` render: `onExport` is only passed when `screen === 'authoring' && lessonContent.length > 0`.

Export payload shape:
```json
{
  "courseName": "...",
  "moduleName": "...",
  "learnerLevel": "beginner",
  "outputLanguage": "Python",
  "exportedAt": "ISO timestamp",
  "steps": [
    {
      "stepNumber": 1,
      "stepTitle": "...",
      "stepGoal": "...",
      "stepTopics": ["..."],
      "blocks": [...],
      "starterCode": "...",
      "expectedAction": "...",
      "validationNote": "..."
    }
  ]
}
```

Export verified live: `output/intro-to-python-collect-and-process-data-0318-2108.json` written successfully.

**Note for next session:** restart Express (`npm run dev:all`) after any change to `server/index.js` — new routes are not live until the process restarts. This caused the first "Export failed: 404".

#### 3. Stale localStorage draft bug

`src/App.jsx` — `handleGenerate()`: after a successful `generateAllLessonContent`, added `localStorage.removeItem(STORAGE_KEY)` before `setScreen('authoring')`.

**Problem it solves:** Vite HMR or any page reload after a new generation was restoring the old saved draft (e.g. a previous "Control Flow" lesson) and overwriting the newly generated content. The fix ensures a successful new generation always clears the stale draft, so reloads start clean.

#### 4. Explain block bullet list rendering

**Problem:** The AI outputs comparison content as `- item\n- item\n- item`. The renderer split on `\n\n`, so the whole list was one `<p>` chunk, and browsers collapsed it to a single line.

**Renderer fix** (`src/components/LessonAuthoringView.jsx`): Added `isBulletList` detection in the `segments` mapping — if every non-empty line in a `\n\n`-separated chunk starts with `- `, render `<ul>/<li>` instead of `<p>`. Runs before the existing `isCode` check. Does not affect code or prose chunks.

**CSS** (`src/App.css`): Added `.block-bullet-list` and `.block-bullet-list li` — standard list styling with left padding and modest item spacing.

**Prompt fix** (`server/prompts/generateContentPrompt.js`): Added bullet list format rules to the EXPLAIN BLOCKS section — each item on its own line starting with `- `, surrounded by blank lines above and below. Prevents the model from embedding bullets inside prose sentences.

**Note:** Existing saved content may not have blank lines around bullet lists. Regenerate to get proper rendering.

---

## State at End of Session

- Both generation endpoints are live and verified with GPT-5.4
- Export is live and verified — `output/` folder exists with one confirmed export
- Screen 2 is block-based end-to-end: generation → `blocks[]` → `BlocksView` / `BlockEditor`
- `learnerLevel` and `outputLanguage` are hardcoded to `'beginner'` / `'Python'` — no UI control yet
- `src/utils/mockGeneration.js` and `src/components/LessonStructureEditor.jsx` are still present as dead code — not deleted

---

## Next Recommended Step

**Clean up dead code** (two safe deletions):
- `src/utils/mockGeneration.js` — nothing imports it; mock behavior is server-side
- `src/components/LessonStructureEditor.jsx` — dead since Session 2

Then update `lessonContentService.js` JSDoc and `CONTENT_FIELDS` to reflect the current block-based schema (low-risk documentation fix).

After that: **Phase 3 — backend persistence** (`handleSaveDraft` → `POST /api/lessons`).

---

---

**ID** 12
**Date:** 2026-03-18
**Session scope:** Server-side prompt infrastructure + Screen 2 AI generation wired end-to-end

---

## What Was Completed

### Session 12 — Prompt infrastructure + Screen 2 AI wired

#### Prompt infrastructure refactor

All AI prompt text is now isolated in editable server-side files. Nothing is embedded inline in route handlers.

New files created:

| File | Purpose |
|---|---|
| `server/lib/promptContext.js` | Normalizes and assembles prompt input fields; the single place to add new context variables (learnerLevel, outputLanguage, etc.) |
| `server/prompts/generateStructurePrompt.js` | Screen 1 prompt builder — moved out of `server/index.js`; exports `buildGenerateStructurePrompt({ courseName, moduleName, subtopicsText })` |
| `server/prompts/generateContentPrompt.js` | Screen 2 master prompt builder — exports `buildGenerateContentPrompt(context)`; this is the file to open when editing the lesson content prompt |
| `server/prompts/contentSectionPrompts.js` | Per-section prompt builders (explanation, code example, instructions, hint, starter code, practice task) — placeholder stubs ready for future per-section regeneration endpoints |

`server/index.js` now only does: request validation → `buildPromptContext()` → `buildGenerateContentPrompt()` / `buildGenerateStructurePrompt()` → OpenAI call → response shaping. No prompt text lives in route handlers.

The user pasted the final Screen 2 master prompt into `generateContentPrompt.js` during this session.

#### Screen 2 AI generation wired

- Added `POST /api/generate-content` to `server/index.js`
  - Accepts: `{ courseName, moduleName, step, lessonStructure?, learnerLevel?, outputLanguage? }`
  - Returns: `{ concept, codeExample, instructions, hint, expectedAction, validationNote, starterCode }`
  - Uses `buildPromptContext()` + `buildGenerateContentPrompt()` for the real path
  - Has a server-side mock (`mockGenerateContent(step)`) used when `USE_MOCK=true`, mirroring the old `mockGeneration.js` behavior
- Created `src/services/lessonContentService.js` — same three-layer pattern as Screen 1:
  - `callProvider()` — calls `POST /api/generate-content`
  - `normalizeContent(rawContent, step)` — validates shape, coerces missing fields to `''`, adds `id`/`stepNumber`/`title`
  - `generateAllLessonContent({ courseName, moduleName, lessonStructure, ... })` — loops over all steps sequentially, one API call per step; exported public API
- Updated `App.jsx` — swapped import from `mockGeneration.generateLessonContent` to `lessonContentService.generateAllLessonContent`; added `await`; updated comment

#### Bugs diagnosed and resolved

**404 on `/api/generate-content`**: Route was registered in code but the Express backend process had not been restarted. Fix: `npm run server` (or `npm run dev:all`). No code change required.

**Screen 2 showing old placeholder content**: `App.jsx` on mount restores `lessonContent` from `localStorage` (`spl_lesson_draft`). The saved draft contained mock-generated content from before the real API was wired. Fix: run `localStorage.removeItem('spl_lesson_draft')` in the browser console, then reload and regenerate. No code change required.

---

## State at End of Session

- `USE_MOCK=false` and `OPENAI_MODEL=gpt-5.4` are set in `.env`
- Both `POST /api/generate-structure` (Screen 1) and `POST /api/generate-content` (Screen 2) are live on the running backend
- The real AI path for Screen 2 has been wired but not yet end-to-end verified with a live generation (the session ended before a full fresh generation was confirmed working)
- `src/utils/mockGeneration.js` is now dead code — no file imports it. The mock behavior was moved server-side. Safe to delete.

---

## Next Recommended Step

**Verify Screen 2 real AI generation end-to-end** (same verification done for Screen 1 in Session 11):
1. Clear localStorage: `localStorage.removeItem('spl_lesson_draft')`
2. Restart backend: `npm run dev:all`
3. Fill in the form, generate structure, click "Generate Lesson Content →"
4. Confirm each step's content looks like real AI output (not bracket-style placeholders)
5. If generation fails, check the Express terminal for `[generate-content]` error logs

Once verified, the next code work is Phase 3 item 1: **Add JSON export button** in the Screen 2 header. State shape is already correct — no structural changes needed.

---

---

**ID** 1
**Date:** 2026-03-16
**Session scope:** Initial build — UI skeleton + local state flow (no backend, no real AI)

> **Cross-references:** This document is a time-stamped session log.
> For living documentation, see: [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## What Was Completed

### Session 1 — Full UI skeleton built from scratch

The project directory was empty at the start of this session. By the end, a fully functional two-screen authoring tool was built with:

- Vite + React project scaffolded manually (no CRA/template)
- Screen 1: Lesson Structure Builder — form input, mocked structure generation, always-editable step cards with add / delete / reorder
- Screen 2: Lesson Authoring View — step sidebar, split instruction + code editor panels, per-step editing, save draft to localStorage
- Global save/dirty state tracking (dirty dot per step in sidebar, SaveStatus indicator in header)
- Draft persistence to `localStorage` (key: `spl_lesson_draft`) with restore on mount
- All content is mocked — no real AI calls yet

---

## Important Decisions Made

The table below captures decisions made in this session. For full rationale and expanded discussion, see [decisions.md](decisions.md) — that file is the canonical reference.

| Decision | Rationale |
|---|---|
| No edit-mode toggle on Screen 1 | The structure cards are always editable; a separate "edit mode" adds friction and hides the authoring nature of the tool |
| `coveredSubtopics` stored as array in App state, edited as a local comma-string in `StepBuilderCard` | Prevents the array→string→array round-trip from resetting the cursor mid-type. Local state resets on `step.id` change (new generation). |
| All mock generation isolated to `src/utils/mockGeneration.js` | Both AI hook points are in one file and clearly marked; callers in `App.jsx` are also annotated `// [AI HOOK]` |
| Save is global, not per-step | "Save Draft" persists the entire lesson to localStorage in one shot. Per-step auto-save can be layered on later. |
| No icon library | Uses Unicode arrows (↑ ↓ ×) to avoid adding a dependency for three symbols |
| `dist/` generated but not committed | Build artifact — must be in `.gitignore` before first commit |

---

## Files Created or Changed

### Created (new project — all files are new)

```
index.html
vite.config.js
package.json
package-lock.json
src/main.jsx
src/App.jsx
src/App.css
src/utils/mockGeneration.js
src/components/Header.jsx
src/components/SaveStatus.jsx
src/components/LessonInputForm.jsx
src/components/LessonStructurePreview.jsx      ← rewritten in session 2
src/components/LessonStructureEditor.jsx       ← created in session 1, now unused (see below)
src/components/LessonAuthoringView.jsx
src/components/InstructionPanelEditor.jsx
src/components/CodeEditorPanel.jsx
docs/session_handoff.md                        ← this file
```

### Notable: `LessonStructureEditor.jsx`

This component was created in the first pass as a separate "edit mode" form. In the second pass the edit-mode concept was removed — editing is now inline in `LessonStructurePreview.jsx`. `LessonStructureEditor.jsx` is no longer imported anywhere. It can be deleted or repurposed.

---

## What Is Currently Working

- **Screen 1 — Lesson Structure Builder**
  - User enters Course Name, Module Name, and Sub-topics (one per line)
  - Clicking "Generate Structure Preview" populates the right pane with editable step cards
  - Each step card has:
    - Inline title input (large, in the card header)
    - Goal field
    - Covered Topics field (comma-separated, local string state)
    - ↑ / ↓ reorder buttons (disabled at boundaries)
    - × delete button (red on hover)
    - Focus-within glow on the whole card (blue border + ring)
  - Steps are auto-renumbered after add / delete / reorder
  - "Add Step" dashed button appends a blank step
  - "Generate Lesson Content →" navigates to Screen 2

- **Screen 2 — Lesson Authoring View**
  - Step sidebar with active-step highlight and unsaved-change amber dot
  - Split layout: Instruction Panel (left) + Code Editor Panel (right)
  - Instruction Panel fields: Title, Concept, Task Instructions, Hint — all editable textareas
  - Code Editor Panel: dark-themed monospace textarea; Tab key inserts 4 spaces
  - All edits update `lessonContent` in App state on each keystroke
  - Save Draft button in header persists to localStorage
  - SaveStatus indicator: Saved (green) / Unsaved changes (amber) / Saving… (blue pulse)
  - Back to Builder navigates back to Screen 1 (state preserved)

- **Draft persistence**
  - On Save Draft: full state written to `localStorage` under key `spl_lesson_draft`
  - On app load: draft is restored if present (screen, form values, structure, content, selected step)

---

## What Is NOT Implemented Yet

- **Real AI generation** — both `generateLessonStructure()` and `generateLessonContent()` in `src/utils/mockGeneration.js` return hardcoded/templated content
- **Backend persistence** — no API calls; only `localStorage`
- **Export** — no JSON export, no file download, no copy-to-clipboard
- **Step drag-and-drop** — reorder is ↑/↓ buttons only
- **Rich code editor** — the code panel is a styled `<textarea>`, not Monaco or CodeMirror
- **Syntax highlighting** — no highlighting in the code panel
- **Undo / redo** — no history
- **Validation** — no warnings for empty step titles, duplicate titles, etc.
- **Multi-lesson management** — no list of lessons, no naming/saving multiple drafts
- **Authentication / user sessions** — none

---

## Next 3 Recommended Steps

For the full prioritized backlog, see [todo.md](todo.md).

### 1. Create `.gitignore` and make the first commit

The `dist/` folder and `node_modules/` must not be committed. Create `.gitignore` first, then commit. Git commands are in the section below.

### 2. Wire in real AI generation

Both integration points are clearly marked. The swap is surgical — replace function bodies in `src/utils/mockGeneration.js` with API calls, and add `isGenerating` state in `App.jsx`:

```js
// src/App.jsx — two [AI HOOK] call sites
const structure = await generateLessonStructure(courseName, moduleName, subtopics)
const content   = await generateLessonContent(lessonStructure)
```

### 3. Add JSON export

The state shape is already export-ready. No data model changes needed — see [data_model.md → Future: Export Shape](data_model.md) for the payload structure.

---

## Known Issues, Rough Edges, and Refactoring Suggestions

| Item | Severity | Notes |
|---|---|---|
| `LessonStructureEditor.jsx` is dead code | Low | No longer imported. Either delete the file or repurpose it as a future "bulk edit / paste JSON" panel |
| ~~`dist/` committed to git~~ | ~~Low~~ | Resolved in Session 2 — `.gitignore` added, `dist/` excluded |
| No loading state for generation | Medium | The mock is synchronous so it doesn't matter now, but once real AI is wired in, clicking "Generate" should disable the button and show feedback |
| `StepBuilderCard` local `topicsStr` can drift | Low | If `coveredSubtopics` is modified outside the card (e.g., future bulk-edit or undo), the local string won't update. The `useEffect` only resets on `step.id` change, not on `step.coveredSubtopics` content change |
| `lessonContent` in Screen 2 is a complete copy | Low | When the user goes back to Screen 1 and re-generates, `lessonContent` is fully replaced. There is no "merge" — manual edits made in Screen 2 are lost on re-generation. This is probably intentional now but worth flagging |
| No `aria-live` on step reorder | Low | Screen readers won't announce that a step moved. The up/down buttons have `aria-label` but no announcement of new position |
| All state in one `App.jsx` | Low | Fine at current scale. If the component grows, consider extracting two contexts: `BuilderContext` and `AuthoringContext` |

---

## Git Commands

> **Note:** This commit was completed between Session 1 and Session 2 as `5afe17a Add .gitignore and clean tracked build artifacts`. The commands below are preserved as a historical reference.

```bash
# 1. Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.DS_Store
*.local
EOF

# 2. Stage source files explicitly
git add .gitignore
git add index.html vite.config.js package.json package-lock.json
git add src/
git add docs/

# 3. Commit
git commit -m "$(cat <<'EOF'
feat: initial SPL Content Generator UI skeleton

Builds the full two-screen authoring tool with local state only.
No backend or real AI generation — all content is mocked.

Screen 1: form input, always-editable step cards, add/delete/reorder
Screen 2: instruction panel + dark code editor, per-step dirty tracking
Shared: localStorage draft persistence, AI and persist hook points marked
EOF
)"
```

---

*End of Session 1.*

---
---

# Session 2 Handoff

**ID:** 2
**Date:** 2026-03-16
**Session scope:** Screen 1 structural rewrite + full project documentation set
**Git state at close:** Working tree clean — all changes committed in `5afe17a`

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## What Was Completed

### 1. Screen 1 — Always-editable step cards (structural rewrite)

The original Screen 1 had a separate edit-mode toggle: users clicked "Edit Structure" to enter an edit form, then "Update" to commit. This was replaced with an always-editable inline builder.

Changes:
- `LessonStructurePreview.jsx` was fully rewritten. The `ViewMode` + `LessonStructureEditor` pattern was replaced with a single `StepBuilderCard` component per step, always visible and always editable.
- `App.jsx` had `isStructureEdit` state removed and four new granular handlers added: `handleUpdateStep`, `handleAddStep`, `handleDeleteStep`, `handleMoveStep`. All four automatically renumber steps.
- `LessonStructureEditor.jsx` was retained on disk but is no longer imported (dead code).
- `App.css` gained a new `step-builder-card` block including `:focus-within` glow, `step-icon-btn` controls, and `step-field-row` layout.

### 2. Documentation set — created from scratch

Six new documents, all based on the implemented codebase (not speculative future state):

| File | Contents |
|---|---|
| `README.md` | Entry point: purpose, quick start, project layout, AI/persist hook locations, doc index |
| `docs/product_overview.md` | Product purpose, target user, two-screen summary, what is mocked, design principles |
| `docs/user_flow.md` | Step-by-step UX for both screens; state lifecycle summary |
| `docs/data_model.md` | Exact state shapes with types, Screen 1→2 transformation, localStorage format, future export/backend payloads |
| `docs/decisions.md` | Canonical architectural and design decisions with full rationale — canonical reference for future sessions |
| `docs/todo.md` | Backlog in six phases: hygiene → AI → export/persist → Screen 1 → Screen 2 → multi-lesson/polish |

### 3. Minor code cleanup

- Fixed stale JSDoc in `src/App.jsx`: removed `isStructureEdit` from the state shape comment block (the field was removed in the Screen 1 rewrite).

### 4. Repository hygiene

- Created `.gitignore` (`node_modules/`, `dist/`, `.DS_Store`, `*.local`).
- All changes — code, docs, and `.gitignore` — were committed in a single commit: `5afe17a Add .gitignore and clean tracked build artifacts`.

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| Always-editable cards, no edit-mode toggle | Authoring tools should feel like editors, not forms. A toggle implies the structure is for reading first, editing second. The inline card model removes the two-step commit flow. See [decisions.md](decisions.md) for full rationale. |
| Immediate structure mutations (no draft buffer on Screen 1) | Step-level edits (add/delete/reorder/field change) go directly to App state. No pending buffer, no "Update" button. Consistent with how a spreadsheet feels. |
| `StepBuilderCard` local `topicsStr` state | The comma-separated topics input uses local string state to prevent cursor reset during typing. Resets on `step.id` change. Documented as a known limitation in [decisions.md](decisions.md). |
| Docs describe current implementation only | All six docs were written against the already-implemented codebase. No speculative future features are presented as if implemented. |

---

## Files Created, Changed, or Deleted

**Created:**
```
README.md
.gitignore
docs/product_overview.md
docs/user_flow.md
docs/data_model.md
docs/decisions.md
docs/todo.md
```

**Modified:**
```
src/App.jsx                           — removed isStructureEdit state + JSDoc; added 4 step handlers
src/App.css                           — added step-builder-card block (~130 lines)
src/components/LessonStructurePreview.jsx  — full rewrite (213 lines, replaces 125)
docs/session_handoff.md               — added Session 2 entry (this section); cross-references; resolved dist/ issue row
```

**Deleted:** None. `LessonStructureEditor.jsx` is dead code but retained on disk.

**Not committed / should not be committed:**
```
dist/          — excluded by .gitignore
node_modules/  — excluded by .gitignore
```

---

## What Is Currently Working

All Session 1 functionality remains working. New in this session:

**Screen 1 — step cards now always editable (no mode toggle)**
- Title input in card header; Goal and Topics fields in card body
- ↑/↓ reorder with boundary-disable and auto-renumber; × delete with red hover
- Focus-within: blue border + glow ring on the active card
- "Add Step" appends a blank step at the end
- All four mutations operate directly on `lessonStructure` in App state — no pending buffer

**Documentation set added**
- `README.md`, `docs/product_overview.md`, `docs/user_flow.md`, `docs/data_model.md`, `docs/decisions.md`, `docs/todo.md`

→ See [user_flow.md](user_flow.md) for the full current interaction detail.
→ See [todo.md](todo.md) for the complete not-yet-implemented backlog.

---

## Next 3 Recommended Steps

### 1. Delete `LessonStructureEditor.jsx`

It is dead code — not imported anywhere. Deleting it eliminates confusion for the next developer.

```bash
git rm src/components/LessonStructureEditor.jsx
git commit -m "chore: remove unused LessonStructureEditor component"
```

### 2. Wire in real AI generation

Both integration points are isolated in `src/utils/mockGeneration.js` and annotated with `// [AI HOOK]` in `App.jsx`. The swap requires:
- Replace function bodies in `mockGeneration.js` with `fetch()` / SDK calls
- Add `isGenerating` boolean to App state
- Disable generate buttons and show loading feedback during generation

### 3. Add JSON export

No data model changes needed. Add a download button in the Screen 2 header that calls a one-shot blob export. The payload shape is documented in [data_model.md](data_model.md).

---

## Known Issues, Rough Edges, and Cleanup Items

See [todo.md](todo.md) — Known Issues table — for the full list with severity ratings.

Top items from this session:
- `LessonStructureEditor.jsx` is dead code (safe to delete — Phase 0 in todo.md)
- No loading state for generation — will freeze UI once real async AI calls land (Phase 2)
- Single commit `5afe17a` contains entire project history with a generic message; future sessions should commit incrementally

---

## Commit Messages

**Recommended (for future reference — this session's work is already committed in `5afe17a`):**

```
feat: rebuild Screen 1 as always-editable structure builder + add project docs

Screen 1 rewrite:
- Replace edit-mode toggle with always-editable inline step cards
- Add step-level handlers: updateStep, addStep, deleteStep, moveStep
- Auto-renumber steps after every mutation
- Focus-within highlight on active card
- LessonStructureEditor.jsx now unused (dead code)

Docs added:
- README.md: quick start, project layout, AI/persist hook locations
- docs/product_overview.md: purpose, users, screens, design principles
- docs/user_flow.md: step-by-step UX for both screens
- docs/data_model.md: state shapes, Screen 1→2 transform, localStorage format
- docs/decisions.md: canonical architectural and design decisions
- docs/todo.md: phased backlog

Cleanup:
- .gitignore: exclude dist/, node_modules/, .DS_Store
- App.jsx: remove stale isStructureEdit JSDoc reference
```

**Alternative A** (concise):
```
feat: always-editable step cards on Screen 1, add full project docs
```

**Alternative B** (split intent — would have been two commits):
```
feat: rebuild Screen 1 structure editor with inline always-editable step cards
docs: add README, product overview, user flow, data model, decisions, todo
```

---

## Git Commands

The working tree was already clean at close — all changes were committed in `5afe17a`.

```bash
# Verify state
git status
git log --oneline
git show --stat HEAD

# Optional: rename the commit message (only safe before pushing to a remote)
git commit --amend -m "$(cat <<'EOF'
feat: rebuild Screen 1 as always-editable structure builder; add project docs

- Replace edit-mode toggle with always-editable inline step cards
- Add step handlers: updateStep, addStep, deleteStep, moveStep (auto-renumber)
- LessonStructureEditor.jsx now unused (dead code — delete in next session)
- Add README, product_overview, user_flow, data_model, decisions, todo docs
- Add .gitignore; fix stale isStructureEdit JSDoc in App.jsx
EOF
)"
```

**Files excluded by `.gitignore` — must never be committed:**
```
dist/         — Vite production build output
node_modules/ — installed packages
```

---

*End of Session 2.*

---
---

# Session 3 Handoff

**ID:** 3
**Date:** 2026-03-16
**Session scope:** Phase 0 cleanup + Phase 1 data model & UI stabilization + Phase 2 generation infrastructure
**Git state at close:** Working tree clean — all changes committed across 5 commits (see log below)

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## Commits This Session

```
019bdc0 feat: add generation error state for both generation actions
42865ec feat: add isGenerating loading state for both generation actions
b2dd870 fix: keep step title in sync between lessonStructure and lessonContent
b145f1b feat: add confirmation guards before destructive regeneration
43ef9a1 feat: add expectedAction and validationNote to lesson content
```

(Plus one chore commit for dead code removal made at the start of this session, already folded in before the above.)

---

## What Was Completed

### 1. Phase 0 — Dead code removal

- Deleted `src/components/LessonStructureEditor.jsx` — confirmed not imported anywhere; superseded in Session 2 when the edit-mode toggle was removed.
- Removed the file from the `README.md` project layout tree.
- Marked Phase 0 ✅ in `todo.md`.

### 2. Phase 1 — `expectedAction` and `validationNote` fields

- Added both fields to the `LessonContent` shape produced by `generateLessonContent()` in `mockGeneration.js`. Mock helpers generate realistic authoring-flavored placeholder text per step.
- Added two editable textarea fields to `InstructionPanelEditor` (below Hint): **Expected Action** and **Validation Note**.
- State, dirty-tracking, and localStorage draft persistence all pick up the new fields automatically via the existing `handleUpdateContent` partial merge.
- `data_model.md` updated: fields promoted from the "Reserved" comment block to live type definition.

### 3. Phase 1 — Re-generation confirmation guards

- `handleSubmit` (`App.jsx`): if `lessonStructure.length > 0`, shows `window.confirm()` before replacing the structure.
- `handleGenerate` (`App.jsx`): if `lessonContent.length > 0`, shows `window.confirm()` before replacing all lesson content.
- First-time generation is unguarded. "Back to Builder" navigation itself is not guarded — the prompt fires on the next explicit Generate action.
- `decisions.md` updated to reflect confirmed behavior; `todo.md` Phase 1 items marked ✅.

### 4. Phase 1 — Step title sync (Screen 1 ↔ Screen 2)

- `handleUpdateContent` in `App.jsx` now mirrors a `title` change in Screen 2 back to the corresponding `lessonStructure` entry.
- Prevents silent divergence when an author renames a step in the authoring view and then returns to Screen 1.
- One-directional (S2 → S1). Editing a title in Screen 1 after visiting Screen 2 does not back-propagate to `lessonContent` — however, any confirmed re-generation of lesson content will re-sync from the current structure titles.
- `data_model.md` comment for `LessonContent.title` corrected (removed "editable independently").

### 5. Phase 2 — `isGenerating` loading state

- `isGenerating` boolean state added to `App.jsx`.
- Both `handleSubmit` and `handleGenerate` are now `async` with `setIsGenerating(true)` before the call and `setIsGenerating(false)` in a `finally` block.
- `LessonInputForm`: button disabled and label changes to "Generating…" when `isGenerating`. Keyboard shortcut (⌘+Enter) also guarded.
- `LessonStructurePreview`: "Generate Lesson Content →" button disabled and label changes to "⏳ Generating…" when `isGenerating`.
- State is invisible during mock use (synchronous) but structurally correct — adding `await` to the AI call is all that's needed.

### 6. Phase 2 — Generation error state

- `generationError` (`string | null`) state added to `App.jsx`.
- Each handler clears the error at the start of a new attempt, then sets a fixed user-friendly message in a `catch` block.
- `LessonInputForm` renders a `<p className="generation-error">` below the submit button when the error is non-null.
- `LessonStructurePreview` renders the same element inside the footer below the generate button.
- `.generation-error` CSS class added to `App.css` using the existing `--color-danger` token.
- `.structure-footer` changed from `flex` row to `flex-direction: column` to accommodate the error stacking below the button.

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| `window.confirm()` for re-generation guards | Simplest correct behavior; no custom modal needed at this stage. Docs reference this explicitly so it's easy to replace later. |
| Title sync is S2 → S1 only | The destructive direction is Screen 2 (where authors spend time naming steps). S1 → S2 sync is implicit on any confirmed re-generation. |
| One shared `generationError` state | Both generators are on Screen 1 and can't run concurrently. A single error state is sufficient and simpler than two. |
| Fixed error messages, not `err.message` | API errors (network timeouts, rate limits) are too technical for an authoring UI. The catch blocks are the right place to add message discrimination when real API calls land. |
| `isGenerating` invisible during mock | No artificial delay added to the mock. The `try/finally` pattern is correct — visibility follows naturally once real async calls are wired in. |

---

## Files Created, Changed, or Deleted

**Deleted:**
```
src/components/LessonStructureEditor.jsx   — dead code removed (Phase 0)
```

**Modified:**
```
src/App.jsx                                — isGenerating, generationError, async handlers,
                                             title sync in handleUpdateContent, new props to children
src/App.css                                — .generation-error class; .structure-footer column layout
src/utils/mockGeneration.js                — expectedAction + validationNote fields + mock helpers
src/components/InstructionPanelEditor.jsx  — Expected Action + Validation Note textarea fields
src/components/LessonInputForm.jsx         — isGenerating + generationError props; button state + label
src/components/LessonStructurePreview.jsx  — isGenerating + generationError props; button state + label
README.md                                  — updated "Where to Connect Real AI" note
docs/data_model.md                         — LessonContent type updated; title comment corrected
docs/decisions.md                          — re-generation decision notes updated
docs/todo.md                               — Phase 0/1/2 items marked ✅; Known Issues table updated
```

---

## What Is Currently Working

All Session 1 + 2 functionality remains working. New in this session:

- **`expectedAction` and `validationNote`** fully wired into the authoring flow: generated, editable in Screen 2, persisted to localStorage with the rest of the draft.
- **Re-generation confirmation prompts** on both Screen 1 (structure replace) and the Screen 1 → 2 transition (content replace).
- **Step title synchronization**: editing a step title in Screen 2 immediately updates the same step in Screen 1's structure.
- **`isGenerating` state** correctly disables and relabels both generate buttons during a generation call.
- **Generation error display**: red inline banner appears near the triggering button on failure; clears on the next attempt.

---

## What Is NOT Implemented Yet

- **Real AI generation** — both `generateLessonStructure()` and `generateLessonContent()` in `mockGeneration.js` return hardcoded/templated content. Hooks in `App.jsx` are marked `// [AI HOOK]`.
- **Backend persistence** — `handleSaveDraft()` writes only to `localStorage`. Marked `// [PERSIST HOOK]`.
- **JSON export** — no file download button.
- **Empty-title validation on Screen 1** — no warning before "Generate Lesson Content →" if any step title is blank (Phase 1, still open).
- **`coveredSubtopics` local state drift fix** — `StepBuilderCard.topicsStr` only resets on `step.id` change (Phase 1, still open).
- **Step title back-sync S1 → S2** — editing a title in Screen 1 after visiting S2 does not update `lessonContent.title`.
- **Rich code editor** (Monaco/CodeMirror), drag-and-drop reorder, undo/redo, export, multi-lesson management — all Phase 3–6.

---

## Next 3 Recommended Steps

### 1. Complete remaining Phase 1 stabilization items

Two items remain open before Phase 2 AI integration:

**a. Empty-title validation on Screen 1**
Block or warn before "Generate Lesson Content →" if any step has a blank title. Simple guard in `handleGenerate` in `App.jsx`:

```js
const hasEmptyTitle = lessonStructure.some((s) => !s.title.trim())
if (hasEmptyTitle) { /* warn */ return }
```

**b. Fix `coveredSubtopics` local state drift**
In `StepBuilderCard` (`LessonStructurePreview.jsx`), the `useEffect` that resets `topicsStr` depends only on `step.id`. Change the dependency to `[step.id, step.coveredSubtopics]` to also reset when content changes externally. See [data_model.md](data_model.md) — coveredSubtopics section for full context.

### 2. Wire in real AI generation (Phase 2)

All infrastructure is in place:
- Both handlers are `async` with `isGenerating` and `generationError` already wired
- Replace the synchronous calls in `mockGeneration.js` with `fetch()` / SDK calls
- Add `await` at the two `// [AI HOOK]` callsites in `App.jsx`
- Update the `catch` blocks to inspect `err` and surface more specific messages

### 3. Add JSON export (Phase 3, quick win)

No data model changes needed. The full state is already in the correct export shape. Add a download button in the Screen 2 header — see [data_model.md → Future: JSON Export Shape](data_model.md) for the exact payload.

---

## Known Issues, Rough Edges, and Refactoring Suggestions

| Item | Severity | Notes |
|---|---|---|
| `coveredSubtopics` local state can drift | Low | `StepBuilderCard.topicsStr` only resets on `step.id` change. Safe currently; Phase 1 cleanup item. |
| Generation error messages are fixed strings | Low | When real API calls land, the catch blocks should inspect `err` for specific failures (rate limit, network, invalid JSON). |
| `isGenerating` invisible during mock | Info | Synchronous mock means "Generating…" flashes one render tick. No action needed — becomes visible once real AI is wired in. |
| S1 title edits don't back-propagate to S2 | Low | If a user goes Back to Builder and renames a step title without re-generating, `lessonContent.title` diverges. Resolves on next confirmed re-generate. Low risk at current scale. |
| All state in one `App.jsx` | Low | Fine for two screens. A third screen or cross-cutting state would warrant extracting `BuilderContext` / `AuthoringContext`. |

---

## Commit Messages

**Recommended:**
```
chore: update session handoff and clean up stale Known Issues table

Adds Session 3 entry to session_handoff.md covering: dead code removal,
expectedAction/validationNote fields, re-generation confirmation guards,
step title sync, isGenerating loading state, and generation error state.
Removes resolved items from todo.md Known Issues table.
```

**Alternative A** (shorter):
```
docs: add Session 3 handoff; update todo Known Issues table
```

**Alternative B** (split intent):
```
docs: add Session 3 handoff to session_handoff.md
chore: remove resolved items from todo.md Known Issues table
```

---

## Git Commands

```bash
git add docs/session_handoff.md docs/todo.md
git commit -m "$(cat <<'EOF'
chore: update session handoff and clean up stale Known Issues table

Adds Session 3 entry to session_handoff.md covering: dead code removal,
expectedAction/validationNote fields, re-generation confirmation guards,
step title sync, isGenerating loading state, and generation error state.
Removes resolved items from todo.md Known Issues table.
EOF
)"
```

**Files excluded by `.gitignore` — must never be committed:**
```
dist/         — Vite production build output
node_modules/ — installed packages
```

---

*End of Session 3.*

---
---

# Session 4 Handoff

**ID:** 4
**Date:** 2026-03-16
**Session scope:** Phase 1 completion — empty-title validation + coveredSubtopics drift fix
**Git state at close:** Two uncommitted changes (see Git Commands below)

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## Commits This Session

```
e44e2d5 feat: block generation on empty step titles with inline validation message
+ this handoff commit (docs + coveredSubtopics fix)
```

---

## What Was Completed

### 1. Phase 1 — Empty-title validation on Screen 1

- `handleGenerate` in `App.jsx` now checks for blank step titles before anything else. If any step has an empty or whitespace-only title, it sets `titleValidationError` state and returns immediately — the confirm dialog and generation are never reached.
- `titleValidationError` (`string | null`) added to App state (JSDoc updated).
- A `useEffect` in `App.jsx` auto-clears the error once all step titles are non-empty (reactive on `lessonStructure`).
- `LessonStructurePreview` accepts the new `titleValidationError` prop and renders it as a `<p className="generation-error">` below the Generate button, above any `generationError`. The two errors are mutually exclusive — validation blocks entry to the code path that sets `generationError`.
- No `alert()`. No new CSS class (reuses `.generation-error`). No change to any other generation behavior.

### 2. Phase 1 — coveredSubtopics local state drift fix

- `StepBuilderCard` in `LessonStructurePreview.jsx` previously reset `topicsStr` only when `step.id` changed. Adding `step.coveredSubtopics` directly to the dep array would cause cursor-jump on every keystroke (each user keystroke round-trips through `onUpdate` → parent state → new array reference → effect fires → canonical overwrites the mid-entry string).
- Fixed with a `lastSentCanonicalRef` (`useRef`). `handleTopicsChange` writes the canonical of whatever it sends up (`parsed.join(', ')`) into the ref. The effect computes the incoming canonical and only calls `setTopicsStr` if it differs from the ref — meaning the change came from outside the card, not from the user typing.
- `useEffect` deps changed from `[step.id]` (with `eslint-disable` suppression) to `[step.id, step.coveredSubtopics]` (no suppression needed).
- `useRef` added to the React import.
- JSDoc on `StepBuilderCard` updated to describe the new sync contract.

### Phase 1 — Status

All five Phase 1 items are now ✅. Phase 1 is complete.

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| `lastSentCanonicalRef` instead of just adding `step.coveredSubtopics` to deps | Naive dep addition causes cursor-jump: every keystroke creates a new array ref in parent state, triggering the effect, which normalizes and overwrites the local input mid-type. The ref lets the effect skip changes that originated locally. |
| `titleValidationError` cleared by `useEffect`, not on blur or on-change | Clears the moment the issue is resolved (any keystroke that makes all titles non-empty), without requiring the user to attempt generation again. |
| Validation fires before the `window.confirm` guard | Prevents a confirm dialog from appearing when the underlying data is still invalid. |

---

## Files Created, Changed, or Deleted

**Modified:**
```
src/App.jsx                                — titleValidationError state + useEffect + handleGenerate guard; new prop to LessonStructurePreview
src/components/LessonStructurePreview.jsx  — titleValidationError prop + render; lastSentCanonicalRef; useRef import; useEffect deps fixed
docs/todo.md                               — Phase 1 items marked ✅; Known Issues coveredSubtopics row struck through
docs/session_handoff.md                    — this entry
```

---

## What Is Currently Working

All previous functionality unchanged. New in this session:

- **Empty-title block:** clicking "Generate Lesson Content →" with any blank step title shows an inline red message near the button and blocks generation. The message auto-clears once all titles are filled in.
- **coveredSubtopics sync:** the topics input now reliably reflects external changes (future undo, bulk-edit) without causing cursor-jump during normal typing.

---

## What Is NOT Implemented Yet

- **Real AI generation** — both `generateLessonStructure()` and `generateLessonContent()` return mocked content. Hooks in `App.jsx` marked `// [AI HOOK]`.
- **Backend persistence** — `handleSaveDraft()` writes only to `localStorage`. Marked `// [PERSIST HOOK]`.
- **JSON export** — no file download button.
- **Step title back-sync S1 → S2** — editing a title in Screen 1 after visiting Screen 2 does not update `lessonContent.title`. Resolves on next confirmed re-generation. Still a low-risk known issue.
- **Rich code editor, drag-and-drop, undo/redo, multi-lesson management** — Phase 4–6.

---

## Next Recommended Step

**Phase 2 — Wire in real AI generation.**

All infrastructure is already in place: both handlers are `async`, `isGenerating` and `generationError` are wired, loading states and error display are live. The integration work is:

1. Replace function bodies in `src/utils/mockGeneration.js` with `fetch()` / Anthropic SDK calls.
2. Add `await` at the two `// [AI HOOK]` callsites in `App.jsx`.
3. Update the `catch` blocks to inspect `err` and surface specific failure messages (rate limit, network timeout, malformed response).

**Prerequisite:** API access to Anthropic (or whichever provider is chosen).

**Alternative quick win (no API needed):** JSON export button in the Screen 2 header. No data model changes required — the state is already in the correct export shape. See [data_model.md → Future: JSON Export Shape](data_model.md).

---

## Known Issues

| Item | Severity | Notes |
|---|---|---|
| Generation error messages are fixed strings | Low | When real API calls land, catch blocks should inspect `err` for specific failures |
| `isGenerating` invisible during mock use | Info | Synchronous mock — "Generating…" flashes one tick; resolves once real async calls land |
| S1 title edits don't back-propagate to S2 | Low | Resolves on next confirmed re-generation; low risk at current scale |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts |

---

*End of Session 4.*

---
---

# Session 5 Handoff

**ID:** 5
**Date:** 2026-03-16
**Session scope:** Phase 2 — Screen 1 AI integration scaffold (service layer)
**Git state at close:** Working tree clean — all changes committed across 2 commits (see below)

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## Commits This Session

```
c108d3f feat: scaffold Screen 1 AI integration with lessonStructureService
5f355c5 docs: update project docs for lessonStructure service layer
```

---

## What Was Completed

### 1. Screen 1 generation service layer (`src/services/lessonStructureService.js`)

New file. Owns the full Screen 1 generation pipeline:

| Layer | Function | Responsibility |
|---|---|---|
| Provider call | `callProvider()` | Only function to change when wiring a real AI. Currently delegates to the mock. |
| Normalization | `normalizeStructure()` | Validates provider response shape; assigns `id` and `stepNumber` locally. |
| Public API | `generateLessonStructure()` | Async entry point called from `App.jsx`. Composes the two layers above. |

The `callProvider()` body contains a full commented-out example of the real Anthropic fetch call, with headers, model, and response parsing noted.

### 2. `App.jsx` — import updated, `await` added

- Import changed from `mockGeneration` to `lessonStructureService` for `generateLessonStructure`.
- `generateLessonContent` import left pointing at `mockGeneration` (Screen 2 not yet touched).
- `await` added at the `handleSubmit` call site.
- JSDoc updated to name both integration points explicitly.
- All existing UI guards (confirmation, `isGenerating`, `generationError`, `try/finally`) are unchanged.

### 3. Docs updated

- `README.md`: "Where to Connect Real AI" section rewritten; project layout updated with `services/`.
- `docs/decisions.md`: New "AI Generation — Service layer" decision with rationale and consequences.
- `docs/todo.md`: Phase 2 structure item updated to point to `callProvider()`.

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| Dedicated service module, not inline replacement | Separates provider call, normalization, and App orchestration so only `callProvider()` changes when the provider is swapped. See `decisions.md` for full rationale. |
| IDs assigned in `normalizeStructure()`, not by provider | Provider returns `{title, goal, coveredSubtopics}` only. IDs are always assigned locally — prevents AI hallucinating them and keeps them consistent with the manual-add pattern in App.jsx. |
| Mock stripped to raw shape before passing to `normalizeStructure()` | `callProvider()` strips `id` from the mock result so `normalizeStructure()` is always the single source of IDs, even during mock use. |
| `mockGeneration.js` left completely unchanged | It remains the backing implementation inside `callProvider()` and the Screen 2 mock. No churn to existing code. |

---

## Files Created, Changed, or Deleted

**Created:**
```
src/services/lessonStructureService.js   — new service module
```

**Modified:**
```
src/App.jsx                  — import split; await added; JSDoc updated
README.md                    — "Where to Connect Real AI" rewritten; layout updated
docs/decisions.md            — AI generation / service layer decision added
docs/todo.md                 — Phase 2 structure item updated to point to callProvider()
docs/session_handoff.md      — this entry
```

**Unchanged:**
```
src/utils/mockGeneration.js  — not touched; still used as fallback via callProvider()
```

---

## What Is Currently Working

All previous functionality unchanged. New in this session:

- **`generateLessonStructure` is now async end-to-end** — `callProvider()` is `async`; `App.jsx` awaits it. The mock path is still synchronous inside, but the async wrapper is correct for the real call.
- **`normalizeStructure()` runs on every generation** — validates the response and assigns IDs, even during mock use, so the real provider path is exercised structurally.
- **The mock is still the backing implementation** — existing local workflow is fully intact.

---

## What Is NOT Implemented Yet

- **Real AI provider call** — `callProvider()` delegates to the mock. Replace its body with a `fetch()` / Anthropic SDK call.
- **`VITE_ANTHROPIC_API_KEY`** — needs to be added to `.env.local` before a real call can be made.
- **Screen 2 AI generation** — `generateLessonContent` is still the mock in `mockGeneration.js`, called directly (no service layer yet).
- **Backend persistence, JSON export, rich editor** — Phases 3–6.

---

## Next 3 Recommended Steps

### 1. Wire a real provider into `callProvider()` (Phase 2, Screen 1)

All infrastructure is in place. The work is contained entirely within `src/services/lessonStructureService.js`:

1. Add `VITE_ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` (already gitignored via `*.local`).
2. Replace the body of `callProvider()` with a `fetch()` call — a complete stub is in the JSDoc comment inside that function.
3. Add a `buildPrompt(courseName, moduleName, subtopicsText)` helper that instructs the model to return `Array<{ title, goal, coveredSubtopics }>` as a JSON block.
4. Add a `parseProviderResponse(data)` helper that extracts the JSON array from the API text response.
5. Update the `catch` block in `handleSubmit` in `App.jsx` to inspect `err.message` and surface specific failures (rate limit, network error, invalid JSON from provider).

### 2. Scaffold Screen 2 AI generation service (Phase 2, Screen 2)

Once Screen 1 is verified working with a real provider, extract `src/services/lessonContentService.js` following the exact same three-layer pattern (`callProvider` / `normalizeContent` / `generateLessonContent`). Update the import in `App.jsx`. The `// [AI HOOK]` comment at the Screen 2 call site marks the integration point.

### 3. Add JSON export button (Phase 3, quick win — no API needed)

No data model changes required. Add a download button in the Screen 2 header. The state is already in the correct export shape — see [data_model.md → Future: JSON Export Shape](data_model.md).

---

## Known Issues

| Item | Severity | Notes |
|---|---|---|
| `callProvider()` is still the mock | Expected | This is the scaffold session — the stub is intentionally in place |
| Generation error messages are fixed strings | Low | Update `catch` in `handleSubmit` once real API errors are available |
| `isGenerating` invisible during mock use | Info | Resolves once real async call is wired |
| S1 title edits don't back-propagate to S2 | Low | Resolves on next confirmed re-generation |

---

*End of Session 5.*

---
---

# Session 6 Handoff

**ID:** 6
**Date:** 2026-03-16
**Session scope:** Phase 2 — Backend proxy for Screen 1 AI generation (OpenAI, server-side key)
**Git state at close:** Working tree clean — all changes in `ee62b8c`

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## Commits This Session

```
ee62b8c feat: add Express backend proxy for Screen 1 AI generation
```

(plus `71941eb` docs cleanup for Session 5 — carried over from previous session close)

---

## What Was Completed

### Direction correction

The previous session scaffolded `callProvider()` to call Anthropic directly from the browser using `VITE_ANTHROPIC_API_KEY`. That approach was rejected: the API key must stay server-side only. This session replaced it with a proper backend proxy.

### Backend proxy (`server/index.js`)

New Express server. Single responsibility: hold the provider API key and call OpenAI.

- `POST /api/generate-structure` — accepts `{ courseName, moduleName, subtopicsText }`, returns `Array<{ title, goal, coveredSubtopics }>`
- If `USE_MOCK=true` in `.env`, returns mock data without calling OpenAI (server-side only — frontend has no knowledge of this flag)
- Validates `OPENAI_API_KEY` on startup; exits with a clear error if missing and `USE_MOCK` is not set
- In production (`NODE_ENV=production`), also serves `dist/` as static files — one process, one port
- Model defaults to `gpt-4o-mini`; overridable via `OPENAI_MODEL` env variable

### Frontend service update (`lessonStructureService.js`)

`callProvider()` now calls `POST /api/generate-structure` via `fetch`. The mock import was removed entirely. `normalizeStructure()` is unchanged.

### Vite dev proxy (`vite.config.js`)

`/api/*` proxied to `http://localhost:3001` in dev. The browser always uses a relative `/api` path — no CORS issues, no port mismatch.

### Env file handling

- `.env` added to `.gitignore` (was not previously covered — `*.local` only covered `.env.local`)
- `.env.example` committed with all four variables: `OPENAI_API_KEY`, `USE_MOCK`, `OPENAI_MODEL`, `PORT`

### `App.jsx` — error surfacing fix

`catch` → `catch (err)` in `handleSubmit`. Server error messages (rate limit, bad key, invalid JSON) now reach the `generationError` UI instead of a static fallback string.

### New dependencies

| Package | Type |
|---|---|
| `express` | dependency |
| `openai` | dependency |
| `dotenv` | dependency |
| `concurrently` | devDependency |

### New scripts

| Script | What it does |
|---|---|
| `npm run server` | Start Express backend only |
| `npm run dev:all` | Start Vite + Express together via `concurrently` |

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| Backend proxy, not direct browser call | API key must never be in the client bundle. See `decisions.md` — "Backend proxy" section. |
| `USE_MOCK` is server-side only | Frontend always calls the same endpoint regardless of mock/real; switching is invisible to the client. |
| OpenAI `gpt-4o-mini` as default model | Cost-effective for structured short-form generation; overridable via `OPENAI_MODEL` env var. |
| `response_format: { type: 'json_object' }` | Forces OpenAI to return valid JSON; server parses `{ steps: [] }` and strips the wrapper before sending to frontend. |
| `.env` explicitly gitignored | `*.local` only covered `.env.local`. A plain `.env` required an explicit entry. |

---

## Files Created, Changed, or Deleted

**Created:**
```
server/index.js              — Express backend proxy
.env.example                 — committed env template (no real keys)
```

**Modified:**
```
src/services/lessonStructureService.js  — callProvider() calls /api; mock import removed
src/App.jsx                             — catch (err) to surface server error messages
vite.config.js                          — /api proxy added
package.json                            — new deps + server/dev:all scripts
package-lock.json                       — lockfile updated
.gitignore                              — .env added
README.md                               — Quick Start rewritten; Backend Proxy section added
docs/decisions.md                       — backend proxy + OpenAI decisions added
docs/todo.md                            — Phase 2 items updated; Known Issues corrected
```

---

## What Is Currently Working

All previous UI behavior is unchanged. New in this session:

- **`npm run dev:all`** starts Vite on `:5173` and Express on `:3001` together
- **`POST /api/generate-structure`** is live and returns the correct shape
- **`USE_MOCK=true`** path works without an API key (server returns mock data)
- **Real OpenAI path is wired** — not yet end-to-end tested (see next steps)
- **Server error messages** reach the frontend `generationError` UI correctly

---

## What Is NOT Implemented Yet

- **End-to-end test with a real OpenAI key** — the integration is wired but has not been run with a live key
- **Screen 2 AI generation** — `generateLessonContent` is still the mock in `mockGeneration.js`; no `/api/generate-content` endpoint exists yet
- **Backend persistence** — `handleSaveDraft()` still writes to `localStorage` only
- **JSON export, rich code editor, drag-and-drop, multi-lesson management** — Phases 3–6

---

## Next 3 Steps for the Next Session

### 1. End-to-end validation (first priority — do this before any new code)

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env
npm run dev:all
```

Verify:
- Structure generation returns real OpenAI-authored steps (not mock boilerplate)
- `isGenerating` loading state is visibly active during the network call
- A missing or invalid API key surfaces a clear error message in the UI
- `USE_MOCK=true` still returns mock data correctly
- All existing UI guards still work (confirmation dialog, empty-title block, error display)

### 2. Wire Screen 2 AI content generation

Once Screen 1 is verified:
- Add `POST /api/generate-content` to `server/index.js` (input: `LessonStructure[]`, output: `LessonContent[]`)
- Extract `src/services/lessonContentService.js` following the same three-layer pattern as `lessonStructureService.js`
- Update the import in `App.jsx`; add `await` at the Screen 2 call site

### 3. JSON export button (quick win, no API needed)

Add a download button in the Screen 2 header. No data model changes needed — the state is already in the correct export shape. See [data_model.md → Future: JSON Export Shape](data_model.md).

---

## Known Issues

| Item | Severity | Notes |
|---|---|---|
| OpenAI path not yet end-to-end tested | High | First task next session — see Step 1 above |
| Screen 2 generation still mocked | Expected | Phase 2, Step 2 |
| `isGenerating` invisible during `USE_MOCK=true` | Info | Mock path is synchronous; resolves on real OpenAI path due to network latency |
| S1 title edits don't back-propagate to S2 | Low | Resolves on next confirmed re-generation |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts |

---

*End of Session 6.*

---

# Session Handoff — SPL Content Generator

**ID** 7
**Date:** 2026-03-18
**Session scope:** Docs sync + Screen 1 backend validation (mock and error paths only)

> **Cross-references:** This document is a time-stamped session log.
> For living documentation, see: [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## What Was Completed

### Docs sync pass

Corrected documentation drift across four living docs before any validation work:

| Doc | What changed |
|---|---|
| `product_overview.md` | Removed "no backend" claim; described live Express+OpenAI path for Screen 1; added `expectedAction`/`validationNote` to Screen 2 field list and mocked table |
| `user_flow.md` | Screen 1 Step 2: replaced false `mockGeneration.js` reference with correct service→backend→OpenAI path + `isGenerating`/`generationError` behavior; Screen 2 instruction fields updated from four to six |
| `data_model.md` | Added `isGenerating`, `generationError`, `titleValidationError` to App State block; marked `coveredSubtopics` limitation as fixed |
| `decisions.md` | Marked `coveredSubtopics` limitation as resolved |

Committed as: `49ae9ea docs: sync living docs to current implemented state`

### Screen 1 backend validation

Tested via `curl` against a running `server/index.js` instance. No code was changed.

**Mock path (`USE_MOCK=true`) — PASSED**

| Check | Result |
|---|---|
| Server starts and logs `[mock]` | ✅ |
| Returns `[{ title, goal, coveredSubtopics }]` array | ✅ |
| Shape matches `normalizeStructure()` input exactly | ✅ |
| Missing request fields → HTTP 400 `{ error: "..." }` | ✅ |
| All-blank subtopics → `[]` → `normalizeStructure` throws "Provider returned no steps." → `generationError` set | ✅ |

**Error path (invalid API key, `USE_MOCK=false`) — PASSED**

| Check | Result |
|---|---|
| Server returns HTTP 500 | ✅ — `callProvider`'s `!res.ok` branch fires |
| Body is `{ error: "401 Incorrect API key provided…" }` — specific and readable | ✅ |
| Error propagates: `body.error` → `throw new Error(…)` → `handleSubmit` catch → `setGenerationError` | ✅ (verified by tracing) |

**Real OpenAI path — NOT TESTED**

No `OPENAI_API_KEY` was available in the environment or shell config. The `.env` file was created with `USE_MOCK=true` as the safe default (gitignored — not committed).

---

## Code Changes

**None.** All validated paths are correct as implemented. No fixes were required.

---

## Files Created, Changed, or Deleted

**Created (gitignored — not committed):**
```
.env    — local dev config; USE_MOCK=true; placeholder API key
```

**Modified (committed earlier this session):**
```
docs/product_overview.md
docs/user_flow.md
docs/data_model.md
docs/decisions.md
```

---

## What Is Currently Working

Unchanged from Session 6. Additionally validated:
- Mock path response shape is correct end-to-end through the full call chain
- Bad-key error message reaches `generationError` UI correctly

---

## What Is NOT Implemented Yet

- **Real OpenAI path end-to-end verified** — wired but never run with a live key
- **Screen 2 AI generation** — `generateLessonContent` still mocked; no `/api/generate-content` endpoint
- **Backend persistence** — `handleSaveDraft()` still writes to `localStorage` only
- **JSON export, rich code editor, drag-and-drop, multi-lesson management** — Phases 3–6

---

## Exact Next Step for the Next Session

**Step 1 only — do not start new feature work until this is verified.**

```bash
# 1. Set your real key in .env
#    OPENAI_API_KEY=sk-...
#    USE_MOCK=false

npm run dev:all
```

Then in the UI:
- Fill course name, module name, and 2–3 sub-topics
- Click "Generate Structure Preview"
- Verify:
  - `isGenerating` loading state is visibly active during the network call
  - Real OpenAI-authored step titles and goals come back (not mock boilerplate)
  - Response shape matches `normalizeStructure()` input: `[{ title, goal, coveredSubtopics }]`

Once confirmed, proceed to **Phase 2 Step 2** in `todo.md`: wire Screen 2 AI generation (`POST /api/generate-content` + `lessonContentService.js`).

---

## Known Issues

| Item | Severity | Notes |
|---|---|---|
| OpenAI path not yet end-to-end tested | High | First and only task next session before any new code |
| Screen 2 generation still mocked | Expected | Phase 2, Step 2 |
| `isGenerating` invisible during `USE_MOCK=true` | Info | Mock is synchronous; resolves on real OpenAI path due to network latency |
| S1 title edits don't back-propagate to S2 | Low | Resolves on next confirmed re-generation |
| All state in one `App.jsx` | Low | Fine for two screens; a third screen would warrant extracting contexts |

---

*End of Session 7.*

---

## Session 8
**Date:** 2026-03-18
**Session scope:** Screen 2 content model improvement — add `codeExample` field, improve teaching structure, rename sidebar labels

### What Was Completed

**Content model: added `codeExample` field to `LessonContent`**
- `concept` (UI label: "Explanation") — now clearly scoped to teaching narrative: why the concept matters, how it works, rules, common mistakes
- `codeExample` (new) — short annotated snippet (4–8 lines) illustrating the concept; distinct from the full `starterCode` block
- `instructions` (UI label: "Task") — now scoped to action-only numbered steps; no teaching content
- All other fields (`hint`, `expectedAction`, `validationNote`, `starterCode`) unchanged

**Files changed:**
- `src/utils/mockGeneration.js` — added `mockExplanation()`, `mockCodeExample()`; rewrote all mock helpers with real teaching-tone content; removed `mockConcept()`
- `src/components/InstructionPanelEditor.jsx` — added Code Example textarea; relabeled "Concept" → "Explanation", "Task Instructions" → "Task"; tightened placeholder text
- `src/components/LessonAuthoringView.jsx` — no sidebar label changes (reverted)
- `docs/data_model.md` — added `codeExample` field to `LessonContent` shape; updated `concept` and `instructions` descriptions
- `docs/product_overview.md` — updated Screen 2 field list
- `docs/user_flow.md` — updated Screen 2 field list (six → seven fields)

### Assumptions
- The data field name `concept` was kept as-is (not renamed to `explanation`) to avoid breaking existing localStorage drafts. The UI label is "Explanation."
- `codeExample` is intentionally short and author-editable — it is not generated from the starter code.
- No UI layout changes beyond the new textarea and label renames.

---

*End of Session 8.*

---

## Session 9
**Date:** 2026-03-18
**Session scope:** Screen 2 view/edit mode — readable lesson page by default, explicit Edit/Save/Cancel controls

### What Was Completed

**Screen 2 now has two modes:**
- **View mode (default):** instruction panel renders as readable prose (title, explanation, code example, task, hint). No textareas. No nested scroll. The main area scrolls naturally as a page.
- **Edit mode (on-demand):** triggered by the "Edit" button in the instruction panel header. InstructionPanelEditor (textareas) and editable code panel are shown. "Save" keeps changes and exits. "Cancel" restores a snapshot taken on edit entry and exits. Switching steps while editing silently cancels (restores snapshot).

**Files changed:**
- `src/components/LessonAuthoringView.jsx` — added `isEditing` + `editSnapshot` local state; added `LessonStepView` component for view mode; added Edit/Save/Cancel controls in panel header; intercepts step selection to cancel edits; passes `readOnly` to `CodeEditorPanel`
- `src/components/CodeEditorPanel.jsx` — added `readOnly` prop; renders `<pre className="code-pre">` in view mode
- `src/App.css` — added `.view-mode` layout override (natural scroll, no nested scrollboxes); added `.lesson-step-view` prose typography; added `.code-pre` read-only code block; added `.panel-header-actions`
- `docs/user_flow.md` — added View mode / Edit mode section; updated Screen 2 flow

### Assumptions
- `expectedAction` and `validationNote` are intentionally hidden in view mode — they are author metadata, not learner-facing content.
- Switching steps while in edit mode silently cancels (no confirm dialog). This is consistent with Cancel semantics and avoids interrupting navigation.
- The 50/50 panel width split is preserved in view mode; only height and overflow behavior change.

---

*End of Session 9.*

---

## Session 10 — End-of-Session Handoff
**Date:** 2026-03-18
**Session scope:** Screen 2 content model improvement + view/edit mode redesign (covered in Sessions 8 and 9 above). This entry is the forward-looking handoff for the next session.

---

### What Was Completed This Session

Two independent improvements were shipped:

**1. Content model: `codeExample` field added to `LessonContent` (Session 8)**
- `concept` (data field name kept; UI label: "Explanation") — scoped to teaching narrative: why the concept matters, how it works, rules, common mistakes
- `codeExample` (new field) — short annotated snippet (4–8 lines) to illustrate the concept inline in the lesson; distinct from the full `starterCode` block
- `instructions` (UI label: "Task") — scoped to action-only numbered steps
- All mock helpers rewritten with real teaching-tone content structure
- `expectedAction` and `validationNote` unchanged

**2. Screen 2 view/edit mode (Session 9)**
- Default mode is a readable lesson page: content renders as prose blocks (h2 title, labeled sections, `<pre>` for code example), no textareas, no nested scroll
- Edit/Save/Cancel controls in the instruction panel header
- Save: keeps edits (already in App state), exits edit mode
- Cancel: restores a snapshot taken on Edit entry, exits edit mode
- Step switch while editing: silently cancels (restores snapshot), then switches
- Code panel: read-only `<pre>` block in view mode, editable textarea in edit mode
- CSS: `.view-mode` on `.authoring-main` enables natural page scroll; panels take natural height

---

### Important Decisions Made

| Decision | Rationale |
|---|---|
| Keep data field name `concept` (not renamed to `explanation`) | Avoids breaking existing localStorage drafts. UI label is "Explanation." |
| `expectedAction` and `validationNote` hidden in view mode | Author metadata only — not learner-facing content |
| Step switch while editing = silent cancel, no confirm dialog | Consistent with Cancel semantics; blocking navigation with a dialog would be disruptive |
| `editSnapshot` is a shallow copy of the step object | `LessonContent` contains only primitives and arrays; shallow copy is safe |
| `isEditing` is local state in `LessonAuthoringView`, not hoisted to App | Pure display state with no persistence requirement; keeps App.jsx unchanged |

---

### Files Changed This Session

| File | Change |
|---|---|
| `src/utils/mockGeneration.js` | Added `codeExample` field; replaced `mockConcept` with `mockExplanation`; rewrote all helpers with teaching-tone content |
| `src/components/InstructionPanelEditor.jsx` | Added Code Example textarea; relabeled "Concept" → "Explanation", "Task Instructions" → "Task" |
| `src/components/LessonAuthoringView.jsx` | Added `isEditing` + `editSnapshot` state; `LessonStepView` component; Edit/Save/Cancel controls; step-switch intercept; `.view-mode` class toggle |
| `src/components/CodeEditorPanel.jsx` | Added `readOnly` prop; renders `<pre className="code-pre">` in view mode |
| `src/App.css` | Added `.view-mode` layout rules; `.lesson-step-view` prose styles; `.code-pre`; `.panel-header-actions` |
| `docs/data_model.md` | Added `codeExample` to `LessonContent` shape; updated `concept` and `instructions` field descriptions |
| `docs/product_overview.md` | Updated date and Current State summary |
| `docs/user_flow.md` | Added View mode / Edit mode section; updated Screen 2 field list |
| `docs/todo.md` | Added two ✅ items to Phase 1 for the Session 8/9 work |

No files created. No files deleted.

---

### What Is Currently Working

- Full two-screen authoring tool — Screen 1 (structure builder) + Screen 2 (lesson authoring)
- Screen 1 AI generation: fully wired (`lessonStructureService.js` → `POST /api/generate-structure` → Express → OpenAI or mock)
- Screen 2 view mode: readable lesson page — Explanation, Code Example, Task, Hint rendered as prose; no nested scroll
- Screen 2 edit mode: Edit/Save/Cancel with snapshot-based Cancel; step-switch auto-cancels
- Starter code: read-only `<pre>` in view mode, editable textarea in edit mode
- Draft persistence: `localStorage` save/restore with dirty state tracking
- Mock fallback: `USE_MOCK=true` in `.env` returns deterministic mock content from the server
- Step navigation, dirty dot indicators, re-generation confirmation guards

---

### What Is Not Implemented Yet

| Feature | Status | Location |
|---|---|---|
| ~~Real OpenAI path end-to-end test~~ | ~~Highest priority~~ | Verified in Session 11 — `gpt-5.4`, all checks passed, no code changes |
| Screen 2 AI content generation | Mocked (`mockGeneration.js`) | `todo.md` Phase 2 |
| JSON export | Not started | `todo.md` Phase 3 |
| Backend persistence | Not started (localStorage only) | `todo.md` Phase 3 |
| Syntax-highlighted code editor | Not started | `todo.md` Phase 4 |
| Multiple draft slots / lesson management | Not started | `todo.md` Phase 5 |

---

### Next 3 Recommended Steps

**1. End-to-end test the real OpenAI path for Screen 1 (no code changes needed)**
- Set `OPENAI_API_KEY` to a real key in `.env`
- Set `USE_MOCK=false` in `.env`
- Run `npm run dev:all`
- Generate a structure, confirm real steps come back, confirm `USE_MOCK=true` still works
- This is the only blocker before Phase 2 Step 2

**2. Wire Screen 2 AI content generation**
- Add `POST /api/generate-content` to `server/index.js`
  - Input: `{ courseName, moduleName, steps: LessonStructure[] }`
  - Output: `LessonContent[]` (all 8 fields including `codeExample`, `expectedAction`, `validationNote`)
- Extract `src/services/lessonContentService.js` (same three-layer pattern as `lessonStructureService.js`)
- Update import in `App.jsx`; `handleGenerate` is already `async`

**3. Add JSON export button in Screen 2 header**
- No state shape changes needed — data is already in the right shape (see `data_model.md` Future: JSON Export Shape)
- Add a Download button to `Header.jsx` when `screen === 'authoring'`
- File name: `${courseName}-${moduleName}.json` (slugified)

---

### Known Issues, Rough Edges, and Cleanup Items

| Item | Severity | Detail |
|---|---|---|
| ~~Real OpenAI path untested~~ | ~~High~~ | Verified in Session 11 — see below |
| Old localStorage drafts lack `codeExample` | Low | Pre-Session 8 drafts will show an empty Code Example field in edit mode and omit the section in view mode. Graceful — no crash. Clear the draft (`localStorage.removeItem('spl_lesson_draft')`) or regenerate content to fix. |
| `concept` split on `\n\n` in view mode | Low | Single newline breaks within a paragraph render as a single `<p>` (not separate lines). Authors must use blank lines between paragraphs for correct view-mode rendering. This should be noted in the future AI prompt for `generate-content`. |
| Dead props on `LessonAuthoringView` | Info | `App.jsx` passes `saveStatus` and `onSaveDraft` to `LessonAuthoringView` but the component no longer uses them. They were already unused before Session 9. Safe to remove from App.jsx's render call when convenient. |
| Screen 2 generation still mocked | Expected | Phase 2, Step 2 — next after OpenAI path is verified |
| `isGenerating` invisible during `USE_MOCK=true` | Info | Mock is synchronous on the server; loading flash is one tick. Resolves on real OpenAI path due to network latency |

---

*End of Session 10.*

---
---

# Session 11 Handoff

**ID:** 11
**Date:** 2026-03-18
**Session scope:** Phase 2 — project review, doc consistency pass, end-to-end validation of real OpenAI path for Screen 1
**Git state at close:** Working tree clean — all changes committed (see log below)

> **Cross-references:** [product_overview.md](product_overview.md) · [user_flow.md](user_flow.md) · [data_model.md](data_model.md) · [decisions.md](decisions.md) · [todo.md](todo.md)

---

## Commits This Session

```
d4d7f9a docs: mark Screen 1 real OpenAI path as verified (Session 11)
70f36d3 docs: session 10 handoff — content model, view/edit mode, next steps   ← carried in from prior session
```

---

## What Was Completed

### 1. Full project review

Read all seven project docs (`README.md`, `product_overview.md`, `user_flow.md`, `data_model.md`, `decisions.md`, `todo.md`, `session_handoff.md`) and confirmed the documented state matched the codebase. No inconsistencies found requiring code changes.

### 2. Screen 1 real OpenAI path — fully verified

Tested via `curl` against the running Express server (`server/index.js`) with `USE_MOCK=false` and a real `OPENAI_API_KEY` in `.env`. Model used: `gpt-5.4` (confirmed valid by the OpenAI API — not a typo or alias).

**All checks passed — no code changes required.**

| Check | Result |
|---|---|
| Real AI content returned (not mock boilerplate) | ✅ — step titles, goals, and subtopics are subject-specific and well-scoped |
| Response shape `[{ title, goal, coveredSubtopics }]` | ✅ — exact match; no extra or missing keys |
| `coveredSubtopics` is a JSON array | ✅ |
| Multiple sub-topics correctly split into steps | ✅ — 4 subtopics → 4 focused steps |
| Missing request field → HTTP 400 | ✅ |
| Blank-only subtopics → `[]` → `normalizeStructure` error path | ✅ |
| `gpt-5.4` model confirmed valid by OpenAI | ✅ |
| `USE_MOCK=true` path still works | ✅ — confirmed in Session 7; unchanged |

### 3. Doc updates

- `docs/todo.md` — Phase 2 OpenAI path item marked ✅; verification details added
- `docs/session_handoff.md` — Session 10 "Real OpenAI path untested" Known Issue struck through; this entry added

---

## Important Decisions Made

| Decision | Rationale |
|---|---|
| Verify Screen 1 before writing any Screen 2 backend code | Avoids building Screen 2 generation on an unproven integration layer. Confirmed correct before proceeding. |
| Validate via `curl`, not browser | Server-side validation isolates the Express + OpenAI layer cleanly; no frontend state noise. |
| Keep `gpt-5.4` in `.env` | Confirmed valid OpenAI model. No reason to change to `gpt-4o-mini` unless cost or rate-limit concerns arise. |
| No code changes after a clean validation | The integration was correct as-built. Minimal intervention — don't touch what isn't broken. |

---

## Files Created, Changed, or Deleted

**No files created. No files deleted. No code changed.**

**Modified (doc-only):**
```
docs/todo.md              — Phase 2 real OpenAI path item marked ✅; verification note added
docs/session_handoff.md   — Session 10 Known Issue struck through; Session 11 entry added
```

---

## What Is Currently Working

All Session 10 functionality is unchanged. Additionally confirmed this session:

- **Screen 1 end-to-end AI generation is fully operational:** form inputs → `lessonStructureService.js` → `POST /api/generate-structure` → Express → OpenAI (`gpt-5.4`) → `normalizeStructure()` → editable step cards
- **Both paths verified for Screen 1:** real OpenAI (`USE_MOCK=false`) and mock (`USE_MOCK=true`)
- Full two-screen authoring tool functional: Screen 1 structure builder + Screen 2 lesson authoring (view/edit mode)
- Draft persistence via `localStorage` with dirty state tracking
- All UI guards in place: loading state, error display, confirmation dialogs, empty-title validation

---

## What Is NOT Implemented Yet

| Feature | Status | Location |
|---|---|---|
| Screen 2 AI content generation | Mocked (`mockGeneration.js`) — **next step** | `todo.md` Phase 2 |
| JSON export | Not started | `todo.md` Phase 3 |
| Backend persistence | Not started (localStorage only) | `todo.md` Phase 3 |
| Syntax-highlighted code editor | Not started | `todo.md` Phase 4 |
| Multiple draft slots / lesson management | Not started | `todo.md` Phase 5 |

---

## Next 3 Recommended Steps

### 1. Wire Screen 2 AI content generation (Phase 2, Step 2) — primary next task

All infrastructure is in place. Work is contained to two files + one import update:

1. Add `POST /api/generate-content` to `server/index.js`
   - Input: `{ courseName, moduleName, steps: LessonStructure[] }`
   - Output: `LessonContent[]` — all 8 fields: `title`, `concept`, `codeExample`, `instructions`, `hint`, `expectedAction`, `validationNote`, `starterCode`
   - AI prompt note: `concept` paragraphs must use blank lines (`\n\n`) for correct view-mode rendering
2. Extract `src/services/lessonContentService.js` — same three-layer pattern as `lessonStructureService.js` (`callProvider` / `normalizeContent` / `generateLessonContent`)
3. Update import in `App.jsx`; `handleGenerate` is already `async` — add `await`

### 2. Add JSON export button in Screen 2 header (Phase 3, quick win)

No data model changes needed. State is already in the correct export shape (see `data_model.md` — Future: JSON Export Shape).

- Add a Download button to `Header.jsx` shown when `screen === 'authoring'`
- Filename: `${courseName}-${moduleName}.json` (slugified, e.g. replace spaces with `-`)
- One `URL.createObjectURL` + `<a>` click — no new dependencies

### 3. Remove dead props from `LessonAuthoringView` (minor cleanup)

`App.jsx` passes `saveStatus` and `onSaveDraft` to `LessonAuthoringView`, but neither prop is used by that component. Two-line removal in `App.jsx`'s render call. Safe to do as a standalone chore commit at any time.

---

## Known Issues, Rough Edges, and Cleanup Items

| Item | Severity | Notes |
|---|---|---|
| Old localStorage drafts lack `codeExample` | Low | Pre-Session 8 drafts show empty Code Example in edit mode; section omitted in view mode. Graceful — no crash. `localStorage.removeItem('spl_lesson_draft')` or regenerate content to fix. |
| `concept` split on `\n\n` in view mode | Low | Single newlines within a paragraph are not treated as line breaks. The AI prompt for `generate-content` must explicitly require blank-line paragraph separation. |
| Dead props on `LessonAuthoringView` | Info | `App.jsx` passes `saveStatus` and `onSaveDraft` to `LessonAuthoringView`; both unused. Safe to remove from `App.jsx` render call when convenient. |
| Screen 2 generation still mocked | Expected | Phase 2, Step 2 — primary next task |
| `isGenerating` invisible during `USE_MOCK=true` | Info | Mock is synchronous on the server; loading flash is one tick. Resolves on real OpenAI path due to network latency. |
| S1 title edits don't back-propagate to S2 | Low | If a user edits a step title in Screen 1 after visiting Screen 2, `lessonContent.title` diverges until the next confirmed re-generation. Low risk at current scale. |

---

## Commit Messages

**Recommended:**
```
docs: finalize Session 11 handoff — Screen 1 OpenAI path fully verified
```

**Alternative A** (shorter):
```
docs: close session 11; Screen 1 real AI path confirmed, no code changes
```

**Alternative B** (describes content more):
```
docs: add full Session 11 handoff with decisions, next steps, and known issues
```

---

## Git Commands

```bash
git add docs/session_handoff.md
git commit -m "docs: finalize Session 11 handoff — Screen 1 OpenAI path fully verified" -m "Full structured handoff entry: validation results, decisions, 3 next steps, known issues, commit message suggestions. Session 10 stale Known Issue row also struck through."
```

**Files excluded by `.gitignore` — must never be committed:**
```
.env          — contains real OPENAI_API_KEY
dist/         — Vite production build output
node_modules/ — installed packages
```

---

*End of Session 11.*
