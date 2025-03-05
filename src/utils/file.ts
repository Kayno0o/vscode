import * as path from 'node:path'
import * as vscode from 'vscode'
import { pathToNamespace } from './textUtils'

export async function createAndOpenFile(filePath: string, content: string): Promise<void> {
  const uri = vscode.Uri.file(filePath)
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content))
  await vscode.window.showTextDocument(uri, { preview: false })
}

export async function createAndOpenPhpFile(filePath: string, content: string): Promise<void> {
  content = `<?php

declare(strict_types=1);

namespace ${pathToNamespace(filePath)};

${content.trim()}
`
  await createAndOpenFile(filePath, content)
}

// ewither src/ApiResource/State exists, or src/State
export async function getStatePath(folderPath: string) {
  let statePath = path.join(folderPath, 'src', 'ApiResource', 'State')
  // eslint-disable-next-line github/no-then
  await vscode.workspace.fs.stat(vscode.Uri.file(statePath)).then(() => null, () => statePath = path.join(folderPath, 'src', 'State'))

  return statePath
}

// either src/Message, or src
export async function getMessagePath(folderPath: string) {
  let messagesPath = path.join(folderPath, 'src', 'Message')
  // eslint-disable-next-line github/no-then
  await vscode.workspace.fs.stat(vscode.Uri.file(messagesPath)).then(() => null, () => messagesPath = path.join(folderPath, 'src'))

  return messagesPath
}
