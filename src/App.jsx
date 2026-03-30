import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import LessonInputForm from './components/LessonInputForm'
import LessonStructurePreview from './components/LessonStructurePreview'
import LessonAuthoringView from './components/LessonAuthoringView'
import { generateStepContent, generateTaskForStep, generateModuleLabForStep, generateBlockForStep } from './services/lessonContentService'
import { generateLessonStructure } from './services/lessonStructureService'

const STORAGE_KEY = 'spl_lesson_draft'

/**
 * App — central state container.
 *
 * State shape:
 *   screen            'builder' | 'authoring'
 *   courseName        string
 *   moduleName        string
 *   subtopics         string  (raw textarea value)
 *   lessonStructure   LessonStructure[]
 *   lessonContent     LessonContent[]
 *   selectedStepId    string | null
 *   dirtyStepIds      Set<string>  (steps edited since last save)
 *   saveStatus        'saved' | 'unsaved' | 'saving'
 *   isGenerating        boolean  (true while either generation call is in flight)
 *   generationError     string | null  (message from the most recent failed generation)
 *   titleValidationError string | null  (set when generate is blocked by empty step titles)
 *
 * Screen 1 AI integration point: src/services/lessonStructureService.js — callProvider()
 * Screen 2 AI integration point: src/services/lessonContentService.js — generateAllLessonContent()
 * Persistence integration point: handleSaveDraft() below [PERSIST HOOK]
 */
