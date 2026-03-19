import React from 'react'
import SaveStatus from './SaveStatus'

/**
 * Header — persistent top bar.
 *
 * Props:
 *   breadcrumb   string | null   — shown on Screen 2
 *   onBack       fn | null       — back-to-builder handler
 *   saveStatus   string | null   — 'saved' | 'unsaved' | 'saving'
 *   onSaveDraft  fn | null       — save handler
 */
function Header({ breadcrumb, onBack, saveStatus, onSaveDraft, onExport }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">SP</div>
        SPL Content Generator
      </div>

      {breadcrumb && (
        <>
          <div className="header-divider" />
          <span className="header-breadcrumb" title={breadcrumb}>
            {breadcrumb}
          </span>
        </>
      )}

      <div className="header-actions">
        {saveStatus && <SaveStatus status={saveStatus} />}

        {onExport && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onExport}
            title="Export current lesson content to output/ folder"
          >
            Export JSON
          </button>
        )}

        {onSaveDraft && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onSaveDraft}
            disabled={saveStatus === 'saved' || saveStatus === 'saving'}
            title="Save all changes to browser storage"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>
        )}

        {onBack && (
          <button className="back-btn" onClick={onBack} title="Return to structure builder">
            ← Back to Builder
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
