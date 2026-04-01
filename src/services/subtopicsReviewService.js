/**
 * subtopicsReviewService.js
 *
 * Thin fetch wrapper for POST /api/review-subtopics.
 * Mirrors the pattern used in lessonStructureService.js.
 *
 * Return shape (passed through from server):
 *   { revisedSubtopics: string, rationale: string }   — revision suggested
 *   { skip: true, reason: string }                     — list is already good
 *
 * Throws on network error or non-OK HTTP status.
 */
export async function reviewSubtopics({ courseName, moduleName, lessonFormat, subtopicsText }) {
  const res = await fetch('/api/review-subtopics', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseName, moduleName, lessonFormat, subtopicsText }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status}`)
  }
  return res.json()
}
