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
