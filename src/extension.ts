import vscode from 'vscode'
import { GetterSetterCodeActionProvider } from './codeActions/getterSetterCodeAction'
import commands from './commands'

let outputChannel: vscode.OutputChannel

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('KVSC')
  outputChannel.appendLine('KVSC extension is now active!')

  for (const command of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(`kvsc.${command.name}`, command.callback))
    outputChannel.appendLine(`Command registered: kvsc.${command.name}`)
  }

  // Register code action provider for PHP files
  const codeActionProvider = new GetterSetterCodeActionProvider(outputChannel)
  const disposable = vscode.languages.registerCodeActionsProvider('php', codeActionProvider as any, {
    providedCodeActionKinds: GetterSetterCodeActionProvider.providedCodeActionKinds,
  })
  context.subscriptions.push(disposable)
  outputChannel.appendLine('Code action provider registered for PHP files')
}

export function getOutputChannel(): vscode.OutputChannel {
  return outputChannel
}
