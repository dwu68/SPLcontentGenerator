# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating self-paced learning (SPL) lesson content in the style of Codecademy. It is designed to help course authors (data scientists, instructional designers, curriculum developers) rapidly structure and draft interactive coding lessons without writing raw content in JSON or a CMS.

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-19)

Both screens are fully live with real AI generation (GPT-5.4). Screen 1 generates a step-by-step lesson structure; Screen 2 generates full lesson content for each step.

Screen 2 uses a **block-based content model**: the AI returns an ordered `blocks[]` array (`explain`, `code`, `check`, `task`, `hint` types) plus `starterCode`, `expectedAction`, and `validationNote`. Blocks render as readable prose in view mode and are editable as individual cards in edit mode (`BlockEditor`).

The check block supports a **reveal/hide answer** mechanic: the AI separates the question from the answer with `\n→ `, and the UI shows a "Show answer" toggle.

Explain blocks support **bullet lists**: when the AI outputs a `\n\n`-separated chunk where every line starts with `- `, the renderer produces a proper `<ul>/<li>` list rather than a flat paragraph.

**Export:** an Export JSON button in the Screen 2 header calls `POST /api/export` on the backend, which writes a timestamped JSON file to the `output/` folder at the project root. The export includes all steps with their blocks, starterCode, expectedAction, validationNote, stepGoal, stepTopics, and metadata.

Persistence is still `localStorage` only (Save Draft). After a new generation, the previous draft is cleared from localStorage so a reload will not restore stale content.

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
| Lesson structure generation | Live: `lessonStructureService.js` → `POST /api/generate-structure` → OpenAI (or mock if `USE_MOCK=true`) |
| Lesson content generation | Live: `lessonContentService.js` → `POST /api/generate-content` → OpenAI (or mock if `USE_MOCK=true`). Block-based schema verified with GPT-5.4. |
| learnerLevel / outputLanguage | Hardcoded to `'beginner'` / `'Python'` — no UI control yet. Passed as defaults in `generateAllLessonContent()` and exported in the JSON. |

---

## What Is Not Built Yet

See [todo.md](todo.md) for the full prioritized backlog. Next items: delete dead code files, then backend persistence to replace localStorage.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
