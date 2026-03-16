import React from 'react'

const LABELS = {
  saved:   'Saved',
  unsaved: 'Unsaved changes',
  saving:  'Saving…',
}

/**
 * SaveStatus — small indicator pill shown in the header on Screen 2.
 *
 * Props:
 *   status  'saved' | 'unsaved' | 'saving'
 */
function SaveStatus({ status }) {
  const label = LABELS[status] ?? ''

  return (
    <div className="save-status" role="status" aria-live="polite">
      <span className={`save-status-dot ${status}`} />
      <span className={`save-status-text ${status}`}>{label}</span>
    </div>
  )
}

export default SaveStatus
