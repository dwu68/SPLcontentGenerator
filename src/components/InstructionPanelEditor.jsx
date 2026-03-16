import React from 'react'

/**
 * InstructionPanelEditor — left editor panel in Screen 2.
 *
 * Renders editable fields for:
 *   - step title
 *   - concept
 *   - task instructions
 *   - hint
 *   - expected action
 *   - validation note
 *
 * Each keystroke calls onUpdate with only the changed field, which
 * flows up to App and back down as new props — fully controlled.
 *
 * Props:
 *   step      LessonContent
 *   onUpdate  fn(fields: Partial<LessonContent>)
 */
function InstructionPanelEditor({ step, onUpdate }) {
  return (
    <div>
      {/* Title */}
      <div className="field-group">
        <label className="field-label" htmlFor={`title-${step.id}`}>
          Title
        </label>
        <input
          id={`title-${step.id}`}
          type="text"
          className="field-input"
          value={step.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Step title"
        />
      </div>

      {/* Concept */}
      <div className="field-group">
        <label className="field-label" htmlFor={`concept-${step.id}`}>
          Concept
        </label>
        <textarea
          id={`concept-${step.id}`}
          className="field-textarea"
          value={step.concept}
          rows={6}
          onChange={(e) => onUpdate({ concept: e.target.value })}
          placeholder="Explain the underlying concept the learner will encounter…"
        />
      </div>

      {/* Task Instructions */}
      <div className="field-group">
        <label className="field-label" htmlFor={`instructions-${step.id}`}>
          Task Instructions
        </label>
        <textarea
          id={`instructions-${step.id}`}
          className="field-textarea"
          value={step.instructions}
          rows={6}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          placeholder="What should the learner do in this exercise?"
        />
      </div>

      {/* Hint */}
      <div className="field-group">
        <label className="field-label" htmlFor={`hint-${step.id}`}>
          Hint
        </label>
        <textarea
          id={`hint-${step.id}`}
          className="field-textarea"
          value={step.hint}
          rows={3}
          onChange={(e) => onUpdate({ hint: e.target.value })}
          placeholder="A nudge for learners who are stuck…"
        />
      </div>

      {/* Expected Action */}
      <div className="field-group">
        <label className="field-label" htmlFor={`expected-action-${step.id}`}>
          Expected Action
        </label>
        <textarea
          id={`expected-action-${step.id}`}
          className="field-textarea"
          value={step.expectedAction}
          rows={3}
          onChange={(e) => onUpdate({ expectedAction: e.target.value })}
          placeholder="What must the learner do to complete this step? (used by future validation)"
        />
      </div>

      {/* Validation Note */}
      <div className="field-group">
        <label className="field-label" htmlFor={`validation-note-${step.id}`}>
          Validation Note
        </label>
        <textarea
          id={`validation-note-${step.id}`}
          className="field-textarea"
          value={step.validationNote}
          rows={4}
          onChange={(e) => onUpdate({ validationNote: e.target.value })}
          placeholder="Guidance for the validator: what does a correct solution look like? What are common mistakes?"
        />
      </div>
    </div>
  )
}

export default InstructionPanelEditor
