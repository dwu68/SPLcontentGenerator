import React, { useRef } from 'react'

/**
 * LessonInputForm — left panel on Screen 1.
 *
 * Props:
 *   courseName / moduleName / subtopics        controlled values
 *   onCourseNameChange / onModuleNameChange / onSubtopicsChange   setters
 *   onSubmit      fn — called when the user clicks "Generate Structure Preview"
 *   isGenerating    boolean — true while generation is in flight
 *   generationError string | null — error message from the last failed generation
 *   subtopicsReview  { status, suggestion, rationale, error } — review state from App
 *   onReviewSubtopics          fn — trigger AI review
 *   onApplySubtopicsSuggestion fn — overwrite textarea with suggestion and dismiss
 *   onDismissSubtopicsReview   fn — dismiss the suggestion panel
 */
const LESSON_FORMAT_OPTIONS = [
  { value: 'code_lab',              label: 'Programming' },
  { value: 'guided_tool_workflow',  label: 'Guided Tool Workflow' },
  { value: 'concept_application',   label: 'Concept & Application (coming soon)', disabled: true },
]

function LessonInputForm({
  courseName,
  moduleName,
  lessonFormat,
  subtopics,
  slideFileName,
  slideText,
  slideCount,
  isUploadingSlides,
  slideUploadError,
  onCourseNameChange,
  onModuleNameChange,
  onLessonFormatChange,
  onSubtopicsChange,
  onSlideUpload,
  onSlideRemove,
  onSubmit,
  isGenerating,
  generationError,
  subtopicsReview = { status: 'idle', suggestion: null, rationale: null, error: null },
  onReviewSubtopics,
  onApplySubtopicsSuggestion,
  onDismissSubtopicsReview,
}) {
  const fileInputRef = useRef(null)

  const isValid =
    courseName.trim().length > 0 &&
    moduleName.trim().length > 0 &&
    (subtopics.trim().length > 0 || slideText.trim().length > 0)

  const hasSubtopics = subtopics.trim().length > 0
  const isReviewing  = subtopicsReview.status === 'reviewing'
  const reviewDone   = subtopicsReview.status === 'done'

  // Number of lines in the suggestion — used to size the read-only textarea
  const suggestionRows = subtopicsReview.suggestion
    ? Math.min(10, Math.max(4, subtopicsReview.suggestion.split('\n').filter(Boolean).length + 1))
    : 4

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    onSlideUpload(file)
  }

  const handleRemoveSlide = () => {
    onSlideRemove()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
        Enter course/skill details and the list of topics you want to cover. AI will generate lesson steps accordingly.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="course-name">
          Course Name / Skill Name
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
        <label className="form-label" htmlFor="lesson-format">
          Lesson Format
        </label>
        <select
          id="lesson-format"
          className="form-input"
          value={lessonFormat}
          onChange={(e) => onLessonFormatChange(e.target.value)}
        >
          {LESSON_FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Slides</label>
        <p className="form-hint">Optional — upload a .pptx to use as source material.</p>
        {isUploadingSlides ? (
          <p className="slides-uploading">Uploading…</p>
        ) : slideFileName ? (
          <div className="slides-selected">
            <span className="slides-selected-name" title={slideFileName}>
              {slideFileName}{slideCount > 0 ? ` — ${slideCount} slides` : ''}
            </span>
            <button
              type="button"
              className="slides-remove-btn"
              onClick={handleRemoveSlide}
              aria-label="Remove slide file"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <label className="slides-upload-label">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx"
                className="slides-file-input"
                onChange={handleFileChange}
              />
              Choose .pptx file
            </label>
            {slideUploadError && (
              <p className="slides-upload-error">{slideUploadError}</p>
            )}
          </>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="subtopics">
          Sub-topics
        </label>
        <p className="form-hint">One topic per line, without bullet points</p>
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

        {/* Review button — shown only when subtopics are non-empty */}
        {hasSubtopics && (
          <button
            type="button"
            className="btn btn-secondary btn-sm subtopics-review-btn"
            onClick={onReviewSubtopics}
            disabled={isReviewing || isGenerating}
          >
            {isReviewing ? 'Reviewing…' : 'Review Sub-topics with AI'}
          </button>
        )}

        {/* Review error */}
        {subtopicsReview.error && (
          <p className="subtopics-review-error">{subtopicsReview.error}</p>
        )}

        {/* Suggestion panel — shown after review completes */}
        {reviewDone && (
          <div className="subtopics-review-panel">
            <div className="subtopics-review-panel-header">
              <span className="subtopics-review-panel-title">
                {subtopicsReview.suggestion ? 'AI Suggestion' : 'AI Review'}
              </span>
              <button
                type="button"
                className="subtopics-review-dismiss-x"
                onClick={onDismissSubtopicsReview}
                aria-label="Dismiss review"
              >
                ×
              </button>
            </div>

            <div className="subtopics-review-panel-body">
              {subtopicsReview.suggestion ? (
                <>
                  <textarea
                    className="subtopics-review-suggestion-textarea"
                    readOnly
                    rows={suggestionRows}
                    value={subtopicsReview.suggestion}
                  />
                  {subtopicsReview.rationale && (
                    <p className="subtopics-review-rationale">{subtopicsReview.rationale}</p>
                  )}
                  <div className="subtopics-review-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={onApplySubtopicsSuggestion}
                    >
                      Apply Suggestion
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={onDismissSubtopicsReview}
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="subtopics-review-skip-reason">{subtopicsReview.rationale}</p>
                  <div className="subtopics-review-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={onDismissSubtopicsReview}
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={onSubmit}
        disabled={!isValid || isGenerating}
        title={!isValid ? 'Fill in all fields to continue' : 'Generate the lesson structure preview'}
      >
        {isGenerating ? 'Generating…' : 'Generate Structure Preview'}
      </button>

      {generationError && (
        <p className="generation-error">{generationError}</p>
      )}

      <p
        style={{
          marginTop: 10,
          fontSize: 11,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        {/* ⌘ + Enter to submit */}
      </p>
    </div>
  )
}

export default LessonInputForm
