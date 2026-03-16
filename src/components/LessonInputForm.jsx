import React from 'react'

/**
 * LessonInputForm — left panel on Screen 1.
 *
 * Props:
 *   courseName / moduleName / subtopics        controlled values
 *   onCourseNameChange / onModuleNameChange / onSubtopicsChange   setters
 *   onSubmit      fn — called when the user clicks "Generate Structure Preview"
 *   isGenerating  boolean — true while generation is in flight
 */
function LessonInputForm({
  courseName,
  moduleName,
  subtopics,
  onCourseNameChange,
  onModuleNameChange,
  onSubtopicsChange,
  onSubmit,
  isGenerating,
}) {
  const isValid =
    courseName.trim().length > 0 &&
    moduleName.trim().length > 0 &&
    subtopics.trim().length > 0

  const handleKeyDown = (e) => {
    // Allow Ctrl/Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isValid && !isGenerating) {
      onSubmit()
    }
  }

  return (
    <div className="form-panel" onKeyDown={handleKeyDown}>
      <div className="form-panel-title">Lesson Setup</div>
      <p className="form-panel-subtitle">
        Enter course details and the list of topics you want to cover. Each topic
        becomes one step in the lesson.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="course-name">
          Course Name
        </label>
        <input
          id="course-name"
          type="text"
          className="form-input"
          placeholder="e.g. Introduction to Python"
          value={courseName}
          onChange={(e) => onCourseNameChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="module-name">
          Module Name
        </label>
        <input
          id="module-name"
          type="text"
          className="form-input"
          placeholder="e.g. Python Basics"
          value={moduleName}
          onChange={(e) => onModuleNameChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="subtopics">
          Sub-topics
        </label>
        <p className="form-hint">One topic per line — each becomes a lesson step.</p>
        <textarea
          id="subtopics"
          className="form-textarea"
          placeholder={
            'Recognize Python keywords\nDo not use keywords as variable names\nRead simple Python instructions'
          }
          value={subtopics}
          onChange={(e) => onSubtopicsChange(e.target.value)}
          rows={9}
        />
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={onSubmit}
        disabled={!isValid || isGenerating}
        title={!isValid ? 'Fill in all fields to continue' : 'Generate the lesson structure preview'}
      >
        {isGenerating ? 'Generating…' : 'Generate Structure Preview'}
      </button>

      <p
        style={{
          marginTop: 10,
          fontSize: 11,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        ⌘ + Enter to submit
      </p>
    </div>
  )
}

export default LessonInputForm
