import React from 'react'
import SaveStatus from './SaveStatus'

/**
 * Header — persistent top bar.
 *
 * Props:
 *   breadcrumb   string | null   — shown on Screen 2
 *   onBack       fn | null       — back-to-builder handler
 *   onNextModule fn | null       — next-module handler
 *   saveStatus   string | null   — 'saved' | 'unsaved' | 'saving'
 *   onSaveDraft  fn | null       — save handler
 */
function Header({ breadcrumb, onBack, onNextModule, saveStatus, onSaveDraft }) {
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

        {onNextModule && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNextModule}
            title="Clear this module and start a new one"
          >
            Next Module →
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
