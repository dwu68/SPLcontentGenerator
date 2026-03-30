import React, { useState, useEffect } from 'react'
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
 *     Only applies to `lesson` steps; non-lesson steps are always read-only.
 *     "Save" keeps edits and exits edit mode.
 *     "Cancel" restores the snapshot taken on edit entry and exits edit mode.
 *     Switching steps while editing silently cancels (restores snapshot).
 *
 * Layout:
 *   [Step Sidebar] | [Instruction Panel] | [Code Panel (lesson steps only)]
 *
 * Props:
 *   lessonStructure  Step[]            — full step list (all types); drives the sidebar
 *   lessonContent    LessonContent[]   — block-based content; only lesson steps have entries
 *   selectedStepId   string | null
 *   onSelectStep     fn(id: string)
 *   onUpdateContent  fn(stepId: string, fields: Partial<LessonContent>)
 *   dirtyStepIds     Set<string>
 */
function LessonAuthoringView({
  lessonStructure,
  lessonContent,
  selectedStepId,
  onSelectStep,
  onUpdateContent,
  onAddTask,
  onAddModuleLab,
  onAddHandsOnStep,
  dirtyStepIds,
  stepGenerationStatus = {},
}) {
  // Disabled while any step is still queued or actively generating
  const generationInProgress = Object.values(stepGenerationStatus).some(
    (s) => s === 'queued' || s === 'generating'
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editSnapshot, setEditSnapshot] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Step metadata (all types) — drives sidebar and stepType branching
  const selectedStructureStep = lessonStructure.find((s) => s.id === selectedStepId) ?? null
  // Lesson content entry — only present for lesson steps
  const selectedContent = lessonContent.find((s) => s.id === selectedStepId) ?? null

  const isLessonStep  = selectedStructureStep?.stepType === 'lesson'
  const isHandsOnStep = Boolean(selectedStructureStep?.isHandsOn)

  // Enter edit mode — snapshot the current lesson content so Cancel can restore it
  const handleEdit = () => {
    if (!selectedContent) return
    setEditSnapshot({ ...selectedContent })
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
      <aside className={`step-sidebar${isSidebarCollapsed ? ' step-sidebar--collapsed' : ''}`}>
        <div className="step-sidebar-header">
          {!isSidebarCollapsed && <span className="step-sidebar-header-text">Lesson Steps</span>}
          <button
            className="step-sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="step-sidebar-list" aria-label="Lesson steps">
          {lessonStructure.map((step) => {
            const genStatus = stepGenerationStatus[step.id]
            return (
              <button
                key={step.id}
                className={`step-nav-btn ${step.id === selectedStepId ? 'active' : ''}`}
                onClick={() => handleSelectStep(step.id)}
                aria-current={step.id === selectedStepId ? 'step' : undefined}
                title={step.title}
              >
                <div className="step-nav-num">{step.stepNumber}</div>
                <div className="step-nav-title">{step.title}</div>
                {genStatus === 'generating' && (
                  <div className="step-nav-genstatus step-nav-genstatus--generating" title="Generating…" aria-label="Generating" />
                )}
                {genStatus === 'queued' && (
                  <div className="step-nav-genstatus step-nav-genstatus--queued" title="Queued" aria-label="Queued" />
                )}
                {genStatus === 'error' && (
                  <div className="step-nav-genstatus step-nav-genstatus--error" title="Generation failed" aria-label="Error" />
                )}
                {dirtyStepIds.has(step.id) && (
                  <div className="step-nav-dirty" title="Unsaved changes" aria-label="Unsaved" />
                )}
              </button>
            )
          })}
          <button
            className="btn btn-ghost step-sidebar-add-handson"
            onClick={onAddHandsOnStep}
            disabled={generationInProgress}
            title={generationInProgress ? 'Waiting for all steps to finish generating…' : 'Add a hands-on practice step'}
          >
            + Add hands-on
          </button>
        </nav>
      </aside>

      {/* ── Main Editor Area ─────────────────────────────────────────────── */}
      <main className="authoring-main">
        {selectedStructureStep ? (
          isLessonStep ? (
            <LessonStepPanels
              selectedContent={selectedContent}
              genStatus={stepGenerationStatus[selectedStepId]}
              isEditing={isEditing}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onUpdateContent={onUpdateContent}
              onAddTask={onAddTask}
              onAddModuleLab={onAddModuleLab}
              isHandsOnStep={isHandsOnStep}
            />
          ) : (
            <NonLessonStepPanel step={selectedStructureStep} />
          )
        ) : (
          <NoStepSelected />
        )}
      </main>
    </div>
  )
}

