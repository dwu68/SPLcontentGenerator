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
 * Block shape:
 *   { id, type, title?, content, language? }
 *   type: 'explain' | 'code' | 'check' | 'task' | 'hint'
 */

const TYPE_LABELS = {
  explain: 'EXPLAIN',
  code:    'CODE',
  check:   'CHECK',
  task:    'TASK',
  hint:    'HINT',
}

const ADD_TYPES = ['explain', 'code', 'check', 'task', 'hint']

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
      ...(type === 'code' ? { language: 'python' } : {}),
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
  const label = TYPE_LABELS[type] ?? type.toUpperCase()
  const isCode = type === 'code'
  const isHint = type === 'hint'

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

        {/* Content — all types */}
        <div className="block-editor-field">
          <label className="block-editor-field-label">Content</label>
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
    case 'code':    return 6
    case 'explain': return 5
    case 'check':   return 4
    case 'task':    return 4
    case 'hint':    return 3
    default:        return 4
  }
}

function contentPlaceholder(type) {
  switch (type) {
    case 'explain': return 'Teach the concept: why it matters, how it works, the key rules…'
    case 'code':    return 'Short annotated snippet (4–10 lines)…'
    case 'check':   return 'Ask the learner a quick question or reflection prompt…'
    case 'task':    return 'Numbered steps the learner must complete…'
    case 'hint':    return 'A nudge for learners who are stuck…'
    default:        return ''
  }
}

export default BlockEditor
