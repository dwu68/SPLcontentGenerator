import React, { useState } from 'react'
import InstructionPanelEditor from './InstructionPanelEditor'
import CodeEditorPanel from './CodeEditorPanel'

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
                  <InstructionPanelEditor
                    step={selectedStep}
                    onUpdate={(fields) => onUpdateContent(selectedStep.id, fields)}
                  />
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
 * Renders concept, codeExample, instructions, and hint as prose blocks.
 * expectedAction and validationNote are author metadata — not shown here.
 */
function LessonStepView({ step }) {
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