// ── Lesson step: instruction panel + code panel ──────────────────────────────

function LessonStepPanels({ selectedContent, genStatus, isEditing, onEdit, onSave, onCancel, onUpdateContent, onAddTask, onAddModuleLab, isHandsOnStep }) {
  const hasLabContent = Boolean(selectedContent?.starterCode?.trim())
  const hasTaskBlock  = selectedContent?.blocks?.some((b) => b.type === 'task') ?? false

  // ── Add task with starter code (normal lesson steps) ─────────────────────
  const [isAddingTask,    setIsAddingTask]    = useState(false)
  const [addTaskError,    setAddTaskError]    = useState(null)
  const [addTaskSkipNote, setAddTaskSkipNote] = useState(null)

  // ── Add module lab (hands-on steps) ──────────────────────────────────────
  const [isAddingModuleLab,    setIsAddingModuleLab]    = useState(false)
  const [addModuleLabError,    setAddModuleLabError]    = useState(null)
  const [addModuleLabSkipNote, setAddModuleLabSkipNote] = useState(null)

  // Clear all AI-action feedback whenever edit mode exits
  useEffect(() => {
    if (!isEditing) {
      setAddTaskError(null)
      setAddTaskSkipNote(null)
      setAddModuleLabError(null)
      setAddModuleLabSkipNote(null)
    }
  }, [isEditing])

  const handleAddTaskClick = async () => {
    setIsAddingTask(true)
    setAddTaskError(null)
    setAddTaskSkipNote(null)
    try {
      const result = await onAddTask(selectedContent?.blocks ?? [])
      if (result?.skipped) setAddTaskSkipNote(result.reason)
    } catch (err) {
      setAddTaskError(err.message || 'Failed to generate task. Please try again.')
    } finally {
      setIsAddingTask(false)
    }
  }

  const handleAddModuleLabClick = async () => {
    setIsAddingModuleLab(true)
    setAddModuleLabError(null)
    setAddModuleLabSkipNote(null)
    try {
      const result = await onAddModuleLab()
      if (result?.skipped) setAddModuleLabSkipNote(result.reason)
    } catch (err) {
      setAddModuleLabError(err.message || 'Failed to generate module lab. Please try again.')
    } finally {
      setIsAddingModuleLab(false)
    }
  }

  // "Add task with starter code" — normal steps only, no existing task/lab
  const showAddTaskBtn      = isEditing && selectedContent && !isHandsOnStep && !hasTaskBlock && !hasLabContent
  // "Add module lab" — hands-on steps only, no existing task/lab
  const showAddModuleLabBtn = isEditing && selectedContent && isHandsOnStep  && !hasTaskBlock && !hasLabContent

  return (
    <>
      {/* Instruction Panel — expands to full width when no lab panel is shown */}
      <section
        className={`panel panel-instruction${hasLabContent ? '' : ' panel-instruction--full'}`}
        aria-label="Instruction panel"
      >
        <div className="panel-header">
          <span className="panel-title">Instructions</span>
          <div className="panel-header-actions">
            {isEditing ? (
              <>
                {showAddTaskBtn && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleAddTaskClick}
                    disabled={isAddingTask}
                  >
                    {isAddingTask ? 'Generating…' : 'Add task with starter code'}
                  </button>
                )}
                {showAddModuleLabBtn && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleAddModuleLabClick}
                    disabled={isAddingModuleLab}
                  >
                    {isAddingModuleLab ? 'Generating…' : 'Add module lab'}
                  </button>
                )}
                <button className="btn btn-sm btn-success" onClick={onSave}>
                  Save
                </button>
                <button className="btn btn-sm btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-sm btn-secondary" onClick={onEdit}>
                Edit
              </button>
            )}
          </div>
        </div>
        {addTaskError && (
          <div style={{ fontSize: 12, color: 'var(--color-danger, #c0392b)', padding: '4px 16px 0' }}>
            {addTaskError}
          </div>
        )}
        {addTaskSkipNote && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 16px 0' }}>
            {addTaskSkipNote}
          </div>
        )}
        {addModuleLabError && (
          <div style={{ fontSize: 12, color: 'var(--color-danger, #c0392b)', padding: '4px 16px 0' }}>
            {addModuleLabError}
          </div>
        )}
        {addModuleLabSkipNote && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 16px 0' }}>
            {addModuleLabSkipNote}
          </div>
        )}
        <div className="panel-body">
          {selectedContent ? (
            isEditing ? (
              Array.isArray(selectedContent.blocks) ? (
                <BlockEditor
                  blocks={selectedContent.blocks}
                  onUpdate={(newBlocks) => onUpdateContent(selectedContent.id, { blocks: newBlocks })}
                />
              ) : (
                <InstructionPanelEditor
                  step={selectedContent}
                  onUpdate={(fields) => onUpdateContent(selectedContent.id, fields)}
                />
              )
            ) : (
              <LessonStepView step={selectedContent} />
            )
          ) : (
            <StepGenerationMessage status={genStatus} />
          )}
        </div>
      </section>

      {/* Code Panel — shown when step has lab content, or while editing (to allow adding it) */}
      {(hasLabContent || isEditing) && (
        <section className="panel panel-code" aria-label="Code editor panel">
          <div className="panel-header panel-header-code">
            <span className="panel-title panel-title-code">Lab</span>
            <span className="panel-step-tag panel-step-tag-code">starter_code.py</span>
          </div>
          <div className="panel-body-code">
            {selectedContent && (
              <CodeEditorPanel
                step={selectedContent}
                onUpdate={(fields) => onUpdateContent(selectedContent.id, fields)}
                readOnly={!isEditing}
              />
            )}
          </div>
        </section>
      )}
    </>
  )
}

