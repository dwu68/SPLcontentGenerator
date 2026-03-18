/**
 * server/lib/promptContext.js
 *
 * Normalizes and assembles the input fields that prompt builders consume.
 * All prompt builder files import this helper so field extraction, defaulting,
 * and derived values stay in one place rather than being repeated per prompt.
 *
 * Edit this file when you add new context fields (e.g. learnerLevel,
 * outputLanguage) that should be available to all prompt builders.
 */

/**
 * buildPromptContext
 *
 * Returns a plain object with every field that prompt builders may reference.
 * Callers pass only the fields they have — missing fields default to safe values.
 *
 * @param {object}   params
 * @param {string}   params.courseName
 * @param {string}   params.moduleName
 * @param {object}   [params.step]            — a single LessonStructure step
 * @param {object[]} [params.lessonStructure] — full structure array (all steps)
 * @param {string}   [params.learnerLevel]    — e.g. "beginner", "intermediate"
 * @param {string}   [params.outputLanguage]  — e.g. "Python", "JavaScript"
 * @returns {PromptContext}
 */
export function buildPromptContext({
  courseName,
  moduleName,
  step = null,
  lessonStructure = [],
  learnerLevel = 'beginner',
  outputLanguage = 'Python',
} = {}) {
  return {
    courseName:      courseName      ?? '',
    moduleName:      moduleName      ?? '',
    step:            step,
    stepTitle:       step?.title     ?? '',
    stepGoal:        step?.goal      ?? '',
    stepTopics:      Array.isArray(step?.coveredSubtopics) ? step.coveredSubtopics : [],
    lessonStructure: lessonStructure,
    totalSteps:      lessonStructure.length,
    learnerLevel:    learnerLevel,
    outputLanguage:  outputLanguage,
  }
}
