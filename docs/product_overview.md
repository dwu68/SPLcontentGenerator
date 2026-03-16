# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating self-paced learning (SPL) lesson content in the style of Codecademy. It is designed to help course authors (data scientists, instructional designers, curriculum developers) rapidly structure and draft interactive coding lessons without writing raw content in JSON or a CMS.

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-16)

The full two-screen interface is built and functional. Screen 1 generation is scaffolded behind a dedicated service layer (`src/services/lessonStructureService.js`) — the provider call is isolated and ready to be replaced with a real API call. Screen 2 generation is still mocked. There is no backend. The only persistence is `localStorage`.

---

## The Two Screens

### Screen 1 — Lesson Structure Builder

The author enters a course name, module name, and list of sub-topics. The app generates one editable step card per sub-topic. Cards are always editable inline — no separate edit mode. The author can add, delete, and reorder steps before clicking **"Generate Lesson Content →"** to proceed.

### Screen 2 — Lesson Authoring View

For each step, the author edits the full lesson content: concept explanation, task instructions, hint, and starter code. A step sidebar tracks unsaved changes. **Save Draft** persists everything to `localStorage`.

→ See [user_flow.md](user_flow.md) for the complete step-by-step interaction detail.

---

## What Is Mocked / Placeholder

| Feature | Current state |
|---|---|
| Lesson structure generation | Service layer scaffolded (`lessonStructureService.js`); `callProvider()` still delegates to template mock — replace with real API call |
| Lesson content generation | Template: generic concept, instructions, hint, and starter code strings |
| Starter code | Python-flavored boilerplate; not subject-specific |

---

## What Is Not Built Yet

See [todo.md](todo.md) for the full prioritized backlog. Top items: delete dead code, stabilize the data model (add `expectedAction` / `validationNote` fields), then wire in real AI generation.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
