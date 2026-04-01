# SPL Content Generator

An internal web-based authoring tool for generating self-paced learning (SPL) lesson materials for technical courses.

Built with Vite + React frontend and a small Express backend proxy. The backend holds the provider API key and calls OpenAI. Both Screen 1 (structure generation) and Screen 2 (block-based content generation) are fully wired to real AI.

---

## Quick Start

```bash
npm install

# 1. Create your local env file (never committed)
cp .env.example .env
# Edit .env — set OPENAI_API_KEY to your key
# Optionally set OPENAI_MODEL (default: gpt-4o-mini; example default in .env.example: gpt-5.4)
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

The tool has two screens and supports two active lesson formats: **Programming** (`code_lab`) and **Guided Tool Workflow** (`guided_tool_workflow`). A third format — **Concept & Application** (`concept_application`) — is visible in the dropdown but disabled pending a dedicated prompt branch.

**Screen 1 — Module Structure Builder**
Enter a course name, module name, lesson format, and a list of sub-topics — or upload a `.pptx` file. The app generates a step-by-step lesson outline via AI. Each step is editable inline: title, learning goal, covered topics. Steps can be added (four types: Lesson, Lab Files, Starter Code, External Lab), deleted, and reordered. A "Review Sub-topics with AI" button assesses the sub-topics list and suggests improvements. Once satisfied, click "Generate Lesson Content →" to proceed.

**Screen 2 — Step Authoring View**
For each lesson step, the app generates block-based content via AI. Blocks vary by format:
- `code_lab`: `explain`, `code`, `check`, `task`, `hint`
- `guided_tool_workflow`: `slide`, `slide-explain`, `explain`
- All formats: `external_link`, `downloadable_file`, `media` (manually addable)

Content renders as markdown-rich text in view mode (`react-markdown` + `remark-gfm`). Edit mode opens per-block editors. AI-assist actions in edit mode: **+ AI Example**, **+ AI Check**, **Add task with starter code** (or **Add module lab** for hands-on steps). A Save Draft button persists everything to `localStorage`.

---

## Project Layout

```
SPLcontentGenerator/
├── index.html
├── vite.config.js
├── package.json
├── .env.example                             copy to .env — holds OPENAI_API_KEY (gitignored)
├── server/
│   ├── index.js                             Express backend — API key + all /api/* routes
│   ├── lib/
│   │   ├── extractSlideText.js              jszip-based .pptx text extraction
│   │   └── promptContext.js                 builds shared context object for prompts
│   └── prompts/
│       ├── generateStructurePrompt.js       Screen 1 structure generation prompt
│       ├── generateContentPrompt.js         Screen 2 content generation prompt
│       ├── generateTaskPrompt.js            narrow: add task + starterCode to existing step
│       ├── generateModuleLabPrompt.js       narrow: add module-level lab for hands-on steps
│       ├── generateBlockPrompt.js           narrow: add AI Example or AI Check block
│       ├── reviewSubtopicsPrompt.js         Screen 1 sub-topics review prompt
│       └── contentSectionPrompts.js         shared prompt fragments
├── src/
│   ├── main.jsx                             React entry point
│   ├── App.jsx                              Central state container
│   ├── App.css                              All styles (CSS variables + component classes)
│   ├── services/
│   │   ├── lessonStructureService.js        Screen 1 generation — calls POST /api/generate-structure
│   │   ├── lessonContentService.js          Screen 2 generation — calls POST /api/generate-content et al.
│   │   └── subtopicsReviewService.js        Calls POST /api/review-subtopics
│   ├── utils/
│   │   └── mockGeneration.js               Dead code — nothing imports it; safe to delete
│   └── components/
│       ├── Header.jsx                       Top bar: breadcrumb, Save Draft, Back button
│       ├── SaveStatus.jsx                   Saved / Unsaved changes / Saving… indicator
│       ├── LessonInputForm.jsx              Screen 1 left panel — form inputs + slides upload
│       ├── LessonStructurePreview.jsx       Screen 1 right panel — editable step cards
│       ├── LessonAuthoringView.jsx          Screen 2 layout: sidebar + view/edit panels
│       ├── BlockEditor.jsx                  Screen 2 edit mode — per-block card editors
│       ├── InstructionPanelEditor.jsx       Legacy flat-field editor (fallback for old drafts without blocks[])
│       └── CodeEditorPanel.jsx              Screen 2 right panel — dark code textarea
└── docs/
    ├── product_overview.md
    ├── user_flow.md
    ├── data_model.md
    ├── decisions.md
    ├── todo.md
    └── session_handoff.md
```

---

## Backend API Endpoints

The Express server (`server/index.js`) is the only process that holds the provider API key.

```
Browser → Vite (:5173) → [proxy /api/* and /uploads/*] → Express (:3001) → OpenAI
```

| Endpoint | What it does |
|---|---|
| `POST /api/generate-structure` | Screen 1: returns `{ title, goal, coveredSubtopics }[]` |
| `POST /api/generate-content` | Screen 2: returns block-based step content |
| `POST /api/generate-task` | Narrow: adds a task block + starterCode to an existing step |
| `POST /api/generate-module-lab` | Narrow: synthesizes a module-level lab from prior step context |
| `POST /api/generate-block` | Narrow: adds an AI Example or AI Check block |
| `POST /api/review-subtopics` | Screen 1: reviews and optionally revises the sub-topics list |
| `POST /api/upload-slides` | Accepts `.pptx`; returns `{ slideText, slideCount }` |
| `POST /api/upload-file` | Accepts any file (50 MB); stores in `server/uploads/`; returns `{ fileUrl, fileName }` |

**To use mock data instead of OpenAI:** set `USE_MOCK=true` in `.env`.

**Model:** Defaults to `gpt-4o-mini`. Override with `OPENAI_MODEL` in `.env` (the `.env.example` default is `gpt-5.4`).

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
