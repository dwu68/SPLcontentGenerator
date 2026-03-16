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
    concept: mockConcept(step),
    instructions: mockInstructions(step),
    hint: mockHint(step),
    starterCode: mockStarterCode(step),
  }))
}

// ---------------------------------------------------------------------------
// Mock content helpers — replace with AI calls later
// ---------------------------------------------------------------------------

function mockConcept(step) {
  return `${step.title}\n\nThis step introduces learners to the concept of "${step.title}". Understanding this will help students build a strong foundation as they progress through the module.\n\nPay close attention to the example code on the right. Notice how the code demonstrates this concept in a realistic context.`
}

function mockInstructions(step) {
  return `In this exercise, you will practice: "${step.title}".\n\n1. Read through the starter code on the right.\n2. Identify where the concept is demonstrated.\n3. Add a comment to the code that explains what you observe.\n4. Run the code to confirm your understanding.`
}

function mockHint(step) {
  return `Think carefully about what "${step.title}" means in this programming context. Look for clues in the existing comments in the starter code.`
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
