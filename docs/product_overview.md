# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating structured self-paced technical learning (SPL) content. It is designed to help course authors — data scientists, instructional designers, curriculum developers — rapidly structure and draft interactive modules without writing raw content in JSON or a CMS.

The tool is evolving beyond programming-only lessons. The intended final goal is a flexible internal authoring interface for multiple module types:
- **Programming** (`code_lab`) — coding exercises with starter code and a working editor
- **Guided Tool Workflow** (`guided_tool_workflow`) — step-by-step workflows using tools like Claude Code or GitHub Copilot; slide-first format
- **Concept & Application** (`concept_application`) — AWS Cloud Practitioner-style conceptual and applied learning

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-31, updated after Session 31)

Both screens are live with real AI generation (GPT-5.4). Screen 1 generates a step-by-step lesson structure from subtopics or uploaded PPTX slides; Screen 2 generates block-based lesson content for each lesson step. `lessonFormat` is now forwarded to all AI generation calls, enabling format-specific prompt behavior.

### What is live and working

- **Module setup** (Screen 1 left panel): Course Name, Module Name, Lesson Format dropdown (Programming / Guided Tool Workflow / Concept & Application), Sub-topics textarea
- **Slides upload** (Screen 1 left panel): a "Slides" field accepts a single `.pptx` file; the file is uploaded to `POST /api/upload-slides`, extracted via jszip (`<a:t>` text nodes), and `slideText` is held in session state. Filename and slide count are shown on success. `slideText` is session-only (lost on reload). `slideFileName` is persisted in the localStorage draft (display label only).
- **Structure generation**: subtopics or uploaded slides → AI-generated `lesson` steps via `POST /api/generate-structure`. Three prompt branches: slides only / slides + subtopics / subtopics only. Subtopics are optional when `slideText` is present.
- **Slide coverage rules** (in generate-structure): when slides are the source, instructional slides must each produce a step; non-instructional slides (title, agenda, section dividers, closing) may be skipped; default grouping is one slide = one step; grouping is only allowed for clearly atomic consecutive teaching units.
- **Step management** (Screen 1 right panel): always-editable step cards; reorder (↑/↓), delete (×), add (type picker)
- **Step type support** (Screen 1): steps carry a `stepType` field. All AI-generated steps are `lesson`. Manually added steps can be one of four types:
  - `lesson` — AI-generated block content in Screen 2
  - `downloadable_lab_files` — description + file upload placeholder
  - `starter_code_file` — description + file upload placeholder(s)
  - `external_lab_link` — description + URL input
- **Content generation** (Screen 2): block-based model for lesson steps. `lessonFormat` is forwarded to `POST /api/generate-content`; the prompt branches on format:
  - **`code_lab`**: `blocks[]` of (`explain`, `code`, `check`, `task`, `hint`) plus `starterCode`, `expectedAction`, `validationNote`
  - **`guided_tool_workflow`**: `blocks[]` of exactly three blocks in order — `slide`, `slide-explain`, `explain` — with `starterCode`/`expectedAction`/`validationNote` as empty strings. The `slide-explain` block is always AI-generated but is user-deletable in the editor. The `explain` block is step-goal-grounded, not slide-anchored. When `slideText` is present, the AI infers `slideRef` from `[Slide N]` labels in the extracted text.
