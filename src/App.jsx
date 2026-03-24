import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import LessonInputForm from './components/LessonInputForm'
import LessonStructurePreview from './components/LessonStructurePreview'
import LessonAuthoringView from './components/LessonAuthoringView'
import { generateAllLessonContent } from './services/lessonContentService'
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
    setGenerationError(null)
    setIsGenerating(true)
    try {
      const content = await generateAllLessonContent({ courseName, moduleName, lessonStructure, lessonFormat, slideText })
      setLessonContent(content)
      setSelectedStepId(lessonStructure[0]?.id || null)
      setDirtyStepIds(new Set())
      setSaveStatus('unsaved')
      // Clear any stale localStorage draft so a page reload won't restore old content
      localStorage.removeItem(STORAGE_KEY)
      setScreen('authoring')
    } catch {
      setGenerationError('Failed to generate lesson content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
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
          dirtyStepIds={dirtyStepIds}
          saveStatus={saveStatus}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </div>
  )
}

export default App
