import React from 'react'

/**
 * BlockEditor — edit mode for block-based steps.
 *
 * Renders each block as an editable card. Handles add and delete.
 * Reordering is intentionally out of scope for this phase.
 *
 * Props:
 *   blocks   Block[]                           — the current blocks array for this step
 *   onUpdate fn(newBlocks: Block[]) => void    — called on every change; wired in
 *                                                LessonAuthoringView as:
 *                                                (newBlocks) => onUpdateContent(step.id, { blocks: newBlocks })
 *
 * Block shape (code_lab):
 *   { id, type, title?, content, language? }
 *   type: 'explain' | 'code' | 'check' | 'task' | 'hint'
 *
 * Block shape (guided_tool_workflow):
 *   slide:        { id, type: 'slide', title?, slideRef, content? }
 *   slide-explain: { id, type: 'slide-explain', title?, content }
 */

const TYPE_LABELS = {
  explain:       'EXPLAIN',
  code:          'CODE',
  check:         'CHECK',
  task:          'TASK',
  hint:          'HINT',
  slide:         'SLIDE',
  'slide-explain': 'SLIDE EXPLAIN',
}

const ADD_TYPES = ['explain', 'code', 'check', 'task', 'hint', 'slide', 'slide-explain']

// ---------------------------------------------------------------------------
// BlockEditor
// ---------------------------------------------------------------------------

function BlockEditor({ blocks, onUpdate }) {
  const handleChange = (id, fields) => {
    onUpdate(blocks.map((b) => (b.id === id ? { ...b, ...fields } : b)))
  }

  const handleDelete = (id) => {
    onUpdate(blocks.filter((b) => b.id !== id))
  }

  const handleAdd = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      title: '',
      content: '',
      ...(type === 'code'  ? { language: 'python' } : {}),
      ...(type === 'slide' ? { slideRef: '' }        : {}),
    }
    onUpdate([...blocks, newBlock])
  }

  return (
    <div className="block-editor">
      <div className="block-editor-list">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onChange={(fields) => handleChange(block.id, fields)}
            onDelete={() => handleDelete(block.id)}
          />
        ))}
      </div>

      <div className="block-editor-add-row">
        {ADD_TYPES.map((type) => (
          <button
            key={type}
            className="block-add-btn"
            type="button"
            onClick={() => handleAdd(type)}
          >
            + {TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BlockCard — one editable block
// ---------------------------------------------------------------------------

function BlockCard({ block, onChange, onDelete }) {
  const { type, title = '', content = '', language = '' } = block
  const slideRef = block.slideRef ?? ''
  const label = TYPE_LABELS[type] ?? type.toUpperCase()
  const isCode  = type === 'code'
  const isHint  = type === 'hint'
  const isSlide = type === 'slide'

  return (
    <div className={`block-editor-card block-editor-card--${type}`}>
      {/* Card header: type badge + delete button */}
      <div className="block-editor-card-header">
        <span className={`block-type-badge block-type-badge--${type}`}>{label}</span>
        <button
          className="block-delete-btn"
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${label} block`}
          title="Delete block"
        >
          ×
        </button>
      </div>

      {/* Editable fields */}
      <div className="block-editor-fields">
        {/* Title — all types */}
        <div className="block-editor-field">
          <label className="block-editor-field-label">
            {isHint ? 'Collapsed label (optional)' : 'Title (optional)'}
          </label>
          <input
            type="text"
            className="field-input"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={isHint ? 'e.g. Need a hint?' : 'e.g. What it is'}
          />
        </div>

        {/* Slide reference — slide blocks only */}
        {isSlide && (
          <div className="block-editor-field">
            <label className="block-editor-field-label">Slide reference</label>
            <input
              type="text"
              className="block-editor-lang-input"
              value={slideRef}
              onChange={(e) => onChange({ slideRef: e.target.value })}
              placeholder="e.g. 3"
            />
          </div>
        )}

        {/* Language — code blocks only */}
        {isCode && (
          <div className="block-editor-field">
            <label className="block-editor-field-label">Language</label>
            <input
              type="text"
              className="block-editor-lang-input"
              value={language}
              onChange={(e) => onChange({ language: e.target.value })}
              placeholder="python"
            />
          </div>
        )}

        {/* Content — all types (optional caption/notes for slide blocks) */}
        <div className="block-editor-field">
          <label className="block-editor-field-label">
            {isSlide ? 'Caption / notes (optional)' : 'Content'}
          </label>
          <textarea
            className={isCode ? 'block-editor-code-textarea' : 'field-textarea'}
            value={content}
            rows={contentRows(type)}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder={contentPlaceholder(type)}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contentRows(type) {
  switch (type) {
    case 'code':          return 6
    case 'explain':       return 5
    case 'slide-explain': return 6
    case 'check':         return 4
    case 'task':          return 4
    case 'hint':          return 3
    case 'slide':         return 2
    default:              return 4
  }
}

function contentPlaceholder(type) {
  switch (type) {
    case 'explain':       return 'Teach the concept: why it matters, how it works, the key rules…'
    case 'code':          return 'Short annotated snippet (4–10 lines)…'
    case 'check':         return 'Ask the learner a quick question or reflection prompt…'
    case 'task':          return 'Numbered steps the learner must complete…'
    case 'hint':          return 'A nudge for learners who are stuck…'
    case 'slide':         return 'Optional caption or authoring note for this slide reference…'
    case 'slide-explain': return 'Expand and explain the slide content for a solo learner…'
    default:              return ''
  }
}

export default BlockEditor
