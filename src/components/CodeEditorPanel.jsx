import React from 'react'

/**
 * CodeEditorPanel — right panel in Screen 2.
 *
 * Renders the starter code in a dark-themed monospaced textarea.
 * Handles Tab key for indentation so the editing experience feels
 * natural without a full code editor library.
 *
 * Props:
 *   step      LessonContent
 *   onUpdate  fn(fields: Partial<LessonContent>)
 */
function CodeEditorPanel({ step, onUpdate }) {
  const handleKeyDown = (e) => {
    // Insert 4 spaces on Tab instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const { selectionStart: start, selectionEnd: end, value } = el
      const indent = '    '
      const next = value.slice(0, start) + indent + value.slice(end)
      onUpdate({ starterCode: next })
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + indent.length
      })
    }
  }

  return (
    <div className="code-editor-wrapper">
      <label className="code-field-label" htmlFor={`code-${step.id}`}>
        starter_code.py
      </label>
      <textarea
        id={`code-${step.id}`}
        className="code-textarea"
        value={step.starterCode}
        onChange={(e) => onUpdate({ starterCode: e.target.value })}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        aria-label="Starter code editor"
      />
    </div>
  )
}

export default CodeEditorPanel
