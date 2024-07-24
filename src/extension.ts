import * as vscode from 'vscode';
import commands from './commands';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "KSymfony" is now active!');

  for (const command of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(`KSymfony.${command.name}`, command.callback));
  }
}

// This method is called when your extension is deactivated
export function deactivate() { }