// ── Non-lesson step: read-only summary view ──────────────────────────────────

const STEP_TYPE_LABELS = {
  downloadable_lab_files: 'Lab Files',
  starter_code_file:      'Starter Code',
  external_lab_link:      'External Lab',
}

function NonLessonStepPanel({ step }) {
  const typeLabel = STEP_TYPE_LABELS[step.stepType] ?? step.stepType

  return (
    <section className="panel panel-instruction" aria-label="Step details panel">
      <div className="panel-header">
        <span className="panel-title">{typeLabel}</span>
        <span className={`step-type-badge step-type-badge--${step.stepType}`}>{typeLabel}</span>
      </div>
      <div className="panel-body">
        <NonLessonStepView step={step} />
      </div>
    </section>
  )
}

function NonLessonStepView({ step }) {
  return (
    <div className="non-lesson-step-view">
      <h2 className="non-lesson-step-title">{step.title}</h2>

      {step.description !== undefined && (
        <div className="non-lesson-step-field">
          <div className="non-lesson-step-label">Description</div>
          <div className="non-lesson-step-value">
            {step.description?.trim() || <span className="non-lesson-step-empty">No description</span>}
          </div>
        </div>
      )}

      {step.stepType === 'external_lab_link' && (
        <div className="non-lesson-step-field">
          <div className="non-lesson-step-label">Lab Link</div>
          <div className="non-lesson-step-value">
            {step.externalLabLink?.trim() ? (
              <a
                href={step.externalLabLink}
                target="_blank"
                rel="noopener noreferrer"
                className="non-lesson-step-link"
              >
                {step.externalLabLink}
              </a>
            ) : (
              <span className="non-lesson-step-empty">No URL set</span>
            )}
          </div>
        </div>
      )}

      {step.stepType === 'downloadable_lab_files' && (
        <div className="non-lesson-step-field">
          <div className="non-lesson-step-label">Lab Files</div>
          <div className="non-lesson-step-placeholder">File upload — coming soon</div>
        </div>
      )}

      {step.stepType === 'starter_code_file' && (
        <>
          <div className="non-lesson-step-field">
            <div className="non-lesson-step-label">Starter Code File</div>
            <div className="non-lesson-step-placeholder">File upload — coming soon</div>
          </div>
          <div className="non-lesson-step-field">
            <div className="non-lesson-step-label">Problem Statement</div>
            <div className="non-lesson-step-placeholder">File upload — coming soon</div>
          </div>
        </>
      )}

      <p className="non-lesson-step-hint">
        Edit this step's fields in the Structure Builder.
      </p>
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
        <Block key={`${step.id}-${block.id}`} block={block} />
      ))}
    </div>
  )
}

