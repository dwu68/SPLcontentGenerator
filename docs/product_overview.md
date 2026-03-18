# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating self-paced learning (SPL) lesson content in the style of Codecademy. It is designed to help course authors (data scientists, instructional designers, curriculum developers) rapidly structure and draft interactive coding lessons without writing raw content in JSON or a CMS.

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-17)

The full two-screen interface is built and functional. Screen 1 generation is live: `lessonStructureService.js` calls `POST /api/generate-structure` on a small Express backend (`server/index.js`), which calls OpenAI (or returns mock data when `USE_MOCK=true`). Screen 2 generation is still mocked (`mockGeneration.js`). The only persistence is `localStorage`.

---

## The Two Screens

### Screen 1 — Lesson Structure Builder

The author enters a course name, module name, and list of sub-topics. The app generates an editable lesson structure from those sub-topics — steps may be grouped or split as the AI sees fit. Cards are always editable inline — no separate edit mode. The author can add, delete, and reorder steps before clicking **"Generate Lesson Content →"** to proceed.

### Screen 2 — Lesson Authoring View

For each step, the author edits the full lesson content: explanation (teaching narrative), code example (short annotated snippet), task instructions, hint, expected action, validation note, and starter code. A step sidebar tracks unsaved changes. **Save Draft** persists everything to `localStorage`.

→ See [user_flow.md](user_flow.md) for the complete step-by-step interaction detail.

---

## What Is Mocked / Placeholder

| Feature | Current state |
|---|---|
| Lesson structure generation | Live: `lessonStructureService.js` → `POST /api/generate-structure` → Express backend → OpenAI (or mock if `USE_MOCK=true`) |
| Lesson content generation | Template: generic concept, instructions, hint, expected action, validation note, and starter code strings |
| Starter code | Python-flavored boilerplate; not subject-specific |

---

## What Is Not Built Yet

See [todo.md](todo.md) for the full prioritized backlog. Current top item: end-to-end verification of the real OpenAI path for Screen 1 (the integration is wired but has not been run with a live key). After that: wire Screen 2 AI content generation.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
