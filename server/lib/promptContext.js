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
 * @param {string}   [params.lessonFormat]    — 'code_lab' | 'guided_tool_workflow' | 'concept_application'
 * @param {string}   [params.learnerLevel]    — e.g. "beginner", "intermediate"
 * @param {string}   [params.outputLanguage]  — e.g. "Python", "JavaScript"
 * @returns {PromptContext}
 */
export function buildPromptContext({
  courseName,
  moduleName,
  step = null,
  lessonStructure = [],
  lessonFormat = 'code_lab',
  learnerLevel = 'beginner',
  outputLanguage = 'Python',
  slideText = '',
} = {}) {
  return {
    courseName:      courseName      ?? '',
    moduleName:      moduleName      ?? '',
    step:            step,
    stepTitle:       step?.title     ?? '',
    stepGoal:        step?.goal      ?? '',
    stepTopics:      Array.isArray(step?.coveredSubtopics) ? step.coveredSubtopics : [],
    slideNumbers:    Array.isArray(step?.slideNumbers) ? step.slideNumbers : [],
    lessonStructure: lessonStructure,
    totalSteps:      lessonStructure.length,
    lessonFormat:    lessonFormat    ?? 'code_lab',
    learnerLevel:    learnerLevel,
    outputLanguage:  outputLanguage,
    slideText:       slideText       ?? '',
  }
}
