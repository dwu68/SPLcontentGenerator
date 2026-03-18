import React from 'react'
import InstructionPanelEditor from './InstructionPanelEditor'
import CodeEditorPanel from './CodeEditorPanel'

/**
 * LessonAuthoringView — Screen 2 layout.
 *
 * Layout:
 *   [Step Sidebar] | [Instruction Panel] | [Code Editor Panel]
 *
 * Props:
 *   lessonContent    LessonContent[]
 *   selectedStepId   string | null
 *   onSelectStep     fn(id: string)
 *   onUpdateContent  fn(stepId: string, fields: Partial<LessonContent>)
 *   dirtyStepIds     Set<string>
 *   saveStatus       string
 *   onSaveDraft      fn
 */
function LessonAuthoringView({
  lessonContent,
  selectedStepId,
  onSelectStep,
  onUpdateContent,
  dirtyStepIds,
  saveStatus,
  onSaveDraft,
}) {
  const selectedStep = lessonContent.find((s) => s.id === selectedStepId) ?? null

  return (
    <div className="authoring-layout">
      {/* ── Step Sidebar ────────────────────────────────────────────────── */}
      <aside className="step-sidebar">
        <div className="step-sidebar-header">Topic List</div>
        <nav className="step-sidebar-list" aria-label="Topic list">
          {lessonContent.map((step) => (
            <button
              key={step.id}
              className={`step-nav-btn ${step.id === selectedStepId ? 'active' : ''}`}
              onClick={() => onSelectStep(step.id)}
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
      <main className="authoring-main">
        {selectedStep ? (
          <>
            {/* Instruction Panel */}
            <section className="panel panel-instruction" aria-label="Instruction panel">
              <div className="panel-header">
                <span className="panel-title">Instructions</span>
                <span className="panel-step-tag">Topic {selectedStep.stepNumber}</span>
              </div>
              <div className="panel-body">
                <InstructionPanelEditor
                  step={selectedStep}
                  onUpdate={(fields) => onUpdateContent(selectedStep.id, fields)}
                />
              </div>
            </section>

            {/* Code Editor Panel */}
            <section className="panel panel-code" aria-label="Code editor panel">
              <div className="panel-header panel-header-code">
                <span className="panel-title panel-title-code">Starter Code</span>
                <span className="panel-step-tag panel-step-tag-code">
                  starter_code.py
                </span>
              </div>
              <div className="panel-body-code">
                <CodeEditorPanel
                  step={selectedStep}
                  onUpdate={(fields) => onUpdateContent(selectedStep.id, fields)}
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
