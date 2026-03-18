import React, { useState } from 'react'
import InstructionPanelEditor from './InstructionPanelEditor'
import CodeEditorPanel from './CodeEditorPanel'
import BlockEditor from './BlockEditor'

/**
 * LessonAuthoringView — Screen 2 layout.
 *
 * Modes:
 *   View mode (default) — lesson content renders as readable prose blocks.
 *     No nested textareas; page scrolls naturally.
 *   Edit mode — triggered by the "Edit" button in the instruction panel header.
 *     InstructionPanelEditor (textareas) and editable CodeEditorPanel are shown.
 *     "Save" keeps edits and exits edit mode.
 *     "Cancel" restores the snapshot taken on edit entry and exits edit mode.
 *     Switching steps while editing silently cancels (restores snapshot).
 *
 * Layout:
 *   [Step Sidebar] | [Instruction Panel] | [Code Panel]
 *
 * Props:
 *   lessonContent    LessonContent[]
 *   selectedStepId   string | null
 *   onSelectStep     fn(id: string)
 *   onUpdateContent  fn(stepId: string, fields: Partial<LessonContent>)
 *   dirtyStepIds     Set<string>
 */
function LessonAuthoringView({
  lessonContent,
  selectedStepId,
  onSelectStep,
  onUpdateContent,
  dirtyStepIds,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editSnapshot, setEditSnapshot] = useState(null)

  const selectedStep = lessonContent.find((s) => s.id === selectedStepId) ?? null

  // Enter edit mode — snapshot the current step so Cancel can restore it
  const handleEdit = () => {
    if (!selectedStep) return
    setEditSnapshot({ ...selectedStep })
    setIsEditing(true)
  }

  // Save — edits are already in App state via onUpdateContent; just exit edit mode
  const handleSave = () => {
    setIsEditing(false)
    setEditSnapshot(null)
  }

  // Cancel — restore the snapshot, discarding any in-progress edits
  const handleCancel = () => {
    if (editSnapshot) {
      onUpdateContent(editSnapshot.id, editSnapshot)
    }
    setIsEditing(false)
    setEditSnapshot(null)
  }

  // Step navigation — silently cancel any in-progress edits before switching
  const handleSelectStep = (id) => {
    if (isEditing && editSnapshot) {
      onUpdateContent(editSnapshot.id, editSnapshot)
    }
    setIsEditing(false)
    setEditSnapshot(null)
    onSelectStep(id)
  }

  return (
    <div className="authoring-layout">
      {/* ── Step Sidebar ────────────────────────────────────────────────── */}
      <aside className="step-sidebar">
        <div className="step-sidebar-header">Lesson Steps</div>
        <nav className="step-sidebar-list" aria-label="Lesson steps">
          {lessonContent.map((step) => (
            <button
              key={step.id}
              className={`step-nav-btn ${step.id === selectedStepId ? 'active' : ''}`}
              onClick={() => handleSelectStep(step.id)}
              aria-current={step.id === selectedStepId ? 'step' : undefined}
              title={step.title}
            >
              <div className="step-nav-num">{step.stepNumber}</div>
              <div className="step-nav-title">{step.title}</div>
              {dirtyStepIds.has(step.id) && (
                <div className="step-nav-dirty" title="Unsaved changes" aria-label="Unsaved" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Editor Area ─────────────────────────────────────────────── */}
      <main className={`authoring-main${isEditing ? '' : ' view-mode'}`}>
        {selectedStep ? (
          <>
            {/* Instruction Panel */}
            <section className="panel panel-instruction" aria-label="Instruction panel">
              <div className="panel-header">
                <span className="panel-title">Instructions</span>
                <div className="panel-header-actions">
                  {isEditing ? (
                    <>
                      <button className="btn btn-sm btn-success" onClick={handleSave}>
                        Save
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={handleEdit}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="panel-body">
                {isEditing ? (
                  selectedStep.blocks?.length > 0 ? (
                    <BlockEditor
                      blocks={selectedStep.blocks}
                      onUpdate={(newBlocks) => onUpdateContent(selectedStep.id, { blocks: newBlocks })}
                    />
                  ) : (
                    <InstructionPanelEditor
                      step={selectedStep}
                      onUpdate={(fields) => onUpdateContent(selectedStep.id, fields)}
                    />
                  )
                ) : (
                  <LessonStepView step={selectedStep} />
                )}
              </div>
            </section>

            {/* Code Panel */}
            <section className="panel panel-code" aria-label="Code editor panel">
              <div className="panel-header panel-header-code">
                <span className="panel-title panel-title-code">Starter Code</span>
                <span className="panel-step-tag panel-step-tag-code">starter_code.py</span>
              </div>
              <div className="panel-body-code">
                <CodeEditorPanel
                  step={selectedStep}
                  onUpdate={(fields) => onUpdateContent(selectedStep.id, fields)}
                  readOnly={!isEditing}
                />
              </div>
            </section>
          </>
        ) : (
          <NoStepSelected />
        )}
      </main>
    </div>
  )
}

// ── View mode: readable lesson page ─────────────────────────────────────────

/**
 * LessonStepView — read-only lesson content for view mode.
 *
 * If the step has a non-empty `blocks` array, delegates to BlocksView (block mode).
 * Otherwise falls back to the original flat-field prose rendering.
 *
 * expectedAction and validationNote are author metadata — not shown in either mode.
 */
function LessonStepView({ step }) {
  if (step.blocks?.length > 0) {
    return <BlocksView step={step} />
  }

  // ── Flat-field fallback (original rendering, unchanged) ──────────────────
  return (
    <div className="lesson-step-view">
      <h2 className="lesson-view-title">{step.title}</h2>

      {step.concept && (
        <div className="lesson-view-section">
          <h3 className="lesson-view-section-heading">Explanation</h3>
          {step.concept
            .split('\n\n')
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="lesson-view-para">
                {para}
              </p>
            ))}
        </div>
      )}

      {step.codeExample && (
        <div className="lesson-view-section">
          <h3 className="lesson-view-section-heading">Code Example</h3>
          <pre className="lesson-view-code">{step.codeExample}</pre>
        </div>
      )}

      {step.instructions && (
        <div className="lesson-view-section">
          <h3 className="lesson-view-section-heading">Task</h3>
          {step.instructions
            .split('\n')
            .filter(Boolean)
            .map((line, i) => (
              <p key={i} className="lesson-view-task-line">
                {line}
              </p>
            ))}
        </div>
      )}

      {step.hint && (
        <div className="lesson-view-section">
          <h3 className="lesson-view-section-heading">Hint</h3>
          <p className="lesson-view-hint">{step.hint}</p>
        </div>
      )}
    </div>
  )
}

// ── Block-based view mode ────────────────────────────────────────────────────

/**
 * BlocksView — renders a step's `blocks` array in sequence.
 * Each block is passed to Block, which dispatches on block.type.
 */
function BlocksView({ step }) {
  return (
    <div className="block-view">
      <h2 className="block-view-title">{step.title}</h2>
      {step.blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  )
}

/**
 * Block — renders one block by type.
 *
 * Types: explain | code | check | task | hint
 * All types support an optional `title` field rendered as a small label above the content.
 */
function Block({ block }) {
  const { type, title, content } = block

  // Shared helpers
  const paragraphs = content
    .split('\n\n')
    .filter(Boolean)
    .map((para, i) => <p key={i}>{para}</p>)

  const lines = content
    .split('\n')
    .filter(Boolean)
    .map((line, i) => <p key={i}>{line}</p>)

  if (type === 'explain') {
    return (
      <div className="block block-explain">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">{paragraphs}</div>
      </div>
    )
  }

  if (type === 'code') {
    return (
      <div className="block block-code">
        {title && <div className="block-heading">{title}</div>}
        <pre className="block-body">{content}</pre>
      </div>
    )
  }

  if (type === 'task') {
    return (
      <div className="block block-task">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">{lines}</div>
      </div>
    )
  }

  if (type === 'check') {
    return (
      <div className="block block-check">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">{paragraphs}</div>
      </div>
    )
  }

  if (type === 'hint') {
    return (
      <div className="block block-hint">
        <details>
          <summary>{title || 'Need a hint?'}</summary>
          <div className="block-body">{paragraphs}</div>
        </details>
      </div>
    )
  }

  // Unknown type — render content as plain text so nothing is silently dropped
  return (
    <div className="block">
      {title && <div className="block-heading">{title}</div>}
      <div>{content}</div>
    </div>
  )
}

function NoStepSelected() {
  return (
    <div className="authoring-empty">
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Select a step from the sidebar to start editing.
      </p>
    </div>
  )
}

export default LessonAuthoringView
