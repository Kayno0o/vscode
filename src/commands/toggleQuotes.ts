import type { KCommand } from '../types'
import vscode from 'vscode'

export default <KCommand>{
  name: 'toggleQuotes',
  callback: () => {
    const editor = vscode.window.activeTextEditor
    if (!editor)
      return

    const doc = editor.document
    const text = doc.getText()

    const edits: { range: vscode.Range, newText: string }[] = []

    for (const selection of editor.selections) {
      const cursorPos = selection.active
      const offset = doc.offsetAt(cursorPos)

      const start = findNearestQuote(text, offset, -1)
      const end = findNearestQuote(text, offset, 1)

      if (start === -1 || end === -1 || start >= end)
        continue

      const startChar = text[start]
      const endChar = text[end]
      const innerText = text.slice(start + 1, end)
      const startPos = doc.positionAt(start)
      const endPos = doc.positionAt(end)

      if (startChar === '\'' && endChar === '\'') {
        const escaped = innerText.replace(/"/g, '\\"')
        edits.push({
          range: new vscode.Range(startPos, endPos.translate(0, 1)),
          newText: `"${escaped}"`,
        })
      }
      else if (startChar === '"' && endChar === '"') {
        const unescaped = innerText.replace(/\\"/g, '"')
        edits.push({
          range: new vscode.Range(startPos, endPos.translate(0, 1)),
          newText: `'${unescaped}'`,
        })
      }
    }

    if (edits.length === 0) {
      vscode.window.showInformationMessage('No matching quotes found.')
      return
    }

    editor.edit((editBuilder) => {
      for (const { range, newText } of edits) {
        editBuilder.replace(range, newText)
      }
    })
  },
}

function findNearestQuote(text: string, offset: number, direction: 1 | -1): number {
  let i = offset + direction
  while (i >= 0 && i < text.length) {
    const char = text[i]
    if (char === '"' || char === '\'')
      return i
    if (char === '\n')
      break
    i += direction
  }
  return -1
}
