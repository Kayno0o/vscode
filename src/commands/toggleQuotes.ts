import type { KCommand } from '../types'
import vscode from 'vscode'

interface QuotedRange { start: number, end: number }

export default <KCommand>{
  name: 'toggleQuotes',
  callback: () => {
    const editor = vscode.window.activeTextEditor
    if (!editor)
      return

    const doc = editor.document
    const seenRanges = new Set<string>()
    const edits: { range: vscode.Range, newText: string }[] = []

    for (const selection of editor.selections) {
      const startLine = selection.start.line
      const cursorChar = selection.start.character

      const line = doc.lineAt(startLine).text
      const ranges = findQuotedStrings(line)

      for (const range of ranges) {
        if (cursorChar < range.start || cursorChar > range.end)
          continue

        const rangeKey = `${startLine}:${range.start}-${range.end}`
        if (seenRanges.has(rangeKey))
          continue

        seenRanges.add(rangeKey)
        const startPos = new vscode.Position(startLine, range.start)
        const endPos = new vscode.Position(startLine, range.end + 1)
        const rangeToEdit = new vscode.Range(startPos, endPos)

        const quotedText = line.slice(range.start + 1, range.end)
        const currentQuote = line[range.start]

        let newText: string
        if (currentQuote === '"') {
          const raw = quotedText.replace(/\\"/g, '"')
          newText = `'${raw.replace(/'/g, '\\\'')}'`
        }
        else {
          const raw = quotedText.replace(/\\'/g, '\'')
          newText = `"${raw.replace(/"/g, '\\"')}"`
        }

        edits.push({ range: rangeToEdit, newText })
      }
    }

    if (edits.length === 0) {
      vscode.window.showInformationMessage('No toggleable quotes found.')
      return
    }

    editor.edit((editBuilder) => {
      for (const { range, newText } of edits) {
        editBuilder.replace(range, newText)
      }
    })
  },
}

export function findQuotedStrings(line: string): QuotedRange[] {
  const ranges: QuotedRange[] = []
  const length = line.length
  let i = 0

  while (i < length) {
    const char = line[i]

    if (char !== '"' && char !== '\'') {
      i++
      continue
    }

    const quote = char
    const start = i++
    let escaped = false

    while (i < length) {
      const current = line[i]

      if (escaped) {
        escaped = false
      }
      else if (current === '\\') {
        escaped = true
      }
      else if (current === quote) {
        break
      }

      i++
    }

    if (i < length && line[i] === quote) {
      ranges.push({ start, end: i })
      i++
      continue
    }

    i = start + 1
  }

  return ranges
}
