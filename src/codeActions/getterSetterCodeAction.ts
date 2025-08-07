import vscode from 'vscode'
import { firstUpper } from '../utils/textUtils'

export interface ClassProperty {
  name: string
  type: string
  isNullable: boolean
  lineNumber: number
  range: vscode.Range
}

export class GetterSetterCodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.RefactorRewrite,
  ]

  constructor(private outputChannel?: vscode.OutputChannel) {}

  provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, _context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    if (document.languageId !== 'php') {
      return []
    }

    const text = document.getText()

    // Check if file contains a class
    const classMatch = text.match(/class\s+(\w+)/i)
    if (!classMatch) {
      return []
    }

    // Find the property at the current cursor position
    const property = this.findPropertyAtPosition(document, range)
    if (!property) {
      return []
    }

    this.outputChannel?.appendLine(`Found property '${property.name}' of type '${property.type}' at line ${range.start.line + 1}`)

    // Check if this property already has getters/setters
    const hasGetter = this.hasGetterMethod(text, property.name)
    const hasSetter = this.hasSetterMethod(text, property.name)

    const actions: vscode.CodeAction[] = []

    if (!hasGetter && !hasSetter) {
      // Both getter and setter are missing
      const action = new vscode.CodeAction(`Generate getter and setter for '${property.name}'`, vscode.CodeActionKind.RefactorRewrite)
      action.command = {
        command: 'kvsc.generateGetterSetterForProperty',
        title: 'Generate getter and setter',
        arguments: [property],
      }
      actions.push(action)
    }
    else if (!hasGetter) {
      // Only getter is missing
      const action = new vscode.CodeAction(`Generate getter for '${property.name}'`, vscode.CodeActionKind.RefactorRewrite)
      action.command = {
        command: 'kvsc.generateGetterForProperty',
        title: 'Generate getter',
        arguments: [property],
      }
      actions.push(action)
    }
    else if (!hasSetter) {
      // Only setter is missing
      const action = new vscode.CodeAction(`Generate setter for '${property.name}'`, vscode.CodeActionKind.RefactorRewrite)
      action.command = {
        command: 'kvsc.generateSetterForProperty',
        title: 'Generate setter',
        arguments: [property],
      }
      actions.push(action)
    }

    if (actions.length > 0) {
      this.outputChannel?.appendLine(`Offering ${actions.length} code action(s) for property '${property.name}'`)
    }

    return actions
  }

  private findPropertyAtPosition(document: vscode.TextDocument, range: vscode.Range): ClassProperty | null {
    const line = document.lineAt(range.start.line)
    const lineText = line.text.trim()

    // Match private/protected/public properties
    const propertyRegex = /^\s*(private|protected|public)\s+(\??)([\w\\]+)\s+\$(\w+)/
    const match = lineText.match(propertyRegex)

    if (!match) {
      return null
    }

    const [, , nullable, type, name] = match

    return {
      name,
      type: type.split('\\').pop() || type,
      isNullable: nullable === '?',
      lineNumber: range.start.line,
      range: line.range,
    }
  }

  private hasGetterMethod(text: string, propertyName: string): boolean {
    const getterName = `get${firstUpper(propertyName)}`
    const regex = new RegExp(`function\\s+${getterName}\\s*\\(`, 'i')
    return regex.test(text)
  }

  private hasSetterMethod(text: string, propertyName: string): boolean {
    const setterName = `set${firstUpper(propertyName)}`
    const regex = new RegExp(`function\\s+${setterName}\\s*\\(`, 'i')
    return regex.test(text)
  }
}
