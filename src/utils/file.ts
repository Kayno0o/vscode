import path from 'node:path'
import vscode from 'vscode'
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

async function folderExists(folderUri: vscode.Uri): Promise<boolean> {
  try {
    const stats = await vscode.workspace.fs.stat(folderUri)
    vscode.window.showErrorMessage(`Folder exists: ${folderUri.fsPath}, isDirectory: ${stats.type}`)
    return true
  }
  catch {
    vscode.window.showErrorMessage(`Folder does not exist: ${folderUri.fsPath}`)
    return false
  }
}

// ewither src/ApiResource/State exists, or src/State
export async function getStatePath(folderPath: string) {
  let statePath = path.join(folderPath, 'src', 'ApiResource', 'State')

  const folderExist = await folderExists(vscode.Uri.file(statePath))

  if (!folderExist)
    statePath = path.join(folderPath, 'src', 'State')

  return statePath
}

// either src/Message, or src
export async function getMessagePath(folderPath: string) {
  let messagesPath = path.join(folderPath, 'src', 'Message')

  const folderExist = await folderExists(vscode.Uri.file(messagesPath))

  if (!folderExist)
    messagesPath = path.join(folderPath, 'src')

  return messagesPath
}

export function getRepositoryPath(folderPath: string) {
  return path.join(folderPath, 'src', 'Repository')
}

export function getEntityPath(folderPath: string) {
  return path.join(folderPath, 'src', 'Entity')
}
