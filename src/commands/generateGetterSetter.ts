import type { ClassProperty } from '../codeActions/getterSetterCodeAction'
import type { KCommand } from '../types'
import vscode from 'vscode'
import { firstUpper } from '../utils/textUtils'

function generateGetter(property: ClassProperty): string {
  const methodName = `get${firstUpper(property.name)}`
  const returnType = `${property.isNullable ? '?' : ''}${property.type}`

  return `    /**
     * @return ${returnType}
     */
    public function ${methodName}(): ${returnType}
    {
        return $this->${property.name};
    }`
}

function generateSetter(property: ClassProperty): string {
  const methodName = `set${firstUpper(property.name)}`
  const paramType = `${property.isNullable ? '?' : ''}${property.type}`

  return `    /**
     * @param ${paramType} $${property.name}
     */
    public function ${methodName}(${paramType} $${property.name}): self
    {
        $this->${property.name} = $${property.name};

        return $this;
    }`
}

function findClassEndPosition(text: string): number {
  const classMatch = text.match(/class\s+\w[^{]*\{/)
  if (!classMatch) {
    return -1
  }

  const classStart = classMatch.index! + classMatch[0].length
  let braceCount = 1
  let position = classStart
  let lastMethodEnd = classStart

  while (position < text.length && braceCount > 0) {
    const char = text[position]

    if (char === '"' || char === '\'') {
      const quote = char
      position++
      while (position < text.length && text[position] !== quote) {
        if (text[position] === '\\') {
          position++
        }
        position++
      }
      position++
      continue
    }

    if (char === '{') {
      braceCount++
    }
    else if (char === '}') {
      braceCount--
      if (braceCount === 1) {
        lastMethodEnd = position + 1
      }
    }

    position++
  }

  if (braceCount === 0) {
    return lastMethodEnd
  }

  return -1
}

export const generateGetterSetterForProperty: KCommand = {
  name: 'generateGetterSetterForProperty',
  callback: async (property: ClassProperty) => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }

    const document = editor.document
    const text = document.getText()

    const getter = generateGetter(property)
    const setter = generateSetter(property)
    const methods = `\n${getter}\n\n${setter}`

    const classEndPosition = findClassEndPosition(text)
    if (classEndPosition === -1) {
      vscode.window.showErrorMessage('Could not find class end position')
      return
    }

    const position = document.positionAt(classEndPosition)

    await editor.edit((editBuilder) => {
      editBuilder.insert(position, `${methods}\n`)
    })

    await document.save()
    vscode.window.showInformationMessage(`Generated getter and setter for property: ${property.name}`)
  },
}

export const generateGetterForProperty: KCommand = {
  name: 'generateGetterForProperty',
  callback: async (property: ClassProperty) => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }

    const document = editor.document
    const text = document.getText()

    const getter = generateGetter(property)

    const classEndPosition = findClassEndPosition(text)
    if (classEndPosition === -1) {
      vscode.window.showErrorMessage('Could not find class end position')
      return
    }

    const position = document.positionAt(classEndPosition)

    await editor.edit((editBuilder) => {
      editBuilder.insert(position, `\n${getter}\n`)
    })

    await document.save()
    vscode.window.showInformationMessage(`Generated getter for property: ${property.name}`)
  },
}

export const generateSetterForProperty: KCommand = {
  name: 'generateSetterForProperty',
  callback: async (property: ClassProperty) => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }

    const document = editor.document
    const text = document.getText()

    const setter = generateSetter(property)

    const classEndPosition = findClassEndPosition(text)
    if (classEndPosition === -1) {
      vscode.window.showErrorMessage('Could not find class end position')
      return
    }

    const position = document.positionAt(classEndPosition)

    await editor.edit((editBuilder) => {
      editBuilder.insert(position, `\n${setter}\n`)
    })

    await document.save()
    vscode.window.showInformationMessage(`Generated setter for property: ${property.name}`)
  },
}
