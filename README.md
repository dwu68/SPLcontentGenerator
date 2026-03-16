# SPL Content Generator

An internal web-based authoring tool for generating Codecademy-style self-paced learning (SPL) lesson materials.

Built with Vite + React frontend and a small Express backend proxy. The backend holds the provider API key and calls OpenAI. Screen 2 content generation is still mocked.

---

## Quick Start

```bash
npm install

# 1. Create your local env file (never committed)
cp .env.example .env
# Edit .env — set OPENAI_API_KEY to your key
# (or set USE_MOCK=true to run without an API key)

# 2. Start both servers (Vite on :5173, Express on :3001)
npm run dev:all

# Or start them separately in two terminals:
npm run dev       # Vite frontend  →  http://localhost:5173
npm run server    # Express backend →  http://localhost:3001

# Production
npm run build     # build frontend → dist/
node server/index.js  # serves dist/ + API on one port
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
├── .env.example                             copy to .env — holds OPENAI_API_KEY (gitignored)
├── server/
│   └── index.js                             Express backend — provider key + /api/generate-structure
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

## Backend Proxy

The Express server (`server/index.js`) is the only process that holds the provider API key.

```
Browser → Vite (:5173) → [proxy /api/*] → Express (:3001) → OpenAI
```

| Endpoint | File | What it does |
|---|---|---|
| `POST /api/generate-structure` | `server/index.js` | Calls OpenAI (or mock) and returns `{ title, goal, coveredSubtopics }[]` |

**To use mock data instead of OpenAI:** set `USE_MOCK=true` in `.env`.

**Screen 2 AI generation** is still mocked (`src/utils/mockGeneration.js`). When ready, add `POST /api/generate-content` to `server/index.js` and extract `lessonContentService.js` on the frontend following the same pattern as `lessonStructureService.js`.

## Where to Connect a Backend for Persistence

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
