# Product Overview — SPL Content Generator

## What It Is

An internal authoring tool for creating self-paced learning (SPL) lesson content in the style of Codecademy. It is designed to help course authors (data scientists, instructional designers, curriculum developers) rapidly structure and draft interactive coding lessons without writing raw content in JSON or a CMS.

## Who Uses It

Internal teams producing SPL lesson content — primarily data science educators and instructional designers who know their subject matter but need tooling to translate it into structured, consistent lesson formats.

## Current State (as of 2026-03-16)

This is the **UI skeleton phase**. The full two-screen interface is built and functional. All AI generation is mocked with template content. There is no backend. The only persistence is `localStorage`.

---

## The Two Screens

### Screen 1 — Lesson Structure Builder

The author defines the skeleton of a lesson before writing any content.

**Inputs:**
- Course Name
- Module Name
- Sub-topics (one per line in a textarea)

**Output:**
A list of lesson steps derived from the sub-topics. Each step has:
- Step number (auto-managed)
- Title
- Learning goal
- Covered sub-topics

After the structure is generated, it is **immediately editable** — there is no separate "edit mode". The author can add steps, delete steps, reorder them (↑/↓), and edit all fields inline.

When the structure is ready, clicking **"Generate Lesson Content →"** runs the generation (currently mocked) and moves to Screen 2.

### Screen 2 — Lesson Authoring View

The author edits the full content for each lesson step.

**Layout:**
- Left sidebar: step list with unsaved-change indicators
- Center panel (Instruction): Title, Concept, Task Instructions, Hint
- Right panel (Starter Code): dark-themed code editor (plain textarea)

Edits to any field update app state immediately. Clicking **Save Draft** persists everything to `localStorage`.

The author can navigate back to Screen 1 at any time; the structure state is preserved.

---

## What Is Mocked / Placeholder

| Feature | Current state |
|---|---|
| Lesson structure generation | Template: one step per sub-topic line, boilerplate goal text |
| Lesson content generation | Template: generic concept, instructions, hint, and starter code strings |
| Starter code | Python-flavored boilerplate; not subject-specific |

---

## What Is Not Built Yet

- Real AI generation (Anthropic API or similar)
- Backend / database persistence
- JSON export
- Multi-lesson management (list, name, switch between drafts)
- Authentication
- Rich code editor (syntax highlighting, language selection)

See [todo.md](todo.md) for the full prioritized backlog.

---

## Design Principles

- **Authoring-first**: the structure is always editable — no separate view/edit modes
- **No-surprise saves**: changes are held in app state; nothing persists until Save Draft is clicked
- **Integration-ready**: AI and persistence hooks are isolated and clearly marked in code
- **Minimal dependencies**: no icon libraries, no UI component libraries — plain React + CSS
