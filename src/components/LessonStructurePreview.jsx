import React, { useState, useEffect, useRef } from 'react'

/**
 * LessonStructurePreview — right pane on Screen 1.
 *
 * Always-editable lesson structure builder.
 * Each step is an inline editable card with reorder and delete controls.
 * No separate "edit mode" — the structure is the editor.
 *
 * Props:
 *   structure     LessonStructure[]
 *   onUpdateStep  fn(id, fields)
 *   onAddStep     fn()
 *   onDeleteStep  fn(id)
 *   onMoveStep    fn(id, 'up' | 'down')
 *   onGenerate    fn()
 *   isGenerating         boolean — true while generation is in flight
 *   generationError      string | null — error message from the last failed generation
 *   titleValidationError string | null — set when generation is blocked by empty step titles
 */
function LessonStructurePreview({
  structure,
  onUpdateStep,
  onAddStep,
  onDeleteStep,
  onMoveStep,
  onGenerate,
  isGenerating,
  generationError,
  titleValidationError,
}) {
  const isEmpty = structure.length === 0

  return (
    <div className="structure-preview">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="structure-header">
        <div className="structure-title">
          Lesson Structure
          {!isEmpty && (
            <span className="structure-count-badge">
              {structure.length} step{structure.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <div className="step-builder-list">
            {structure.map((step, index) => (
              <StepBuilderCard
                key={step.id}
                step={step}
                isFirst={index === 0}
                isLast={index === structure.length - 1}
                onUpdate={(fields) => onUpdateStep(step.id, fields)}
                onDelete={() => onDeleteStep(step.id)}
                onMoveUp={() => onMoveStep(step.id, 'up')}
                onMoveDown={() => onMoveStep(step.id, 'down')}
              />
            ))}
          </div>

          {/* Add step */}
          <button className="add-step-btn" onClick={onAddStep}>
            <span>+</span> Add Step
          </button>

          {/* Generate footer */}
          <div className="structure-footer">
            <button
              className="btn btn-success btn-lg"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Generating…' : '✨ Generate Lesson Content →'}
            </button>
            {titleValidationError && (
              <p className="generation-error">{titleValidationError}</p>
            )}
            {generationError && (
              <p className="generation-error">{generationError}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="structure-empty">
      <span className="structure-empty-icon">📋</span>
      <div className="structure-empty-title">No structure yet</div>
      <p className="structure-empty-body">
        Fill in the lesson details on the left and click{' '}
        <strong>Generate Structure Preview</strong> to build your lesson outline here.
      </p>
    </div>
  )
}

/* ── Step builder card ───────────────────────────────────────────────────────── */

/**
 * StepBuilderCard — single editable step row.
 *
 * Uses local state for the topics string so the user can type freely
 * (e.g. mid-comma) without the array conversion disrupting the cursor.
 * Syncs back to parent on every change.
 *
 * Local state resets when step.id changes (new generation) or when coveredSubtopics
 * is changed externally (e.g. future undo / bulk-edit). Changes that originate from
 * the user typing in this card do not reset the input, preserving cursor position.
 */
function StepBuilderCard({ step, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [topicsStr, setTopicsStr] = useState(
    () => step.coveredSubtopics?.join(', ') ?? ''
  )

  // Tracks the canonical form of the last value we sent up via onUpdate.
  // Lets the effect distinguish user-typed changes (which round-trip through props
  // but should not reset the input) from external changes (which should).
  const lastSentCanonicalRef = useRef(step.coveredSubtopics?.join(', ') ?? '')

  useEffect(() => {
    const canonical = step.coveredSubtopics?.join(', ') ?? ''
    if (canonical !== lastSentCanonicalRef.current) {
      setTopicsStr(canonical)
      lastSentCanonicalRef.current = canonical
    }
  }, [step.id, step.coveredSubtopics])

  const handleTopicsChange = (value) => {
    setTopicsStr(value)
    const parsed = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    lastSentCanonicalRef.current = parsed.join(', ')
    onUpdate({ coveredSubtopics: parsed })
  }

  return (
    <div className="step-builder-card">
      {/* ── Card header: number + title input + reorder/delete controls ─── */}
      <div className="step-builder-card-header">
        <div className="step-number-badge" aria-label={`Step ${step.stepNumber}`}>
          {step.stepNumber}
        </div>

        <input
          type="text"
          className="step-builder-title-input"
          value={step.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter step title…"
          aria-label={`Step ${step.stepNumber} title`}
        />

        <div className="step-builder-actions">
          <button
            className="step-icon-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move step up"
            aria-label="Move step up"
          >
            ↑
          </button>
          <button
            className="step-icon-btn"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move step down"
            aria-label="Move step down"
          >
            ↓
          </button>
          <div className="step-builder-actions-sep" aria-hidden="true" />
          <button
            className="step-icon-btn step-icon-btn-delete"
            onClick={onDelete}
            title="Delete step"
            aria-label="Delete this step"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Card body: goal + topics ──────────────────────────────────────── */}
      <div className="step-builder-card-body">
        <div className="step-field-row">
          <label
            className="step-field-label"
            htmlFor={`goal-${step.id}`}
          >
            Goal
          </label>
          <input
            id={`goal-${step.id}`}
            type="text"
            className="step-field-input"
            value={step.goal}
            onChange={(e) => onUpdate({ goal: e.target.value })}
            placeholder="Students will be able to…"
          />
        </div>

        <div className="step-field-row">
          <label
            className="step-field-label"
            htmlFor={`topics-${step.id}`}
          >
            Topics
          </label>
          <input
            id={`topics-${step.id}`}
            type="text"
            className="step-field-input"
            value={topicsStr}
            onChange={(e) => handleTopicsChange(e.target.value)}
            placeholder="keyword one, keyword two, …"
          />
        </div>
      </div>
    </div>
  )
}

export default LessonStructurePreview
