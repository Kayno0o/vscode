import vscode from 'vscode'
import commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('KSymfony')
  outputChannel.appendLine('KSymfony extension is now active!')
  console.log('KSymfony extension is now active!')

  for (const command of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(`kvsc.${command.name}`, command.callback))
    outputChannel.appendLine(`Command registered: kvsc.${command.name}`)
    console.log(`Command registered: kvsc.${command.name}`)
  }
}
