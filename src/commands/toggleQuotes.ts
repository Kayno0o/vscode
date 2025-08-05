import type { KCommand } from '../types'
import vscode from 'vscode'

export default <KCommand>{
  name: 'toggleQuotes',
  callback: () => {
    const editor = vscode.window.activeTextEditor
    if (!editor)
      return

    const edits: vscode.TextEdit[] = []
    const seen = new Set<string>()

    for (const selection of editor.selections) {
      const line = editor.document.lineAt(selection.start.line)
      const pos = selection.start.character

      // find quote at cursor position
      const match = findQuoteAtPosition(line.text, pos)
      if (!match)
        continue

      const key = `${line.lineNumber}:${match.start}-${match.end}`
      if (seen.has(key))
        continue
      seen.add(key)

      const range = new vscode.Range(line.lineNumber, match.start, line.lineNumber, match.end)

      edits.push(vscode.TextEdit.replace(range, toggleQuote(match.content)))
    }

    if (edits.length === 0) {
      vscode.window.showInformationMessage('No toggleable quotes found.')
      return
    }

    editor.edit((edit) => {
      for (const e of edits) edit.replace(e.range, e.newText)
    })
  },
}

function findQuoteAtPosition(line: string, pos: number) {
  let i = 0

  while (i < line.length) {
    if (line[i] !== '"' && line[i] !== '\'') {
      i++
      continue
    }

    const quote = line[i]
    const start = i++

    while (i < line.length && (line[i] !== quote || line[i - 1] === '\\')) {
      i++
    }

    if (i < line.length && pos >= start && pos <= i) {
      return {
        start,
        end: i + 1,
        content: line.slice(start, i + 1),
      }
    }

    i++
  }

  return null
}

function toggleQuote(quoted: string) {
  const quote = quoted[0]
  const content = quoted.slice(1, -1)

  if (quote === '"')
    return `'${content.replace(/\\"/g, '"').replace(/'/g, '\\\'')}'`

  return `"${content.replace(/\\'/g, '\'').replace(/"/g, '\\"')}"`
}
