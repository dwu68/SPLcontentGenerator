/**
 * mockGeneration.js
 *
 * Generates mocked lesson structure and lesson content from user inputs.
 * Replace the bodies of these functions with real AI API calls when ready.
 *
 * Entry points for AI integration:
 *   - generateLessonStructure(courseName, moduleName, subtopicsText) → LessonStructure[]
 *   - generateLessonContent(lessonStructure) → LessonContent[]
 */

// ---------------------------------------------------------------------------
// Screen 1: Generate lesson structure from form inputs
// ---------------------------------------------------------------------------

export function generateLessonStructure(courseName, moduleName, subtopicsText) {
  const lines = subtopicsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return lines.map((line, index) => ({
    id: `step-${Date.now()}-${index}`,
    stepNumber: index + 1,
    title: line,
    goal: `Students will be able to ${line.toLowerCase()}.`,
    coveredSubtopics: [line],
  }))
}

// ---------------------------------------------------------------------------
// Screen 2: Generate detailed lesson content from structure
// ---------------------------------------------------------------------------

export function generateLessonContent(lessonStructure) {
  return lessonStructure.map((step) => ({
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    concept: mockExplanation(step),
    codeExample: mockCodeExample(step),
    instructions: mockInstructions(step),
    hint: mockHint(step),
    starterCode: mockStarterCode(step),
    expectedAction: mockExpectedAction(step),
    validationNote: mockValidationNote(step),
  }))
}

// ---------------------------------------------------------------------------
// Mock content helpers — replace with AI calls later
// ---------------------------------------------------------------------------

function mockExplanation(step) {
  return `${step.title} is a core concept you will use throughout this module.\n\nWhy it matters: getting ${step.title.toLowerCase()} wrong does not always produce an obvious error — sometimes the code runs but produces incorrect output, which makes it harder to debug.\n\nHow it works: the key rule is that [describe the primary rule or mechanism here]. This applies any time [describe when the rule is in force]. If the rule is broken, Python will either raise an error or silently produce the wrong result.\n\nCommon mistake: learners often assume [describe a typical misconception]. The correct approach is always to [describe the correct practice] — especially when [describe the edge case where beginners slip up most].`
}

function mockCodeExample(step) {
  return `# ${step.title} — short example\n\n# Correct usage:\n[example of correct code here]   # <- why this works\n\n# Common mistake:\n[example of incorrect code here] # <- what goes wrong and why`
}

function mockInstructions(step) {
  return `1. Look at the starter code on the right. Find the section marked TODO.\n2. Apply ${step.title.toLowerCase()} to complete that section.\n3. Run the code and confirm the output matches the expected result shown in the comment.`
}

function mockHint(step) {
  return `Re-read the explanation above and focus on the key rule for ${step.title.toLowerCase()}. Then look at the code example — the correct usage pattern there is exactly what the TODO is asking for.`
}

function mockExpectedAction(step) {
  return `The learner completes the TODO block by correctly applying ${step.title.toLowerCase()}. The code should run without errors and produce the expected output.`
}

function mockValidationNote(step) {
  return `Correct solution: the TODO block is filled in and the output matches what is expected. Watch for: copy-pasting the example without adapting it to the task, producing output that looks right but uses the wrong approach, and leaving the TODO comment in place. The most common slip for ${step.title.toLowerCase()} is [describe the specific mistake most likely for this concept].`
}

function mockStarterCode(step) {
  return `# Step ${step.stepNumber}: ${step.title}
# -----------------------------------------------
# Read this code carefully. Two concepts below
# relate directly to: ${step.title}

# TODO: Add your comment here explaining what you notice.


# Example code
if True:
    print("Step ${step.stepNumber} is running")
`
}
