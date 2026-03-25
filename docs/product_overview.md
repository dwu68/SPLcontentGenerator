# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating structured self-paced technical learning (SPL) content. It is designed to help course authors — data scientists, instructional designers, curriculum developers — rapidly structure and draft interactive modules without writing raw content in JSON or a CMS.

The tool is evolving beyond programming-only lessons. The intended final goal is a flexible internal authoring interface for multiple module types:
- **Programming** (`code_lab`) — coding exercises with starter code and a working editor
- **Guided Tool Workflow** (`guided_tool_workflow`) — step-by-step workflows using tools like Claude Code or GitHub Copilot; slide-first format
- **Concept & Application** (`concept_application`) — AWS Cloud Practitioner-style conceptual and applied learning

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-24, updated after Session 21)

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
- **Block types supported in editor**: `explain`, `code`, `check`, `task`, `hint` (code_lab); `slide`, `slide-explain` (guided_tool_workflow). All are manually addable/deletable.
- **Conditional lab panel** (Screen 2): the right-side lab/code panel is shown only when `starterCode` is non-empty. When absent, the instruction panel expands to full width. This is content-driven, not format-driven.
- **Check block answer reveal**: question and answer separated by `\n→ `; "Show answer" toggle in view mode
- **Explain block bullet lists**: `\n\n`-separated chunks where all lines start with `- ` render as `<ul>/<li>`
- **Save Draft**: persists all state to `localStorage` (key: `spl_lesson_draft`); new generation clears stale draft
- **Export JSON**: `POST /api/export` writes a timestamped file to `output/` *(de-prioritized — see scope note below)*

### Scope decisions (current)

| Area | Status |
|---|---|
| Monaco / CodeMirror | **Not in scope** for current work |
| Export JSON / output folder | **De-prioritized** — built but not actively maintained |
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
