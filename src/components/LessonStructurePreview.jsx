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
 *   onAddStep     fn(stepType: string)
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
  const [showTypePicker, setShowTypePicker] = useState(false)
  const isEmpty = structure.length === 0

  const handlePickType = (stepType) => {
    onAddStep(stepType)
    setShowTypePicker(false)
  }

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

          {/* Add step + type picker */}
          <div className="add-step-area">
            {showTypePicker && (
              <StepTypePicker onPick={handlePickType} onCancel={() => setShowTypePicker(false)} />
            )}
            <button
              className="add-step-btn"
              onClick={() => setShowTypePicker((v) => !v)}
            >
              {showTypePicker ? (
                <>× Cancel</>
              ) : (
                <><span>+</span> Add Step</>
              )}
            </button>
          </div>

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

/* ── Step type picker ────────────────────────────────────────────────────────── */

const STEP_TYPE_OPTIONS = [
  { value: 'lesson',                 label: 'Lesson',          description: 'AI-generated lesson content' },
  { value: 'downloadable_lab_files', label: 'Lab Files',       description: 'Downloadable files for a lab' },
  { value: 'starter_code_file',      label: 'Starter Code',    description: 'Starter code file for learners' },
  { value: 'external_lab_link',      label: 'External Lab',    description: 'Link to an external lab platform' },
]

function StepTypePicker({ onPick, onCancel }) {
  return (
    <div className="step-type-picker">
      <div className="step-type-picker-label">Choose step type</div>
      <div className="step-type-picker-options">
        {STEP_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="step-type-picker-btn"
            onClick={() => onPick(opt.value)}
            title={opt.description}
          >
            {opt.label}
          </button>
        ))}
      </div>
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

/* ── Step type metadata ──────────────────────────────────────────────────────── */

const STEP_TYPE_LABELS = {
  lesson:                 'Lesson',
  downloadable_lab_files: 'Lab Files',
  starter_code_file:      'Starter Code',
  external_lab_link:      'External Lab',
}

/* ── Step builder card ───────────────────────────────────────────────────────── */

function StepBuilderCard({ step, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const typeLabel = STEP_TYPE_LABELS[step.stepType] ?? step.stepType

  return (
    <div className="step-builder-card">
      {/* ── Card header: number + type badge + title input + controls ─── */}
      <div className="step-builder-card-header">
        <div className="step-number-badge" aria-label={`Step ${step.stepNumber}`}>
          {step.stepNumber}
        </div>

        <span className={`step-type-badge step-type-badge--${step.stepType}`}>
          {typeLabel}
        </span>

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

      {/* ── Card body: fields vary by step type ──────────────────────────── */}
      <div className="step-builder-card-body">
        {step.stepType === 'lesson' && (
          <LessonStepFields step={step} onUpdate={onUpdate} />
        )}
        {step.stepType === 'downloadable_lab_files' && (
          <DownloadableLabFilesFields step={step} onUpdate={onUpdate} />
        )}
        {step.stepType === 'starter_code_file' && (
          <StarterCodeFileFields step={step} onUpdate={onUpdate} />
        )}
        {step.stepType === 'external_lab_link' && (
          <ExternalLabLinkFields step={step} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

/* ── Lesson step fields (unchanged behavior) ─────────────────────────────────── */

function LessonStepFields({ step, onUpdate }) {
  const [topicsStr, setTopicsStr] = useState(
    () => step.coveredSubtopics?.join(', ') ?? ''
  )

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
    <>
      <div className="step-field-row">
        <label className="step-field-label" htmlFor={`goal-${step.id}`}>
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
        <label className="step-field-label" htmlFor={`topics-${step.id}`}>
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
    </>
  )
}

/* ── Downloadable lab files fields ───────────────────────────────────────────── */

function DownloadableLabFilesFields({ step, onUpdate }) {
  return (
    <>
      <div className="step-field-row">
        <label className="step-field-label" htmlFor={`desc-${step.id}`}>
          Description
        </label>
        <input
          id={`desc-${step.id}`}
          type="text"
          className="step-field-input"
          value={step.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="What do these files contain?"
        />
      </div>

      <div className="step-field-row">
        <label className="step-field-label">Files</label>
        <input
          type="text"
          className="step-field-input step-field-input--placeholder"
          disabled
          placeholder="File upload — coming soon"
        />
      </div>
    </>
  )
}

/* ── Starter code file fields ────────────────────────────────────────────────── */

function StarterCodeFileFields({ step, onUpdate }) {
  return (
    <>
      <div className="step-field-row">
        <label className="step-field-label" htmlFor={`desc-${step.id}`}>
          Description
        </label>
        <input
          id={`desc-${step.id}`}
          type="text"
          className="step-field-input"
          value={step.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="What should the learner do with this file?"
        />
      </div>

      <div className="step-field-row">
        <label className="step-field-label">Starter Code</label>
        <input
          type="text"
          className="step-field-input step-field-input--placeholder"
          disabled
          placeholder="File upload — coming soon"
        />
      </div>

      <div className="step-field-row">
        <label className="step-field-label">Problem Statement</label>
        <input
          type="text"
          className="step-field-input step-field-input--placeholder"
          disabled
          placeholder="File upload — coming soon (optional)"
        />
      </div>
    </>
  )
}

/* ── External lab link fields ────────────────────────────────────────────────── */

function ExternalLabLinkFields({ step, onUpdate }) {
  return (
    <>
      <div className="step-field-row">
        <label className="step-field-label" htmlFor={`desc-${step.id}`}>
          Description
        </label>
        <input
          id={`desc-${step.id}`}
          type="text"
          className="step-field-input"
          value={step.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Brief description of the external lab"
        />
      </div>

      <div className="step-field-row">
        <label className="step-field-label" htmlFor={`link-${step.id}`}>
          Lab Link
        </label>
        <input
          id={`link-${step.id}`}
          type="url"
          className="step-field-input"
          value={step.externalLabLink ?? ''}
          onChange={(e) => onUpdate({ externalLabLink: e.target.value })}
          placeholder="https://…"
        />
      </div>
    </>
  )
}

export default LessonStructurePreview