- **View / edit mode** (Screen 2): view mode renders blocks as readable prose; edit mode opens `BlockEditor` per block
- **Add task with starter code** (Screen 2 edit mode): when a step in edit mode has no `task` block and no `starterCode`, an **Add task with starter code** button appears in the instruction panel header. Clicking it calls a dedicated narrow AI path (`POST /api/generate-task`) that generates one `task` block and matching `starterCode` anchored to the step's existing instructional content. The task block is appended to the end of the existing block sequence; `starterCode` remains a step-level field. On success the author stays in edit mode. If the AI judges the step unsuitable for a task (e.g. purely conceptual, tool-workflow without a real coding action), it returns a skip response with a brief reason, shown inline — no content is modified.
- **Block types supported in editor**: `explain`, `code`, `check`, `task`, `hint` (code_lab); `slide`, `slide-explain` (guided_tool_workflow). All are manually addable/deletable.
- **Conditional lab panel** (Screen 2): the right-side lab/code panel is shown only when `starterCode` is non-empty. When absent, the instruction panel expands to full width. This is content-driven, not format-driven.
- **Add AI Example / Add AI Check** (Screen 2 edit mode): two buttons in the instruction panel header, always visible in edit mode for all step types and formats. **+ AI Example** generates a filled `code` block (short annotated runnable example, language auto-detected from existing code blocks or defaults to `python`). **+ AI Check** generates a filled `check` block (question + `\n→ ` + answer, following the existing reveal convention). Both append to the end of the block list; no cap. Shared `POST /api/generate-block` endpoint with a `blockType` parameter.
- **Block reordering in Screen 2 edit mode**: each block card in the instruction panel has ↑/↓ buttons in its header (left of the × delete button). ↑ disabled on first block, ↓ disabled on last block. Pure local array swap — no server call. All block types and all formats supported.
- **Module Summary step always last**: every generated lesson structure ends with a "Module Summary" step. Enforced at two layers — the generate-structure prompt explicitly instructs the AI to include it as the final step; `normalizeStructure()` appends a fallback if the last step title does not contain "summary" (case-insensitive). Applies to all three generation branches (subtopics only, slides only, slides + subtopics).
- **Resume step content editing** (Screen 1 footer): when `lessonContent` exists, a secondary "Resume step content editing" button appears in the Screen 1 footer alongside "Generate Lesson Content →". Clicking it navigates directly to Screen 2 without triggering any generation or clearing any content.
- **Back-to-builder confirmation**: clicking "← Back to Builder" in Screen 2 shows a `window.confirm()` when lesson content exists, accurately describing the risk of re-generating from Screen 1.
- **Add hands-on step** (Screen 2 sidebar): an **Add hands-on** button sits below the step list, always visible, disabled while generation is in progress. Clicking it appends a new empty `lesson` step with the default title "Hands-on Practice", auto-selects it, and creates a matching empty `lessonContent` entry. No AI generation is triggered — the author authors the step manually in edit mode.
- **`isHandsOn` step marker**: steps created via "Add hands-on" carry `isHandsOn: true` on the `lessonStructure` entry. This flag is persisted in the localStorage draft and survives renaming the step title. It drives action routing in Screen 2 — specifically, which AI-assist button appears in edit mode.
- **`external_link` and `downloadable_file` block types**: available in the `BlockEditor` add-block row for all editable lesson steps. `external_link` stores the URL in `content` and the link label in `title`; renders as a clickable link card in view mode. `downloadable_file` supports real file upload: author picks a file in edit mode → uploaded to `POST /api/upload-file` → stored on disk in `server/uploads/` → `fileUrl` and `fileName` stored on the block. View mode shows a download link if a file is attached, or "No file uploaded yet" if not.
- **Edit-mode branch fix**: empty-blocks steps (including newly created hands-on steps) now correctly enter `BlockEditor` in edit mode rather than falling back to the legacy flat-field editor.
- **Add module lab** (Screen 2 edit mode, hands-on steps only): for steps with `isHandsOn: true`, the "Add task with starter code" action is replaced by **Add module lab**. Clicking it calls a dedicated narrow endpoint (`POST /api/generate-module-lab`) with a condensed summary of all previous lesson steps in the module as context. The AI synthesizes a `task` block (title: "Module Lab") and matching `starterCode` that draws on concepts taught across the earlier steps. Skip responses are supported when there is insufficient prior lesson content to synthesize from (e.g. no completed previous steps, or a purely conceptual module). The condensation happens client-side before the request — each previous step is reduced to title, goal, covered topics, and a 150-char excerpt per block; `starterCode`/`expectedAction`/`validationNote` are excluded.
- **Check block answer reveal**: question and answer separated by `\n→ `; "Show answer" toggle in view mode
- **Explain block bullet lists**: `\n\n`-separated chunks where all lines start with `- ` render as `<ul>/<li>`
- **Save Draft**: persists all state to `localStorage` (key: `spl_lesson_draft`); new generation clears stale draft
- **Next Module**: "Next Module →" button in the Screen 2 header (right of "← Back to Builder"). Shows a confirmation dialog, then clears the current module from both app state and localStorage and returns to a blank Screen 1. Export JSON has been removed.

### Scope decisions (current)

| Area | Status |
|---|---|
| Monaco / CodeMirror | **Not in scope** for current work |
| Export JSON / output folder | **Removed** — button and handler deleted in Session 31; `POST /api/export` endpoint on the server is unused but not yet removed |
| Backend persistence | **Deferred to another team** — localStorage only for now |
| Database / upload pipeline | **Not in scope** for current work |
| PPT / slides ingestion | **Implemented through Slice D** — `.pptx` upload UI (Slice A), backend extraction (Slice B), generate-structure wiring (Slice C), and generate-content wiring (Slice D) are all done |
| Real file upload (lab files, starter code) | **Placeholder** — disabled inputs; not implemented |
| `concept_application` format | **Scaffolded** — lessonFormat value exists and is forwarded to AI; no dedicated prompt branch yet |

---

## The Two Screens

### Screen 1 — Module Structure Builder

The author fills in module-level details (course name, module name, lesson format) and a list of subtopics or uploads a PPTX file. Clicking **Generate Structure Preview** sends the material to the AI and builds an editable list of `lesson` steps. When `guided_tool_workflow` is selected and slides are uploaded, the AI maps each instructional slide to a step with conservative grouping. The author can then add, delete, reorder steps, and manually add non-lesson steps (lab files, starter code, external links) before proceeding.

### Screen 2 — Step Authoring View

For each step, Screen 2 shows the generated or configured content. For `lesson` steps: block-based view with editable block cards. The layout adapts:
- If `starterCode` is non-empty, shows a split view (instruction panel left, lab panel right)
- If `starterCode` is empty (as is always the case for `guided_tool_workflow`), the instruction panel expands to full width

In edit mode, if a step has no `task` block and no `starterCode`, the author can trigger AI to generate both with a single action ("Add task with starter code"). The AI uses the step's existing blocks and metadata as context. The result is inserted at the end of the block sequence without disrupting the existing instructional content. Unsuitable steps (conceptual-only, no coding action) receive a graceful skip with a reason message instead.

For non-lesson steps: Screen 2 renders a minimal read-only summary of the configured fields (description, link URL, file reference) — no block editor is shown and no AI generation is run for these steps.

→ See [user_flow.md](user_flow.md) for the complete step-by-step interaction detail.

---

## What Is Not Built Yet

See [todo.md](todo.md) for the full prioritized backlog. The immediate next candidate for `guided_tool_workflow` is rendering the actual slide content (extracted text for the step's `slideRef`) inside the `slide` block panel, and end-to-end AI generation validation for the three-block shape.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes on Screen 1
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
- **Incremental expansion**: step types and lesson formats are added as foundations; Screen 2 rendering follows as a separate slice
- **Content-driven layout**: UI decisions (e.g. lab panel visibility) are driven by step content, not hardcoded by format
