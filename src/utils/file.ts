import * as vscode from 'vscode'

export async function createAndOpenFile(filePath: string, content: string): Promise<void> {
  const uri = vscode.Uri.file(filePath)
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content))
  await vscode.window.showTextDocument(uri, { preview: false })
}
