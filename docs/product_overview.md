# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating structured self-paced technical learning (SPL) content. It is designed to help course authors — data scientists, instructional designers, curriculum developers — rapidly structure and draft interactive modules without writing raw content in JSON or a CMS.

The tool is evolving beyond programming-only lessons. The intended final goal is a flexible internal authoring interface for multiple module types:
- **Programming** (`code_lab`) — coding exercises with starter code and a working editor
- **Guided Tool Workflow** (`guided_tool_workflow`) — step-by-step workflows using tools like Claude Code or GitHub Copilot
- **Concept & Application** (`concept_application`) — AWS Cloud Practitioner-style conceptual and applied learning

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-23, updated after Session 17)

Both screens are live with real AI generation (GPT-5.4). Screen 1 generates a step-by-step lesson structure from subtopics; Screen 2 generates block-based lesson content for each lesson step.

### What is live and working

- **Module setup** (Screen 1 left panel): Course Name, Module Name, Lesson Format dropdown (Programming / Guided Tool Workflow / Concept & Application), Sub-topics textarea
- **Structure generation**: subtopics → AI-generated `lesson` steps via `POST /api/generate-structure`
- **Step management** (Screen 1 right panel): always-editable step cards; reorder (↑/↓), delete (×), add (type picker)
- **Step type support** (Screen 1): steps carry a `stepType` field. All AI-generated steps are `lesson`. Manually added steps can be one of four types:
  - `lesson` — AI-generated block content in Screen 2
  - `downloadable_lab_files` — description + file upload placeholder
  - `starter_code_file` — description + file upload placeholder(s)
  - `external_lab_link` — description + URL input
- **Content generation** (Screen 2): block-based model for lesson steps — `blocks[]` array (`explain`, `code`, `check`, `task`, `hint` types) plus `starterCode`, `expectedAction`, `validationNote`
- **View / edit mode** (Screen 2): view mode renders blocks as readable prose; edit mode opens `BlockEditor` per block
- **Check block answer reveal**: question and answer separated by `\n→ `; "Show answer" toggle in view mode
- **Explain block bullet lists**: `\n\n`-separated chunks where all lines start with `- ` render as `<ul>/<li>`
- **Slides upload UI** (Screen 1 left panel): a "Slides" field accepts a single `.pptx` file; selected filename is stored in state and persisted in the draft; file can be removed/replaced. Backend extraction and structure-generation wiring are not yet implemented.
- **Save Draft**: persists all state to `localStorage` (key: `spl_lesson_draft`); new generation clears stale draft
- **Export JSON**: `POST /api/export` writes a timestamped file to `output/` *(de-prioritized — see scope note below)*

### Scope decisions (current)

| Area | Status |
|---|---|
| Monaco / CodeMirror | **Not in scope** for current work |
| Export JSON / output folder | **De-prioritized** — built but not actively maintained |
| Backend persistence | **Deferred to another team** — localStorage only for now |
| Database / upload pipeline | **Not in scope** for current work |
| PPT / slides ingestion | **Implemented through Slice C** — `.pptx` upload UI (Slice A), backend extraction (Slice B), and generate-structure wiring (Slice C) are all done; generate-content wiring is deferred |
| Real file upload (lab files, starter code) | **Placeholder** — disabled inputs; not implemented |

---

## The Two Screens

### Screen 1 — Module Structure Builder

The author fills in module-level details (course name, module name, lesson format) and a list of subtopics. Clicking **Generate Structure Preview** sends those subtopics to the AI and builds an editable list of `lesson` steps. The author can then add, delete, reorder steps, and manually add non-lesson steps (lab files, starter code, external links) before proceeding.

### Screen 2 — Step Authoring View

For each step, Screen 2 shows the generated or configured content. For `lesson` steps: block-based view with editable block cards. For non-lesson steps: Screen 2 currently still renders the lesson view (this is a known gap — per-type Screen 2 rendering is the next slice to implement).

→ See [user_flow.md](user_flow.md) for the complete step-by-step interaction detail.

---

## What Is Not Built Yet

See [todo.md](todo.md) for the full prioritized backlog. The immediate next slice is Screen 2 step-type-awareness for non-lesson steps.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes on Screen 1
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
- **Incremental expansion**: step types and lesson formats are added as foundations; Screen 2 rendering follows as a separate slice