function App() {
  // ── Screen ──────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('builder')

  // ── Form inputs ──────────────────────────────────────────────────────────
  const [courseName, setCourseName] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [lessonFormat, setLessonFormat] = useState('code_lab')
  const [subtopics, setSubtopics] = useState('')
  const [slideFileName, setSlideFileName] = useState('')
  const [slideText, setSlideText] = useState('')
  const [slideCount, setSlideCount] = useState(0)
  const [isUploadingSlides, setIsUploadingSlides] = useState(false)
  const [slideUploadError, setSlideUploadError] = useState(null)

  // ── Lesson structure (Screen 1 output) ──────────────────────────────────
  const [lessonStructure, setLessonStructure] = useState([])

  // ── Lesson content (Screen 2) ────────────────────────────────────────────
  const [lessonContent, setLessonContent] = useState([])
  const [selectedStepId, setSelectedStepId] = useState(null)

  // ── Save / dirty state ───────────────────────────────────────────────────
  const [dirtyStepIds, setDirtyStepIds] = useState(new Set())
  const [saveStatus, setSaveStatus] = useState('saved')

  // ── Generation loading / error state ────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [titleValidationError, setTitleValidationError] = useState(null)

  // ── Per-step generation status (Screen 2 progressive generation) ─────────
  // Shape: { [stepId]: 'queued' | 'generating' | 'done' | 'error' }
  // Only populated during / after a generation run. Empty object = no run yet.
  const [stepGenerationStatus, setStepGenerationStatus] = useState({})

  // ── Restore draft from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.courseName) setCourseName(data.courseName)
      if (data.moduleName) setModuleName(data.moduleName)
      if (data.lessonFormat) setLessonFormat(data.lessonFormat)
      if (data.subtopics) setSubtopics(data.subtopics)
      if (data.slideFileName) setSlideFileName(data.slideFileName)
      if (data.lessonStructure?.length) setLessonStructure(data.lessonStructure)
      if (data.lessonContent?.length) {
        setLessonContent(data.lessonContent)
        setSelectedStepId(data.selectedStepId || data.lessonContent[0]?.id || null)
      }
      if (data.screen) setScreen(data.screen)
    } catch {
      // ignore parse errors
    }
  }, [])

  // ── Clear title validation error once all titles are filled in ──────────
  useEffect(() => {
    if (titleValidationError && lessonStructure.every((s) => s.title.trim())) {
      setTitleValidationError(null)
    }
  }, [lessonStructure, titleValidationError])

  // ── Slides upload handler ────────────────────────────────────────────────
  const handleSlideUpload = async (file) => {
    setSlideFileName(file.name)
    setSlideText('')
    setSlideCount(0)
    setSlideUploadError(null)
    setIsUploadingSlides(true)
    const formData = new FormData()
    formData.append('slides', file)
    try {
      const res = await fetch('/api/upload-slides', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Upload failed (${res.status})`)
      }
      const data = await res.json()
      setSlideText(data.slideText)
      setSlideCount(data.slideCount)
    } catch (err) {
      setSlideFileName('')
      setSlideUploadError(err.message || 'Slide upload failed')
    } finally {
      setIsUploadingSlides(false)
    }
  }

  const handleSlideRemove = () => {
    setSlideFileName('')
    setSlideText('')
    setSlideCount(0)
    setSlideUploadError(null)
  }

  // ── Screen 1: submit form → generate structure ───────────────────────────
  const handleSubmit = async () => {
    const hasSlides = slideText.trim().length > 0
    if (!courseName.trim() || !moduleName.trim() || (!subtopics.trim() && !hasSlides)) return
    if (lessonStructure.length > 0) {
      const ok = window.confirm(
        'Regenerate lesson structure?\n\nThis will replace all existing steps, including any edits you have made. This cannot be undone.'
      )
      if (!ok) return
    }
    setGenerationError(null)
    setIsGenerating(true)
    try {
      // [AI HOOK] see src/services/lessonStructureService.js — callProvider()
      const structure = await generateLessonStructure(courseName, moduleName, subtopics, slideText)
      setLessonStructure(structure)
    } catch (err) {
      setGenerationError(err.message || 'Failed to generate lesson structure. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Screen 1: step-level mutations (all renumber automatically) ──────────
  const handleUpdateStep = (id, fields) => {
    setLessonStructure((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...fields } : s))
    )
  }

  const handleAddStep = (stepType = 'lesson') => {
    setLessonStructure((prev) => {
      const next = prev.length + 1
      const defaultTitle = stepType === 'lesson' ? '' : 'Hands-on practice'
      const base = {
        id: `step-new-${Date.now()}`,
        stepNumber: next,
        stepType,
        title: defaultTitle,
      }
      const typeFields = {
        lesson:                 { goal: '', coveredSubtopics: [] },
        downloadable_lab_files: { description: '' },
        starter_code_file:      { description: '' },
        external_lab_link:      { description: '', externalLabLink: '' },
      }
      return [...prev, { ...base, ...(typeFields[stepType] ?? {}) }]
    })
  }

  const handleDeleteStep = (id) => {
    setLessonStructure((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      return filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  const handleMoveStep = (id, direction) => {
    setLessonStructure((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx < 0) return prev
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1
      if (nextIdx < 0 || nextIdx >= prev.length) return prev
      const reordered = [...prev]
      ;[reordered[idx], reordered[nextIdx]] = [reordered[nextIdx], reordered[idx]]
      return reordered.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  // ── Screen 1 → Screen 2: generate content from structure ────────────────
  //
  // Progressive generation slice:
  //   1. Validate and confirm (same as before)
  //   2. Navigate to Screen 2 immediately
  //   3. Generate one lesson step at a time, updating lessonContent + status
  //      after each step so completed steps are visible while later steps wait
  //   4. Continue on per-step error (marks step 'error') rather than aborting
  //
  // Known limitation (this slice): navigating back to Screen 1 mid-generation
  // does not cancel in-flight requests. Back navigation is available but the
  // background loop will continue updating state until it finishes.
  const handleGenerate = async () => {
    const emptyStep = lessonStructure.find((s) => !s.title.trim())
    if (emptyStep) {
      setTitleValidationError(
        `Step ${emptyStep.stepNumber} has no title. All steps must have a title before generating content.`
      )
      return
    }
    setTitleValidationError(null)
    if (lessonContent.length > 0) {
      const ok = window.confirm(
        'Generate new lesson content?\n\nAll edits in the Lesson Authoring view will be replaced. This cannot be undone.'
      )
      if (!ok) return
    }

    const lessonSteps = lessonStructure.filter((s) => s.stepType === 'lesson')

    // Initialise all lesson steps as queued
    const initialStatus = {}
    for (const step of lessonSteps) {
      initialStatus[step.id] = 'queued'
    }

    setGenerationError(null)
    setIsGenerating(true)
    setLessonContent([])
    setStepGenerationStatus(initialStatus)
    setDirtyStepIds(new Set())
    setSelectedStepId(lessonStructure[0]?.id || null)
    localStorage.removeItem(STORAGE_KEY)
    setScreen('authoring') // navigate immediately — user sees Screen 2 right away

    for (const step of lessonSteps) {
      setStepGenerationStatus((prev) => ({ ...prev, [step.id]: 'generating' }))
      try {
        const content = await generateStepContent({
          courseName, moduleName, step, lessonStructure, lessonFormat, slideText,
        })
        setLessonContent((prev) => [...prev, content])
        setStepGenerationStatus((prev) => ({ ...prev, [step.id]: 'done' }))
      } catch (err) {
        setStepGenerationStatus((prev) => ({ ...prev, [step.id]: 'error' }))
        setGenerationError(err.message || `Failed to generate content for step "${step.title}".`)
      }
    }

    setSaveStatus('unsaved')
    setIsGenerating(false)
  }

  // ── Screen 2: add a new empty hands-on lesson step ───────────────────────
  //
  // Creates a lesson step in lessonStructure + a matching empty lessonContent
  // entry (no AI call — author authors manually in edit mode afterward).
  // Auto-selects the new step so the author can start editing immediately.
  const handleAddHandsOnStep = () => {
    const newId = `step-new-${Date.now()}`
    setLessonStructure((prev) => [
      ...prev,
      {
        id: newId,
        stepNumber: prev.length + 1,
        stepType: 'lesson',
        title: 'Hands-on Practice',
        goal: '',
        coveredSubtopics: [],
        isHandsOn: true,
      },
    ])
    setLessonContent((prev) => [
      ...prev,
      {
        id: newId,
        stepNumber: lessonStructure.length + 1,
        title: 'Hands-on Practice',
        blocks: [],
        starterCode: '',
        expectedAction: '',
        validationNote: '',
      },
    ])
    setSelectedStepId(newId)
    setSaveStatus('unsaved')
  }

  // ── Screen 2: generate module-level lab for a Hands-on Practice step ────
  //
  // Uses all previous lesson steps as context (condensed in the service layer).
  // Appends a task block + starterCode to the current step, same as handleAddTask.
  // Returns { skipped: true, reason } when the model signals no suitable lab.
  // Throws on network / server error.
  const handleAddModuleLab = async () => {
    const structureStep = lessonStructure.find((s) => s.id === selectedStepId)
    if (!structureStep) return null

    const result = await generateModuleLabForStep({
      courseName,
      moduleName,
      lessonFormat,
      step: structureStep,
      lessonStructure,
      lessonContent,
    })

    if (result.skip) return { skipped: true, reason: result.reason }

    const blockWithId = { ...result.taskBlock, id: `block-${Date.now()}` }
    setLessonContent((prev) =>
      prev.map((s) =>
        s.id !== selectedStepId ? s :
        { ...s, blocks: [...(s.blocks || []), blockWithId], starterCode: result.starterCode }
      )
    )
    setDirtyStepIds((prev) => new Set([...prev, selectedStepId]))
    setSaveStatus('unsaved')
    return null
  }

  // ── Screen 2: add a task block + starterCode to a step via AI ───────────
  //
  // Called from LessonAuthoringView with the live (in-edit) blocks for the
  // currently selected step. Returns:
  //   null                        — success; state already updated
  //   { skipped: true, reason }   — model signalled no suitable task; caller shows reason
  // Throws on network / server error.
  //
  // State update uses setLessonContent's functional updater so the append is
  // always applied to the current state, not a closure-captured snapshot.
  const handleAddTask = async (currentBlocks) => {
    const structureStep = lessonStructure.find((s) => s.id === selectedStepId)
    if (!structureStep) return null

    const result = await generateTaskForStep({
      courseName,
      moduleName,
      step: structureStep,
      currentBlocks,
      lessonFormat,
      slideText,
    })

    if (result.skip) return { skipped: true, reason: result.reason }

    const blockWithId = { ...result.taskBlock, id: `block-${Date.now()}` }
    setLessonContent((prev) =>
      prev.map((s) =>
        s.id !== selectedStepId ? s :
        { ...s, blocks: [...(s.blocks || []), blockWithId], starterCode: result.starterCode }
      )
    )
    setDirtyStepIds((prev) => new Set([...prev, selectedStepId]))
    setSaveStatus('unsaved')
    return null
  }

  // ── Screen 2: generate a single AI block (code example or check question) ─
  //
  // Detects the code language from any existing code block in the step;
  // falls back to 'python' if none is found.
  // Appends the returned block to the end of the step's block list.
  // Throws on network / server error (no skip path).
  const handleAddBlock = async (blockType, currentBlocks) => {
    const structureStep = lessonStructure.find((s) => s.id === selectedStepId)
    if (!structureStep) return

    const existingCodeBlock = currentBlocks.find((b) => b.type === 'code')
    const language = existingCodeBlock?.language || 'python'

    const result = await generateBlockForStep({
      step: structureStep,
      currentBlocks,
      blockType,
      language,
      lessonFormat,
      slideText,
    })

    const blockWithId = { ...result.block, id: `block-${Date.now()}` }
    setLessonContent((prev) =>
      prev.map((s) =>
        s.id !== selectedStepId ? s :
        { ...s, blocks: [...(s.blocks || []), blockWithId] }
      )
    )
    setDirtyStepIds((prev) => new Set([...prev, selectedStepId]))
    setSaveStatus('unsaved')
  }

  // ── Screen 2: update a single step's content fields ─────────────────────
  const handleUpdateContent = (stepId, updatedFields) => {
    setLessonContent((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...updatedFields } : step))
    )
    // Keep lessonStructure title in sync when the author renames a step in Screen 2
    if (updatedFields.title !== undefined) {
      setLessonStructure((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, title: updatedFields.title } : s))
      )
    }
    setDirtyStepIds((prev) => new Set([...prev, stepId]))
    setSaveStatus('unsaved')
  }

  // ── Save draft to localStorage ───────────────────────────────────────────
  const handleSaveDraft = () => {
    setSaveStatus('saving')
    try {
      // [PERSIST HOOK] swap localStorage.setItem with backend API call
      const data = {
        screen,
        courseName,
        moduleName,
        lessonFormat,
        subtopics,
        slideFileName,
        lessonStructure,
        lessonContent,
        selectedStepId,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setTimeout(() => {
        setDirtyStepIds(new Set())
        setSaveStatus('saved')
      }, 350)
    } catch {
      setSaveStatus('unsaved')
    }
  }

  // ── Export current lesson content to output/ via backend ────────────────
  const handleExport = async () => {
    const exportedAt = new Date().toISOString()
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseName,
          moduleName,
          lessonStructure,
          lessonContent,
          learnerLevel: 'beginner',
          outputLanguage: 'Python',
          exportedAt,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(`Export failed: ${body.error || res.status}`)
        return
      }
      alert(`Exported → output/${body.filename}`)
    } catch (err) {
      alert(`Export failed: ${err.message}`)
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleBackToBuilder = () => {
    setScreen('builder')
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const breadcrumb =
    courseName && moduleName
      ? `${courseName}  ›  ${moduleName}`
      : courseName || 'New Lesson'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Header
        breadcrumb={screen === 'authoring' ? breadcrumb : null}
        onBack={screen === 'authoring' ? handleBackToBuilder : null}
        saveStatus={screen === 'authoring' ? saveStatus : null}
        onSaveDraft={screen === 'authoring' ? handleSaveDraft : null}
        onExport={screen === 'authoring' && lessonContent.length > 0 ? handleExport : null}
      />

      {screen === 'builder' ? (
        <div className="builder-layout">
          <div className="builder-left">
            <LessonInputForm
              courseName={courseName}
              moduleName={moduleName}
              lessonFormat={lessonFormat}
              subtopics={subtopics}
              slideFileName={slideFileName}
              slideText={slideText}
              slideCount={slideCount}
              isUploadingSlides={isUploadingSlides}
              slideUploadError={slideUploadError}
              onCourseNameChange={setCourseName}
              onModuleNameChange={setModuleName}
              onLessonFormatChange={setLessonFormat}
              onSubtopicsChange={setSubtopics}
              onSlideUpload={handleSlideUpload}
              onSlideRemove={handleSlideRemove}
              onSubmit={handleSubmit}
              isGenerating={isGenerating}
              generationError={generationError}
            />
          </div>
          <div className="builder-right">
            <LessonStructurePreview
              structure={lessonStructure}
              onUpdateStep={handleUpdateStep}
              onAddStep={handleAddStep}
              onDeleteStep={handleDeleteStep}
              onMoveStep={handleMoveStep}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generationError={generationError}
              titleValidationError={titleValidationError}
            />
          </div>
        </div>
      ) : (
        <LessonAuthoringView
          lessonStructure={lessonStructure}
          lessonContent={lessonContent}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
          onUpdateContent={handleUpdateContent}
          onAddTask={handleAddTask}
          onAddModuleLab={handleAddModuleLab}
          onAddBlock={handleAddBlock}
          onAddHandsOnStep={handleAddHandsOnStep}
          dirtyStepIds={dirtyStepIds}
          saveStatus={saveStatus}
          onSaveDraft={handleSaveDraft}
          stepGenerationStatus={stepGenerationStatus}
        />
      )}
    </div>
  )
}

export default App
