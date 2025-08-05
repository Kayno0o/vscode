import type { KCommand } from '../types'
import vscode from 'vscode'
import { firstUpper } from '../utils/textUtils'

interface ClassProperty {
  name: string
  type: string
  isNullable: boolean
  lineNumber: number
}

export default <KCommand>{
  name: 'getterSetter',
  callback: async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found')
      return
    }

    const document = editor.document
    if (document.languageId !== 'php') {
      vscode.window.showErrorMessage('This command only works with PHP files')
      return
    }

    const text = document.getText()

    // Check if file contains a class
    const classMatch = text.match(/class\s+(\w+)/i)
    if (!classMatch) {
      vscode.window.showErrorMessage('No PHP class detected in the current file')
      return
    }

    // Find all class properties
    const properties = findClassProperties(text)
    if (properties.length === 0) {
      vscode.window.showErrorMessage('No class properties found')
      return
    }

    // Check which properties already have getters/setters
    const propertiesWithoutGetterSetter = properties.filter((prop) => {
      const hasGetter = hasGetterMethod(text, prop.name)
      const hasSetter = hasSetterMethod(text, prop.name)
      return !hasGetter && !hasSetter
    })

    if (propertiesWithoutGetterSetter.length === 0) {
      vscode.window.showErrorMessage('All properties already have getter or setter methods')
      return
    }

    // Prompt user to select a property
    const propertyItems = propertiesWithoutGetterSetter.map(prop => ({
      label: prop.name,
      description: `${prop.isNullable ? '?' : ''}${prop.type}`,
      detail: `Line ${prop.lineNumber + 1}`,
      property: prop,
    }))

    const selectedItem = await vscode.window.showQuickPick(propertyItems, {
      placeHolder: 'Select a property to generate getter/setter for',
    })

    if (!selectedItem) {
      return
    }

    const selectedProperty = selectedItem.property

    // Generate getter and setter methods
    const getterMethod = generateGetter(selectedProperty)
    const setterMethod = generateSetter(selectedProperty)

    // Find the end position to insert methods
    const classEndPosition = findClassEndPosition(text)
    if (classEndPosition === -1) {
      vscode.window.showErrorMessage('Could not find class end position')
      return
    }

    // Convert to VS Code position
    const position = document.positionAt(classEndPosition)

    // Check if we need to add newlines for proper spacing
    const textBeforePosition = text.substring(0, classEndPosition)
    const needsLeadingNewline = !textBeforePosition.endsWith('\n')

    // Find the final closing brace of the class
    const remainingText = text.substring(classEndPosition)
    const finalBraceMatch = remainingText.match(/^\s*\}/)
    const needsTrailingNewline = !finalBraceMatch

    // Insert the methods with proper formatting
    await editor.edit((editBuilder) => {
      let methodsToInsert = ''

      if (needsLeadingNewline) {
        methodsToInsert += '\n'
      }

      methodsToInsert += `\n${getterMethod}\n\n${setterMethod}`

      if (needsTrailingNewline) {
        methodsToInsert += '\n'
      }

      editBuilder.insert(position, methodsToInsert)
    })

    await document.save()

    vscode.window.showInformationMessage(`Generated getter and setter for property: ${selectedProperty.name}`)
  },
}

function findClassProperties(text: string): ClassProperty[] {
  const properties: ClassProperty[] = []
  const lines = text.split('\n')

  // Look for private/protected/public properties
  const propertyRegex = /^\s*(private|protected|public)\s+(\??)([\w\\]+)\s+\$(\w+)/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(propertyRegex)

    if (match) {
      const [, , nullable, type, name] = match
      properties.push({
        name,
        type: type.split('\\').pop() || type, // Get the last part of namespaced types
        isNullable: nullable === '?',
        lineNumber: i,
      })
    }
  }

  return properties
}

function hasGetterMethod(text: string, propertyName: string): boolean {
  const getterName = `get${firstUpper(propertyName)}`
  const regex = new RegExp(`function\\s+${getterName}\\s*\\(`, 'i')
  return regex.test(text)
}

function hasSetterMethod(text: string, propertyName: string): boolean {
  const setterName = `set${firstUpper(propertyName)}`
  const regex = new RegExp(`function\\s+${setterName}\\s*\\(`, 'i')
  return regex.test(text)
}

function findClassEndPosition(text: string): number {
  // Find the class declaration
  const classMatch = text.match(/class\s+\w[^{]*\{/)
  if (!classMatch) {
    return -1
  }

  // Get the position right after the opening brace of the class
  const classStart = classMatch.index! + classMatch[0].length

  let braceCount = 1 // We already found the opening brace
  let position = classStart
  let lastMethodEnd = classStart

  // Count braces to find the matching closing brace
  while (position < text.length && braceCount > 0) {
    const char = text[position]

    // Skip strings and comments to avoid counting braces inside them
    if (char === '"' || char === '\'') {
      const quote = char
      position++
      while (position < text.length && text[position] !== quote) {
        if (text[position] === '\\') {
          position++ // Skip escaped character
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

      // If we're at brace level 2 (inside a method), this might be the end of a method
      if (braceCount === 1) {
        lastMethodEnd = position + 1
      }
    }

    position++
  }

  if (braceCount === 0) {
    // Return the position after the last method
    return lastMethodEnd
  }

  return -1
}

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
