# SPL Content Generator

An internal web-based authoring tool for generating Codecademy-style self-paced learning (SPL) lesson materials.

Built with Vite + React. All state is local. No backend, no real AI generation yet — this is the UI skeleton phase.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

---

## What It Does

The tool has two screens:

**Screen 1 — Lesson Structure Builder**
Enter a course name, module name, and list of sub-topics. The app generates a step-by-step lesson outline. Each step is editable inline: title, learning goal, covered topics. Steps can be added, deleted, and reordered.

**Screen 2 — Lesson Authoring View**
For each step in the structure, author the full lesson content: concept explanation, task instructions, hint, and starter code. A step sidebar tracks unsaved changes. A Save Draft button persists everything to `localStorage`.

---

## Project Layout

```
SPLcontentGenerator/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                         React entry point
│   ├── App.jsx                          Central state container
│   ├── App.css                          All styles (CSS variables + component classes)
│   ├── services/
│   │   └── lessonStructureService.js    Screen 1 generation service — replace callProvider() with real API
│   ├── utils/
│   │   └── mockGeneration.js            Mock generation — used as fallback by services and Screen 2
│   └── components/
│       ├── Header.jsx                   Top bar: breadcrumb, Save Draft, Back button
│       ├── SaveStatus.jsx               Saved / Unsaved changes / Saving… indicator
│       ├── LessonInputForm.jsx          Screen 1 left panel — form inputs
│       ├── LessonStructurePreview.jsx   Screen 1 right panel — editable step cards
│       ├── LessonAuthoringView.jsx      Screen 2 layout: sidebar + editors
│       ├── InstructionPanelEditor.jsx   Screen 2 left panel — instruction fields
│       └── CodeEditorPanel.jsx          Screen 2 right panel — dark code textarea
└── docs/
    ├── product_overview.md
    ├── user_flow.md
    ├── data_model.md
    ├── decisions.md
    ├── todo.md
    └── session_handoff.md
```

---

## Where to Connect Real AI

### Screen 1 — Lesson Structure Generation (service layer in place)

Integration point: `src/services/lessonStructureService.js` — `callProvider()`

The service layer is scaffolded. To wire in a real provider:

1. Replace the body of `callProvider()` in `lessonStructureService.js` with a `fetch()` / SDK call.
2. Return `Array<{ title, goal, coveredSubtopics }>` — no ids or step numbers (assigned by `normalizeStructure()`).
3. Add `VITE_ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` (already gitignored via `*.local`).

`isGenerating`, `generationError`, `try/finally`, and `await` are all wired in `App.jsx` — no changes needed there.

### Screen 2 — Lesson Content Generation (still mocked)

Integration point: `src/utils/mockGeneration.js` — `generateLessonContent()` — marked `// [AI HOOK]` in `App.jsx`.

When ready: extract a `lessonContentService.js` following the same pattern as `lessonStructureService.js`, then update the import in `App.jsx`.

## Where to Connect a Backend

`handleSaveDraft()` in `src/App.jsx` is marked `// [PERSIST HOOK]`. Currently writes to `localStorage`. Replace with a `fetch()` call to save to a backend.

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/product_overview.md](docs/product_overview.md) | Purpose, users, screens, current vs. future |
| [docs/user_flow.md](docs/user_flow.md) | Step-by-step UX for both screens |
| [docs/data_model.md](docs/data_model.md) | State shape, data structures, localStorage format |
| [docs/decisions.md](docs/decisions.md) | Technical and design decisions with rationale |
| [docs/todo.md](docs/todo.md) | Backlog organized by priority |
| [docs/session_handoff.md](docs/session_handoff.md) | Session log: what was built, files changed |