/**
 * Block — renders one block by type.
 *
 * Types: explain | code | check | task | hint | slide | slide-explain
 * All types support an optional `title` field rendered as a small label above the content.
 *
 * content is guarded to '' before any string operations — slide blocks intentionally
 * carry null content (their display is driven by slideRef, not content).
 */
function CheckBlock({ title, content, segments }) {
  const [revealed, setRevealed] = useState(false)

  // Detect answer separator — accept "→ ", "Answer:", or "Answer :" variants
  const SEPARATORS = ['\n→ ', '\n\nAnswer:', '\nAnswer:']
  let splitAt = -1
  let sepLen = 0
  for (const sep of SEPARATORS) {
    const idx = content.indexOf(sep)
    if (idx !== -1) { splitAt = idx; sepLen = sep.length; break }
  }
  const hasAnswer = splitAt !== -1
  const questionContent = hasAnswer ? content.slice(0, splitAt).trim() : content
  const answerText = hasAnswer ? content.slice(splitAt + sepLen).trim() : null

  // Re-run the segment renderer on just the question portion
  const questionSegments = questionContent
    .split('\n\n')
    .filter(Boolean)
    .map((chunk, i) => {
      const lines = chunk.split('\n')
      const isCode =
        lines.some((line) => /^\s/.test(line)) ||
        (lines.length >= 2 && /^[a-z_]/.test(chunk))
      return isCode
        ? <pre key={i} className="block-inline-code">{chunk}</pre>
        : <p key={i}>{chunk}</p>
    })

  return (
    <div className="block block-check">
      {title && <div className="block-heading">{title}</div>}
      <div className="block-body">
        {hasAnswer ? questionSegments : segments}
        {hasAnswer && (
          <div className="check-solution">
            <button
              className="check-solution-btn"
              onClick={() => setRevealed((v) => !v)}
            >
              {revealed ? 'Hide answer' : 'Show answer'}
            </button>
            {revealed && <p className="check-solution-text">{answerText}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function Block({ block }) {
  const { type, title, content, slideRef } = block
  // Guard against null/undefined content — slide blocks intentionally have null content.
  const safeContent = content ?? ''

  // Render double-newline-separated content.
  // Each chunk is classified as:
  //   bullet list — every non-empty line starts with "- " → <ul>/<li>
  //   code        — any line starts with whitespace, OR multi-line starting
  //                 with a lowercase letter (unindented AI code snippet) → <pre>
  //   prose       — everything else → <p>
  const segments = safeContent
    .split('\n\n')
    .filter(Boolean)
    .map((chunk, i) => {
      const lines = chunk.split('\n').filter(Boolean)
      const isBulletList = lines.length > 0 && lines.every((line) => /^- /.test(line))
      if (isBulletList) {
        return (
          <ul key={i} className="block-bullet-list">
            {lines.map((line, j) => <li key={j}>{line.slice(2)}</li>)}
          </ul>
        )
      }
      const isCode =
        lines.some((line) => /^\s/.test(line)) ||
        (lines.length >= 2 && /^[a-z_]/.test(chunk))
      return isCode
        ? <pre key={i} className="block-inline-code">{chunk}</pre>
        : <p key={i}>{chunk}</p>
    })

  const lines = safeContent
    .split('\n')
    .filter(Boolean)
    .map((line, i) => <p key={i}>{line}</p>)

  if (type === 'slide') {
    return (
      <div className="block block-slide">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-slide-placeholder">
          <div className="block-slide-placeholder-label">Slide {slideRef || '?'}</div>
        </div>
        {safeContent && <div className="block-body">{segments}</div>}
      </div>
    )
  }

  if (type === 'slide-explain') {
    return (
      <div className="block block-slide-explain">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">{segments}</div>
      </div>
    )
  }

  if (type === 'explain') {
    return (
      <div className="block block-explain">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">{segments}</div>
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
        <div className="block-heading">{title || 'Lab'}</div>
        <div className="block-body">{lines}</div>
      </div>
    )
  }

  if (type === 'check') {
    return <CheckBlock title={title} content={safeContent} segments={segments} />
  }

  if (type === 'hint') {
    return (
      <div className="block block-hint">
        <details>
          <summary>{title || 'Need a hint?'}</summary>
          <div className="block-body">{segments}</div>
        </details>
      </div>
    )
  }

  if (type === 'external_link') {
    return (
      <div className="block block-external-link">
        {title && <div className="block-heading">{title}</div>}
        <div className="block-body">
          {safeContent ? (
            <a
              href={safeContent}
              target="_blank"
              rel="noopener noreferrer"
              className="block-external-link-url"
            >
              {title || safeContent}
            </a>
          ) : (
            <span className="block-empty-placeholder">No URL set</span>
          )}
        </div>
      </div>
    )
  }

  if (type === 'downloadable_file') {
    const fileUrl  = block.fileUrl  ?? ''
    const fileName = block.fileName ?? ''
    return (
      <div className="block block-downloadable-file">
        <div className="block-heading">{title || 'File'}</div>
        <div className="block-body">
          {safeContent && <p>{safeContent}</p>}
          {fileUrl ? (
            <a
              className="block-downloadable-file-link"
              href={fileUrl}
              download={fileName || title || true}
            >
              ⬇ {fileName || title || 'Download file'}
            </a>
          ) : (
            <div className="block-downloadable-file-placeholder">No file uploaded yet</div>
          )}
        </div>
      </div>
    )
  }

  // Unknown type — render content as plain text so nothing is silently dropped
  return (
    <div className="block">
      {title && <div className="block-heading">{title}</div>}
      <div>{safeContent}</div>
    </div>
  )
}

/**
 * StepGenerationMessage — shown in the instruction panel body when a lesson
 * step has no content yet (selectedContent is null).
 *
 * Renders a distinct message for each generation status:
 *   queued     — step is waiting for earlier steps to finish
 *   generating — step is currently being generated
 *   error      — generation failed for this step
 *   undefined  — no generation run has started (initial / restored state)
 */
function StepGenerationMessage({ status }) {
  if (status === 'generating') {
    return (
      <div className="panel-gen-status panel-gen-status--generating">
        Generating content for this step…
      </div>
    )
  }
  if (status === 'queued') {
    return (
      <div className="panel-gen-status panel-gen-status--queued">
        Queued — waiting for earlier steps to complete.
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="panel-gen-status panel-gen-status--error">
        Content generation failed for this step. Go back to Screen 1 and click Generate Content to retry.
      </div>
    )
  }
  // No active generation run (fresh load or localStorage restore with a gap)
  return (
    <div className="panel-empty-msg">No content generated for this step yet.</div>
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
