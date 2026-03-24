/**
 * server/lib/extractSlideText.js
 *
 * Extracts visible text from a PPTX buffer.
 *
 * Scope: normal slide text only — titles, text boxes, and bullet content
 * (<a:t> nodes in ppt/slides/slide*.xml). Does not extract SmartArt,
 * speaker notes, or embedded objects.
 *
 * Returns:
 *   { slideText: string, slideCount: number }
 *
 *   slideText is a labelled block per slide, e.g.:
 *     [Slide 1]
 *     Introduction to Python Variables
 *
 *     [Slide 2]
 *     What is a variable? A container for storing data values.
 */

import JSZip from 'jszip'

export async function extractSlideText(buffer) {
  const zip = await JSZip.loadAsync(buffer)

  // Collect ppt/slides/slide*.xml entries and sort numerically
  const slideKeys = Object.keys(zip.files)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => {
      const num = (s) => parseInt(s.match(/(\d+)\.xml$/)[1], 10)
      return num(a) - num(b)
    })

  const parts = []
  for (let i = 0; i < slideKeys.length; i++) {
    const xml = await zip.files[slideKeys[i]].async('string')

    // Extract all <a:t> text nodes — covers titles, text boxes, bullet runs
    const texts = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean)

    if (texts.length > 0) {
      parts.push(`[Slide ${i + 1}]\n${texts.join(' ')}`)
    }
  }

  return {
    slideText: parts.join('\n\n'),
    slideCount: slideKeys.length,
  }
}
