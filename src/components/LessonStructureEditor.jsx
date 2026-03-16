import React, { useState } from 'react'

/**
 * LessonStructureEditor — inline editor for the lesson structure.
 * Maintains a local draft so edits don't propagate until "Update" is clicked.
 *
 * Props:
 *   structure   LessonStructure[]  — source of truth passed from App
 *   onSave      fn(updated: LessonStructure[])
 *   onCancel    fn
 */
function LessonStructureEditor({ structure, onSave, onCancel }) {
  // Local draft — lives only in this component until Save
  const [draft, setDraft] = useState(() =>
    structure.map((s) => ({
      ...s,
      // flatten coveredSubtopics array to comma-separated string for editing
      _subtopicsStr: s.coveredSubtopics?.join(', ') ?? '',
    }))
  )

  const updateField = (id, field, value) => {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addStep = () => {
    const next = draft.length + 1
    setDraft((prev) => [
      ...prev,
      {
        id: `step-new-${Date.now()}`,
        stepNumber: next,
        title: '',
        goal: '',
        coveredSubtopics: [],
        _subtopicsStr: '',
      },
    ])
  }

  const removeStep = (id) => {
    setDraft((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      return updated.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  const handleSave = () => {
    const cleaned = draft.map(({ _subtopicsStr, ...s }) => ({
      ...s,
      coveredSubtopics: _subtopicsStr
        ? _subtopicsStr.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    }))
    onSave(cleaned)
  }

  return (
    <div>
      <div className="structure-editor">
        {draft.map((step) => (
          <div key={step.id} className="step-edit-card">
            {/* Step header */}
            <div className="step-edit-header">
              <div className="step-edit-label-row">
                <span className="step-edit-number">Step {step.stepNumber}</span>
              </div>
              {draft.length > 1 && (
                <button
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => removeStep(step.id)}
                  title="Remove this step"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Editable fields */}
            <div className="step-edit-fields">
              <div>
                <label className="step-edit-field-label" htmlFor={`title-${step.id}`}>
                  Title
                </label>
                <input
                  id={`title-${step.id}`}
                  type="text"
                  className="form-input"
                  value={step.title}
                  onChange={(e) => updateField(step.id, 'title', e.target.value)}
                  placeholder="Step title"
                />
              </div>

              <div>
                <label className="step-edit-field-label" htmlFor={`goal-${step.id}`}>
                  Learning Goal
                </label>
                <input
                  id={`goal-${step.id}`}
                  type="text"
                  className="form-input"
                  value={step.goal}
                  onChange={(e) => updateField(step.id, 'goal', e.target.value)}
                  placeholder="Students will be able to…"
                />
              </div>

              <div>
                <label className="step-edit-field-label" htmlFor={`subtopics-${step.id}`}>
                  Covered Sub-topics
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: 'none',
                      marginLeft: 4,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    (comma-separated)
                  </span>
                </label>
                <input
                  id={`subtopics-${step.id}`}
                  type="text"
                  className="form-input"
                  value={step._subtopicsStr}
                  onChange={(e) => updateField(step.id, '_subtopicsStr', e.target.value)}
                  placeholder="topic one, topic two"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="add-step-btn" onClick={addStep}>
        + Add Step
      </button>

      <div className="editor-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          Update Structure
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default LessonStructureEditor
