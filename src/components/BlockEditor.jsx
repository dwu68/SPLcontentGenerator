import React, { useState } from 'react'

/**
 * BlockEditor — edit mode for block-based steps.
 *
 * Renders each block as an editable card. Handles add, delete, and reorder (↑/↓).
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
  explain:           'EXPLAIN',
  code:              'CODE',
  check:             'CHECK',
  task:              'TASK',
  hint:              'HINT',
  slide:             'SLIDE',
  'slide-explain':   'SLIDE EXPLAIN',
  external_link:     'LINK',
  downloadable_file: 'FILE',
}

const ADD_TYPES = [
  'explain', 'code', 'check', 'task', 'hint',
  'slide', 'slide-explain',
  'external_link', 'downloadable_file',
]

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

  const handleMoveUp = (id) => {
    const i = blocks.findIndex((b) => b.id === id)
    if (i <= 0) return
    const next = [...blocks]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onUpdate(next)
  }

  const handleMoveDown = (id) => {
    const i = blocks.findIndex((b) => b.id === id)
    if (i < 0 || i >= blocks.length - 1) return
    const next = [...blocks]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onUpdate(next)
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
        {blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            onChange={(fields) => handleChange(block.id, fields)}
            onDelete={() => handleDelete(block.id)}
            onMoveUp={() => handleMoveUp(block.id)}
            onMoveDown={() => handleMoveDown(block.id)}
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

function BlockCard({ block, isFirst, isLast, onChange, onDelete, onMoveUp, onMoveDown }) {
  const { type, title = '', content = '', language = '' } = block
  const slideRef = block.slideRef ?? ''
  const fileUrl  = block.fileUrl  ?? ''
  const fileName = block.fileName ?? ''
  const label = TYPE_LABELS[type] ?? type.toUpperCase()
  const isCode             = type === 'code'
  const isHint             = type === 'hint'
  const isSlide            = type === 'slide'
  const isExternalLink     = type === 'external_link'
  const isDownloadableFile = type === 'downloadable_file'

  // Upload state — only used for downloadable_file blocks
  const [uploadStatus, setUploadStatus] = useState('idle') // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError]   = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('uploading')
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-file', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Upload failed (${res.status})`)
      }
      const data = await res.json()
      onChange({ fileUrl: data.fileUrl, fileName: data.fileName })
      setUploadStatus('success')
    } catch (err) {
      setUploadError(err.message)
      setUploadStatus('error')
    }
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  return (
    <div className={`block-editor-card block-editor-card--${type}`}>
      {/* Card header: type badge + reorder buttons + delete button */}
      <div className="block-editor-card-header">
        <span className={`block-type-badge block-type-badge--${type}`}>{label}</span>
        <div className="block-editor-card-header-actions">
          <button
            className="block-reorder-btn"
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ${label} block up`}
            title="Move up"
          >
            ↑
          </button>
          <button
            className="block-reorder-btn"
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ${label} block down`}
            title="Move down"
          >
            ↓
          </button>
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
      </div>

      {/* Editable fields */}
      <div className="block-editor-fields">
        {/* Title — all types */}
        <div className="block-editor-field">
          <label className="block-editor-field-label">
            {isHint             ? 'Collapsed label (optional)'
             : isDownloadableFile ? 'Filename or label'
             : 'Title (optional)'}
          </label>
          <input
            type="text"
            className="field-input"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={
              isHint             ? 'e.g. Need a hint?'
              : isDownloadableFile ? 'e.g. starter_data.csv'
              : 'e.g. What it is'
            }
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

        {/* Content — URL input for external_link; textarea for all others */}
        <div className="block-editor-field">
          <label className="block-editor-field-label">
            {isSlide            ? 'Caption / notes (optional)'
             : isExternalLink    ? 'URL'
             : isDownloadableFile ? 'Description'
             : 'Content'}
          </label>
          {isExternalLink ? (
            <input
              type="url"
              className="field-input"
              value={content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="https://…"
            />
          ) : (
            <textarea
              className={isCode ? 'block-editor-code-textarea' : 'field-textarea'}
              value={content}
              rows={contentRows(type)}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder={contentPlaceholder(type)}
            />
          )}
        </div>

        {/* File upload — downloadable_file blocks only */}
        {isDownloadableFile && (
          <div className="block-editor-field">
            <label className="block-editor-field-label">File</label>
            <div className="block-file-upload">
              <input
                type="file"
                id={`file-upload-${block.id}`}
                className="block-file-upload-input"
                onChange={handleFileChange}
                disabled={uploadStatus === 'uploading'}
              />
              <label
                htmlFor={`file-upload-${block.id}`}
                className={`block-file-upload-btn${uploadStatus === 'uploading' ? ' block-file-upload-btn--disabled' : ''}`}
              >
                {fileUrl ? 'Replace file' : 'Choose file'}
              </label>
              <span className={`block-file-upload-status block-file-upload-status--${uploadStatus}`}>
                {uploadStatus === 'uploading' && 'Uploading…'}
                {uploadStatus === 'success'   && `✓ ${fileName}`}
                {uploadStatus === 'error'     && uploadError}
                {uploadStatus === 'idle'      && (fileName || fileUrl
                  ? (fileName || 'File uploaded')
                  : 'No file uploaded yet'
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contentRows(type) {
  switch (type) {
    case 'code':              return 6
    case 'explain':           return 5
    case 'slide-explain':     return 6
    case 'check':             return 4
    case 'task':              return 4
    case 'hint':              return 3
    case 'slide':             return 2
    case 'downloadable_file': return 3
    default:                  return 4
  }
}

function contentPlaceholder(type) {
  switch (type) {
    case 'explain':           return 'Teach the concept: why it matters, how it works, the key rules…'
    case 'code':              return 'Short annotated snippet (4–10 lines)…'
    case 'check':             return 'Ask the learner a quick question or reflection prompt…'
    case 'task':              return 'Numbered steps the learner must complete…'
    case 'hint':              return 'A nudge for learners who are stuck…'
    case 'slide':             return 'Optional caption or authoring note for this slide reference…'
    case 'slide-explain':     return 'Expand and explain the slide content for a solo learner…'
    case 'downloadable_file': return 'What this file contains and how the learner should use it…'
    default:                  return ''
  }
}

export default BlockEditor
