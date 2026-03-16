import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import LessonInputForm from './components/LessonInputForm'
import LessonStructurePreview from './components/LessonStructurePreview'
import LessonAuthoringView from './components/LessonAuthoringView'
import { generateLessonStructure, generateLessonContent } from './utils/mockGeneration'

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
 *
 * Future integration points are marked with  // [AI HOOK]  comments.
 * Future persistence points are marked with  // [PERSIST HOOK]  comments.
 */
function App() {
  // ── Screen ──────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('builder')

  // ── Form inputs ──────────────────────────────────────────────────────────
  const [courseName, setCourseName] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [subtopics, setSubtopics] = useState('')

  // ── Lesson structure (Screen 1 output) ──────────────────────────────────
  const [lessonStructure, setLessonStructure] = useState([])

  // ── Lesson content (Screen 2) ────────────────────────────────────────────
  const [lessonContent, setLessonContent] = useState([])
  const [selectedStepId, setSelectedStepId] = useState(null)

  // ── Save / dirty state ───────────────────────────────────────────────────
  const [dirtyStepIds, setDirtyStepIds] = useState(new Set())
  const [saveStatus, setSaveStatus] = useState('saved')

  // ── Restore draft from localStorage on mount ────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.courseName) setCourseName(data.courseName)
      if (data.moduleName) setModuleName(data.moduleName)
      if (data.subtopics) setSubtopics(data.subtopics)
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

  // ── Screen 1: submit form → generate structure ───────────────────────────
  const handleSubmit = () => {
    if (!courseName.trim() || !moduleName.trim() || !subtopics.trim()) return
    if (lessonStructure.length > 0) {
      const ok = window.confirm(
        'Regenerate lesson structure?\n\nThis will replace all existing steps, including any edits you have made. This cannot be undone.'
      )
      if (!ok) return
    }
    // [AI HOOK] replace generateLessonStructure with API call
    const structure = generateLessonStructure(courseName, moduleName, subtopics)
    setLessonStructure(structure)
  }

  // ── Screen 1: step-level mutations (all renumber automatically) ──────────
  const handleUpdateStep = (id, fields) => {
    setLessonStructure((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...fields } : s))
    )
  }

  const handleAddStep = () => {
    setLessonStructure((prev) => {
      const next = prev.length + 1
      return [
        ...prev,
        {
          id: `step-new-${Date.now()}`,
          stepNumber: next,
          title: '',
          goal: '',
          coveredSubtopics: [],
        },
      ]
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
  const handleGenerate = () => {
    if (lessonContent.length > 0) {
      const ok = window.confirm(
        'Generate new lesson content?\n\nAll edits in the Lesson Authoring view will be replaced. This cannot be undone.'
      )
      if (!ok) return
    }
    // [AI HOOK] replace generateLessonContent with API call
    const content = generateLessonContent(lessonStructure)
    setLessonContent(content)
    setSelectedStepId(content[0]?.id || null)
    setDirtyStepIds(new Set())
    setSaveStatus('unsaved')
    setScreen('authoring')
  }

  // ── Screen 2: update a single step's content fields ─────────────────────
  const handleUpdateContent = (stepId, updatedFields) => {
    setLessonContent((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...updatedFields } : step))
    )
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
        subtopics,
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
      />

      {screen === 'builder' ? (
        <div className="builder-layout">
          <div className="builder-left">
            <LessonInputForm
              courseName={courseName}
              moduleName={moduleName}
              subtopics={subtopics}
              onCourseNameChange={setCourseName}
              onModuleNameChange={setModuleName}
              onSubtopicsChange={setSubtopics}
              onSubmit={handleSubmit}
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
            />
          </div>
        </div>
      ) : (
        <LessonAuthoringView
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
